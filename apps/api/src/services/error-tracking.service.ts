import logger, { enhancedLoggers } from '../lib/logger-enhanced'
import { db } from '../lib/db'

// Error classification types
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  RATE_LIMIT = 'rate_limit',
  DATABASE = 'database',
  EXTERNAL_API = 'external_api',
  PAYMENT = 'payment',
  SYSTEM = 'system',
  UNKNOWN = 'unknown',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error tracking interface
export interface TrackedError {
  id: string
  category: ErrorCategory
  severity: ErrorSeverity
  message: string
  stack?: string
  code?: string
  statusCode?: number
  timestamp: Date
  count: number
  firstOccurrence: Date
  lastOccurrence: Date
  context?: {
    userId?: string
    requestId?: string
    correlationId?: string
    url?: string
    method?: string
    ip?: string
    userAgent?: string
    [key: string]: any
  }
  metadata?: Record<string, any>
  fingerprint: string
}

// Error aggregation interface
export interface ErrorAggregation {
  category: ErrorCategory
  count: number
  uniqueErrors: number
  lastOccurred: Date
  examples: Array<{
    message: string
    count: number
    severity: ErrorSeverity
    lastOccurred: Date
  }>
}

// Error statistics interface
export interface ErrorStatistics {
  total: number
  byCategory: Record<ErrorCategory, number>
  bySeverity: Record<ErrorSeverity, number>
  topErrors: Array<{
    fingerprint: string
    message: string
    count: number
    category: ErrorCategory
    severity: ErrorSeverity
  }>
  trend: {
    lastHour: number
    last24Hours: number
    last7Days: number
  }
}

// In-memory error storage (for production, consider using Redis or a database)
class ErrorStore {
  private errors: Map<string, TrackedError> = new Map()
  private errorsByCategory: Map<ErrorCategory, Set<string>> = new Map()
  private errorsBySeverity: Map<ErrorSeverity, Set<string>> = new Map()
  private errorTimestamps: Array<{ timestamp: Date; fingerprint: string }> = []

  // Configuration
  private readonly MAX_STORED_ERRORS = 10000
  private readonly MAX_TIMESTAMPS = 100000
  private readonly CLEANUP_INTERVAL = 3600000 // 1 hour
  private readonly ERROR_TTL = 86400000 * 7 // 7 days

