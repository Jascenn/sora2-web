import { Request, Response, NextFunction } from 'express'
import { enhancedLoggers, logContext } from '../lib/logger-enhanced'
import os from 'os'
import { v4 as uuidv4 } from 'uuid'

// Performance metrics interface
interface PerformanceMetrics {
  requestId: string
  method: string
  url: string
  startTime: number
  endTime?: number
  duration?: number
  statusCode?: number
  memoryUsage: {
    start: NodeJS.MemoryUsage
    end?: NodeJS.MemoryUsage
    delta?: {
      rss: number
      heapTotal: number
      heapUsed: number
      external: number
    }
  }
  cpuUsage: {
    start: NodeJS.CpuUsage
    end?: NodeJS.CpuUsage
    delta?: {
      user: number
      system: number
    }
  }
}

// Store active requests for monitoring
const activeRequests = new Map<string, PerformanceMetrics>()

// Global metrics
interface GlobalMetrics {
  totalRequests: number
  activeRequests: number
  totalErrors: number
  averageResponseTime: number
  requestsPerMinute: number
  memoryUsage: NodeJS.MemoryUsage
  cpuUsage: NodeJS.CpuUsage
  uptime: number
}

let globalMetrics: GlobalMetrics = {
  totalRequests: 0,
  activeRequests: 0,
  totalErrors: 0,
  averageResponseTime: 0,
  requestsPerMinute: 0,
  memoryUsage: process.memoryUsage(),
  cpuUsage: process.cpuUsage(),
  uptime: process.uptime(),
}

// Request counter for RPM calculation
const requestTimestamps: number[] = []

// Calculate memory delta
function calculateMemoryDelta(start: NodeJS.MemoryUsage, end: NodeJS.MemoryUsage) {
  return {
    rss: end.rss - start.rss,
    heapTotal: end.heapTotal - start.heapTotal,
    heapUsed: end.heapUsed - start.heapUsed,
    external: end.external - start.external,
  }
}

// Calculate CPU delta
function calculateCpuDelta(start: NodeJS.CpuUsage, end: NodeJS.CpuUsage) {
  return {
    user: end.user - start.user,
    system: end.system - start.system,
  }
}

// Format bytes to human-readable format
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

// Update requests per minute
function updateRequestsPerMinute() {
  const now = Date.now()
  const oneMinuteAgo = now - 60000

  // Remove old timestamps
  while (requestTimestamps.length > 0 && requestTimestamps[0] < oneMinuteAgo) {
    requestTimestamps.shift()
  }

  globalMetrics.requestsPerMinute = requestTimestamps.length
}

// Get system metrics
function getSystemMetrics() {
  return {
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
      usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
    },
    cpu: {
      loadAverage: os.loadavg(),
      cores: os.cpus().length,
    },
    process: {
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      uptime: process.uptime(),
    },
  }
}

// Performance thresholds
const THRESHOLDS = {
  responseTime: {
    fast: 100,
    normal: 500,
    slow: 1000,
    critical: 3000,
  },
  memory: {
    warning: 500 * 1024 * 1024, // 500MB
    critical: 1000 * 1024 * 1024, // 1GB
  },
}

/**
 * Performance monitoring middleware
 * Tracks request response time, memory usage, and CPU usage
 */
