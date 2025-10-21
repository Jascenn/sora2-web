import { Request, Response, NextFunction } from 'express'
import logger, { loggers } from './logger'
import os from 'os'

/**
 * Performance Metrics Store
 */
class MetricsStore {
  private metrics: {
    requests: {
      total: number
      successful: number
      failed: number
      byStatus: Map<number, number>
      byMethod: Map<string, number>
      byPath: Map<string, number>
    }
    response: {
      totalTime: number
      count: number
      histogram: Map<string, number> // Time buckets
    }
    errors: {
      total: number
      byType: Map<string, number>
      byPath: Map<string, number>
    }
    activeRequests: number
    peakActiveRequests: number
    startTime: number
  }

  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byStatus: new Map(),
        byMethod: new Map(),
        byPath: new Map(),
      },
      response: {
        totalTime: 0,
        count: 0,
        histogram: new Map([
          ['<50ms', 0],
          ['50-100ms', 0],
          ['100-200ms', 0],
          ['200-500ms', 0],
          ['500-1000ms', 0],
          ['>1000ms', 0],
        ]),
      },
      errors: {
        total: 0,
        byType: new Map(),
        byPath: new Map(),
      },
      activeRequests: 0,
      peakActiveRequests: 0,
      startTime: Date.now(),
    }
  }

  /**
   * Record a request
   */
  recordRequest(
    method: string,
    path: string,
    statusCode: number,
    responseTime: number
  ): void {
    // Update total requests
    this.metrics.requests.total++

    // Update success/failure counts
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.successful++
    } else {
      this.metrics.requests.failed++
    }

    // Update status code distribution
    const statusCount = this.metrics.requests.byStatus.get(statusCode) || 0
    this.metrics.requests.byStatus.set(statusCode, statusCount + 1)

    // Update method distribution
    const methodCount = this.metrics.requests.byMethod.get(method) || 0
    this.metrics.requests.byMethod.set(method, methodCount + 1)

    // Update path distribution (normalize paths)
    const normalizedPath = this.normalizePath(path)
    const pathCount = this.metrics.requests.byPath.get(normalizedPath) || 0
    this.metrics.requests.byPath.set(normalizedPath, pathCount + 1)

    // Update response time metrics
    this.metrics.response.totalTime += responseTime
    this.metrics.response.count++

    // Update response time histogram
    this.updateHistogram(responseTime)
  }

  /**
   * Record an error
   */
  recordError(type: string, path: string): void {
    this.metrics.errors.total++

    // Update error type distribution
    const typeCount = this.metrics.errors.byType.get(type) || 0
    this.metrics.errors.byType.set(type, typeCount + 1)

    // Update error path distribution
    const normalizedPath = this.normalizePath(path)
    const pathCount = this.metrics.errors.byPath.get(normalizedPath) || 0
    this.metrics.errors.byPath.set(normalizedPath, pathCount + 1)
  }

  /**
   * Update active request count
   */
  updateActiveRequests(delta: number): void {
    this.metrics.activeRequests += delta
    if (this.metrics.activeRequests > this.metrics.peakActiveRequests) {
      this.metrics.peakActiveRequests = this.metrics.activeRequests
    }
  }

  /**
   * Update response time histogram
   */
  private updateHistogram(responseTime: number): void {
    if (responseTime < 50) {
      this.incrementHistogram('<50ms')
    } else if (responseTime < 100) {
      this.incrementHistogram('50-100ms')
    } else if (responseTime < 200) {
      this.incrementHistogram('100-200ms')
    } else if (responseTime < 500) {
      this.incrementHistogram('200-500ms')
    } else if (responseTime < 1000) {
      this.incrementHistogram('500-1000ms')
    } else {
      this.incrementHistogram('>1000ms')
    }
  }

  /**
   * Increment histogram bucket
   */
  private incrementHistogram(bucket: string): void {
    const count = this.metrics.response.histogram.get(bucket) || 0
    this.metrics.response.histogram.set(bucket, count + 1)
  }

  /**
   * Normalize path to group similar endpoints
   */
  private normalizePath(path: string): string {
    // Replace UUIDs with :id
    let normalized = path.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      ':id'
    )
    // Replace numeric IDs with :id
    normalized = normalized.replace(/\/\d+/g, '/:id')
    return normalized
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const uptime = Date.now() - this.metrics.startTime
    const avgResponseTime =
      this.metrics.response.count > 0
        ? this.metrics.response.totalTime / this.metrics.response.count
        : 0

    return {
      uptime: Math.round(uptime / 1000), // Convert to seconds
      requests: {
        total: this.metrics.requests.total,
        successful: this.metrics.requests.successful,
        failed: this.metrics.requests.failed,
        successRate:
          this.metrics.requests.total > 0
            ? (
                (this.metrics.requests.successful / this.metrics.requests.total) *
                100
              ).toFixed(2) + '%'
            : '0%',
        errorRate:
          this.metrics.requests.total > 0
            ? (
                (this.metrics.requests.failed / this.metrics.requests.total) *
                100
              ).toFixed(2) + '%'
            : '0%',
        byStatus: Object.fromEntries(this.metrics.requests.byStatus),
        byMethod: Object.fromEntries(this.metrics.requests.byMethod),
        topPaths: this.getTopItems(this.metrics.requests.byPath, 10),
      },
      response: {
        averageTime: Math.round(avgResponseTime) + 'ms',
        histogram: Object.fromEntries(this.metrics.response.histogram),
      },
      errors: {
        total: this.metrics.errors.total,
        byType: Object.fromEntries(this.metrics.errors.byType),
        topErrorPaths: this.getTopItems(this.metrics.errors.byPath, 10),
      },
      concurrency: {
        active: this.metrics.activeRequests,
        peak: this.metrics.peakActiveRequests,
      },
    }
  }

  /**
   * Get top N items from a map
   */
  private getTopItems(map: Map<string, number>, limit: number) {
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byStatus: new Map(),
        byMethod: new Map(),
        byPath: new Map(),
      },
      response: {
        totalTime: 0,
        count: 0,
        histogram: new Map([
          ['<50ms', 0],
          ['50-100ms', 0],
          ['100-200ms', 0],
          ['200-500ms', 0],
          ['500-1000ms', 0],
          ['>1000ms', 0],
        ]),
      },
      errors: {
        total: 0,
        byType: new Map(),
        byPath: new Map(),
      },
      activeRequests: 0,
      peakActiveRequests: 0,
      startTime: Date.now(),
    }
  }
}

