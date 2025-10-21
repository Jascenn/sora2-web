import { db } from '../lib/db'
import logger from '../lib/logger'
import { dbOptimizerService, QueryCacheConfig, generateCacheKey } from './db-optimizer.service'

/**
 * Credit Service - Optimized database queries for credit operations
 *
 * Performance optimizations:
 * - Uses composite index: credit_transactions_user_id_created_at_idx
 * - Implements efficient pagination
 * - Avoids N+1 queries
 * - Transaction safety for credit operations
 * - Redis caching for frequently accessed data
 * - Automatic cache invalidation on updates
 */
export class CreditService {
  /**
   * Get user credit balance
   * Single query optimization with caching
   */
  async getBalance(userId: string, skipCache: boolean = false) {
    const cacheKey = generateCacheKey(
      QueryCacheConfig.userBalance.prefix,
      userId
    )

    return dbOptimizerService.cachedQuery(
      cacheKey,
      async () => {
        try {
          const result = await db.query(
            'SELECT credits FROM users WHERE id = $1',
            [userId]
          )

          return result.rows[0]?.credits || 0
        } catch (error: any) {
          logger.error('Failed to get credit balance:', { error: error.message, userId })
          throw error
        }
      },
      QueryCacheConfig.userBalance.ttl,
      skipCache
    )
  }