  constructor() {
    // Periodic cleanup
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL)
  }

  /**
   * Add or update an error
   */
  add(error: Omit<TrackedError, 'count' | 'firstOccurrence' | 'lastOccurrence'>): TrackedError {
    const existing = this.errors.get(error.fingerprint)

    if (existing) {
      // Update existing error
      existing.count++
      existing.lastOccurrence = error.timestamp
      existing.context = { ...existing.context, ...error.context }
      existing.metadata = { ...existing.metadata, ...error.metadata }
      return existing
    } else {
      // Create new error
      const trackedError: TrackedError = {
        ...error,
        count: 1,
        firstOccurrence: error.timestamp,
        lastOccurrence: error.timestamp,
      }

      this.errors.set(error.fingerprint, trackedError)

      // Add to category index
      if (!this.errorsByCategory.has(error.category)) {
        this.errorsByCategory.set(error.category, new Set())
      }
      this.errorsByCategory.get(error.category)!.add(error.fingerprint)

      // Add to severity index
      if (!this.errorsBySeverity.has(error.severity)) {
        this.errorsBySeverity.set(error.severity, new Set())
      }
      this.errorsBySeverity.get(error.severity)!.add(error.fingerprint)

      // Add timestamp
      this.errorTimestamps.push({
        timestamp: error.timestamp,
        fingerprint: error.fingerprint,
      })

      // Enforce size limits
      if (this.errors.size > this.MAX_STORED_ERRORS) {
        this.evictOldest()
      }

      if (this.errorTimestamps.length > this.MAX_TIMESTAMPS) {
        this.errorTimestamps = this.errorTimestamps.slice(-this.MAX_TIMESTAMPS)
      }

      return trackedError
    }
  }

  /**
   * Get error by fingerprint
   */
  get(fingerprint: string): TrackedError | undefined {
    return this.errors.get(fingerprint)
  }

  /**
   * Get errors by category
   */
  getByCategory(category: ErrorCategory): TrackedError[] {
    const fingerprints = this.errorsByCategory.get(category) || new Set()
    return Array.from(fingerprints)
      .map((fp) => this.errors.get(fp))
      .filter((e): e is TrackedError => e !== undefined)
  }

  /**
   * Get errors by severity
   */
  getBySeverity(severity: ErrorSeverity): TrackedError[] {
    const fingerprints = this.errorsBySeverity.get(severity) || new Set()
    return Array.from(fingerprints)
      .map((fp) => this.errors.get(fp))
      .filter((e): e is TrackedError => e !== undefined)
  }

  /**
   * Get all errors
   */
  getAll(): TrackedError[] {
    return Array.from(this.errors.values())
  }

  /**
   * Get error count for time range
   */
  getCountForTimeRange(startTime: Date, endTime: Date): number {
    return this.errorTimestamps.filter(
      (e) => e.timestamp >= startTime && e.timestamp <= endTime
    ).length
  }

  /**
   * Get aggregated errors by category
   */
  getAggregationByCategory(): Map<ErrorCategory, ErrorAggregation> {
    const aggregations = new Map<ErrorCategory, ErrorAggregation>()

    for (const [category, fingerprints] of this.errorsByCategory.entries()) {
      const errors = Array.from(fingerprints)
        .map((fp) => this.errors.get(fp))
        .filter((e): e is TrackedError => e !== undefined)

      const totalCount = errors.reduce((sum, e) => sum + e.count, 0)
      const lastOccurred = new Date(Math.max(...errors.map((e) => e.lastOccurrence.getTime())))

      const topExamples = errors
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((e) => ({
          message: e.message,
          count: e.count,
          severity: e.severity,
          lastOccurred: e.lastOccurrence,
        }))

      aggregations.set(category, {
        category,
        count: totalCount,
        uniqueErrors: fingerprints.size,
        lastOccurred,
        examples: topExamples,
      })
    }

    return aggregations
  }

  /**
   * Get error statistics
   */
  getStatistics(): ErrorStatistics {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 3600000)
    const oneDayAgo = new Date(now.getTime() - 86400000)
    const sevenDaysAgo = new Date(now.getTime() - 86400000 * 7)

    const byCategory: Record<ErrorCategory, number> = {} as any
    for (const category of Object.values(ErrorCategory)) {
      const errors = this.getByCategory(category as ErrorCategory)
      byCategory[category as ErrorCategory] = errors.reduce((sum, e) => sum + e.count, 0)
    }

    const bySeverity: Record<ErrorSeverity, number> = {} as any
    for (const severity of Object.values(ErrorSeverity)) {
      const errors = this.getBySeverity(severity as ErrorSeverity)
      bySeverity[severity as ErrorSeverity] = errors.reduce((sum, e) => sum + e.count, 0)
    }

    const topErrors = Array.from(this.errors.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((e) => ({
        fingerprint: e.fingerprint,
        message: e.message,
        count: e.count,
        category: e.category,
        severity: e.severity,
      }))

    return {
      total: Array.from(this.errors.values()).reduce((sum, e) => sum + e.count, 0),
      byCategory,
      bySeverity,
      topErrors,
      trend: {
        lastHour: this.getCountForTimeRange(oneHourAgo, now),
        last24Hours: this.getCountForTimeRange(oneDayAgo, now),
        last7Days: this.getCountForTimeRange(sevenDaysAgo, now),
      },
    }
  }

  /**
   * Cleanup old errors
   */
  private cleanup(): void {
    const now = Date.now()
    const cutoff = now - this.ERROR_TTL

    let removedCount = 0
    for (const [fingerprint, error] of this.errors.entries()) {
      if (error.lastOccurrence.getTime() < cutoff) {
        this.errors.delete(fingerprint)
        this.errorsByCategory.get(error.category)?.delete(fingerprint)
        this.errorsBySeverity.get(error.severity)?.delete(fingerprint)
        removedCount++
      }
    }

    // Cleanup timestamps
    this.errorTimestamps = this.errorTimestamps.filter(
      (e) => e.timestamp.getTime() >= cutoff
    )

    if (removedCount > 0) {
      logger.info(`Error tracking cleanup: removed ${removedCount} old errors`)
    }
  }

  /**
   * Evict oldest error when store is full
   */
  private evictOldest(): void {
    let oldest: TrackedError | null = null
    let oldestFingerprint: string | null = null

    for (const [fingerprint, error] of this.errors.entries()) {
      if (!oldest || error.lastOccurrence < oldest.lastOccurrence) {
        oldest = error
        oldestFingerprint = fingerprint
      }
    }

    if (oldestFingerprint && oldest) {
      this.errors.delete(oldestFingerprint)
      this.errorsByCategory.get(oldest.category)?.delete(oldestFingerprint)
      this.errorsBySeverity.get(oldest.severity)?.delete(oldestFingerprint)
    }
  }

  /**
   * Clear all errors (for testing)
   */
  clear(): void {
    this.errors.clear()
    this.errorsByCategory.clear()
    this.errorsBySeverity.clear()
    this.errorTimestamps = []
  }
}

