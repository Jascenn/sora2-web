/**
 * Monitoring Integration Examples
 *
 * This file demonstrates how to integrate the monitoring components
 * into your existing API code.
 */

import express, { Request, Response, NextFunction } from 'express'
import logger, { enhancedLoggers, logContext } from '../lib/logger-enhanced'
import { performanceMiddleware, getPerformanceMetrics } from '../middleware/performance.middleware'
import { ErrorTrackingService, ErrorCategory, ErrorSeverity } from '../services/error-tracking.service'
import { enhancedHealthCheck } from '../controllers/health-enhanced.controller'

// ============================================================================
// Example 1: Basic Application Setup
// ============================================================================

function exampleBasicSetup() {
  const app = express()

  // 1. Add performance middleware early (after body parser)
  app.use(express.json())
  app.use(performanceMiddleware) // This will automatically track all requests

  // 2. Your routes
  app.get('/api/users', (req, res) => {
    // Request is automatically tracked by performanceMiddleware
    res.json({ users: [] })
  })

  // 3. Add health check endpoint
  app.get('/health', enhancedHealthCheck)

  // 4. Error handler (should be last)
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    // Track the error
    ErrorTrackingService.trackError(err, {
      userId: (req as any).user?.id,
      requestId: (req as any).requestId,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })

    res.status(err.statusCode || 500).json({
      error: err.message,
    })
  })

  return app
}

// ============================================================================
// Example 2: Enhanced Logging in Controllers
// ============================================================================

// Video Controller Example
async function createVideoExample(req: Request, res: Response) {
  const startTime = Date.now()

  try {
    // Log business event
    enhancedLoggers.business({
      event: 'video_creation_started',
      category: 'video',
      userId: (req as any).user.id,
      metadata: {
        prompt: req.body.prompt,
        duration: req.body.duration,
      },
    })

    // Simulate video creation
    const video = await simulateVideoCreation(req.body)

    // Log performance metric
    const duration = Date.now() - startTime
    enhancedLoggers.performance({
      operation: 'create_video',
      duration,
      threshold: 5000, // 5 seconds threshold
      metadata: {
        videoId: video.id,
        fileSize: video.size,
      },
      tags: ['video', 'creation'],
    })

    // Log business event
    enhancedLoggers.business({
      event: 'video_created',
      category: 'video',
      userId: (req as any).user.id,
      metadata: {
        videoId: video.id,
        duration: video.duration,
      },
    })

    // Log audit trail
    enhancedLoggers.audit({
      action: 'create',
      resource: 'video',
      resourceId: video.id,
      userId: (req as any).user.id,
      userName: (req as any).user.email,
      ip: req.ip,
      result: 'success',
    })

    res.json(video)
  } catch (error: any) {
    // Error will be tracked by error middleware
    throw error
  }
}

// ============================================================================
// Example 3: Database Query Logging
// ============================================================================

async function databaseQueryExample(userId: string) {
  const startTime = Date.now()
  const query = 'SELECT * FROM users WHERE id = $1'

  try {
    // Simulate database query
    const result = await simulateDbQuery(query, [userId])
    const duration = Date.now() - startTime

    // Log database query
    enhancedLoggers.dbQuery({
      query,
      duration,
      rowCount: result.length,
      operation: 'SELECT',
      table: 'users',
    })

    return result
  } catch (error: any) {
    const duration = Date.now() - startTime

    // Log failed query
    enhancedLoggers.dbQuery({
      query,
      duration,
      error: error.message,
      operation: 'SELECT',
      table: 'users',
    })

    throw error
  }
}

// ============================================================================
// Example 4: External API Call Logging
// ============================================================================

