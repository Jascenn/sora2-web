import Bull from 'bull'
import Redis from 'ioredis'
import { SoraService } from './sora.service'
import { StorageService } from './storage.service'
import { db } from '../lib/db'
import logger from '../lib/logger'

interface VideoJobData {
  videoId: string
  userId: string
  prompt: string
  negativePrompt?: string
  config: {
    duration: number
    resolution: string
    aspectRatio: string
    style?: string
    fps: number
  }
}

export class QueueService {
  private videoQueue: Bull.Queue<VideoJobData>
  private soraService: SoraService
  private storageService: StorageService

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

    this.videoQueue = new Bull('video-generation', redisUrl, {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    })

    this.soraService = new SoraService()
    this.storageService = new StorageService()

    this.setupProcessors()
  }

  /**
   * Add video generation job to queue
   */
  async addVideoJob(data: VideoJobData): Promise<void> {
    await this.videoQueue.add(data, {
      jobId: data.videoId,
    })

    logger.info(`Video job added to queue`, { videoId: data.videoId, userId: data.userId })
  }

  /**
   * Setup queue processors
   */
  private setupProcessors() {
    this.videoQueue.process(async (job) => {
      const { videoId, userId, prompt, negativePrompt, config } = job.data

      logger.info(`Processing video`, { videoId, userId })

      try {
        // Update status to processing
        await db.query(
          'UPDATE videos SET status = $1, updated_at = NOW() WHERE id = $2',
          ['processing', videoId]
        )

        // Step 1: Generate video with Sora API
        const generateResult = await this.soraService.generateVideo({
          prompt,
          negativePrompt,
          ...config,
        })

        // Update with task ID
        await db.query(
          'UPDATE videos SET openai_task_id = $1, updated_at = NOW() WHERE id = $2',
          [generateResult.id, videoId]
        )

        // Step 2: Get video URL and thumbnail (Sora-2 returns immediately via chat completions)
        let status = generateResult.status
        let videoUrl: string | undefined = generateResult.videoUrl
        let thumbnailUrl: string | undefined = generateResult.thumbnailUrl

        // If status is already completed and we have URL, skip polling
        if (status === 'completed' && videoUrl) {
          logger.info(`Video URL received immediately`, { videoId, videoUrl, thumbnailUrl })
        } else {
          // Otherwise poll for completion (for async APIs)
          while (status === 'pending' || status === 'processing') {
            await new Promise((resolve) => setTimeout(resolve, 5000)) // Wait 5 seconds

            const statusResult = await this.soraService.getVideoStatus(generateResult.id)
            status = statusResult.status
            videoUrl = statusResult.videoUrl
            thumbnailUrl = statusResult.thumbnailUrl

            if (status === 'failed') {
              throw new Error(statusResult.error || 'Video generation failed')
            }
          }

          if (!videoUrl) {
            throw new Error('Video URL not received')
          }
        }

        // Step 3: Handle video storage
        let finalVideoUrl = videoUrl
        let videoSize = 0

        // Check if S3 is properly configured
        const hasS3Config = process.env.AWS_ACCESS_KEY_ID &&
                           process.env.AWS_SECRET_ACCESS_KEY &&
                           process.env.AWS_S3_BUCKET &&
                           process.env.AWS_ACCESS_KEY_ID !== 'demo-access-key'

        if (hasS3Config) {
          logger.info('Downloading video for S3 upload', { videoId })
          // Download video
          const videoBuffer = await this.soraService.downloadVideo(videoUrl)
          videoSize = videoBuffer.length

          // Upload to S3
          logger.info('Uploading to S3', { videoId, size: videoSize })
          finalVideoUrl = await this.storageService.uploadVideo(
            videoBuffer,
            `${videoId}.mp4`
          )
          logger.info('Uploaded to S3', { videoId, finalVideoUrl })
        } else {
          logger.warn('S3 not configured, using direct video URL', { videoId })
          finalVideoUrl = videoUrl
        }

        // Step 4: Get actual video duration
        let actualDuration: number | null = null
        try {
          logger.debug('Getting video duration', { videoId })
          actualDuration = await this.soraService.getVideoDuration(videoUrl)
          if (actualDuration) {
            logger.info('Video duration determined', { videoId, duration: actualDuration })
          }
        } catch (error: any) {
          logger.warn('Could not determine video duration', { videoId, error: error.message })
        }

        // Step 5: Update database with video URL, thumbnail, and actual duration
        if (actualDuration) {
          await db.query(
            `UPDATE videos
             SET status = $1, file_url = $2, file_size = $3, thumbnail_url = $4, duration = $5, completed_at = NOW(), updated_at = NOW()
             WHERE id = $6`,
            ['completed', finalVideoUrl, videoSize, thumbnailUrl || null, actualDuration, videoId]
          )
        } else {
          // Fallback: update without duration if we couldn't get it
          await db.query(
            `UPDATE videos
             SET status = $1, file_url = $2, file_size = $3, thumbnail_url = $4, completed_at = NOW(), updated_at = NOW()
             WHERE id = $5`,
            ['completed', finalVideoUrl, videoSize, thumbnailUrl || null, videoId]
          )
        }

        logger.info('Video completed', { videoId, duration: actualDuration, fileUrl: finalVideoUrl })

        return { success: true, videoId }
      } catch (error: any) {
        const errorMessage = error.message || 'Unknown error'
        const attemptNumber = job.attemptsMade + 1
        const maxAttempts = job.opts.attempts || 3

        logger.error('Video generation failed', {
          videoId,
          error: errorMessage,
          stack: error.stack,
          attempt: attemptNumber,
          maxAttempts
        })

        // Determine if error is retryable
        const isRetryable = this.isRetryableError(error)
        const shouldRetry = isRetryable && attemptNumber < maxAttempts

        if (shouldRetry) {
          // Update status to pending for retry
          await db.query(
            'UPDATE videos SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3',
            ['pending', `Retry ${attemptNumber}/${maxAttempts}: ${errorMessage}`, videoId]
          )
          logger.info('Job will be retried', { videoId, attempt: attemptNumber })
        } else {
          // Final failure - update status to failed
          await db.query(
            'UPDATE videos SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3',
            ['failed', errorMessage, videoId]
          )

          // Refund credits using transaction with row-level locking (only on final failure)
          await db.transaction(async (client) => {
            // Get video cost
            const videoResult = await client.query(
              'SELECT cost_credits FROM videos WHERE id = $1',
              [videoId]
            )

            if (videoResult.rows.length > 0) {
              const costCredits = videoResult.rows[0].cost_credits

              // Get current user credits with FOR UPDATE lock to prevent race conditions
              const userResult = await client.query(
                'SELECT credits FROM users WHERE id = $1 FOR UPDATE',
                [userId]
              )

              const currentCredits = userResult.rows[0].credits
              const newBalance = currentCredits + costCredits

              // Refund credits to user
              await client.query(
                'UPDATE users SET credits = credits + $1, updated_at = NOW() WHERE id = $2',
                [costCredits, userId]
              )

              // Create refund transaction
              await client.query(
                `INSERT INTO credit_transactions (user_id, type, amount, balance_after, related_id, description, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                [userId, 'refund', costCredits, newBalance, videoId, 'Video generation failed - refund']
              )

              logger.info('Credits refunded for failed video', {
                videoId,
                userId,
                refundedCredits: costCredits,
                newBalance,
              })
            }
          })
        }

        throw error
      }
    })

    // Queue event listeners
    this.videoQueue.on('completed', (job) => {
      logger.info('Job completed', { jobId: job.id })
    })

    this.videoQueue.on('failed', (job, err) => {
      logger.error('Job failed', { jobId: job?.id, error: err.message })
    })
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    const errorMessage = error.message || ''

    // Non-retryable errors (permanent failures)
    const nonRetryablePatterns = [
      /额度已用尽/i,              // API quota exhausted
      /RemainQuota = 0/i,        // No quota remaining
      /unauthorized/i,           // Auth issues
      /invalid.*api.*key/i,      // Invalid API key
      /forbidden/i,              // Forbidden access
      /not.*found/i,             // Resource not found (404)
      /invalid.*prompt/i,        // Invalid prompt content
      /content.*policy/i,        // Content policy violation
    ]

    // Check if error matches non-retryable patterns
    if (nonRetryablePatterns.some(pattern => pattern.test(errorMessage))) {
      return false
    }

    // Retryable errors (temporary failures)
    const retryablePatterns = [
      /502/,                     // Bad Gateway
      /503/,                     // Service Unavailable
      /504/,                     // Gateway Timeout
      /timeout/i,                // Any timeout error
      /ECONNREFUSED/i,           // Connection refused
      /ETIMEDOUT/i,              // Socket timeout
      /ENOTFOUND/i,              // DNS lookup failed
      /network/i,                // Network errors
      /temporarily/i,            // Temporary errors
    ]

    // Check if error matches retryable patterns
    if (retryablePatterns.some(pattern => pattern.test(errorMessage))) {
      return true
    }

    // Default: retry on unknown errors (conservative approach)
    return true
  }

  /**
   * Get queue stats
   */
  async getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.videoQueue.getWaitingCount(),
      this.videoQueue.getActiveCount(),
      this.videoQueue.getCompletedCount(),
      this.videoQueue.getFailedCount(),
    ])

    return { waiting, active, completed, failed }
  }

  /**
   * Remove job from queue by video ID
   */
  async removeVideoJob(videoId: string): Promise<void> {
    try {
      const job = await this.videoQueue.getJob(videoId)
      if (job) {
        await job.remove()
        logger.info('Video job removed from queue', { videoId })
      }
    } catch (error: any) {
      logger.warn('Failed to remove video job from queue', {
        videoId,
        error: error.message,
      })
    }
  }
}

// Export singleton instance
export const queueService = new QueueService()
