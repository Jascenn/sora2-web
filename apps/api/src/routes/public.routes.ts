import { Router } from 'express'
import type { Router as RouterType, Request, Response } from 'express'
import { SoraService } from '../services/sora.service'
import logger from '../lib/logger'
import { AppError } from '../middleware/error.middleware'

export const publicRouter: RouterType = Router()

/**
 * @swagger
 * /api/public/generate:
 *   post:
 *     tags:
 *       - Public
 *     summary: 公开视频生成接口
 *     description: 使用 API Key 进行视频生成,无需用户认证(SSE 流式响应)
 *     security:
 *       - apiKeyAuth: []
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
 *                 default: 10
 *                 example: 10
 *               aspectRatio:
 *                 type: string
 *                 description: 视频宽高比
 *                 enum: ['16:9', '9:16', '1:1']
 *                 default: '16:9'
 *               model:
 *                 type: string
 *                 description: 使用的生成模型
 *                 enum: ['sora-2', 'sora-2-hd']
 *                 default: 'sora-2-hd'
 *                 example: 'sora-2-hd'
 *               image:
 *                 type: string
 *                 description: 可选的参考图片 URL 或 base64
 *     responses:
 *       200:
 *         description: SSE 流式响应
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               description: Server-Sent Events 流,包含生成进度和最终视频 URL
 *             examples:
 *               start:
 *                 value: 'data: {"type":"start","message":"开始生成视频..."}\n\n'
 *               progress:
 *                 value: 'data: {"type":"progress","message":"正在调用 Sora API..."}\n\n'
 *               complete:
 *                 value: 'data: {"type":"complete","message":"视频生成完成!","videoUrl":"https://...","thumbnailUrl":"https://..."}\n\n'
 *               error:
 *                 value: 'data: {"type":"error","error":"生成失败的原因"}\n\n'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *             example: 'data: {"type":"error","error":"API key is required"}\n\n'
 *       401:
 *         description: API Key 无效
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *             example: 'data: {"type":"error","error":"Invalid API key"}\n\n'
 */
publicRouter.post('/generate', async (req: Request, res: Response) => {
  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const sendEvent = (type: string, data: any) => {
    try {
      if (!res.writableEnded) {
        const message = `data: ${JSON.stringify({ type, ...data })}\n\n`
        res.write(message)
        console.log(`📡 Sent SSE event: ${type}`)
      } else {
        console.warn(`⚠️  Cannot send event ${type}, stream already closed`)
      }
    } catch (error) {
      console.error(`❌ Error sending SSE event ${type}:`, error)
    }
  }

  try {
    const apiKey = (req.headers['x-api-key'] as string || req.headers.authorization?.replace('Bearer ', ''))?.trim()
    const { prompt, aspectRatio, image, duration = 10, model = 'sora-2-hd' } = req.body

    if (!apiKey) {
      sendEvent('error', { error: 'API key is required' })
      res.end()
      return
    }

    // Log the API key (masked) for debugging
    console.log(`🔑 API key received: ${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)} (length: ${apiKey.length})`)
    console.log(`🔑 Expected format: sk-xxxxx... (should start with 'sk-')`)

    if (!prompt) {
      sendEvent('error', { error: 'Prompt is required' })
      res.end()
      return
    }

    logger.info('Public video generation request', {
      hasApiKey: !!apiKey,
      promptLength: prompt.length,
      aspectRatio,
      duration,
      model
    })

    // Send start event
    sendEvent('start', { message: '开始生成视频...' })

    // Initialize Sora service with custom API key
    const soraService = new SoraService(apiKey, process.env.API_BASE_URL)

    // Generate video with periodic heartbeat
    sendEvent('progress', { message: '正在调用 Sora API...' })

    // Keep connection alive with heartbeats every 10 seconds
    const heartbeatInterval = setInterval(() => {
      sendEvent('progress', { message: '视频生成中，请耐心等待...（约需 1-2 分钟）' })
    }, 10000)

    try {
      const result = await soraService.generateVideo({
      prompt,
      negativePrompt: undefined,
      duration: Number(duration) || 10,
      resolution: model === 'sora-2' ? '720p' : '1080p',
      aspectRatio: aspectRatio || '16:9',
      style: undefined,
      fps: 30,
      })

      clearInterval(heartbeatInterval)

      console.log(`📊 Generation result:`, { status: result.status, hasVideo: !!result.videoUrl })

    if (result.status === 'completed' && result.videoUrl) {
      sendEvent('complete', {
        message: '视频生成完成！',
        id: result.id,
        videoId: result.id,
        taskId: result.taskId,
        generationId: result.id,
        videoUrl: result.videoUrl,
        thumbnailUrl: result.thumbnailUrl,
        gifUrl: result.gifUrl,
      })
    } else if (result.status === 'failed') {
      sendEvent('error', { error: result.error || '视频生成失败' })
    } else {
      sendEvent('progress', { message: '视频生成中，请稍候...' })
    }

    // Add a small delay to ensure the message is sent
    await new Promise(resolve => setTimeout(resolve, 100))

      if (!res.writableEnded) {
        res.end()
      }
    } catch (generationError: any) {
      clearInterval(heartbeatInterval)
      throw generationError
    }
  } catch (error: any) {
    logger.error('Public video generation error:', {
      error: error.message,
      stack: error.stack,
    })

    sendEvent('error', {
      error: error.message || 'Failed to generate video'
    })

    res.end()
  }
})

/**
 * @swagger
 * /api/public/health:
 *   get:
 *     tags:
 *       - Public
 *     summary: 健康检查
 *     description: 检查公共 API 服务状态
 *     responses:
 *       200:
 *         description: 服务正常
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: 当前服务器时间
 */
publicRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})
