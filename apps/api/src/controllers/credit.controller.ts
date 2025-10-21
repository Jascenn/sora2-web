import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { AppError } from '../middleware/error.middleware'
import { db } from '../lib/db'
import { success } from '../lib/response'

export class CreditController {
  async getBalance(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!

      const result = await db.query(
        'SELECT credits FROM users WHERE id = $1',
        [userId]
      )

      if (result.rows.length === 0) {
        throw new AppError('User not found', 404)
      }

      res.json(success({ balance: result.rows[0].credits }))
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error
      }
      console.error('Failed to get balance:', error)
      throw new AppError('Failed to get balance', 400)
    }
  }

  async getTransactions(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!
      const { page = 1, limit = 20 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const [transactionsResult, totalResult] = await Promise.all([
        db.query(
          `SELECT id, type, amount, balance_after as "balanceAfter", related_id as "relatedId",
                  description, created_at as "createdAt"
           FROM credit_transactions
           WHERE user_id = $1
           ORDER BY created_at DESC
           LIMIT $2 OFFSET $3`,
          [userId, Number(limit), offset]
        ),
        db.query(
          'SELECT COUNT(*) as count FROM credit_transactions WHERE user_id = $1',
          [userId]
        ),
      ])

      res.json(success({
        transactions: transactionsResult.rows,
        total: parseInt(totalResult.rows[0].count),
        page: Number(page),
        limit: Number(limit),
      }))
    } catch (error) {
      console.error('Failed to get transactions:', error)
      throw new AppError('Failed to get transactions', 400)
    }
  }

  async recharge(req: AuthRequest, res: Response) {
    try {
      const { amount } = req.body
      const userId = req.userId

      // TODO: Create recharge order

      res.json(success({}, 'Recharge initiated'))
    } catch (error) {
      throw new AppError('Failed to recharge', 400)
    }
  }
}