async function externalApiExample(prompt: string) {
  const startTime = Date.now()
  const requestId = `req-${Date.now()}`

  try {
    // Log outgoing request
    logger.info('Calling Sora API', {
      service: 'sora',
      requestId,
      prompt,
    })

    // Simulate API call
    const response = await simulateSoraApiCall(prompt)
    const duration = Date.now() - startTime

    // Log successful API call
    enhancedLoggers.externalApi({
      service: 'sora-api',
      method: 'POST',
      url: 'https://api.sora.com/generate',
      statusCode: 200,
      duration,
      requestId,
    })

    return response
  } catch (error: any) {
    const duration = Date.now() - startTime

    // Log failed API call
    enhancedLoggers.externalApi({
      service: 'sora-api',
      method: 'POST',
      url: 'https://api.sora.com/generate',
      statusCode: error.statusCode,
      duration,
      error: error.message,
      requestId,
    })

    throw error
  }
}

// ============================================================================
// Example 5: Security Event Logging
// ============================================================================

async function loginExample(req: Request, res: Response) {
  const { email, password } = req.body

  try {
    const user = await authenticateUser(email, password)

    // Log successful login
    enhancedLoggers.security({
      event: 'login_success',
      severity: 'low',
      userId: user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      action: 'login',
      resource: 'auth',
      result: 'success',
    })

    // Log audit trail
    enhancedLoggers.audit({
      action: 'login',
      resource: 'user',
      resourceId: user.id,
      userId: user.id,
      userName: user.email,
      ip: req.ip,
      result: 'success',
    })

    res.json({ token: user.token })
  } catch (error: any) {
    // Log failed login
    enhancedLoggers.security({
      event: 'login_failure',
      severity: 'medium',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      action: 'login',
      resource: 'auth',
      result: 'failure',
      metadata: {
        email,
        reason: error.message,
      },
    })

    throw error
  }
}

// ============================================================================
// Example 6: Payment Transaction Logging
// ============================================================================

async function processPaymentExample(orderId: string, amount: number) {
  try {
    // Simulate payment processing
    const transaction = await simulatePaymentProcessing(orderId, amount)

    // Log payment event
    enhancedLoggers.payment({
      event: 'payment_processed',
      transactionId: transaction.id,
      orderId,
      userId: transaction.userId,
      amount,
      currency: 'USD',
      provider: 'stripe',
      status: 'completed',
    })

    // Log audit trail
    enhancedLoggers.audit({
      action: 'payment',
      resource: 'order',
      resourceId: orderId,
      userId: transaction.userId,
      result: 'success',
      after: {
        status: 'paid',
        transactionId: transaction.id,
      },
    })

    return transaction
  } catch (error: any) {
    // Log failed payment
    enhancedLoggers.payment({
      event: 'payment_failed',
      transactionId: 'N/A',
      orderId,
      amount,
      currency: 'USD',
      provider: 'stripe',
      status: 'failed',
      metadata: {
        error: error.message,
      },
    })

    throw error
  }
}

// ============================================================================
// Example 7: Custom Error Handling
// ============================================================================

class CustomError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message)
    this.name = 'CustomError'
  }
}

function throwCustomError() {
  throw new CustomError('User not found', 404, 'USER_NOT_FOUND')
}

function errorHandlingExample(req: Request, res: Response, next: NextFunction) {
  try {
    throwCustomError()
  } catch (error: any) {
    // Track error with context
    const trackedError = ErrorTrackingService.trackError(error, {
      userId: (req as any).user?.id,
      requestId: (req as any).requestId,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    }, {
      additionalInfo: 'Some metadata',
    })

    // Persist critical errors
    if (trackedError.severity === ErrorSeverity.CRITICAL) {
      ErrorTrackingService.persistError(trackedError)
    }

    next(error)
  }
}

// ============================================================================
// Example 8: Monitoring Dashboard Controller
// ============================================================================

