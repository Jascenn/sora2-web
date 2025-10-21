import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import path from 'path'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './swagger'
import { authRouter } from './routes/auth.routes'
import { videoRouter } from './routes/video.routes'
import { creditRouter } from './routes/credit.routes'
import { orderRouter } from './routes/order.routes'
import { userRouter } from './routes/user.routes'
import { adminRouter } from './routes/admin.routes'
import { publicRouter } from './routes/public.routes'
import { errorHandler, notFoundHandler } from './middleware/error.middleware'
import logger from './lib/logger'
import { healthCheck } from './controllers/health.controller'
import { requestMonitoringMiddleware, getMetrics, gracefulShutdown } from './lib/monitoring'

// Load .env from the API directory
dotenv.config({ path: path.join(__dirname, '../.env') })

// Validate environment variables
import { env } from './lib/env'
import { outboxService } from './services/outbox.service'

const app = express()
const PORT = env.PORT

// Start outbox processor for reliable queue processing
outboxService.start()

// Trust proxy - required for rate limiting and X-Forwarded-* headers
// In development, trust localhost only. In production, configure based on your infrastructure
app.set('trust proxy', env.NODE_ENV === 'production' ? 1 : 'loopback')

// Rate limiters - defined before route mounting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: '请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Temporarily increased for testing
  message: '登录请求过于频繁，请15分钟后再试',
  standardHeaders: true,
  legacyHeaders: false,
})

const videoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: '视频生成请求过于频繁，请1小时后再试',
  standardHeaders: true,
  legacyHeaders: false,
})

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: '注册请求过于频繁，请1小时后再试',
  standardHeaders: true,
  legacyHeaders: false,
})

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true, // Allow credentials (cookies) to be sent with CORS requests
}))
// Cookie parser - must come before routes that use cookies
app.use(cookieParser())
// Increase payload size limit to 50MB for image uploads (base64 encoded images can be large)
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Request monitoring - track performance and errors
app.use(requestMonitoringMiddleware)

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Sora2 API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
  },
}))

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

// Health check - comprehensive system status
app.get('/health', healthCheck)

// Metrics endpoint - application and system metrics
app.get('/metrics', getMetrics)

// Apply general rate limiter to all API routes
app.use('/api', generalLimiter)

// Apply specific rate limiters to targeted routes
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', registerLimiter)
app.use('/api/videos/generate', videoLimiter)

// Routes
app.use('/api/public', publicRouter) // Public routes (no auth required)
app.use('/api/auth', authRouter)
app.use('/api/videos', videoRouter)
app.use('/api/credits', creditRouter)
app.use('/api/orders', orderRouter)
app.use('/api/users', userRouter)
app.use('/api/admin', adminRouter)

// Serve uploaded files in development
if (env.NODE_ENV === 'development') {
  const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || './uploads')
  app.use('/uploads', express.static(uploadDir))
}

// 404 handler - must be before error handler
app.use(notFoundHandler)

// Error handling - must be last
app.use(errorHandler)

const server = app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`, {
    port: PORT,
    environment: env.NODE_ENV,
    nodeVersion: process.version,
  })
})

// Graceful shutdown handling
const shutdown = async (signal: string) => {
  logger.info(`${signal} received, starting graceful shutdown...`)

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed')

    try {
      // Stop outbox processor
      await outboxService.stop()
      logger.info('Outbox processor stopped')

      // Run monitoring cleanup
      await gracefulShutdown()
      logger.info('Monitoring cleanup complete')

      logger.info('Graceful shutdown completed successfully')
      process.exit(0)
    } catch (error) {
      logger.error('Error during graceful shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      })
      process.exit(1)
    }
  })

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout')
    process.exit(1)
  }, 30000)
}

// Listen for termination signals
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
    name: error.name,
  })
  shutdown('uncaughtException')
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: String(promise),
  })
  shutdown('unhandledRejection')
})

