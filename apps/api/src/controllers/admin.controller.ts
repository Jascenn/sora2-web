import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { AppError } from '../middleware/error.middleware'
import { db } from '../lib/db'
import { queueService } from '../services/queue.service'
import { configService } from '../services/config.service'
import { success, error } from '../lib/response'

export class AdminController {
  /**
   * Get system statistics
   */
  async getStats(req: AuthRequest, res: Response) {
    try {
      // Get user stats
      const userStats = await db.query(`
        SELECT
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE status = 'active') as active_users,
          COUNT(*) FILTER (WHERE status = 'banned') as banned_users,
          SUM(credits) as total_credits
        FROM users
      `)

      // Get video stats
      const videoStats = await db.query(`
        SELECT
          COUNT(*) as total_videos,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_videos,
          COUNT(*) FILTER (WHERE status = 'processing') as processing_videos,
          COUNT(*) FILTER (WHERE status = 'failed') as failed_videos,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_videos,
          SUM(file_size) as total_storage
        FROM videos
      `)

      // Get credit transaction stats (last 30 days)
      const creditStats = await db.query(`
        SELECT
          SUM(amount) FILTER (WHERE type = 'purchase') as total_purchases,
          SUM(amount) FILTER (WHERE type = 'consumption') as total_consumption,
          SUM(amount) FILTER (WHERE type = 'refund') as total_refunds
        FROM credit_transactions
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `)

      // Get order stats
      const orderStats = await db.query(`
        SELECT
          COUNT(*) as total_orders,
          COUNT(*) FILTER (WHERE status = 'paid') as paid_orders,
          SUM(amount) FILTER (WHERE status = 'paid') as total_revenue
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `)

      // Get queue stats
      const queueStats = await queueService.getQueueStats()

      res.json(success({
        users: userStats.rows[0],
        videos: videoStats.rows[0],
        credits: creditStats.rows[0],
        orders: orderStats.rows[0],
        queue: queueStats,
      }))
    } catch (err: any) {
      console.error('Get stats error:', err)
      res.status(500).json(error('Failed to get system stats'))
    }
  }