// Create global metrics store
const metricsStore = new MetricsStore()

/**
 * System Resource Monitor
 */
class SystemMonitor {
  private readonly checkInterval: number = 60000 // 60 seconds
  private intervalId?: NodeJS.Timeout

  constructor() {
    // Start monitoring on initialization
    this.start()
  }

  /**
   * Start system monitoring
   */
  start(): void {
    if (this.intervalId) {
      return // Already started
    }

    // Log initial system info
    this.logSystemMetrics()

    // Schedule periodic monitoring
    this.intervalId = setInterval(() => {
      this.logSystemMetrics()
    }, this.checkInterval)
  }

  /**
   * Stop system monitoring
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
  }

  /**
   * Log system metrics
   */
  private logSystemMetrics(): void {
    const metrics = this.getSystemMetrics()

    // Log to performance logger
    loggers.performance({
      operation: 'system_health',
      duration: 0,
      metadata: metrics,
    })

    // Log warnings for high resource usage
    if (metrics.memory.usagePercent > 85) {
      logger.warn('High memory usage detected', { memory: metrics.memory })
    }

    if (metrics.cpu.loadAverage1m > os.cpus().length) {
      logger.warn('High CPU load detected', { cpu: metrics.cpu })
    }
  }

  /**
   * Get current system metrics
   */
  getSystemMetrics() {
    const memUsage = process.memoryUsage()
    const totalMemory = os.totalmem()
    const freeMemory = os.freemem()
    const usedMemory = totalMemory - freeMemory
    const loadAverage = os.loadavg()

    return {
      process: {
        uptime: Math.round(process.uptime()),
        pid: process.pid,
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
          external: Math.round(memUsage.external / 1024 / 1024), // MB
        },
      },
      system: {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        cpuCount: os.cpus().length,
      },
      memory: {
        total: Math.round(totalMemory / 1024 / 1024 / 1024), // GB
        used: Math.round(usedMemory / 1024 / 1024 / 1024), // GB
        free: Math.round(freeMemory / 1024 / 1024 / 1024), // GB
        usagePercent: Math.round((usedMemory / totalMemory) * 100),
      },
      cpu: {
        loadAverage1m: parseFloat(loadAverage[0].toFixed(2)),
        loadAverage5m: parseFloat(loadAverage[1].toFixed(2)),
        loadAverage15m: parseFloat(loadAverage[2].toFixed(2)),
      },
    }
  }
}