// Singleton error store
const errorStore = new ErrorStore()

/**
 * Error tracking service
 */
export class ErrorTrackingService {
  /**
   * Generate error fingerprint for deduplication
   */
  private static generateFingerprint(
    category: ErrorCategory,
    message: string,
    code?: string,
    statusCode?: number
  ): string {
    // Normalize message to group similar errors
    const normalizedMessage = message
      .replace(/\d+/g, 'N') // Replace numbers with N
      .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, 'UUID') // Replace UUIDs
      .replace(/\/[a-z0-9-]+\//gi, '/ID/') // Replace IDs in paths
      .slice(0, 200) // Limit length

    return `${category}:${code || statusCode || 'unknown'}:${normalizedMessage}`
  }

  /**
   * Classify error into category
   */
  private static classifyError(error: Error, statusCode?: number): ErrorCategory {
    const message = error.message.toLowerCase()
    const name = error.name.toLowerCase()

    if (statusCode === 401 || name.includes('unauthorized') || message.includes('unauthorized')) {
      return ErrorCategory.AUTHENTICATION
    }

    if (statusCode === 403 || name.includes('forbidden') || message.includes('forbidden')) {
      return ErrorCategory.AUTHORIZATION
    }

    if (statusCode === 400 || name.includes('validation') || message.includes('validation')) {
      return ErrorCategory.VALIDATION
    }

    if (statusCode === 404 || name.includes('notfound') || message.includes('not found')) {
      return ErrorCategory.NOT_FOUND
    }

    if (statusCode === 429 || name.includes('ratelimit') || message.includes('rate limit')) {
      return ErrorCategory.RATE_LIMIT
    }

    if (name.includes('database') || message.includes('database') || message.includes('query')) {
      return ErrorCategory.DATABASE
    }

    if (name.includes('payment') || message.includes('payment') || message.includes('transaction')) {
      return ErrorCategory.PAYMENT
    }

    if (
      name.includes('api') ||
      name.includes('fetch') ||
      message.includes('api') ||
      message.includes('request failed')
    ) {
      return ErrorCategory.EXTERNAL_API
    }

    if (statusCode && statusCode >= 500) {
      return ErrorCategory.SYSTEM
    }

    return ErrorCategory.UNKNOWN
  }

  /**
   * Determine error severity
   */
  private static determineSeverity(
    category: ErrorCategory,
    statusCode?: number
  ): ErrorSeverity {
    // Critical severity
    if (category === ErrorCategory.SYSTEM && statusCode && statusCode >= 500) {
      return ErrorSeverity.CRITICAL
    }

    if (category === ErrorCategory.DATABASE) {
      return ErrorSeverity.HIGH
    }

    if (category === ErrorCategory.PAYMENT) {
      return ErrorSeverity.HIGH
    }

    // High severity
    if (category === ErrorCategory.EXTERNAL_API) {
      return ErrorSeverity.HIGH
    }

    // Medium severity
    if (category === ErrorCategory.AUTHORIZATION) {
      return ErrorSeverity.MEDIUM
    }

    if (category === ErrorCategory.AUTHENTICATION) {
      return ErrorSeverity.MEDIUM
    }

    // Low severity
    if (category === ErrorCategory.VALIDATION) {
      return ErrorSeverity.LOW
    }

    if (category === ErrorCategory.NOT_FOUND) {
      return ErrorSeverity.LOW
    }

    if (category === ErrorCategory.RATE_LIMIT) {
      return ErrorSeverity.LOW
    }

    return ErrorSeverity.MEDIUM
  }

