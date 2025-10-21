import { Request, Response, NextFunction } from 'express'
import logger, { loggers } from '../lib/logger'
import { monitorError } from '../lib/monitoring'

/**
 * Error Categories for classification
 */
export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  DATABASE = 'DATABASE',
  EXTERNAL_API = 'EXTERNAL_API',
  SYSTEM = 'SYSTEM',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Error Severity Levels
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Enhanced Application Error with classification
 */
export class AppError extends Error {
  statusCode: number
  isOperational: boolean
  category: ErrorCategory
  severity: ErrorSeverity
  metadata?: Record<string, any>
  timestamp: Date

  constructor(
    message: string,
    statusCode: number,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    metadata?: Record<string, any>
  ) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    this.category = category
    this.severity = this.determineSeverity(statusCode, category)
    this.metadata = metadata
    this.timestamp = new Date()
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * Determine error severity based on status code and category
   */
  private determineSeverity(
    statusCode: number,
    category: ErrorCategory
  ): ErrorSeverity {
    // Critical errors
    if (statusCode >= 500 || category === ErrorCategory.DATABASE) {
      return ErrorSeverity.CRITICAL
    }

    // High severity errors
    if (
      category === ErrorCategory.AUTHENTICATION ||
      category === ErrorCategory.AUTHORIZATION ||
      category === ErrorCategory.EXTERNAL_API
    ) {
      return ErrorSeverity.HIGH
    }

    // Medium severity errors
    if (
      statusCode === 409 ||
      statusCode === 429 ||
      category === ErrorCategory.CONFLICT ||
      category === ErrorCategory.RATE_LIMIT
    ) {
      return ErrorSeverity.MEDIUM
    }

    // Low severity errors (client errors)
    return ErrorSeverity.LOW
  }

  /**
   * Serialize error for logging
   */
  toJSON() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      category: this.category,
      severity: this.severity,
      metadata: this.metadata,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    }
  }
}

/**
 * Predefined error classes for common scenarios
 */
export class ValidationError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 400, ErrorCategory.VALIDATION, metadata)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', metadata?: Record<string, any>) {
    super(message, 401, ErrorCategory.AUTHENTICATION, metadata)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', metadata?: Record<string, any>) {
    super(message, 403, ErrorCategory.AUTHORIZATION, metadata)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', metadata?: Record<string, any>) {
    super(`${resource} not found`, 404, ErrorCategory.NOT_FOUND, metadata)
  }
}

export class ConflictError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 409, ErrorCategory.CONFLICT, metadata)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', metadata?: Record<string, any>) {
    super(message, 429, ErrorCategory.RATE_LIMIT, metadata)
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', metadata?: Record<string, any>) {
    super(message, 500, ErrorCategory.DATABASE, metadata)
  }
}

export class ExternalApiError extends AppError {
  constructor(service: string, message: string, metadata?: Record<string, any>) {
    super(`${service} API error: ${message}`, 502, ErrorCategory.EXTERNAL_API, metadata)
  }
}

export class SystemError extends AppError {
  constructor(message: string = 'System error occurred', metadata?: Record<string, any>) {
    super(message, 500, ErrorCategory.SYSTEM, metadata)
  }
}

/**
 * Error Reporter for external monitoring services
 */
class ErrorReporter {
  private errorCounts: Map<string, number> = new Map()
  private lastReportTime: Map<string, number> = new Map()
  private readonly reportThreshold = 5 // Report after 5 occurrences
  private readonly reportInterval = 300000 // 5 minutes in milliseconds

  /**
   * Report error to monitoring service
   */
  report(error: AppError, req: Request): void {
    const errorKey = `${error.category}:${error.statusCode}:${req.path}`
    const currentCount = (this.errorCounts.get(errorKey) || 0) + 1
    const lastReport = this.lastReportTime.get(errorKey) || 0
    const now = Date.now()

    this.errorCounts.set(errorKey, currentCount)

    // Report if threshold reached or enough time has passed
    const shouldReport =
      currentCount >= this.reportThreshold ||
      now - lastReport >= this.reportInterval

    if (shouldReport) {
      this.sendToMonitoring(error, req, currentCount)
      this.errorCounts.set(errorKey, 0)
      this.lastReportTime.set(errorKey, now)
    }
  }

