import winston from 'winston'
import path from 'path'
import fs from 'fs'
import 'winston-daily-rotate-file'
import os from 'os'

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Custom log levels with priorities
const customLevels = {
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    http: 4,
    debug: 5,
    trace: 6,
  },
  colors: {
    fatal: 'red bold',
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
    trace: 'gray',
  },
}

winston.addColors(customLevels.colors)

// Enhanced structured JSON format with additional metadata
const structuredJsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format((info) => {
    // Add common metadata to all log entries
    return {
      ...info,
      service: 'sora2-api',
      environment: process.env.NODE_ENV || 'development',
      hostname: os.hostname(),
      pid: process.pid,
      nodeVersion: process.version,
      platform: os.platform(),
      // Add correlation ID if available from context
      correlationId: (info as any).correlationId || undefined,
      // Add user context if available
      userId: (info as any).userId || undefined,
      // Add request context if available
      requestId: (info as any).requestId || undefined,
    }
  })(),
  winston.format.json()
)

// Enhanced console format for development with colors and structure
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.printf(({ timestamp, level, message, service, correlationId, requestId, ...metadata }) => {
    // Remove internal fields from metadata
    const {
      environment,
      hostname,
      pid,
      stack,
      nodeVersion,
      platform,
      userId,
      ...cleanMetadata
    } = metadata

    let msg = `${timestamp} [${level}]`

    // Add correlation/request ID if present
    if (correlationId) msg += ` [CID:${correlationId}]`
    if (requestId) msg += ` [RID:${requestId}]`

    msg += ` [${service}] ${message}`

    // Add stack trace if present
    if (stack) {
      msg += `\n${stack}`
    }

    // Add metadata if present
    if (Object.keys(cleanMetadata).length > 0) {
      msg += `\n${JSON.stringify(cleanMetadata, null, 2)}`
    }

    return msg
  })
)

// Daily rotating file transport for fatal logs
const fatalRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'fatal-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'fatal',
  maxSize: '20m',
  maxFiles: '30d',
  zippedArchive: true,
  format: structuredJsonFormat,
})

// Daily rotating file transport for error logs
const errorRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true,
  format: structuredJsonFormat,
})

// Daily rotating file transport for combined logs
const combinedRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true,
  format: structuredJsonFormat,
})

// Daily rotating file transport for access logs (HTTP requests)
const accessRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'access-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'http',
  maxSize: '20m',
  maxFiles: '30d',
  zippedArchive: true,
  format: structuredJsonFormat,
})

// Daily rotating file transport for performance logs
const performanceRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'performance-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'info',
  maxSize: '20m',
  maxFiles: '7d',
  zippedArchive: true,
  format: structuredJsonFormat,
})

// Daily rotating file transport for audit logs
const auditRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'audit-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'info',
  maxSize: '20m',
  maxFiles: '90d', // Keep audit logs for 90 days
  zippedArchive: true,
  format: structuredJsonFormat,
})

// Daily rotating file transport for security logs
const securityRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'security-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'warn',
  maxSize: '20m',
  maxFiles: '90d', // Keep security logs for 90 days
  zippedArchive: true,
  format: structuredJsonFormat,
})

// Create main logger instance with custom levels
const logger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: structuredJsonFormat,
  transports: [
    fatalRotateTransport,
    errorRotateTransport,
    combinedRotateTransport,
  ],
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.DailyRotateFile({
      filename: path.join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
      format: structuredJsonFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.DailyRotateFile({
      filename: path.join(logsDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
      format: structuredJsonFormat,
    }),
  ],
})

// Add console transport for non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  )
}

// Create specialized loggers for different purposes
export const accessLogger = winston.createLogger({
  levels: customLevels.levels,
  level: 'http',
  format: structuredJsonFormat,
  transports: [accessRotateTransport],
})

export const performanceLogger = winston.createLogger({
  levels: customLevels.levels,
  level: 'info',
  format: structuredJsonFormat,
  transports: [performanceRotateTransport],
})

export const auditLogger = winston.createLogger({
  levels: customLevels.levels,
  level: 'info',
  format: structuredJsonFormat,
  transports: [auditRotateTransport],
})

