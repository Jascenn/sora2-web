import { Router } from 'express'
import type { Router as RouterType } from 'express'
import { OrderController } from '../controllers/order.controller'
import { authenticate } from '../middleware/auth.middleware'

export const orderRouter: RouterType = Router()
const orderController = new OrderController()

orderRouter.use(authenticate)

/**
 * @swagger
 * /api/orders/create:
 *   post:
 *     tags:
 *       - Order
 *     summary: 创建订单
 *     description: 创建积分充值订单
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credits
 *               - paymentMethod
 *             properties:
 *               credits:
 *                 type: integer
 *                 description: 购买积分数量
 *                 example: 100
 *                 minimum: 1
 *               paymentMethod:
 *                 type: string
 *                 enum: [ALIPAY, WECHAT, STRIPE]
 *                 description: 支付方式
 *                 example: ALIPAY
 *     responses:
 *       201:
 *         description: 订单创建成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Order'
 *                 - type: object
 *                   properties:
 *                     paymentUrl:
 *                       type: string
 *                       description: 支付链接
 *                       example: https://payment.example.com/pay/abc123
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
orderRouter.post('/create', orderController.create)

/**
 * @swagger
 * /api/orders:
 *   get:
 *     tags:
 *       - Order
 *     summary: 获取订单列表
 *     description: 获取当前用户的所有订单
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
 *           default: 10
 *         description: 每页数量
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, FAILED, CANCELLED, REFUNDED]
 *         description: 按订单状态筛选
 *     responses:
 *       200:
 *         description: 订单列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 total:
 *                   type: integer
 *                   description: 总订单数
 *                 page:
 *                   type: integer
 *                   description: 当前页码
 *                 limit:
 *                   type: integer
 *                   description: 每页数量
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
orderRouter.get('/', orderController.list)

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     tags:
 *       - Order
 *     summary: 获取订单详情
 *     description: 根据 ID 获取订单详细信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 订单 ID
 *     responses:
 *       200:
 *         description: 订单详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
orderRouter.get('/:id', orderController.getById)

/**
 * @swagger
 * /api/orders/{id}/pay:
 *   post:
 *     tags:
 *       - Order
 *     summary: 支付订单
 *     description: 处理订单支付(通常由支付网关回调)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 订单 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentData:
 *                 type: object
 *                 description: 支付网关返回的数据
 *     responses:
 *       200:
 *         description: 支付成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 支付成功
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: 订单状态错误或支付失败
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
orderRouter.post('/:id/pay', orderController.pay)