  /**
   * Send error to monitoring service
   * In production, integrate with services like Sentry, DataDog, New Relic, etc.
   */
  private sendToMonitoring(
    error: AppError,
    req: Request,
    occurrences: number
  ): void {
    const errorReport = {
      ...error.toJSON(),
      occurrences,
      request: {
        method: req.method,
        path: req.path,
        url: req.originalUrl || req.url,
        query: req.query,
        headers: this.sanitizeHeaders(req.headers),
        userId: (req as any).user?.id,
        ip: req.ip || req.socket.remoteAddress,
      },
      environment: process.env.NODE_ENV || 'development',
    }

    // Log high-severity errors
    if (
      error.severity === ErrorSeverity.CRITICAL ||
      error.severity === ErrorSeverity.HIGH
    ) {
      logger.error('High-severity error reported to monitoring', errorReport)
    }

    // TODO: Integrate with external monitoring service
    // Example: Sentry.captureException(error, { extra: errorReport })
    // Example: dataDog.sendError(errorReport)

    // For now, just log security events
    if (
      error.category === ErrorCategory.AUTHENTICATION ||
      error.category === ErrorCategory.AUTHORIZATION
    ) {
      loggers.security({
        event: 'security_error',
        userId: (req as any).user?.id,
        ip: req.ip,
        metadata: errorReport,
      })
    }
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private sanitizeHeaders(headers: any): Record<string, any> {
    const sanitized = { ...headers }
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
    ]

    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]'
      }
    })

    return sanitized
  }

  /**
   * Get error statistics
   */
  getStatistics() {
    return {
      uniqueErrors: this.errorCounts.size,
      errorCounts: Object.fromEntries(this.errorCounts),
      lastReports: Object.fromEntries(
        Array.from(this.lastReportTime.entries()).map(([key, time]) => [
          key,
          new Date(time).toISOString(),
        ])
      ),
    }
  }
}

// Create global error reporter
const errorReporter = new ErrorReporter()

/**
 * Enhanced error handler middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip if response already sent
  if (res.headersSent) {
    return next(err)
  }

  // Handle operational AppError
  if (err instanceof AppError) {
    // Monitor error
    monitorError(err, req)

    // Report to monitoring service
    errorReporter.report(err, req)

    // Log based on severity
    const logData = {
      ...err.toJSON(),
      request: {
        method: req.method,
        path: req.path,
        url: req.originalUrl || req.url,
        userId: (req as any).user?.id,
        ip: req.ip,
      },
    }

    if (err.severity === ErrorSeverity.CRITICAL) {
      logger.error('Critical operational error', logData)
    } else if (err.severity === ErrorSeverity.HIGH) {
      logger.error('High-severity operational error', logData)
    } else if (err.severity === ErrorSeverity.MEDIUM) {
      logger.warn('Medium-severity operational error', logData)
    } else {
      logger.info('Low-severity operational error', logData)
    }

    // Return error response
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        category: err.category,
        ...(process.env.NODE_ENV !== 'production' && {
          stack: err.stack,
          metadata: err.metadata,
        }),
      },
    })
  }

  // Handle unknown errors
  const unknownError = new SystemError('An unexpected error occurred', {
    originalError: err.message,
    originalStack: err.stack,
  })

  // Monitor error
  monitorError(unknownError, req)

  // Report to monitoring service
  errorReporter.report(unknownError, req)

  // Log critical error
  logger.error('Unexpected system error', {
    ...unknownError.toJSON(),
    originalError: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
    request: {
      method: req.method,
      path: req.path,
      url: req.originalUrl || req.url,
      query: req.query,
      body: req.body,
      userId: (req as any).user?.id,
      ip: req.ip,
    },
  })

  // Return generic error response
  return res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      category: ErrorCategory.SYSTEM,
      ...(process.env.NODE_ENV !== 'production' && {
        details: err.message,
        stack: err.stack,
      }),
    },
  })
}

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = new NotFoundError('Endpoint', {
    path: req.path,
    method: req.method,
  })
  next(error)
}

/**
 * Async handler wrapper to catch promise rejections
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// Export error reporter for metrics
export { errorReporter }
