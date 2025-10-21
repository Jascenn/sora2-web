import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { AppError } from '../middleware/error.middleware'
import { success } from '../lib/response'

export class OrderController {
  async create(req: AuthRequest, res: Response) {
    try {
      const { credits, paymentMethod } = req.body
      const userId = req.userId

      // TODO: Create order

      res.status(201).json(success({ orderId: 'placeholder-id' }))
    } catch (error) {
      throw new AppError('Failed to create order', 400)
    }
  }

  async list(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId

      // TODO: Get user's orders

      res.json(success({ orders: [] }))
    } catch (error) {
      throw new AppError('Failed to get orders', 400)
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const userId = req.userId!

      // TODO: Get order by ID
      // IMPORTANT: When implementing, ensure to verify user_id:
      // SELECT * FROM orders WHERE id = $1 AND user_id = $2

      res.json(success({ order: {} }))
    } catch (error) {
      throw new AppError('Order not found', 404)
    }
  }

  async pay(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const userId = req.userId!

      // TODO: Process payment
      // IMPORTANT: When implementing, ensure to verify user_id:
      // SELECT * FROM orders WHERE id = $1 AND user_id = $2 AND status = 'pending'

      res.json(success({ paymentUrl: 'placeholder-url' }))
    } catch (error) {
      throw new AppError('Payment failed', 400)
    }
  }
}