export const securityLogger = winston.createLogger({
  levels: customLevels.levels,
  level: 'warn',
  format: structuredJsonFormat,
  transports: [securityRotateTransport],
})

// Context management for correlation IDs
class LogContext {
  private context: Map<string, any> = new Map()

  set(key: string, value: any): void {
    this.context.set(key, value)
  }

  get(key: string): any {
    return this.context.get(key)
  }

  clear(): void {
    this.context.clear()
  }

  getAll(): Record<string, any> {
    const obj: Record<string, any> = {}
    this.context.forEach((value, key) => {
      obj[key] = value
    })
    return obj
  }
}

export const logContext = new LogContext()

// Enhanced helper methods for structured logging
export const enhancedLoggers = {
  /**
   * Log HTTP request with detailed information
   */
  httpRequest: (data: {
    method: string
    url: string
    statusCode: number
    responseTime: number
    userAgent?: string
    userId?: string
    ip?: string
    requestId?: string
    correlationId?: string
    requestSize?: number
    responseSize?: number
    error?: string
  }) => {
    const level = data.statusCode >= 500 ? 'error' : data.statusCode >= 400 ? 'warn' : 'http'
    accessLogger.log(level, 'HTTP Request', {
      type: 'http_request',
      ...data,
      ...logContext.getAll(),
    })
  },

  /**
   * Log performance metric with thresholds
   */
  performance: (data: {
    operation: string
    duration: number
    threshold?: number
    metadata?: Record<string, any>
    tags?: string[]
  }) => {
    const { threshold = 1000, ...rest } = data
    const level = data.duration > threshold ? 'warn' : 'info'
    const message = data.duration > threshold
      ? `Slow operation detected: ${data.operation}`
      : `Performance: ${data.operation}`

    performanceLogger.log(level, message, {
      type: 'performance',
      exceedsThreshold: data.duration > threshold,
      thresholdMs: threshold,
      ...rest,
      ...logContext.getAll(),
    })
  },

  /**
   * Log database query with enhanced details
   */
  dbQuery: (data: {
    query: string
    duration: number
    rowCount?: number
    error?: string
    operation?: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'OTHER'
    table?: string
    slow?: boolean
  }) => {
    const slowThreshold = 100
    const isSlow = data.duration > slowThreshold
    const level = data.error ? 'error' : isSlow ? 'warn' : 'debug'

    logger.log(level, data.error ? 'Database Query Failed' : isSlow ? 'Slow Database Query' : 'Database Query', {
      type: 'db_query',
      slow: isSlow,
      slowThreshold,
      ...data,
      ...logContext.getAll(),
    })
  },

  /**
   * Log external API call with retry information
   */
  externalApi: (data: {
    service: string
    method: string
    url: string
    statusCode?: number
    duration: number
    error?: string
    retryCount?: number
    maxRetries?: number
    requestId?: string
  }) => {
    const level = data.error ? 'error' : data.statusCode && data.statusCode >= 400 ? 'warn' : 'info'
    logger.log(level, `External API Call: ${data.service}`, {
      type: 'external_api',
      ...data,
      ...logContext.getAll(),
    })
  },

  /**
   * Log security event with detailed context
   */
  security: (data: {
    event: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    userId?: string
    ip?: string
    userAgent?: string
    action?: string
    resource?: string
    result: 'success' | 'failure' | 'blocked'
    metadata?: Record<string, any>
  }) => {
    const level = data.severity === 'critical' || data.severity === 'high' ? 'error' : 'warn'
    securityLogger.log(level, `Security Event: ${data.event}`, {
      type: 'security',
      ...data,
      ...logContext.getAll(),
    })
  },

  /**
   * Log business event with context
   */
  business: (data: {
    event: string
    category?: string
    userId?: string
    value?: number
    currency?: string
    metadata?: Record<string, any>
  }) => {
    logger.info(`Business Event: ${data.event}`, {
      type: 'business',
      ...data,
      ...logContext.getAll(),
    })
  },

  /**
   * Log audit trail
   */
  audit: (data: {
    action: string
    resource: string
    resourceId?: string
    userId?: string
    userName?: string
    ip?: string
    userAgent?: string
    before?: any
    after?: any
    result: 'success' | 'failure'
    reason?: string
  }) => {
    auditLogger.info(`Audit: ${data.action} on ${data.resource}`, {
      type: 'audit',
      ...data,
      ...logContext.getAll(),
    })
  },

  /**
   * Log system event
   */
  system: (data: {
    event: string
    component: string
    severity: 'info' | 'warn' | 'error' | 'fatal'
    metadata?: Record<string, any>
  }) => {
    const level = data.severity
    logger.log(level, `System Event: ${data.event}`, {
      type: 'system',
      ...data,
      ...logContext.getAll(),
    })
  },

  /**
   * Log cache operation
   */
  cache: (data: {
    operation: 'get' | 'set' | 'delete' | 'clear'
    key: string
    hit?: boolean
    ttl?: number
    size?: number
    duration?: number
  }) => {
    logger.debug(`Cache ${data.operation}: ${data.key}`, {
      type: 'cache',
      ...data,
      ...logContext.getAll(),
    })
  },

  /**
   * Log queue operation
   */
  queue: (data: {
    operation: 'enqueue' | 'dequeue' | 'retry' | 'failed'
    queue: string
    jobId?: string
    jobType?: string
    priority?: number
    retryCount?: number
    error?: string
  }) => {
    const level = data.error ? 'error' : 'info'
    logger.log(level, `Queue ${data.operation}: ${data.queue}`, {
      type: 'queue',
      ...data,
      ...logContext.getAll(),
    })
  },

  /**
   * Log payment transaction
   */
  payment: (data: {
    event: string
    transactionId: string
    orderId?: string
    userId?: string
    amount: number
    currency: string
    provider: string
    status: string
    metadata?: Record<string, any>
  }) => {
    auditLogger.info(`Payment: ${data.event}`, {
      type: 'payment',
      ...data,
      ...logContext.getAll(),
    })
  },

  /**
   * Log API key usage
   */
  apiKey: (data: {
    keyId: string
    userId?: string
    endpoint: string
    ip?: string
    allowed: boolean
    reason?: string
  }) => {
    const level = data.allowed ? 'info' : 'warn'
    securityLogger.log(level, `API Key Usage: ${data.keyId}`, {
      type: 'api_key',
      ...data,
      ...logContext.getAll(),
    })
  },

  /**
   * Log rate limit event
   */
  rateLimit: (data: {
    identifier: string
    limit: number
    window: number
    current: number
    exceeded: boolean
    endpoint?: string
  }) => {
    const level = data.exceeded ? 'warn' : 'debug'
    logger.log(level, data.exceeded ? 'Rate Limit Exceeded' : 'Rate Limit Check', {
      type: 'rate_limit',
      ...data,
      ...logContext.getAll(),
    })
  },
}

// Log rotation event handlers
fatalRotateTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info('Log file rotated', {
    type: 'log_rotation',
    oldFile: oldFilename,
    newFile: newFilename,
    transport: 'fatal',
  })
})

errorRotateTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info('Log file rotated', {
    type: 'log_rotation',
    oldFile: oldFilename,
    newFile: newFilename,
    transport: 'error',
  })
})

combinedRotateTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info('Log file rotated', {
    type: 'log_rotation',
    oldFile: oldFilename,
    newFile: newFilename,
    transport: 'combined',
  })
})

accessRotateTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info('Log file rotated', {
    type: 'log_rotation',
    oldFile: oldFilename,
    newFile: newFilename,
    transport: 'access',
  })
})

performanceRotateTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info('Log file rotated', {
    type: 'log_rotation',
    oldFile: oldFilename,
    newFile: newFilename,
    transport: 'performance',
  })
})

// Log startup
logger.info('Enhanced Logger initialized', {
  level: logger.level,
  environment: process.env.NODE_ENV || 'development',
  logsDirectory: logsDir,
  customLevels: Object.keys(customLevels.levels),
})

export default logger