  /**
   * Get all users with pagination
   */
  async getUsers(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const search = req.query.search as string
      const status = req.query.status as string
      const offset = (page - 1) * limit

      let whereClause = ''
      const params: any[] = []

      if (search) {
        params.push(`%${search}%`, `%${search}%`)
        whereClause = `WHERE email LIKE $${params.length - 1} OR nickname LIKE $${params.length}`
      }

      if (status) {
        if (whereClause) {
          params.push(status)
          whereClause += ` AND status = $${params.length}`
        } else {
          params.push(status)
          whereClause = `WHERE status = $${params.length}`
        }
      }

      params.push(limit, offset)

      const result = await db.query(
        `SELECT id, email, nickname, avatar_url as "avatarUrl", credits, role, status, created_at as "createdAt"
         FROM users
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      )

      const countResult = await db.query(
        `SELECT COUNT(*) FROM users ${whereClause}`,
        params.slice(0, -2)
      )

      res.json(success({
        users: result.rows,
        total: parseInt(countResult.rows[0].count),
        page,
        limit,
      }))
    } catch (err: any) {
      console.error('Get users error:', err)
      res.status(500).json(error('Failed to get users'))
    }
  }

  /**
   * Update user credits
   */
  async updateUserCredits(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const { credits, reason } = req.body

      if (typeof credits !== 'number') {
        return res.status(400).json(error('Invalid credits amount'))
      }

      // Use transaction with row-level locking to prevent race conditions
      const newBalance = await db.transaction(async (client) => {
        // Get current user credits with FOR UPDATE lock
        const userResult = await client.query(
          'SELECT credits, email FROM users WHERE id = $1 FOR UPDATE',
          [id]
        )

        if (userResult.rows.length === 0) {
          throw new AppError('User not found', 404)
        }

        const currentCredits = userResult.rows[0].credits
        const calculatedBalance = currentCredits + credits

        if (calculatedBalance < 0) {
          throw new AppError('Insufficient credits', 400)
        }

        // Update user credits
        await client.query(
          'UPDATE users SET credits = $1, updated_at = NOW() WHERE id = $2',
          [calculatedBalance, id]
        )

        // Create transaction record
        await client.query(
          `INSERT INTO credit_transactions (user_id, type, amount, balance_after, description, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            id,
            credits > 0 ? 'admin_add' : 'admin_deduct',
            credits,
            calculatedBalance,
            reason || `Admin ${credits > 0 ? 'added' : 'deducted'} credits`,
          ]
        )

        return calculatedBalance
      })

      res.json(success({
        newBalance,
      }, 'Credits updated successfully'))
    } catch (err: any) {
      console.error('Update credits error:', err)
      res.status(500).json(error('Failed to update credits'))
    }
  }

  /**
   * Update user status (ban/unban)
   */
  async updateUserStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const { status } = req.body

      if (!['active', 'banned'].includes(status)) {
        return res.status(400).json(error('Invalid status'))
      }

      const result = await db.query(
        'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING email',
        [status, id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json(error('User not found'))
      }

      res.json(success({}, `User ${status === 'banned' ? 'banned' : 'unbanned'} successfully`))
    } catch (err: any) {
      console.error('Update user status error:', err)
      res.status(500).json(error('Failed to update user status'))
    }
  }

  /**
   * Get all videos with pagination
   */
  async getVideos(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const status = req.query.status as string
      const offset = (page - 1) * limit

      let whereClause = ''
      const params: any[] = []

      if (status) {
        params.push(status)
        whereClause = `WHERE v.status = $${params.length}`
      }

      params.push(limit, offset)

      const result = await db.query(
        `SELECT
          v.id, v.prompt, v.duration, v.resolution, v.aspect_ratio as "aspectRatio",
          v.status, v.file_url as "fileUrl", v.thumbnail_url as "thumbnailUrl",
          v.cost_credits as "costCredits", v.created_at as "createdAt",
          v.completed_at as "completedAt", v.error_message as "errorMessage",
          u.email as "userEmail", u.nickname as "userName"
         FROM videos v
         LEFT JOIN users u ON v.user_id = u.id
         ${whereClause}
         ORDER BY v.created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      )

      const countResult = await db.query(
        `SELECT COUNT(*) FROM videos v ${whereClause}`,
        params.slice(0, -2)
      )

      res.json(success({
        videos: result.rows,
        total: parseInt(countResult.rows[0].count),
        page,
        limit,
      }))
    } catch (err: any) {
      console.error('Get videos error:', err)
      res.status(500).json(error('Failed to get videos'))
    }
  }

  /**
   * Delete video
   */
  async deleteVideo(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      const result = await db.query(
        'DELETE FROM videos WHERE id = $1 RETURNING id',
        [id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json(error('Video not found'))
      }

      res.json(success({}, 'Video deleted successfully'))
    } catch (err: any) {
      console.error('Delete video error:', err)
      res.status(500).json(error('Failed to delete video'))
    }
  }

  /**
   * Get credit transactions
   */
  async getTransactions(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 50
      const type = req.query.type as string
      const userId = req.query.userId as string
      const offset = (page - 1) * limit

      let whereClause = ''
      const params: any[] = []

      if (type) {
        params.push(type)
        whereClause = `WHERE t.type = $${params.length}`
      }

      if (userId) {
        if (whereClause) {
          params.push(userId)
          whereClause += ` AND t.user_id = $${params.length}`
        } else {
          params.push(userId)
          whereClause = `WHERE t.user_id = $${params.length}`
        }
      }

      params.push(limit, offset)

      const result = await db.query(
        `SELECT
          t.id, t.type, t.amount, t.balance_after as "balanceAfter",
          t.description, t.created_at as "createdAt",
          u.email as "userEmail", u.nickname as "userName"
         FROM credit_transactions t
         LEFT JOIN users u ON t.user_id = u.id
         ${whereClause}
         ORDER BY t.created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      )

      const countResult = await db.query(
        `SELECT COUNT(*) FROM credit_transactions t ${whereClause}`,
        params.slice(0, -2)
      )

      res.json(success({
        transactions: result.rows,
        total: parseInt(countResult.rows[0].count),
        page,
        limit,
      }))
    } catch (err: any) {
      console.error('Get transactions error:', err)
      res.status(500).json(error('Failed to get transactions'))
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(req: AuthRequest, res: Response) {
    try {
      const stats = await queueService.getQueueStats()
      res.json(success(stats))
    } catch (err: any) {
      console.error('Get queue stats error:', err)
      res.status(500).json(error('Failed to get queue stats'))
    }
  }

  /**
   * Get all system configurations
   */
  async getConfigs(req: AuthRequest, res: Response) {
    try {
      const category = req.query.category as string

      if (category) {
        const configs = await configService.getConfigsByCategory(category)
        res.json(success({ configs }))
      } else {
        const configs = await configService.getAllConfigs()
        const categories = await configService.getCategories()
        res.json(success({ configs, categories }))
      }
    } catch (err: any) {
      console.error('Get configs error:', err)
      res.status(500).json(error('Failed to get configurations'))
    }
  }

  /**
   * Update system configuration
   */
  async updateConfig(req: AuthRequest, res: Response) {
    try {
      const { key } = req.params
      const { value } = req.body

      if (!value && value !== '') {
        return res.status(400).json(error('Value is required'))
      }

      await configService.updateConfig(key, value.toString())

      res.json(success({}, 'Configuration updated successfully'))
    } catch (err: any) {
      console.error('Update config error:', err)
      res.status(500).json(error('Failed to update configuration'))
    }
  }

  /**
   * Update multiple configurations
   */
  async updateConfigs(req: AuthRequest, res: Response) {
    try {
      const { configs } = req.body

      if (!configs || typeof configs !== 'object') {
        return res.status(400).json(error('Invalid configurations'))
      }

      await configService.updateConfigs(configs)

      res.json(success({}, 'Configurations updated successfully'))
    } catch (err: any) {
      console.error('Update configs error:', err)
      res.status(500).json(error('Failed to update configurations'))
    }
  }
}