async function monitoringDashboardExample(req: Request, res: Response) {
  // Get performance metrics
  const perfMetrics = getPerformanceMetrics()

  // Get error statistics
  const errorStats = ErrorTrackingService.getStatistics()

  // Get error aggregations
  const errorAggs = ErrorTrackingService.getAggregations()

  // Format response
  const dashboard = {
    timestamp: new Date().toISOString(),
    performance: {
      requests: {
        total: perfMetrics.global.totalRequests,
        active: perfMetrics.global.activeRequests,
        perMinute: perfMetrics.global.requestsPerMinute,
      },
      response: {
        average: Math.round(perfMetrics.global.averageResponseTime),
        errors: perfMetrics.global.totalErrors,
      },
    },
    system: {
      memory: {
        used: perfMetrics.system.memory.used,
        total: perfMetrics.system.memory.total,
        percent: Math.round(perfMetrics.system.memory.usagePercent),
      },
      cpu: {
        cores: perfMetrics.system.cpu.cores,
        loadAverage: perfMetrics.system.cpu.loadAverage,
      },
    },
    errors: {
      total: errorStats.total,
      byCategory: errorStats.byCategory,
      bySeverity: errorStats.bySeverity,
      topErrors: errorStats.topErrors.slice(0, 5),
      trend: errorStats.trend,
    },
    activeRequests: perfMetrics.activeRequests.requests,
  }

  res.json(dashboard)
}

// ============================================================================
// Example 9: Rate Limiting with Logging
// ============================================================================

function rateLimitMiddlewareExample() {
  const rateLimits = new Map<string, { count: number; resetTime: number }>()

  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || 'unknown'
    const limit = 100
    const window = 60000 // 1 minute
    const now = Date.now()

    let rateLimit = rateLimits.get(identifier)

    if (!rateLimit || now > rateLimit.resetTime) {
      rateLimit = { count: 0, resetTime: now + window }
      rateLimits.set(identifier, rateLimit)
    }

    rateLimit.count++
    const exceeded = rateLimit.count > limit

    // Log rate limit check
    enhancedLoggers.rateLimit({
      identifier,
      limit,
      window: window / 1000, // seconds
      current: rateLimit.count,
      exceeded,
      endpoint: req.url,
    })

    if (exceeded) {
      // Log security event
      enhancedLoggers.security({
        event: 'rate_limit_exceeded',
        severity: 'low',
        ip: req.ip,
        action: req.method,
        resource: req.url,
        result: 'blocked',
      })

      return res.status(429).json({ error: 'Too many requests' })
    }

    next()
  }
}

// ============================================================================
// Example 10: Cache Operations with Logging
// ============================================================================

class CacheService {
  private cache = new Map<string, any>()

  async get(key: string): Promise<any> {
    const startTime = Date.now()
    const value = this.cache.get(key)
    const duration = Date.now() - startTime

    enhancedLoggers.cache({
      operation: 'get',
      key,
      hit: value !== undefined,
      duration,
    })

    return value
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const startTime = Date.now()
    this.cache.set(key, value)
    const duration = Date.now() - startTime

    enhancedLoggers.cache({
      operation: 'set',
      key,
      ttl,
      size: JSON.stringify(value).length,
      duration,
    })
  }

  async delete(key: string): Promise<void> {
    const startTime = Date.now()
    this.cache.delete(key)
    const duration = Date.now() - startTime

    enhancedLoggers.cache({
      operation: 'delete',
      key,
      duration,
    })
  }
}

// ============================================================================
// Helper functions (simulated)
// ============================================================================

async function simulateVideoCreation(data: any) {
  return {
    id: 'video-123',
    duration: 30,
    size: 1024 * 1024 * 10, // 10MB
  }
}

async function simulateDbQuery(query: string, params: any[]) {
  return [{ id: params[0], name: 'Test User' }]
}

async function simulateSoraApiCall(prompt: string) {
  return { videoId: 'video-123', status: 'processing' }
}

async function authenticateUser(email: string, password: string) {
  return { id: 'user-123', email, token: 'jwt-token' }
}

async function simulatePaymentProcessing(orderId: string, amount: number) {
  return {
    id: 'txn-123',
    userId: 'user-123',
    status: 'completed',
  }
}

// ============================================================================
// Export examples
// ============================================================================

export {
  exampleBasicSetup,
  createVideoExample,
  databaseQueryExample,
  externalApiExample,
  loginExample,
  processPaymentExample,
  errorHandlingExample,
  monitoringDashboardExample,
  rateLimitMiddlewareExample,
  CacheService,
}
