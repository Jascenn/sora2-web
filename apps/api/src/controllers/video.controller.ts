import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { AppError } from '../middleware/error.middleware'
import { db } from '../lib/db'
import { SoraService } from '../services/sora.service'
import { queueService } from '../services/queue.service'
import logger from '../lib/logger'
import { success } from '../lib/response'

export class VideoController {
  /**
   * Generate video with Server-Sent Events for real-time progress
   */
  async generateWithSSE(req: AuthRequest, res: Response) {
    try {
      const { prompt, negativePrompt, config } = req.body
      const userId = req.userId!

      // Validate config exists
      if (!config || typeof config !== 'object') {
        throw new AppError('Missing or invalid video configuration', 400)
      }

      // Validate config
      const { duration, resolution, aspectRatio, style, fps, model } = config

      if (!duration || !resolution || !aspectRatio || !fps) {
        throw new AppError('Missing required video configuration', 400)
      }

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('X-Accel-Buffering', 'no') // Disable nginx buffering

      // Helper to send SSE events
      const sendEvent = (event: string, data: any) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
      }

      try {
        // Send start event
        sendEvent('start', { message: 'Starting video generation...' })

        // Calculate credit cost
        const soraService = new SoraService()
        const costCredits = await soraService.calculateCost(duration, model || 'sora-2')

        sendEvent('progress', { message: 'Checking credits...', percent: 10 })

        // Use transaction for all database operations with row-level locking
        const result = await db.transaction(async (client) => {
          // Check user credits with FOR UPDATE lock
          const userResult = await client.query(
            'SELECT credits FROM users WHERE id = $1 FOR UPDATE',
            [userId]
          )

          if (userResult.rows.length === 0) {
            throw new AppError('User not found', 404)
          }

          const userCredits = userResult.rows[0].credits

          if (userCredits < costCredits) {
            throw new AppError(
              `Insufficient credits. Required: ${costCredits}, Available: ${userCredits}`,
              400
            )
          }

          sendEvent('progress', { message: 'Creating video record...', percent: 20 })

          // Create video record
          const videoResult = await client.query(
            `INSERT INTO videos (user_id, prompt, negative_prompt, duration, resolution, aspect_ratio, style, fps, cost_credits, status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
             RETURNING id, status`,
            [userId, prompt, negativePrompt || null, duration, resolution, aspectRatio, style || null, fps, costCredits, 'pending']
          )

          const video = videoResult.rows[0]

          // Deduct credits
          await client.query(
            'UPDATE users SET credits = credits - $1, updated_at = NOW() WHERE id = $2',
            [costCredits, userId]
          )

          // Create credit transaction
          const newBalance = userCredits - costCredits
          await client.query(
            `INSERT INTO credit_transactions (user_id, type, amount, balance_after, related_id, description, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [userId, 'consume', -costCredits, newBalance, video.id, `Video generation: ${prompt.substring(0, 30)}...`]
          )

          sendEvent('progress', { message: 'Credits deducted, queueing job...', percent: 30 })

          // Store in outbox
          await client.query(
            `INSERT INTO video_jobs (video_id, user_id, prompt, negative_prompt, config, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             ON CONFLICT (video_id) DO NOTHING`,
            [
              video.id,
              userId,
              prompt,
              negativePrompt || null,
              JSON.stringify(config),
              'pending',
            ]
          )

          return { video, newBalance, costCredits }
        })

        sendEvent('progress', { message: 'Adding to processing queue...', percent: 40 })

        // Add to queue
        try {
          await queueService.addVideoJob({
            videoId: result.video.id,
            userId,
            prompt,
            negativePrompt,
            config: {
              duration,
              resolution,
              aspectRatio,
              style,
              fps,
            },
          })
          sendEvent('progress', { message: 'Job queued successfully', percent: 50 })
        } catch (queueError: any) {
          logger.warn('Failed to add job to queue immediately, outbox will handle', {
            videoId: result.video.id,
            error: queueError.message,
          })
          sendEvent('progress', { message: 'Queued via outbox processor', percent: 50 })
        }

        // Send complete event with video details
        sendEvent('complete', {
          video: {
            id: result.video.id,
            status: result.video.status,
            costCredits: result.costCredits,
            remainingCredits: result.newBalance,
          },
          message: 'Video generation queued. Processing will begin shortly.',
        })

        res.end()
      } catch (error: any) {
        if (error instanceof AppError) {
          sendEvent('error', { message: error.message, code: error.statusCode })
        } else {
          logger.error('SSE video generation error:', { error: error.message, stack: error.stack })
          sendEvent('error', { message: 'Video generation failed', code: 500 })
        }
        res.end()
      }
    } catch (error: any) {
      // If headers not sent yet, send normal error
      if (!res.headersSent) {
        if (error instanceof AppError) {
          throw error
        }
        logger.error('Video generation error:', { error: error.message })
        throw new AppError('Video generation failed', 400)
      }
    }
  }

  async generate(req: AuthRequest, res: Response) {
    try {
      const { prompt, negativePrompt, config } = req.body
      const userId = req.userId!

      // Validate config exists
      if (!config || typeof config !== 'object') {
        throw new AppError('Missing or invalid video configuration', 400)
      }

      // Validate config
      const { duration, resolution, aspectRatio, style, fps, model } = config

      if (!duration || !resolution || !aspectRatio || !fps) {
        throw new AppError('Missing required video configuration', 400)
      }

      // Calculate credit cost
      const soraService = new SoraService()
      const costCredits = await soraService.calculateCost(duration, model || 'sora-2')

      // Use transaction for all database operations with row-level locking
      const result = await db.transaction(async (client) => {
        // Check user credits with FOR UPDATE lock to prevent race conditions
        // This ensures no other transaction can modify this user's credits until we commit
        const userResult = await client.query(
          'SELECT credits FROM users WHERE id = $1 FOR UPDATE',
          [userId]
        )

        if (userResult.rows.length === 0) {
          throw new AppError('User not found', 404)
        }

        const userCredits = userResult.rows[0].credits

        if (userCredits < costCredits) {
          throw new AppError(
            `Insufficient credits. Required: ${costCredits}, Available: ${userCredits}`,
            400
          )
        }

        // Create video record
        const videoResult = await client.query(
          `INSERT INTO videos (user_id, prompt, negative_prompt, duration, resolution, aspect_ratio, style, fps, cost_credits, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
           RETURNING id, status`,
          [userId, prompt, negativePrompt || null, duration, resolution, aspectRatio, style || null, fps, costCredits, 'pending']
        )

        const video = videoResult.rows[0]

        // Deduct credits using the locked value
        await client.query(
          'UPDATE users SET credits = credits - $1, updated_at = NOW() WHERE id = $2',
          [costCredits, userId]
        )

        // Create credit transaction
        const newBalance = userCredits - costCredits
        await client.query(
          `INSERT INTO credit_transactions (user_id, type, amount, balance_after, related_id, description, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [userId, 'consume', -costCredits, newBalance, video.id, `Video generation: ${prompt.substring(0, 30)}...`]
        )

        // Store queue job data in video_jobs outbox table for reliability
        // This ensures queue jobs are not lost even if queue service is unavailable
        await client.query(
          `INSERT INTO video_jobs (video_id, user_id, prompt, negative_prompt, config, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (video_id) DO NOTHING`,
          [
            video.id,
            userId,
            prompt,
            negativePrompt || null,
            JSON.stringify(config),
            'pending',
          ]
        )

        return { video, newBalance }
      })

      // Add to queue immediately (best effort)
      // If this fails, the outbox processor will pick it up
      try {
        await queueService.addVideoJob({
          videoId: result.video.id,
          userId,
          prompt,
          negativePrompt,
          config: {
            duration,
            resolution,
            aspectRatio,
            style,
            fps,
          },
        })
      } catch (queueError: any) {
        // Log but don't fail the request - outbox will handle it
        logger.warn('Failed to add job to queue immediately, will be picked up by outbox processor', {
          videoId: result.video.id,
          error: queueError.message,
        })
      }

      res.status(201).json(success({
        video: {
          id: result.video.id,
          status: result.video.status,
          costCredits,
          remainingCredits: result.newBalance,
        },
      }, 'Video generation started'))
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error
      }
      logger.error('Video generation error:', { error: error.message, stack: error.stack, userId: req.userId })
      throw new AppError('Video generation failed', 400)
    }
  }

  async list(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!
      const { page = 1, limit = 20, status } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let whereClause = 'WHERE user_id = $1'
      const params: any[] = [userId, Number(limit), offset]

      if (status) {
        whereClause += ' AND status = $4'
        params.push(status)
      }

      const [videosResult, totalResult] = await Promise.all([
        db.query(
          `SELECT id, prompt, negative_prompt as "negativePrompt", duration, resolution,
                  aspect_ratio as "aspectRatio", style, fps, status, file_url as "fileUrl",
                  thumbnail_url as "thumbnailUrl", file_size as "fileSize", cost_credits as "costCredits",
                  error_message as "errorMessage",
                  to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "createdAt",
                  to_char(completed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "completedAt"
           FROM videos
           ${whereClause}
           ORDER BY created_at DESC
           LIMIT $2 OFFSET $3`,
          params.slice(0, status ? 4 : 3)
        ),
        db.query(
          `SELECT COUNT(*) as count FROM videos ${whereClause}`,
          status ? [userId, status] : [userId]
        ),
      ])

      const total = parseInt(totalResult.rows[0].count)

      res.json(success({
        videos: videosResult.rows,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      }))
    } catch (error: any) {
      logger.error('Failed to fetch videos:', { error: error.message, userId: req.userId })
      throw new AppError('Failed to fetch videos', 400)
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const userId = req.userId!

      const result = await db.query(
        `SELECT id, prompt, negative_prompt as "negativePrompt", duration, resolution,
                aspect_ratio as "aspectRatio", style, fps, status, file_url as "fileUrl",
                thumbnail_url as "thumbnailUrl", file_size as "fileSize", cost_credits as "costCredits",
                openai_task_id as "openaiTaskId", error_message as "errorMessage",
                to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "createdAt",
                to_char(completed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "completedAt",
                to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "updatedAt"
         FROM videos
         WHERE id = $1 AND user_id = $2`,
        [id, userId]
      )

      if (result.rows.length === 0) {
        throw new AppError('Video not found', 404)
      }

      res.json(success({ video: result.rows[0] }))
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error
      }
      logger.error('Failed to get video:', { error: error.message, videoId: req.params.id })
      throw new AppError('Video not found', 404)
    }
  }