  /**
   * Track an error
   */
  static trackError(
    error: Error,
    context?: TrackedError['context'],
    metadata?: Record<string, any>
  ): TrackedError {
    const statusCode = (error as any).statusCode || (error as any).status
    const code = (error as any).code

    const category = this.classifyError(error, statusCode)
    const severity = this.determineSeverity(category, statusCode)
    const fingerprint = this.generateFingerprint(category, error.message, code, statusCode)

    const trackedError = errorStore.add({
      id: fingerprint,
      category,
      severity,
      message: error.message,
      stack: error.stack,
      code,
      statusCode,
      timestamp: new Date(),
      context,
      metadata,
      fingerprint,
    })

    // Log based on severity
    const logData = {
      errorId: trackedError.id,
      category: trackedError.category,
      severity: trackedError.severity,
      message: trackedError.message,
      count: trackedError.count,
      statusCode: trackedError.statusCode,
      code: trackedError.code,
      context: trackedError.context,
      metadata: trackedError.metadata,
    }

    if (severity === ErrorSeverity.CRITICAL) {
      logger.error('Critical error tracked', logData)
    } else if (severity === ErrorSeverity.HIGH) {
      logger.error('High severity error tracked', logData)
    } else if (severity === ErrorSeverity.MEDIUM) {
      logger.warn('Medium severity error tracked', logData)
    } else {
      logger.info('Low severity error tracked', logData)
    }

    // Log to security logger for auth/authz errors
    if (category === ErrorCategory.AUTHENTICATION || category === ErrorCategory.AUTHORIZATION) {
      enhancedLoggers.security({
        event: category,
        severity: severity === ErrorSeverity.CRITICAL ? 'critical' : severity === ErrorSeverity.HIGH ? 'high' : 'medium',
        userId: context?.userId,
        ip: context?.ip,
        userAgent: context?.userAgent,
        action: context?.method,
        resource: context?.url,
        result: 'failure',
        metadata: {
          message: error.message,
          code,
        },
      })
    }

    return trackedError
  }

  /**
   * Get error by fingerprint
   */
  static getError(fingerprint: string): TrackedError | undefined {
    return errorStore.get(fingerprint)
  }

  /**
   * Get errors by category
   */
  static getErrorsByCategory(category: ErrorCategory): TrackedError[] {
    return errorStore.getByCategory(category)
  }

  /**
   * Get errors by severity
   */
  static getErrorsBySeverity(severity: ErrorSeverity): TrackedError[] {
    return errorStore.getBySeverity(severity)
  }

  /**
   * Get all errors
   */
  static getAllErrors(): TrackedError[] {
    return errorStore.getAll()
  }

  /**
   * Get error aggregations
   */
  static getAggregations(): Map<ErrorCategory, ErrorAggregation> {
    return errorStore.getAggregationByCategory()
  }

  /**
   * Get error statistics
   */
  static getStatistics(): ErrorStatistics {
    return errorStore.getStatistics()
  }

  /**
   * Clear all errors (for testing)
   */
  static clearErrors(): void {
    errorStore.clear()
  }

  /**
   * Persist error to database (optional)
   */
  static async persistError(trackedError: TrackedError): Promise<void> {
    try {
      await db.query(
        `
        INSERT INTO error_logs (
          fingerprint, category, severity, message, stack, code, status_code,
          count, first_occurrence, last_occurrence, context, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (fingerprint) DO UPDATE SET
          count = error_logs.count + 1,
          last_occurrence = EXCLUDED.last_occurrence,
          context = COALESCE(EXCLUDED.context, error_logs.context),
          metadata = COALESCE(EXCLUDED.metadata, error_logs.metadata)
        `,
        [
          trackedError.fingerprint,
          trackedError.category,
          trackedError.severity,
          trackedError.message,
          trackedError.stack,
          trackedError.code,
          trackedError.statusCode,
          trackedError.count,
          trackedError.firstOccurrence,
          trackedError.lastOccurrence,
          JSON.stringify(trackedError.context),
          JSON.stringify(trackedError.metadata),
        ]
      )
    } catch (error) {
      // Don't throw - error tracking shouldn't break the app
      logger.error('Failed to persist error to database', { error })
    }
  }
}

export default ErrorTrackingService
