import { db } from '../lib/db'
import logger from '../lib/logger'
import { dbOptimizerService, QueryCacheConfig, generateCacheKey } from './db-optimizer.service'

/**
 * Video Service - Optimized database queries for video operations
 *
 * Performance optimizations:
 * - Uses composite indexes for filtered queries
 * - Implements proper pagination
 * - Avoids N+1 queries by using efficient SQL
 * - Selective field projection to reduce data transfer
 * - Redis caching for frequently accessed data
 * - Automatic cache invalidation on updates
 */
export class VideoService {
  /**
   * Get videos for a user with optimized query using composite index
   * Uses: videos_user_id_status_created_at_idx
   * With Redis caching for improved performance
   */
  async getUserVideos(userId: string, options: {
    page?: number
    limit?: number
    status?: string
    skipCache?: boolean
  } = {}) {
    const page = Number(options.page) || 1
    const limit = Number(options.limit) || 20
    const offset = (page - 1) * limit

    // Generate cache key based on query parameters
    const cacheKey = generateCacheKey(
      QueryCacheConfig.videoList.prefix,
      userId,
      page,
      limit,
      options.status || 'all'
    )

    // Use cached query with automatic caching
    return dbOptimizerService.cachedQuery(
      cacheKey,
      async () => {
        const params: any[] = [userId, limit, offset]
        let whereClause = 'WHERE user_id = $1'

        if (options.status) {
          whereClause += ' AND status = $4'
          params.push(options.status)
        }

        try {
          // Parallel execution for better performance
          const [videosResult, totalResult] = await Promise.all([
        // This query will use the composite index: videos_user_id_status_created_at_idx
        db.query(
          `SELECT
            id,
            prompt,
            negative_prompt as "negativePrompt",
            duration,
            resolution,
            aspect_ratio as "aspectRatio",
            style,
            fps,
            status,
            file_url as "fileUrl",
            thumbnail_url as "thumbnailUrl",
            file_size as "fileSize",
            cost_credits as "costCredits",
            error_message as "errorMessage",
            to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "createdAt",
            to_char(completed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "completedAt"
           FROM videos
           ${whereClause}
           ORDER BY created_at DESC
           LIMIT $2 OFFSET $3`,
          options.status ? params : params.slice(0, 3)
        ),
        db.query(
          `SELECT COUNT(*) as count FROM videos ${whereClause}`,
          options.status ? [userId, options.status] : [userId]
        ),
      ])

          const total = parseInt(totalResult.rows[0].count)

          return {
            videos: videosResult.rows,
            pagination: {
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit),
            },
          }
        } catch (error: any) {
          logger.error('Failed to get user videos:', { error: error.message, userId })
          throw error
        }
      },
      QueryCacheConfig.videoList.ttl,
      options.skipCache
    )
  }

  /**
   * Get video by ID with user verification
   * Optimized with single query and caching
   */
  async getVideoById(videoId: string, userId: string, skipCache: boolean = false) {
    const cacheKey = generateCacheKey(
      QueryCacheConfig.videoDetail.prefix,
      videoId,
      userId
    )

    return dbOptimizerService.cachedQuery(
      cacheKey,
      async () => {
        try {
          const result = await db.query(
        `SELECT
          id,
          prompt,
          negative_prompt as "negativePrompt",
          duration,
          resolution,
          aspect_ratio as "aspectRatio",
          style,
          fps,
          status,
          file_url as "fileUrl",
          thumbnail_url as "thumbnailUrl",
          file_size as "fileSize",
          cost_credits as "costCredits",
          openai_task_id as "openaiTaskId",
          error_message as "errorMessage",
          to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "createdAt",
          to_char(completed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "completedAt",
          to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "updatedAt"
         FROM videos
         WHERE id = $1 AND user_id = $2`,
        [videoId, userId]
      )

          return result.rows[0] || null
        } catch (error: any) {
          logger.error('Failed to get video by ID:', { error: error.message, videoId, userId })
          throw error
        }
      },
      QueryCacheConfig.videoDetail.ttl,
      skipCache
    )
  }

  /**
   * Get video status - lightweight query with only needed fields
   */
  async getVideoStatus(videoId: string, userId: string) {
    try {
      const result = await db.query(
        `SELECT
          status,
          error_message as "errorMessage",
          to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "createdAt",
          to_char(completed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "completedAt",
          openai_task_id as "openaiTaskId"
         FROM videos
         WHERE id = $1 AND user_id = $2`,
        [videoId, userId]
      )

      return result.rows[0] || null
    } catch (error: any) {
      logger.error('Failed to get video status:', { error: error.message, videoId, userId })
      throw error
    }
  }

  /**
   * Get videos by status for background processing
   * Optimized for worker queries
   */
  async getVideosByStatus(status: string, limit: number = 10) {
    try {
      // Uses status index for efficient lookup
      const result = await db.query(
        `SELECT
          id,
          user_id as "userId",
          prompt,
          negative_prompt as "negativePrompt",
          duration,
          resolution,
          aspect_ratio as "aspectRatio",
          style,
          fps,
          openai_task_id as "openaiTaskId",
          created_at as "createdAt"
         FROM videos
         WHERE status = $1
         ORDER BY created_at ASC
         LIMIT $2`,
        [status, limit]
      )

      return result.rows
    } catch (error: any) {
      logger.error('Failed to get videos by status:', { error: error.message, status })
      throw error
    }
  }

  /**
   * Batch update video status
   * Useful for processing multiple videos efficiently
   * Invalidates cache after update
   */
  async batchUpdateStatus(videoIds: string[], status: string, errorMessage?: string) {
    try {
      const result = await db.query(
        `UPDATE videos
         SET status = $1,
             error_message = $2,
             updated_at = NOW()
         WHERE id = ANY($3::uuid[])
         RETURNING id, user_id`,
        [status, errorMessage || null, videoIds]
      )

      // Invalidate cache for affected users
      const userIds = [...new Set(result.rows.map(row => row.user_id))]
      await Promise.all(
        userIds.map(userId =>
          dbOptimizerService.invalidateCache(`${QueryCacheConfig.videoList.prefix}${userId}*`)
        )
      )

      return result.rows
    } catch (error: any) {
      logger.error('Failed to batch update video status:', {
        error: error.message,
        videoIds: videoIds.length,
        status
      })
      throw error
    }
  }

  /**
   * Get user video statistics
   * Optimized aggregation query with caching
   */
  async getUserVideoStats(userId: string, skipCache: boolean = false) {
    const cacheKey = generateCacheKey(
      QueryCacheConfig.statistics.prefix,
      'video',
      userId
    )

    return dbOptimizerService.cachedQuery(
      cacheKey,
      async () => {
        try {
          const result = await db.query(
        `SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'processing') as processing,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'failed') as failed,
          COALESCE(SUM(cost_credits), 0) as "totalCreditsSpent"
         FROM videos
         WHERE user_id = $1`,
        [userId]
      )

          return result.rows[0]
        } catch (error: any) {
          logger.error('Failed to get user video stats:', { error: error.message, userId })
          throw error
        }
      },
      QueryCacheConfig.statistics.ttl,
      skipCache
    )
  }

  /**
   * Invalidate all video caches for a user
   * Call this after video creation, update, or deletion
   */
  async invalidateUserVideoCache(userId: string): Promise<void> {
    await Promise.all([
      dbOptimizerService.invalidateCache(`${QueryCacheConfig.videoList.prefix}${userId}*`),
      dbOptimizerService.invalidateCache(`${QueryCacheConfig.statistics.prefix}video:${userId}*`),
    ])
  }

  /**
   * Invalidate cache for a specific video
   */
  async invalidateVideoCache(videoId: string, userId: string): Promise<void> {
    await Promise.all([
      dbOptimizerService.invalidateCache(generateCacheKey(QueryCacheConfig.videoDetail.prefix, videoId, userId)),
      this.invalidateUserVideoCache(userId),
    ])
  }
}

export const videoService = new VideoService()
