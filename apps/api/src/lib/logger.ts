import winston from 'winston'
import path from 'path'
import fs from 'fs'
import 'winston-daily-rotate-file'

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

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
      hostname: require('os').hostname(),
      pid: process.pid,
    }
  })(),
  winston.format.json()
)

// Enhanced console format for development with colors and structure
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.printf(({ timestamp, level, message, service, ...metadata }) => {
    // Remove internal fields from metadata
    const { environment, hostname, pid, stack, ...cleanMetadata } = metadata

    let msg = `${timestamp} [${level}] [${service}] ${message}`

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

// Daily rotating file transport for error logs
const errorRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m', // 20MB per file
  maxFiles: '14d', // Keep logs for 14 days
  zippedArchive: true, // Compress rotated logs
  format: structuredJsonFormat,
})

// Daily rotating file transport for combined logs
const combinedRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m', // 20MB per file
  maxFiles: '14d', // Keep logs for 14 days
  zippedArchive: true, // Compress rotated logs
  format: structuredJsonFormat,
})

// Daily rotating file transport for access logs (HTTP requests)
const accessRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'access-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'info',
  maxSize: '20m', // 20MB per file
  maxFiles: '30d', // Keep access logs for 30 days
  zippedArchive: true,
  format: structuredJsonFormat,
})

// Daily rotating file transport for performance logs
const performanceRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'performance-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'info',
  maxSize: '20m',
  maxFiles: '7d', // Keep performance logs for 7 days
  zippedArchive: true,
  format: structuredJsonFormat,
})

// Create main logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: structuredJsonFormat,
  transports: [
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
    }),
  ],
  rejectionHandlers: [
    new winston.transports.DailyRotateFile({
      filename: path.join(logsDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
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
  level: 'info',
  format: structuredJsonFormat,
  transports: [accessRotateTransport],
})

export const performanceLogger = winston.createLogger({
  level: 'info',
  format: structuredJsonFormat,
  transports: [performanceRotateTransport],
})

// Add helper methods for structured logging
export const loggers = {
  /**
   * Log HTTP request
   */
  httpRequest: (data: {
    method: string
    url: string
    statusCode: number
    responseTime: number
    userAgent?: string
    userId?: string
    ip?: string
  }) => {
    accessLogger.info('HTTP Request', {
      type: 'http_request',
      ...data,
    })
  },

  /**
   * Log performance metric
   */
  performance: (data: {
    operation: string
    duration: number
    metadata?: Record<string, any>
  }) => {
    performanceLogger.info('Performance Metric', {
      type: 'performance',
      ...data,
    })
  },

  /**
   * Log database query
   */
  dbQuery: (data: {
    query: string
    duration: number
    rowCount?: number
    error?: string
  }) => {
    const level = data.error ? 'error' : data.duration > 100 ? 'warn' : 'info'
    logger.log(level, 'Database Query', {
      type: 'db_query',
      ...data,
    })
  },

  /**
   * Log external API call
   */
  externalApi: (data: {
    service: string
    method: string
    url: string
    statusCode?: number
    duration: number
    error?: string
  }) => {
    const level = data.error ? 'error' : 'info'
    logger.log(level, 'External API Call', {
      type: 'external_api',
      ...data,
    })
  },

  /**
   * Log security event
   */
  security: (data: {
    event: string
    userId?: string
    ip?: string
    metadata?: Record<string, any>
  }) => {
    logger.warn('Security Event', {
      type: 'security',
      ...data,
    })
  },

  /**
   * Log business event
   */
  business: (data: {
    event: string
    userId?: string
    metadata?: Record<string, any>
  }) => {
    logger.info('Business Event', {
      type: 'business',
      ...data,
    })
  },
}

// Log rotation event handlers
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

// Log startup
logger.info('Logger initialized', {
  level: logger.level,
  environment: process.env.NODE_ENV || 'development',
  logsDirectory: logsDir,
})

export default logger
