import { db } from '../lib/db'
import { queueService } from './queue.service'
import logger from '../lib/logger'

/**
 * Outbox Service - Implements the Outbox pattern for reliable message delivery
 *
 * This service periodically processes pending video jobs from the video_jobs table
 * and ensures they are added to the Bull queue. This guarantees that no jobs are lost
 * even if the queue service is temporarily unavailable.
 */
export class OutboxService {
  private processorInterval?: NodeJS.Timeout
  private readonly PROCESS_INTERVAL_MS = 10000 // Process every 10 seconds
  private readonly MAX_ATTEMPTS = 3
  private readonly RETRY_DELAY_MS = 60000 // Retry failed jobs after 1 minute

  /**
   * Start the outbox processor
   */
  start(): void {
    if (this.processorInterval) {
      logger.warn('Outbox processor already running')
      return
    }

    logger.info('Starting outbox processor', {
      interval: this.PROCESS_INTERVAL_MS,
      maxAttempts: this.MAX_ATTEMPTS,
    })

    // Process immediately on start
    this.processOutbox().catch((error) => {
      logger.error('Initial outbox processing failed', { error: error.message })
    })

    // Then process periodically
    this.processorInterval = setInterval(() => {
      this.processOutbox().catch((error) => {
        logger.error('Outbox processing failed', { error: error.message })
      })
    }, this.PROCESS_INTERVAL_MS)
  }

  /**
   * Stop the outbox processor
   */
  stop(): void {
    if (this.processorInterval) {
      clearInterval(this.processorInterval)
      this.processorInterval = undefined
      logger.info('Outbox processor stopped')
    }
  }

  /**
   * Process pending and failed jobs from the outbox
   */
  private async processOutbox(): Promise<void> {
    try {
      // Get pending jobs (never attempted)
      const pendingResult = await db.query(
        `SELECT video_id, user_id, prompt, negative_prompt, config
         FROM video_jobs
         WHERE status = 'pending'
         ORDER BY created_at ASC
         LIMIT 100`,
        []
      )

      // Get failed jobs that are ready for retry
      const failedResult = await db.query(
        `SELECT video_id, user_id, prompt, negative_prompt, config, attempts
         FROM video_jobs
         WHERE status = 'failed'
           AND attempts < $1
           AND (last_attempt_at IS NULL OR last_attempt_at < NOW() - INTERVAL '1 minute')
         ORDER BY last_attempt_at ASC NULLS FIRST
         LIMIT 20`,
        [this.MAX_ATTEMPTS]
      )

      const jobs = [...pendingResult.rows, ...failedResult.rows]

      if (jobs.length > 0) {
        logger.info('Processing outbox jobs', { count: jobs.length })
      }

      // Process each job
      for (const job of jobs) {
        await this.processJob(job)
      }
    } catch (error: any) {
      logger.error('Error in outbox processing', {
        error: error.message,
        stack: error.stack,
      })
    }
  }

  /**
   * Process a single job from the outbox
   */
  private async processJob(job: any): Promise<void> {
    const { video_id, user_id, prompt, negative_prompt, config } = job

    try {
      // Parse config JSON
      const configObj = typeof config === 'string' ? JSON.parse(config) : config

      // Add job to Bull queue
      await queueService.addVideoJob({
        videoId: video_id,
        userId: user_id,
        prompt,
        negativePrompt: negative_prompt,
        config: configObj,
      })

      // Mark as queued in outbox
      await db.query(
        `UPDATE video_jobs
         SET status = 'queued', updated_at = NOW()
         WHERE video_id = $1`,
        [video_id]
      )

      logger.info('Job successfully added to queue from outbox', {
        videoId: video_id,
      })
    } catch (error: any) {
      // Increment attempts and update error
      await db.query(
        `UPDATE video_jobs
         SET status = 'failed',
             attempts = attempts + 1,
             last_attempt_at = NOW(),
             error_message = $1,
             updated_at = NOW()
         WHERE video_id = $2`,
        [error.message, video_id]
      )

      logger.warn('Failed to add job to queue from outbox', {
        videoId: video_id,
        error: error.message,
        attempts: (job.attempts || 0) + 1,
      })

      // If max attempts reached, log critical error
      if ((job.attempts || 0) + 1 >= this.MAX_ATTEMPTS) {
        logger.error('Job exceeded max retry attempts in outbox', {
          videoId: video_id,
          attempts: this.MAX_ATTEMPTS,
          error: error.message,
        })
      }
    }
  }

  /**
   * Get outbox statistics
   */
  async getStats(): Promise<{
    pending: number
    queued: number
    failed: number
    failedRetryable: number
  }> {
    const result = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'pending') as pending,
         COUNT(*) FILTER (WHERE status = 'queued') as queued,
         COUNT(*) FILTER (WHERE status = 'failed') as failed,
         COUNT(*) FILTER (WHERE status = 'failed' AND attempts < $1) as failed_retryable
       FROM video_jobs`,
      [this.MAX_ATTEMPTS]
    )

    const stats = result.rows[0]
    return {
      pending: parseInt(stats.pending || '0'),
      queued: parseInt(stats.queued || '0'),
      failed: parseInt(stats.failed || '0'),
      failedRetryable: parseInt(stats.failed_retryable || '0'),
    }
  }
}

// Export singleton instance
export const outboxService = new OutboxService()