  /**
   * Get credit transactions with optimized pagination
   * Uses composite index: credit_transactions_user_id_created_at_idx
   * With Redis caching for improved performance
   */
  async getTransactions(userId: string, options: {
    page?: number
    limit?: number
    type?: string
    skipCache?: boolean
  } = {}) {
    const page = Number(options.page) || 1
    const limit = Number(options.limit) || 20
    const offset = (page - 1) * limit

    // Generate cache key
    const cacheKey = generateCacheKey(
      QueryCacheConfig.transactionList.prefix,
      userId,
      page,
      limit,
      options.type || 'all'
    )

    return dbOptimizerService.cachedQuery(
      cacheKey,
      async () => {
        const params: any[] = [userId, limit, offset]
        let whereClause = 'WHERE user_id = $1'

        if (options.type) {
          whereClause += ' AND type = $4'
          params.push(options.type)
        }

        try {
          // Parallel execution for better performance
          const [transactionsResult, totalResult] = await Promise.all([
        // This query uses the composite index: credit_transactions_user_id_created_at_idx
        db.query(
          `SELECT
            id,
            type,
            amount,
            balance_after as "balanceAfter",
            related_id as "relatedId",
            description,
            to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "createdAt"
           FROM credit_transactions
           ${whereClause}
           ORDER BY created_at DESC
           LIMIT $2 OFFSET $3`,
          options.type ? params : params.slice(0, 3)
        ),
        db.query(
          `SELECT COUNT(*) as count FROM credit_transactions ${whereClause}`,
          options.type ? [userId, options.type] : [userId]
        ),
      ])

          const total = parseInt(totalResult.rows[0].count)

          return {
            transactions: transactionsResult.rows,
            pagination: {
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit),
            },
          }
        } catch (error: any) {
          logger.error('Failed to get credit transactions:', { error: error.message, userId })
          throw error
        }
      },
      QueryCacheConfig.transactionList.ttl,
      options.skipCache
    )
  }

  /**
   * Get recent transactions (optimized for dashboard display)
   */
  async getRecentTransactions(userId: string, limit: number = 10) {
    try {
      // Uses composite index for efficient lookup
      const result = await db.query(
        `SELECT
          id,
          type,
          amount,
          balance_after as "balanceAfter",
          description,
          to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "createdAt"
         FROM credit_transactions
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit]
      )

      return result.rows
    } catch (error: any) {
      logger.error('Failed to get recent transactions:', { error: error.message, userId })
      throw error
    }
  }

  /**
   * Get credit statistics for user
   * Optimized aggregation query
   */
  async getUserCreditStats(userId: string) {
    try {
      const result = await db.query(
        `SELECT
          COUNT(*) as "totalTransactions",
          COALESCE(SUM(amount) FILTER (WHERE type = 'recharge'), 0) as "totalRecharged",
          COALESCE(SUM(ABS(amount)) FILTER (WHERE type = 'consume'), 0) as "totalConsumed",
          COALESCE(SUM(amount) FILTER (WHERE type = 'gift'), 0) as "totalGifted",
          COALESCE(SUM(amount) FILTER (WHERE type = 'refund'), 0) as "totalRefunded"
         FROM credit_transactions
         WHERE user_id = $1`,
        [userId]
      )

      return result.rows[0]
    } catch (error: any) {
      logger.error('Failed to get user credit stats:', { error: error.message, userId })
      throw error
    }
  }

  /**
   * Add credits with transaction record (atomic operation)
   * Invalidates cache after successful operation
   */
  async addCredits(
    userId: string,
    amount: number,
    type: 'recharge' | 'gift' | 'refund',
    description: string,
    relatedId?: string
  ) {
    try {
      const result = await db.transaction(async (client) => {
        // Lock user row and get current credits
        const userResult = await client.query(
          'SELECT credits FROM users WHERE id = $1 FOR UPDATE',
          [userId]
        )

        if (userResult.rows.length === 0) {
          throw new Error('User not found')
        }

        const currentCredits = userResult.rows[0].credits
        const newBalance = currentCredits + amount

        // Update user credits
        await client.query(
          'UPDATE users SET credits = $1, updated_at = NOW() WHERE id = $2',
          [newBalance, userId]
        )

        // Create transaction record
        const txResult = await client.query(
          `INSERT INTO credit_transactions
           (user_id, type, amount, balance_after, related_id, description, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           RETURNING id, created_at as "createdAt"`,
          [userId, type, amount, newBalance, relatedId || null, description]
        )

        return {
          transactionId: txResult.rows[0].id,
          oldBalance: currentCredits,
          newBalance,
          createdAt: txResult.rows[0].createdAt,
        }
      })

      // Invalidate related caches
      await this.invalidateUserCreditCache(userId)

      return result
    } catch (error: any) {
      logger.error('Failed to add credits:', {
        error: error.message,
        userId,
        amount,
        type
      })
      throw error
    }
  }

  /**
   * Deduct credits with transaction record (atomic operation)
   * Invalidates cache after successful operation
   */
  async deductCredits(
    userId: string,
    amount: number,
    description: string,
    relatedId?: string
  ) {
    try {
      const result = await db.transaction(async (client) => {
        // Lock user row and get current credits
        const userResult = await client.query(
          'SELECT credits FROM users WHERE id = $1 FOR UPDATE',
          [userId]
        )

        if (userResult.rows.length === 0) {
          throw new Error('User not found')
        }

        const currentCredits = userResult.rows[0].credits

        if (currentCredits < amount) {
          throw new Error(`Insufficient credits. Required: ${amount}, Available: ${currentCredits}`)
        }

        const newBalance = currentCredits - amount

        // Update user credits
        await client.query(
          'UPDATE users SET credits = $1, updated_at = NOW() WHERE id = $2',
          [newBalance, userId]
        )

        // Create transaction record
        const txResult = await client.query(
          `INSERT INTO credit_transactions
           (user_id, type, amount, balance_after, related_id, description, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           RETURNING id, created_at as "createdAt"`,
          [userId, 'consume', -amount, newBalance, relatedId || null, description]
        )

        return {
          transactionId: txResult.rows[0].id,
          oldBalance: currentCredits,
          newBalance,
          createdAt: txResult.rows[0].createdAt,
        }
      })

      // Invalidate related caches
      await this.invalidateUserCreditCache(userId)

      return result
    } catch (error: any) {
      logger.error('Failed to deduct credits:', {
        error: error.message,
        userId,
        amount
      })
      throw error
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(transactionId: string, userId: string) {
    try {
      const result = await db.query(
        `SELECT
          id,
          type,
          amount,
          balance_after as "balanceAfter",
          related_id as "relatedId",
          description,
          to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "createdAt"
         FROM credit_transactions
         WHERE id = $1 AND user_id = $2`,
        [transactionId, userId]
      )

      return result.rows[0] || null
    } catch (error: any) {
      logger.error('Failed to get transaction by ID:', {
        error: error.message,
        transactionId,
        userId
      })
      throw error
    }
  }

  /**
   * Invalidate all credit-related caches for a user
   * Call this after credit changes or transaction creation
   */
  async invalidateUserCreditCache(userId: string): Promise<void> {
    await Promise.all([
      dbOptimizerService.invalidateCache(`${QueryCacheConfig.userBalance.prefix}${userId}*`),
      dbOptimizerService.invalidateCache(`${QueryCacheConfig.transactionList.prefix}${userId}*`),
      dbOptimizerService.invalidateCache(`${QueryCacheConfig.statistics.prefix}credit:${userId}*`),
      dbOptimizerService.invalidateCache(`${QueryCacheConfig.user.prefix}${userId}*`),
    ])
  }
}

export const creditService = new CreditService()
