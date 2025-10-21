import { Router } from 'express'
import type { Router as RouterType } from 'express'
import { CreditController } from '../controllers/credit.controller'
import { authenticate } from '../middleware/auth.middleware'

export const creditRouter: RouterType = Router()
const creditController = new CreditController()

creditRouter.use(authenticate)

/**
 * @swagger
 * /api/credits/balance:
 *   get:
 *     tags:
 *       - Credit
 *     summary: 获取积分余额
 *     description: 获取当前用户的积分余额
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 积分余额信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: integer
 *                   description: 当前积分余额
 *                   example: 1000
 *                 userId:
 *                   type: string
 *                   format: uuid
 *                   description: 用户 ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
creditRouter.get('/balance', creditController.getBalance)

/**
 * @swagger
 * /api/credits/transactions:
 *   get:
 *     tags:
 *       - Credit
 *     summary: 获取积分交易记录
 *     description: 获取当前用户的积分交易历史
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [RECHARGE, CONSUME, REFUND, REWARD]
 *         description: 按交易类型筛选
 *     responses:
 *       200:
 *         description: 积分交易记录列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Credit'
 *                 total:
 *                   type: integer
 *                   description: 总记录数
 *                 page:
 *                   type: integer
 *                   description: 当前页码
 *                 limit:
 *                   type: integer
 *                   description: 每页数量
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
creditRouter.get('/transactions', creditController.getTransactions)

/**
 * @swagger
 * /api/credits/recharge:
 *   post:
 *     tags:
 *       - Credit
 *     summary: 积分充值
 *     description: 为当前用户充值积分(需要先创建订单)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *                 description: 已支付的订单 ID
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: 充值成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 充值成功
 *                 balance:
 *                   type: integer
 *                   description: 充值后的余额
 *                 transaction:
 *                   $ref: '#/components/schemas/Credit'
 *       400:
 *         description: 订单无效或未支付
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: 订单不存在
 */
creditRouter.post('/recharge', creditController.recharge)
