import { db } from '../lib/db'
import logger from '../lib/logger'
import { dbOptimizerService, QueryCacheConfig, generateCacheKey } from './db-optimizer.service'

/**
 * Order Service - Optimized database queries for order operations
 *
 * Performance optimizations:
 * - Uses composite index: orders_user_id_status_created_at_idx
 * - Implements efficient pagination
 * - Avoids N+1 queries
 * - Transaction safety for order operations
 * - Redis caching for frequently accessed data
 * - Automatic cache invalidation on updates
 */
export class OrderService {
  /**
   * Get user orders with optimized pagination
   * Uses composite index: orders_user_id_status_created_at_idx
   * With Redis caching for improved performance
   */
  async getUserOrders(userId: string, options: {
    page?: number
    limit?: number
    status?: string
    skipCache?: boolean
  } = {}) {
    const page = Number(options.page) || 1
    const limit = Number(options.limit) || 20
    const offset = (page - 1) * limit

    // Generate cache key
    const cacheKey = generateCacheKey(
      QueryCacheConfig.orderList.prefix,
      userId,
      page,
      limit,
      options.status || 'all'
    )

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
          const [ordersResult, totalResult] = await Promise.all([
        // This query uses the composite index: orders_user_id_status_created_at_idx
        db.query(
          `SELECT
            id,
            order_no as "orderNo",
            amount,
            credits,
            payment_method as "paymentMethod",
            status,
            to_char(paid_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "paidAt",
            to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "createdAt"
           FROM orders
           ${whereClause}
           ORDER BY created_at DESC
           LIMIT $2 OFFSET $3`,
          options.status ? params : params.slice(0, 3)
        ),
        db.query(
          `SELECT COUNT(*) as count FROM orders ${whereClause}`,
          options.status ? [userId, options.status] : [userId]
        ),
      ])

          const total = parseInt(totalResult.rows[0].count)

          return {
            orders: ordersResult.rows,
            pagination: {
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit),
            },
          }
        } catch (error: any) {
          logger.error('Failed to get user orders:', { error: error.message, userId })
          throw error
        }
      },
      QueryCacheConfig.orderList.ttl,
      options.skipCache
    )
  }

  /**
   * Get order by ID with user verification
   */
  async getOrderById(orderId: string, userId: string) {
    try {
      const result = await db.query(
        `SELECT
          id,
          order_no as "orderNo",
          amount,
          credits,
          payment_method as "paymentMethod",
          status,
          to_char(paid_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "paidAt",
          to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "createdAt"
         FROM orders
         WHERE id = $1 AND user_id = $2`,
        [orderId, userId]
      )

      return result.rows[0] || null
    } catch (error: any) {
      logger.error('Failed to get order by ID:', { error: error.message, orderId, userId })
      throw error
    }
  }

  /**
   * Get order by order number
   * Uses orderNo index for efficient lookup
   */
  async getOrderByOrderNo(orderNo: string) {
    try {
      const result = await db.query(
        `SELECT
          id,
          user_id as "userId",
          order_no as "orderNo",
          amount,
          credits,
          payment_method as "paymentMethod",
          status,
          to_char(paid_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "paidAt",
          to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "createdAt"
         FROM orders
         WHERE order_no = $1`,
        [orderNo]
      )

      return result.rows[0] || null
    } catch (error: any) {
      logger.error('Failed to get order by order number:', { error: error.message, orderNo })
      throw error
    }
  }

  /**
   * Create new order
   */
  async createOrder(
    userId: string,
    credits: number,
    amount: number,
    paymentMethod: string
  ) {
    try {
      // Generate unique order number
      const orderNo = this.generateOrderNo()

      const result = await db.query(
        `INSERT INTO orders
         (user_id, order_no, amount, credits, payment_method, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING
           id,
           order_no as "orderNo",
           amount,
           credits,
           payment_method as "paymentMethod",
           status,
           to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "createdAt"`,
        [userId, orderNo, amount, credits, paymentMethod, 'pending']
      )

      return result.rows[0]
    } catch (error: any) {
      logger.error('Failed to create order:', {
        error: error.message,
        userId,
        credits,
        amount
      })
      throw error
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: string, paidAt?: Date) {
    try {
      const result = await db.query(
        `UPDATE orders
         SET status = $1,
             paid_at = $2
         WHERE id = $3
         RETURNING
           id,
           status,
           to_char(paid_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "paidAt"`,
        [status, paidAt || null, orderId]
      )

      return result.rows[0]
    } catch (error: any) {
      logger.error('Failed to update order status:', {
        error: error.message,
        orderId,
        status
      })
      throw error
    }
  }

  /**
   * Process order payment (atomic operation)
   * Updates order and credits in a transaction
   * Invalidates cache after successful payment
   */
  async processPayment(orderId: string, userId: string) {
    try {
      const result = await db.transaction(async (client) => {
        // Get and lock order
        const orderResult = await client.query(
          'SELECT credits, status FROM orders WHERE id = $1 AND user_id = $2 FOR UPDATE',
          [orderId, userId]
        )

        if (orderResult.rows.length === 0) {
          throw new Error('Order not found')
        }

        const order = orderResult.rows[0]

        if (order.status !== 'pending') {
          throw new Error(`Cannot process payment for order with status: ${order.status}`)
        }

        // Update order status
        await client.query(
          'UPDATE orders SET status = $1, paid_at = NOW() WHERE id = $2',
          ['paid', orderId]
        )

        // Get and lock user
        const userResult = await client.query(
          'SELECT credits FROM users WHERE id = $1 FOR UPDATE',
          [userId]
        )

        const currentCredits = userResult.rows[0].credits
        const newBalance = currentCredits + order.credits

        // Add credits to user
        await client.query(
          'UPDATE users SET credits = $1, updated_at = NOW() WHERE id = $2',
          [newBalance, userId]
        )

        // Create credit transaction
        await client.query(
          `INSERT INTO credit_transactions
           (user_id, type, amount, balance_after, related_id, description, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            userId,
            'recharge',
            order.credits,
            newBalance,
            orderId,
            `Order payment: ${orderId}`
          ]
        )

        return {
          orderId,
          creditsAdded: order.credits,
          oldBalance: currentCredits,
          newBalance,
        }
      })

      // Invalidate related caches
      await this.invalidateUserOrderCache(userId)

      return result
    } catch (error: any) {
      logger.error('Failed to process payment:', {
        error: error.message,
        orderId,
        userId
      })
      throw error
    }
  }

  /**
   * Get order statistics for user
   */
  async getUserOrderStats(userId: string) {
    try {
      const result = await db.query(
        `SELECT
          COUNT(*) as "totalOrders",
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'paid') as paid,
          COUNT(*) FILTER (WHERE status = 'failed') as failed,
          COUNT(*) FILTER (WHERE status = 'refunded') as refunded,
          COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) as "totalSpent",
          COALESCE(SUM(credits) FILTER (WHERE status = 'paid'), 0) as "totalCreditsPurchased"
         FROM orders
         WHERE user_id = $1`,
        [userId]
      )

      return result.rows[0]
    } catch (error: any) {
      logger.error('Failed to get user order stats:', { error: error.message, userId })
      throw error
    }
  }

  /**
   * Get recent orders (for dashboard display)
   */
  async getRecentOrders(userId: string, limit: number = 10) {
    try {
      const result = await db.query(
        `SELECT
          id,
          order_no as "orderNo",
          amount,
          credits,
          status,
          to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "createdAt"
         FROM orders
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit]
      )

      return result.rows
    } catch (error: any) {
      logger.error('Failed to get recent orders:', { error: error.message, userId })
      throw error
    }
  }

  /**
   * Generate unique order number
   */
  private generateOrderNo(): string {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `ORD${timestamp}${random}`
  }

  /**
   * Invalidate all order caches for a user
   * Call this after order creation, update, or payment
   */
  async invalidateUserOrderCache(userId: string): Promise<void> {
    await Promise.all([
      dbOptimizerService.invalidateCache(`${QueryCacheConfig.orderList.prefix}${userId}*`),
      dbOptimizerService.invalidateCache(`${QueryCacheConfig.statistics.prefix}order:${userId}*`),
      dbOptimizerService.invalidateCache(`${QueryCacheConfig.userBalance.prefix}${userId}*`),
      dbOptimizerService.invalidateCache(`${QueryCacheConfig.transactionList.prefix}${userId}*`),
    ])
  }
}

export const orderService = new OrderService()