export function performanceMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = uuidv4()
  const startTime = Date.now()
  const startMemory = process.memoryUsage()
  const startCpu = process.cpuUsage()

  // Set request ID in context
  logContext.set('requestId', requestId)
  logContext.set('correlationId', req.headers['x-correlation-id'] || requestId)

  // Attach request ID to request object
  ;(req as any).requestId = requestId
  ;(req as any).startTime = startTime

  // Create performance metrics object
  const metrics: PerformanceMetrics = {
    requestId,
    method: req.method,
    url: req.url,
    startTime,
    memoryUsage: {
      start: startMemory,
    },
    cpuUsage: {
      start: startCpu,
    },
  }

  // Store in active requests
  activeRequests.set(requestId, metrics)

  // Update global metrics
  globalMetrics.totalRequests++
  globalMetrics.activeRequests++
  requestTimestamps.push(startTime)
  updateRequestsPerMinute()

  // Set response header with request ID
  res.setHeader('X-Request-ID', requestId)
  res.setHeader('X-Correlation-ID', logContext.get('correlationId'))

  // Capture the original end function
  const originalEnd = res.end
  const originalJson = res.json

  // Override res.end to capture metrics
  ;(res as any).end = function (chunk?: any, encoding?: any, callback?: any): Response {
    // Restore original end
    res.end = originalEnd

    // Calculate metrics
    const endTime = Date.now()
    const endMemory = process.memoryUsage()
    const endCpu = process.cpuUsage()
    const duration = endTime - startTime

    metrics.endTime = endTime
    metrics.duration = duration
    metrics.statusCode = res.statusCode
    metrics.memoryUsage.end = endMemory
    metrics.memoryUsage.delta = calculateMemoryDelta(startMemory, endMemory)
    metrics.cpuUsage.end = endCpu
    metrics.cpuUsage.delta = calculateCpuDelta(startCpu, endCpu)

    // Update global metrics
    globalMetrics.activeRequests--
    globalMetrics.averageResponseTime =
      (globalMetrics.averageResponseTime * (globalMetrics.totalRequests - 1) + duration) /
      globalMetrics.totalRequests

    if (res.statusCode >= 400) {
      globalMetrics.totalErrors++
    }

    // Remove from active requests
    activeRequests.delete(requestId)

    // Determine performance level
    let performanceLevel: 'fast' | 'normal' | 'slow' | 'critical' = 'fast'
    if (duration >= THRESHOLDS.responseTime.critical) {
      performanceLevel = 'critical'
    } else if (duration >= THRESHOLDS.responseTime.slow) {
      performanceLevel = 'slow'
    } else if (duration >= THRESHOLDS.responseTime.normal) {
      performanceLevel = 'normal'
    }

    // Check memory usage
    const memoryDelta = metrics.memoryUsage.delta!.heapUsed
    const memoryWarning = memoryDelta > THRESHOLDS.memory.warning
    const memoryCritical = memoryDelta > THRESHOLDS.memory.critical

    // Log HTTP request
    enhancedLoggers.httpRequest({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: duration,
      userAgent: req.headers['user-agent'],
      userId: (req as any).user?.id,
      ip: req.ip || req.socket.remoteAddress,
      requestId,
      correlationId: logContext.get('correlationId'),
      requestSize: parseInt(req.headers['content-length'] || '0'),
      responseSize: parseInt(res.getHeader('content-length') as string || '0'),
    })

    // Log performance metrics if slow or memory intensive
    if (performanceLevel !== 'fast' || memoryWarning) {
      enhancedLoggers.performance({
        operation: `${req.method} ${req.url}`,
        duration,
        threshold: THRESHOLDS.responseTime.normal,
        metadata: {
          performanceLevel,
          memoryDelta: {
            heapUsed: formatBytes(memoryDelta),
            rss: formatBytes(metrics.memoryUsage.delta!.rss),
          },
          cpuDelta: metrics.cpuUsage.delta,
          statusCode: res.statusCode,
          memoryWarning,
          memoryCritical,
        },
        tags: [performanceLevel, memoryWarning ? 'memory-warning' : ''].filter(Boolean),
      })
    }

    // Log critical performance issues
    if (performanceLevel === 'critical' || memoryCritical) {
      enhancedLoggers.system({
        event: 'critical_performance',
        component: 'performance_middleware',
        severity: 'error',
        metadata: {
          requestId,
          method: req.method,
          url: req.url,
          duration,
          memoryDelta: formatBytes(memoryDelta),
          performanceLevel,
          memoryCritical,
        },
      })
    }

    // Clear context
    logContext.clear()

    // Call original end
    return originalEnd.call(this, chunk, encoding, callback)
  }

  // Override res.json to capture response data
  ;(res as any).json = function (data: any): Response {
    // Restore original json
    res.json = originalJson

    // Set content length if not already set
    if (!res.getHeader('content-length')) {
      const jsonString = JSON.stringify(data)
      res.setHeader('content-length', Buffer.byteLength(jsonString))
    }

    // Call original json
    return originalJson.call(this, data)
  }

  next()
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): {
  global: GlobalMetrics
  system: ReturnType<typeof getSystemMetrics>
  activeRequests: {
    count: number
    requests: Array<{
      requestId: string
      method: string
      url: string
      duration: number
    }>
  }
} {
  updateRequestsPerMinute()

  const now = Date.now()
  const activeRequestsInfo = Array.from(activeRequests.values()).map((req) => ({
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    duration: now - req.startTime,
  }))

  return {
    global: {
      ...globalMetrics,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      uptime: process.uptime(),
    },
    system: getSystemMetrics(),
    activeRequests: {
      count: activeRequests.size,
      requests: activeRequestsInfo,
    },
  }
}

/**
 * Reset performance metrics
 */
export function resetPerformanceMetrics(): void {
  globalMetrics = {
    totalRequests: 0,
    activeRequests: activeRequests.size,
    totalErrors: 0,
    averageResponseTime: 0,
    requestsPerMinute: 0,
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    uptime: process.uptime(),
  }
  requestTimestamps.length = 0
}

/**
 * Middleware to expose metrics endpoint
 */
export function metricsEndpoint(req: Request, res: Response): void {
  const metrics = getPerformanceMetrics()

  res.json({
    timestamp: new Date().toISOString(),
    metrics,
  })
}

// Periodic system metrics logging
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    const systemMetrics = getSystemMetrics()

    enhancedLoggers.system({
      event: 'periodic_metrics',
      component: 'performance_middleware',
      severity: 'info',
      metadata: {
        ...globalMetrics,
        system: systemMetrics,
      },
    })

    // Check for memory warnings
    const memoryUsagePercent = systemMetrics.memory.usagePercent
    if (memoryUsagePercent > 90) {
      enhancedLoggers.system({
        event: 'high_memory_usage',
        component: 'performance_middleware',
        severity: 'error',
        metadata: {
          memoryUsagePercent,
          memoryUsed: formatBytes(systemMetrics.memory.used),
          memoryTotal: formatBytes(systemMetrics.memory.total),
        },
      })
    } else if (memoryUsagePercent > 80) {
      enhancedLoggers.system({
        event: 'elevated_memory_usage',
        component: 'performance_middleware',
        severity: 'warn',
        metadata: {
          memoryUsagePercent,
          memoryUsed: formatBytes(systemMetrics.memory.used),
          memoryTotal: formatBytes(systemMetrics.memory.total),
        },
      })
    }

    // Check for high CPU load
    const loadAverage = systemMetrics.cpu.loadAverage[0]
    const cpuCores = systemMetrics.cpu.cores
    const loadPerCore = loadAverage / cpuCores

    if (loadPerCore > 0.9) {
      enhancedLoggers.system({
        event: 'high_cpu_load',
        component: 'performance_middleware',
        severity: 'error',
        metadata: {
          loadAverage,
          cpuCores,
          loadPerCore,
        },
      })
    } else if (loadPerCore > 0.7) {
      enhancedLoggers.system({
        event: 'elevated_cpu_load',
        component: 'performance_middleware',
        severity: 'warn',
        metadata: {
          loadAverage,
          cpuCores,
          loadPerCore,
        },
      })
    }
  }, 60000) // Every minute
}
