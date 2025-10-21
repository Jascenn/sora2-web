/**
 * Cache Middleware
 *
 * Week 4: Performance Optimization - API Response Caching
 */

import { Request, Response, NextFunction } from 'express'
import { cacheService } from '../services/cache.service'
import logger from '../lib/logger'

interface CacheOptions {
  ttl?: number // TTL in seconds
  keyPrefix?: string
  varyBy?: string[] // Request properties to vary cache by (e.g., ['userId', 'query.status'])
}

/**
 * Cache middleware factory
 *
 * Usage:
 * router.get('/api/videos', cacheMiddleware({ ttl: 180 }), controller.getVideos)
 */
export function cacheMiddleware(options: CacheOptions = {}) {
  const { ttl = 120, keyPrefix = 'api', varyBy = [] } = options

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next()
    }

    // Build cache key
    const cacheKey = buildCacheKey(req, keyPrefix, varyBy)

    try {
      // Try to get from cache
      const cachedData = await cacheService.get<any>(cacheKey)

      if (cachedData) {
        logger.debug(`Cache hit: ${cacheKey}`)
        return res.json(cachedData)
      }

      logger.debug(`Cache miss: ${cacheKey}`)

      // Capture original res.json
      const originalJson = res.json.bind(res)

      // Override res.json to cache the response
      res.json = function (data: any) {
        // Cache the response
        cacheService.set(cacheKey, data, ttl).catch((error) => {
          logger.error('Error caching response:', error)
        })

        // Call original json method
        return originalJson(data)
      }

      next()
    } catch (error) {
      logger.error('Cache middleware error:', error)
      // On error, skip caching and continue
      next()
    }
  }
}

/**
 * Build cache key from request
 */
function buildCacheKey(
  req: Request,
  prefix: string,
  varyBy: string[]
): string {
  const parts = [prefix, req.path]

  // Add query string if exists
  const queryString = new URLSearchParams(req.query as any).toString()
  if (queryString) {
    parts.push(queryString)
  }

  // Add custom vary parameters
  for (const param of varyBy) {
    const value = getNestedProperty(req, param)
    if (value !== undefined) {
      parts.push(`${param}:${value}`)
    }
  }

  return parts.join(':')
}

/**
 * Get nested property from object
 */
function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, prop) => current?.[prop], obj)
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCache(pattern: string): Promise<number> {
  try {
    const count = await cacheService.deletePattern(pattern)
    logger.info(`Invalidated ${count} cache keys matching: ${pattern}`)
    return count
  } catch (error) {
    logger.error('Error invalidating cache:', error)
    return 0
  }
}

/**
 * Invalidate user-related cache
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  await invalidateCache(`*user:${userId}*`)
  await invalidateCache(`*videos:${userId}*`)
}

/**
 * Invalidate video-related cache
 */
export async function invalidateVideoCache(videoId?: string): Promise<void> {
  if (videoId) {
    await invalidateCache(`*video:${videoId}*`)
  }
  await invalidateCache('*videos:*')
}
