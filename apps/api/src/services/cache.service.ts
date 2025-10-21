/**
 * Redis Cache Service
 *
 * Week 4: Performance Optimization - Redis Caching
 *
 * Features:
 * - User data caching
 * - Video list caching
 * - API response caching
 * - Automatic cache invalidation
 * - TTL management
 */

import Redis from 'ioredis'
import logger from '../lib/logger'

class CacheService {
  private redis: Redis
  private isConnected: boolean = false

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY'
        if (err.message.includes(targetError)) {
          // Reconnect on READONLY errors
          return true
        }
        return false
      },
    })

    this.redis.on('connect', () => {
      this.isConnected = true
      logger.info('Redis connected successfully')
    })

    this.redis.on('error', (error) => {
      this.isConnected = false
      logger.error('Redis connection error:', error)
    })

    this.redis.on('close', () => {
      this.isConnected = false
      logger.warn('Redis connection closed')
    })
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping cache get')
        return null
      }

      const value = await this.redis.get(key)
      if (!value) {
        return null
      }

      return JSON.parse(value) as T
    } catch (error) {
      logger.error('Cache get error:', error)
      return null
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping cache set')
        return false
      }

      const serialized = JSON.stringify(value)
      await this.redis.setex(key, ttlSeconds, serialized)
      return true
    } catch (error) {
      logger.error('Cache set error:', error)
      return false
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false
      }

      await this.redis.del(key)
      return true
    } catch (error) {
      logger.error('Cache delete error:', error)
      return false
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      if (!this.isConnected) {
        return 0
      }

      const keys = await this.redis.keys(pattern)
      if (keys.length === 0) {
        return 0
      }

      await this.redis.del(...keys)
      return keys.length
    } catch (error) {
      logger.error('Cache delete pattern error:', error)
      return 0
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false
      }

      const result = await this.redis.exists(key)
      return result === 1
    } catch (error) {
      logger.error('Cache exists error:', error)
      return false
    }
  }

  /**
   * Increment a counter
   */
  async increment(key: string, ttlSeconds?: number): Promise<number> {
    try {
      if (!this.isConnected) {
        return 0
      }

      const value = await this.redis.incr(key)

      if (ttlSeconds && value === 1) {
        // Set TTL only on first increment
        await this.redis.expire(key, ttlSeconds)
      }

      return value
    } catch (error) {
      logger.error('Cache increment error:', error)
      return 0
    }
  }

  /**
   * Get TTL for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      if (!this.isConnected) {
        return -1
      }

      return await this.redis.ttl(key)
    } catch (error) {
      logger.error('Cache TTL error:', error)
      return -1
    }
  }

  /**
   * Flush all cache (use with caution!)
   */
  async flush(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false
      }

      await this.redis.flushdb()
      logger.info('Cache flushed successfully')
      return true
    } catch (error) {
      logger.error('Cache flush error:', error)
      return false
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean
    keys: number
    memory: string
    hits?: number
    misses?: number
  }> {
    try {
      if (!this.isConnected) {
        return {
          connected: false,
          keys: 0,
          memory: '0B',
        }
      }

      const dbSize = await this.redis.dbsize()
      const info = await this.redis.info('memory')

      // Parse memory usage
      const memoryMatch = info.match(/used_memory_human:(.+)/)
      const memory = memoryMatch ? memoryMatch[1].trim() : '0B'

      // Parse stats if available
      const statsInfo = await this.redis.info('stats')
      const hitsMatch = statsInfo.match(/keyspace_hits:(\d+)/)
      const missesMatch = statsInfo.match(/keyspace_misses:(\d+)/)

      return {
        connected: true,
        keys: dbSize,
        memory,
        hits: hitsMatch ? parseInt(hitsMatch[1]) : undefined,
        misses: missesMatch ? parseInt(missesMatch[1]) : undefined,
      }
    } catch (error) {
      logger.error('Cache stats error:', error)
      return {
        connected: false,
        keys: 0,
        memory: '0B',
      }
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    try {
      await this.redis.quit()
      logger.info('Redis connection closed')
    } catch (error) {
      logger.error('Error closing Redis connection:', error)
    }
  }
}

// Singleton instance
export const cacheService = new CacheService()

// Cache key helpers
export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userBalance: (userId: string) => `user:${userId}:balance`,
  videos: (userId: string, filters?: string) =>
    `videos:${userId}${filters ? `:${filters}` : ''}`,
  video: (videoId: string) => `video:${videoId}`,
  userVideos: (userId: string) => `videos:user:${userId}:*`,
  allVideos: () => `videos:*`,
}

// Cache TTL constants (in seconds)
export const CacheTTL = {
  USER_DATA: 300, // 5 minutes
  USER_BALANCE: 60, // 1 minute
  VIDEO_LIST: 180, // 3 minutes
  VIDEO_DETAIL: 300, // 5 minutes
  API_RESPONSE: 120, // 2 minutes
}