// Create global system monitor
const systemMonitor = new SystemMonitor()

/**
 * Request monitoring middleware
 */
export function requestMonitoringMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now()

  // Increment active requests
  metricsStore.updateActiveRequests(1)

  // Store request start time
  res.locals.startTime = startTime

  // Override res.json to capture response
  const originalJson = res.json.bind(res)
  res.json = function (body: any) {
    res.locals.responseBody = body
    return originalJson(body)
  }

  // Listen for response finish
  res.on('finish', () => {
    const responseTime = Date.now() - startTime

    // Decrement active requests
    metricsStore.updateActiveRequests(-1)

    // Skip health check and metrics endpoints
    if (req.path === '/health' || req.path === '/metrics') {
      return
    }

    // Record request metrics
    metricsStore.recordRequest(
      req.method,
      req.path,
      res.statusCode,
      responseTime
    )

    // Log HTTP request
    loggers.httpRequest({
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('user-agent'),
      userId: (req as any).user?.id,
      ip: req.ip || req.socket.remoteAddress,
    })

    // Log slow requests
    if (responseTime > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        responseTime: `${responseTime}ms`,
        statusCode: res.statusCode,
      })
    }
  })

  next()
}

/**
 * Error rate monitoring
 */
export function monitorError(error: Error, req: Request): void {
  const errorType = error.constructor.name || 'Error'
  metricsStore.recordError(errorType, req.path)

  // Log error with context
  logger.error('Request error', {
    type: 'request_error',
    errorType,
    message: error.message,
    stack: error.stack,
    method: req.method,
    path: req.path,
    userId: (req as any).user?.id,
    ip: req.ip,
  })
}

/**
 * Get metrics endpoint handler
 */
export function getMetrics(req: Request, res: Response): void {
  const appMetrics = metricsStore.getMetrics()
  const systemMetrics = systemMonitor.getSystemMetrics()

  res.json({
    timestamp: new Date().toISOString(),
    application: appMetrics,
    system: systemMetrics,
  })
}

/**
 * Performance measurement utility
 */
export class PerformanceTracker {
  private startTime: number
  private checkpoints: Map<string, number>

  constructor() {
    this.startTime = Date.now()
    this.checkpoints = new Map()
  }

  /**
   * Mark a checkpoint
   */
  checkpoint(name: string): void {
    this.checkpoints.set(name, Date.now() - this.startTime)
  }

  /**
   * Get elapsed time since start
   */
  elapsed(): number {
    return Date.now() - this.startTime
  }

  /**
   * Complete tracking and log results
   */
  complete(operation: string, metadata?: Record<string, any>): void {
    const duration = this.elapsed()
    const checkpoints = Object.fromEntries(this.checkpoints)

    loggers.performance({
      operation,
      duration,
      metadata: {
        ...metadata,
        checkpoints,
      },
    })
  }
}

/**
 * Database query performance monitoring wrapper
 */
export function monitorDatabaseQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()

  return queryFn()
    .then((result) => {
      const duration = Date.now() - startTime
      loggers.dbQuery({
        query: queryName,
        duration,
        rowCount: Array.isArray(result) ? result.length : undefined,
      })
      return result
    })
    .catch((error) => {
      const duration = Date.now() - startTime
      loggers.dbQuery({
        query: queryName,
        duration,
        error: error.message,
      })
      throw error
    })
}

/**
 * External API call monitoring wrapper
 */
export async function monitorExternalApi<T>(
  service: string,
  method: string,
  url: string,
  apiFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()

  try {
    const result = await apiFn()
    const duration = Date.now() - startTime

    loggers.externalApi({
      service,
      method,
      url,
      duration,
    })

    return result
  } catch (error: any) {
    const duration = Date.now() - startTime

    loggers.externalApi({
      service,
      method,
      url,
      duration,
      error: error.message,
      statusCode: error.response?.status,
    })

    throw error
  }
}

/**
 * Graceful shutdown handler
 */
export async function gracefulShutdown(): Promise<void> {
  logger.info('Initiating graceful shutdown', {
    activeRequests: metricsStore.getMetrics().concurrency.active,
  })

  // Stop system monitoring
  systemMonitor.stop()

  // Log final metrics
  const finalMetrics = metricsStore.getMetrics()
  logger.info('Final metrics before shutdown', finalMetrics)

  // Reset metrics
  metricsStore.reset()
}

// Export instances
export { metricsStore, systemMonitor }
