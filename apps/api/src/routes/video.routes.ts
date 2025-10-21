import { Router } from 'express'
import type { Router as RouterType } from 'express'
import { VideoController } from '../controllers/video.controller'
import { authenticate } from '../middleware/auth.middleware'
import { validateVideoGeneration, handleValidationErrors } from '../middleware/validation.middleware'

export const videoRouter: RouterType = Router()
const videoController = new VideoController()

videoRouter.use(authenticate)

/**
 * @swagger
 * /api/videos/generate:
 *   post:
 *     tags:
 *       - Video
 *     summary: 生成视频
 *     description: 根据提示词生成视频
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: 视频生成提示词
 *                 example: 一只可爱的小猫在草地上玩耍
 *               duration:
 *                 type: integer
 *                 description: 视频时长(秒)
 *                 default: 5
 *                 example: 5
 *               aspectRatio:
 *                 type: string
 *                 description: 视频宽高比
 *                 enum: ['16:9', '9:16', '1:1']
 *                 default: '16:9'
 *               model:
 *                 type: string
 *                 description: 使用的生成模型
 *                 default: 'sora-v1'
 *                 example: 'sora-v1'
 *     responses:
 *       201:
 *         description: 视频生成任务创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Video'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       402:
 *         description: 积分不足
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
videoRouter.post('/generate', validateVideoGeneration, handleValidationErrors, videoController.generate)

/**
 * @swagger
 * /api/videos/generate-stream:
 *   post:
 *     tags:
 *       - Video
 *     summary: 生成视频(SSE 流式)
 *     description: 根据提示词生成视频,实时推送状态更新
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: 视频生成提示词
 *                 example: 一只可爱的小猫在草地上玩耍
 *               duration:
 *                 type: integer
 *                 description: 视频时长(秒)
 *                 default: 5
 *               aspectRatio:
 *                 type: string
 *                 enum: ['16:9', '9:16', '1:1']
 *                 default: '16:9'
 *     responses:
 *       200:
 *         description: SSE 流式响应
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
videoRouter.post('/generate-stream', validateVideoGeneration, handleValidationErrors, videoController.generateWithSSE)

/**
 * @swagger
 * /api/videos:
 *   get:
 *     tags:
 *       - Video
 *     summary: 获取视频列表
 *     description: 获取当前用户的所有视频
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
 *           enum: [PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED]
 *         description: 按状态筛选
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
 *                   description: 总数
 *                 page:
 *                   type: integer
 *                   description: 当前页码
 *                 limit:
 *                   type: integer
 *                   description: 每页数量
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
videoRouter.get('/', videoController.list)

/**
 * @swagger
 * /api/videos/{id}:
 *   get:
 *     tags:
 *       - Video
 *     summary: 获取视频详情
 *     description: 根据 ID 获取视频详细信息
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
 *         description: 视频详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Video'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
videoRouter.get('/:id', videoController.getById)

/**
 * @swagger
 * /api/videos/{id}/status:
 *   get:
 *     tags:
 *       - Video
 *     summary: 获取视频生成状态
 *     description: 查询视频生成进度和状态
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
 *         description: 视频状态信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 status:
 *                   type: string
 *                   enum: [PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED]
 *                 progress:
 *                   type: integer
 *                   description: 生成进度 0-100
 *                 estimatedTimeRemaining:
 *                   type: integer
 *                   description: 预计剩余时间(秒)
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
videoRouter.get('/:id/status', videoController.getStatus)

/**
 * @swagger
 * /api/videos/{id}:
 *   delete:
 *     tags:
 *       - Video
 *     summary: 删除视频
 *     description: 删除指定的视频
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
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
videoRouter.delete('/:id', videoController.delete)

/**
 * @swagger
 * /api/videos/{id}/regenerate:
 *   post:
 *     tags:
 *       - Video
 *     summary: 重新生成视频
 *     description: 使用相同的提示词重新生成视频
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 原视频 ID
 *     responses:
 *       201:
 *         description: 重新生成任务创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Video'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       402:
 *         description: 积分不足
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
videoRouter.post('/:id/regenerate', videoController.regenerate)

/**
 * @swagger
 * /api/videos/{id}/cancel:
 *   post:
 *     tags:
 *       - Video
 *     summary: 取消视频生成
 *     description: 取消正在生成中的视频任务
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
 *         description: 取消成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 视频生成已取消
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
videoRouter.post('/:id/cancel', videoController.cancel)

/**
 * @swagger
 * /api/videos/{id}/download:
 *   get:
 *     tags:
 *       - Video
 *     summary: 下载视频
 *     description: 下载已生成的视频文件
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
 *         description: 视频文件或下载链接
 *         content:
 *           video/mp4:
 *             schema:
 *               type: string
 *               format: binary
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 downloadUrl:
 *                   type: string
 *                   description: 视频下载链接
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
videoRouter.get('/:id/download', videoController.download)

/**
 * @swagger
 * /api/videos/{id}/share:
 *   post:
 *     tags:
 *       - Video
 *     summary: 分享视频
 *     description: 生成视频分享链接
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
 *         description: 分享链接生成成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shareUrl:
 *                   type: string
 *                   description: 分享链接
 *                   example: https://sora2.com/share/abc123
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
videoRouter.post('/:id/share', videoController.share)