  async getStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const userId = req.userId!

      const result = await db.query(
        `SELECT status, error_message as "errorMessage",
                to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "createdAt",
                to_char(completed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "completedAt",
                openai_task_id as "openaiTaskId"
         FROM videos
         WHERE id = $1 AND user_id = $2`,
        [id, userId]
      )

      if (result.rows.length === 0) {
        throw new AppError('Video not found', 404)
      }

      const video = result.rows[0]

      res.json(success({
        status: video.status,
        errorMessage: video.errorMessage,
        createdAt: video.createdAt,
        completedAt: video.completedAt,
        openaiTaskId: video.openaiTaskId,
      }))
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error
      }
      logger.error('Failed to get status:', { error: error.message, videoId: req.params.id })
      throw new AppError('Failed to get status', 400)
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const userId = req.userId!

      // Check if video exists and belongs to user
      const checkResult = await db.query(
        'SELECT id FROM videos WHERE id = $1 AND user_id = $2',
        [id, userId]
      )

      if (checkResult.rows.length === 0) {
        throw new AppError('Video not found', 404)
      }

      // Delete the video (cascade will handle related records if any)
      await db.query(
        'DELETE FROM videos WHERE id = $1 AND user_id = $2',
        [id, userId]
      )

      // Note: We don't refund credits for deleted videos as per business logic

      res.json(success({}, 'Video deleted successfully'))
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error
      }
      logger.error('Failed to delete video:', { error: error.message, videoId: req.params.id })
      throw new AppError('Failed to delete video', 400)
    }
  }

  async regenerate(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const userId = req.userId!

      // Get original video configuration
      const videoResult = await db.query(
        `SELECT prompt, negative_prompt as "negativePrompt", duration, resolution,
                aspect_ratio as "aspectRatio", style, fps, cost_credits as "costCredits"
         FROM videos
         WHERE id = $1 AND user_id = $2`,
        [id, userId]
      )

      if (videoResult.rows.length === 0) {
        throw new AppError('Original video not found', 404)
      }

      const originalVideo = videoResult.rows[0]
      const costCredits = originalVideo.costCredits

      // Use transaction for regeneration with row-level locking
      const result = await db.transaction(async (client) => {
        // Check user credits with FOR UPDATE lock to prevent race conditions
        const userResult = await client.query(
          'SELECT credits FROM users WHERE id = $1 FOR UPDATE',
          [userId]
        )

        if (userResult.rows.length === 0) {
          throw new AppError('User not found', 404)
        }

        const userCredits = userResult.rows[0].credits

        if (userCredits < costCredits) {
          throw new AppError(
            `Insufficient credits. Required: ${costCredits}, Available: ${userCredits}`,
            400
          )
        }

        // Create new video record with same configuration
        const newVideoResult = await client.query(
          `INSERT INTO videos (user_id, prompt, negative_prompt, duration, resolution, aspect_ratio, style, fps, cost_credits, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
           RETURNING id, status`,
          [
            userId,
            originalVideo.prompt,
            originalVideo.negativePrompt,
            originalVideo.duration,
            originalVideo.resolution,
            originalVideo.aspectRatio,
            originalVideo.style,
            originalVideo.fps,
            costCredits,
            'pending',
          ]
        )

        const newVideo = newVideoResult.rows[0]

        // Deduct credits
        await client.query(
          'UPDATE users SET credits = credits - $1, updated_at = NOW() WHERE id = $2',
          [costCredits, userId]
        )

        // Create credit transaction
        const newBalance = userCredits - costCredits
        await client.query(
          `INSERT INTO credit_transactions (user_id, type, amount, balance_after, related_id, description, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            userId,
            'consume',
            -costCredits,
            newBalance,
            newVideo.id,
            `Video regeneration: ${originalVideo.prompt.substring(0, 30)}...`,
          ]
        )

        // Store queue job data in outbox table
        const config = {
          duration: originalVideo.duration,
          resolution: originalVideo.resolution,
          aspectRatio: originalVideo.aspectRatio,
          style: originalVideo.style,
          fps: originalVideo.fps,
        }

        await client.query(
          `INSERT INTO video_jobs (video_id, user_id, prompt, negative_prompt, config, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (video_id) DO NOTHING`,
          [
            newVideo.id,
            userId,
            originalVideo.prompt,
            originalVideo.negativePrompt,
            JSON.stringify(config),
            'pending',
          ]
        )

        return { newVideo, newBalance }
      })

      // Add to queue immediately (best effort)
      try {
        await queueService.addVideoJob({
          videoId: result.newVideo.id,
          userId,
          prompt: originalVideo.prompt,
          negativePrompt: originalVideo.negativePrompt,
          config: {
            duration: originalVideo.duration,
            resolution: originalVideo.resolution,
            aspectRatio: originalVideo.aspectRatio,
            style: originalVideo.style,
            fps: originalVideo.fps,
          },
        })
      } catch (queueError: any) {
        logger.warn('Failed to add regeneration job to queue immediately, will be picked up by outbox processor', {
          videoId: result.newVideo.id,
          error: queueError.message,
        })
      }

      res.status(201).json(success({
        video: {
          id: result.newVideo.id,
          status: result.newVideo.status,
          costCredits,
          remainingCredits: result.newBalance,
        },
      }, 'Video regeneration started'))
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error
      }
      logger.error('Failed to regenerate video:', { error: error.message, videoId: req.params.id })
      throw new AppError('Failed to regenerate video', 400)
    }
  }

  async download(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const userId = req.userId!

      const result = await db.query(
        `SELECT file_url as "fileUrl", status
         FROM videos
         WHERE id = $1 AND user_id = $2`,
        [id, userId]
      )

      if (result.rows.length === 0) {
        throw new AppError('Video not found', 404)
      }

      const video = result.rows[0]

      if (video.status !== 'completed') {
        throw new AppError('Video is not ready for download', 400)
      }

      if (!video.fileUrl) {
        throw new AppError('Video file not available', 404)
      }

      // Return the direct file URL
      // In production, you might want to generate a signed/temporary URL for better security
      res.json(success({ downloadUrl: video.fileUrl }))
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error
      }
      logger.error('Failed to download video:', { error: error.message, videoId: req.params.id })
      throw new AppError('Failed to download video', 400)
    }
  }

  async share(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const userId = req.userId!

      const result = await db.query(
        `SELECT status, file_url as "fileUrl"
         FROM videos
         WHERE id = $1 AND user_id = $2`,
        [id, userId]
      )

      if (result.rows.length === 0) {
        throw new AppError('Video not found', 404)
      }

      const video = result.rows[0]

      if (video.status !== 'completed') {
        throw new AppError('Video is not ready for sharing', 400)
      }

      // Generate share URL using the video ID
      // In the future, you can add a share_token field for better security
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
      const shareUrl = `${baseUrl}/share/${id}`

      res.json(success({ shareUrl }))
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error
      }
      logger.error('Failed to create share link:', { error: error.message, videoId: req.params.id })
      throw new AppError('Failed to create share link', 400)
    }
  }

  async cancel(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const userId = req.userId!

      // Get video info and verify ownership
      const videoResult = await db.query(
        `SELECT status, cost_credits as "costCredits"
         FROM videos
         WHERE id = $1 AND user_id = $2`,
        [id, userId]
      )

      if (videoResult.rows.length === 0) {
        throw new AppError('Video not found', 404)
      }

      const video = videoResult.rows[0]

      // Only allow cancellation of pending or processing videos
      if (video.status !== 'pending' && video.status !== 'processing') {
        throw new AppError(`Cannot cancel video in ${video.status} status`, 400)
      }

      const costCredits = video.costCredits

      // Use transaction to update video status and refund credits
      await db.transaction(async (client) => {
        // Update video status to cancelled
        await client.query(
          'UPDATE videos SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3',
          ['cancelled', 'Cancelled by user', id]
        )

        // Get current user credits with FOR UPDATE lock
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
          [userId, 'refund', costCredits, newBalance, id, 'Video generation cancelled - refund']
        )
      })

      // Try to remove from queue if it's still pending
      try {
        await queueService.removeVideoJob(id)
        logger.info('Cancelled video removed from queue', { videoId: id })
      } catch (queueError: any) {
        logger.warn('Failed to remove cancelled video from queue', {
          videoId: id,
          error: queueError.message,
        })
      }

      res.json(success({
        refundedCredits: costCredits,
      }, 'Video generation cancelled and credits refunded'))
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error
      }
      logger.error('Failed to cancel video:', { error: error.message, videoId: req.params.id })
      throw new AppError('Failed to cancel video', 400)
    }
  }
}
