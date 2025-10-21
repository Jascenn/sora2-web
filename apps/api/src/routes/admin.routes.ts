import { Router } from 'express'
import type { Router as RouterType } from 'express'
import { AdminController } from '../controllers/admin.controller'
import { authenticate, requireAdmin } from '../middleware/auth.middleware'

export const adminRouter: RouterType = Router()
const adminController = new AdminController()

// All admin routes require authentication and admin role
adminRouter.use(authenticate)
adminRouter.use(requireAdmin)

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     tags:
 *       - Admin
 *     summary: 获取系统统计数据
 *     description: 获取系统整体统计信息(仅管理员)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 系统统计数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                   description: 总用户数
 *                 totalVideos:
 *                   type: integer
 *                   description: 总视频数
 *                 totalOrders:
 *                   type: integer
 *                   description: 总订单数
 *                 totalRevenue:
 *                   type: number
 *                   description: 总收入
 *                 activeUsers:
 *                   type: integer
 *                   description: 活跃用户数
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
adminRouter.get('/stats', adminController.getStats)

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags:
 *       - Admin
 *     summary: 获取用户列表
 *     description: 获取所有用户列表(仅管理员)
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
 *         name: role
 *         schema:
 *           type: string
 *           enum: [USER, ADMIN]
 *         description: 按角色筛选
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索用户名或邮箱
 *     responses:
 *       200:
 *         description: 用户列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
adminRouter.get('/users', adminController.getUsers)

/**
 * @swagger
 * /api/admin/users/{id}/credits:
 *   put:
 *     tags:
 *       - Admin
 *     summary: 更新用户积分
 *     description: 管理员手动调整用户积分(仅管理员)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 用户 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - reason
 *             properties:
 *               amount:
 *                 type: integer
 *                 description: 积分变动数量(正数增加,负数减少)
 *                 example: 100
 *               reason:
 *                 type: string
 *                 description: 调整原因
 *                 example: 活动奖励
 *     responses:
 *       200:
 *         description: 积分更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 积分更新成功
 *                 newBalance:
 *                   type: integer
 *                   description: 更新后的积分余额
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
adminRouter.put('/users/:id/credits', adminController.updateUserCredits)

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   put:
 *     tags:
 *       - Admin
 *     summary: 更新用户状态
 *     description: 管理员更新用户账户状态(仅管理员)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 用户 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, SUSPENDED, BANNED]
 *                 description: 用户状态
 *               reason:
 *                 type: string
 *                 description: 状态变更原因
 *     responses:
 *       200:
 *         description: 状态更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 用户状态更新成功
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
adminRouter.put('/users/:id/status', adminController.updateUserStatus)

/**
 * @swagger
 * /api/admin/videos:
 *   get:
 *     tags:
 *       - Admin
 *     summary: 获取所有视频
 *     description: 获取系统中所有用户的视频(仅管理员)
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED]
 *         description: 按状态筛选
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 按用户 ID 筛选
 *     responses:
 *       200:
 *         description: 视频列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 videos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Video'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
adminRouter.get('/videos', adminController.getVideos)

/**
 * @swagger
 * /api/admin/videos/{id}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: 删除视频
 *     description: 管理员删除任意用户的视频(仅管理员)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 视频 ID
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 视频删除成功
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
adminRouter.delete('/videos/:id', adminController.deleteVideo)

/**
 * @swagger
 * /api/admin/transactions:
 *   get:
 *     tags:
 *       - Admin
 *     summary: 获取所有交易记录
 *     description: 获取系统中所有积分交易记录(仅管理员)
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
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 按用户 ID 筛选
 *     responses:
 *       200:
 *         description: 交易记录列表
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
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
adminRouter.get('/transactions', adminController.getTransactions)

/**
 * @swagger
 * /api/admin/queue/stats:
 *   get:
 *     tags:
 *       - Admin
 *     summary: 获取队列统计
 *     description: 获取视频生成队列统计信息(仅管理员)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 队列统计数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 waiting:
 *                   type: integer
 *                   description: 等待中的任务数
 *                 active:
 *                   type: integer
 *                   description: 处理中的任务数
 *                 completed:
 *                   type: integer
 *                   description: 已完成的任务数
 *                 failed:
 *                   type: integer
 *                   description: 失败的任务数
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
adminRouter.get('/queue/stats', adminController.getQueueStats)

/**
 * @swagger
 * /api/admin/configs:
 *   get:
 *     tags:
 *       - Admin
 *     summary: 获取系统配置
 *     description: 获取所有系统配置项(仅管理员)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 系统配置列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
adminRouter.get('/configs', adminController.getConfigs)

/**
 * @swagger
 * /api/admin/configs/{key}:
 *   put:
 *     tags:
 *       - Admin
 *     summary: 更新单个配置项
 *     description: 更新指定的系统配置项(仅管理员)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: 配置项键名
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: string
 *                 description: 配置项的值
 *     responses:
 *       200:
 *         description: 配置更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 配置更新成功
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
adminRouter.put('/configs/:key', adminController.updateConfig)

/**
 * @swagger
 * /api/admin/configs:
 *   put:
 *     tags:
 *       - Admin
 *     summary: 批量更新配置
 *     description: 批量更新多个系统配置项(仅管理员)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties:
 *               type: string
 *             example:
 *               MAX_VIDEO_DURATION: "60"
 *               DEFAULT_CREDITS: "100"
 *     responses:
 *       200:
 *         description: 配置批量更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 配置批量更新成功
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
adminRouter.put('/configs', adminController.updateConfigs)
