/**
 * Cache Usage Examples
 *
 * Week 4: Performance Optimization - Redis Cache Integration
 *
 * This file demonstrates how to use the cache service in controllers and routes
 */

import { Router, Request, Response } from 'express'
import { cacheService, CacheKeys, CacheTTL } from '../services/cache.service'
import { cacheMiddleware, invalidateUserCache, invalidateVideoCache } from '../middleware/cache.middleware'

const router = Router()

// ============================================================================
// Example 1: Manual caching in controller
// ============================================================================

router.get('/user/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params

  try {
    // Try to get from cache first
    const cacheKey = CacheKeys.user(userId)
    const cachedUser = await cacheService.get<any>(cacheKey)

    if (cachedUser) {
      return res.json({
        user: cachedUser,
        cached: true,
      })
    }

    // If not in cache, fetch from database
    // const user = await db.query('SELECT * FROM users WHERE id = $1', [userId])
    const user = { id: userId, name: 'Example User' } // Placeholder

    // Store in cache for future requests
    await cacheService.set(cacheKey, user, CacheTTL.USER_DATA)

    res.json({
      user,
      cached: false,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' })
  }
})

// ============================================================================
// Example 2: Automatic caching with middleware
// ============================================================================

router.get(
  '/videos',
  cacheMiddleware({
    ttl: CacheTTL.VIDEO_LIST,
    keyPrefix: 'videos',
    varyBy: ['user.id', 'query.status', 'query.resolution'],
  }),
  async (req: Request, res: Response) => {
    // This response will be automatically cached
    // const videos = await db.query('SELECT * FROM videos WHERE user_id = $1', [req.user.id])
    const videos = [
      { id: '1', title: 'Video 1' },
      { id: '2', title: 'Video 2' },
    ] // Placeholder

    res.json({ videos })
  }
)

// ============================================================================
// Example 3: Cache invalidation on data modification
// ============================================================================

router.post('/videos', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id

    // Create video in database
    // const video = await db.query('INSERT INTO videos ...')
    const video = { id: 'new-video', title: 'New Video' } // Placeholder

    // Invalidate related cache
    await invalidateUserCache(userId)
    await invalidateVideoCache()

    res.json({ video })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create video' })
  }
})

router.delete('/videos/:videoId', async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params
    const userId = (req as any).user?.id

    // Delete video from database
    // await db.query('DELETE FROM videos WHERE id = $1', [videoId])

    // Invalidate cache
    await invalidateVideoCache(videoId)
    await invalidateUserCache(userId)

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete video' })
  }
})

// ============================================================================
// Example 4: User balance caching with short TTL
// ============================================================================

router.get('/user/:userId/balance', async (req: Request, res: Response) => {
  const { userId } = req.params

  try {
    const cacheKey = CacheKeys.userBalance(userId)
    const cachedBalance = await cacheService.get<number>(cacheKey)

    if (cachedBalance !== null) {
      return res.json({ balance: cachedBalance, cached: true })
    }

    // Fetch from database
    // const result = await db.query('SELECT credits FROM users WHERE id = $1', [userId])
    const balance = 100 // Placeholder

    // Cache with short TTL (1 minute) since balance changes frequently
    await cacheService.set(cacheKey, balance, CacheTTL.USER_BALANCE)

    res.json({ balance, cached: false })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get balance' })
  }
})

// Update balance and invalidate cache
router.post('/user/:userId/balance', async (req: Request, res: Response) => {
  const { userId } = req.params
  const { amount } = req.body

  try {
    // Update in database
    // await db.query('UPDATE users SET credits = credits + $1 WHERE id = $2', [amount, userId])

    // Invalidate balance cache
    const cacheKey = CacheKeys.userBalance(userId)
    await cacheService.delete(cacheKey)

    // Also invalidate user cache
    await cacheService.delete(CacheKeys.user(userId))

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update balance' })
  }
})

// ============================================================================
// Example 5: Cache statistics endpoint
// ============================================================================

router.get('/cache/stats', async (req: Request, res: Response) => {
  try {
    const stats = await cacheService.getStats()
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cache stats' })
  }
})

// ============================================================================
// Example 6: Clear cache (admin only)
// ============================================================================

router.post('/cache/clear', async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    // if (req.user?.role !== 'admin') {
    //   return res.status(403).json({ error: 'Forbidden' })
    // }

    await cacheService.flush()
    res.json({ success: true, message: 'Cache cleared' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear cache' })
  }
})

export default router

/**
 * Integration Guide
 * =================
 *
 * 1. Import cache service and helpers:
 *    import { cacheService, CacheKeys, CacheTTL } from '../services/cache.service'
 *    import { cacheMiddleware, invalidateUserCache } from '../middleware/cache.middleware'
 *
 * 2. For READ operations (GET):
 *    - Option A: Use cacheMiddleware for automatic caching
 *    - Option B: Manual caching with cacheService.get/set
 *
 * 3. For WRITE operations (POST/PUT/DELETE):
 *    - Always invalidate related cache after successful write
 *    - Use invalidateUserCache(), invalidateVideoCache(), or cacheService.deletePattern()
 *
 * 4. Cache Key Strategy:
 *    - Use CacheKeys helpers for consistency
 *    - Include all parameters that affect the response (userId, filters, etc.)
 *    - Pattern: `resource:id:subresource:filters`
 *
 * 5. TTL Strategy:
 *    - Frequently changing data: 60s (e.g., balance)
 *    - Moderately changing data: 180s (e.g., video list)
 *    - Rarely changing data: 300s (e.g., user profile)
 *
 * 6. Error Handling:
 *    - Cache operations should not break the application
 *    - If cache fails, fetch from database (cache is optional optimization)
 *    - Log cache errors for monitoring
 */
