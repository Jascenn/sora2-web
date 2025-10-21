/**
 * Monitoring Types
 *
 * Shared type definitions for the monitoring system
 */

// ============================================================================
// Logger Types
// ============================================================================

export interface LogContext {
  userId?: string
  requestId?: string
  correlationId?: string
  [key: string]: any
}

export interface HttpRequestLog {
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
}

export interface PerformanceLog {
  operation: string
  duration: number
  threshold?: number
  metadata?: Record<string, any>
  tags?: string[]
}

export interface DatabaseQueryLog {
  query: string
  duration: number
  rowCount?: number
  error?: string
  operation?: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'OTHER'
  table?: string
  slow?: boolean
}

export interface ExternalApiLog {
  service: string
  method: string
  url: string
  statusCode?: number
  duration: number
  error?: string
  retryCount?: number
  maxRetries?: number
  requestId?: string
}

export interface SecurityLog {
  event: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  userId?: string
  ip?: string
  userAgent?: string
  action?: string
  resource?: string
  result: 'success' | 'failure' | 'blocked'
  metadata?: Record<string, any>
}

export interface BusinessLog {
  event: string
  category?: string
  userId?: string
  value?: number
  currency?: string
  metadata?: Record<string, any>
}

export interface AuditLog {
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
}

export interface SystemLog {
  event: string
  component: string
  severity: 'info' | 'warn' | 'error' | 'fatal'
  metadata?: Record<string, any>
}

export interface CacheLog {
  operation: 'get' | 'set' | 'delete' | 'clear'
  key: string
  hit?: boolean
  ttl?: number
  size?: number
  duration?: number
}

export interface QueueLog {
  operation: 'enqueue' | 'dequeue' | 'retry' | 'failed'
  queue: string
  jobId?: string
  jobType?: string
  priority?: number
  retryCount?: number
  error?: string
}

export interface PaymentLog {
  event: string
  transactionId: string
  orderId?: string
  userId?: string
  amount: number
  currency: string
  provider: string
  status: string
  metadata?: Record<string, any>
}

export interface ApiKeyLog {
  keyId: string
  userId?: string
  endpoint: string
  ip?: string
  allowed: boolean
  reason?: string
}

export interface RateLimitLog {
  identifier: string
  limit: number
  window: number
  current: number
  exceeded: boolean
  endpoint?: string
}

// ============================================================================
// Performance Monitoring Types
// ============================================================================

export interface PerformanceMetrics {
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
    delta?: MemoryDelta
  }
  cpuUsage: {
    start: NodeJS.CpuUsage
    end?: NodeJS.CpuUsage
    delta?: CpuDelta
  }
}

export interface MemoryDelta {
  rss: number
  heapTotal: number
  heapUsed: number
  external: number
}

export interface CpuDelta {
  user: number
  system: number
}

export interface GlobalMetrics {
  totalRequests: number
  activeRequests: number
  totalErrors: number
  averageResponseTime: number
  requestsPerMinute: number
  memoryUsage: NodeJS.MemoryUsage
  cpuUsage: NodeJS.CpuUsage
  uptime: number
}

export interface SystemMetrics {
  memory: {
    total: number
    free: number
    used: number
    usagePercent: number
  }
  cpu: {
    loadAverage: number[]
    cores: number
  }
  process: {
    memoryUsage: NodeJS.MemoryUsage
    cpuUsage: NodeJS.CpuUsage
    uptime: number
  }
}

export interface PerformanceData {
  global: GlobalMetrics
  system: SystemMetrics
  activeRequests: {
    count: number
    requests: Array<{
      requestId: string
      method: string
      url: string
      duration: number
    }>
  }
}

// ============================================================================
// Health Check Types
// ============================================================================

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  environment: string
  checks: HealthChecks
  metrics?: HealthMetrics
  alerts?: Alert[]
}

export interface HealthChecks {
  database: DatabaseCheck
  redis: RedisCheck
  memory: MemoryCheck
  cpu: CpuCheck
  disk: DiskCheck
  dependencies?: DependencyCheck[]
}

export interface DatabaseCheck {
  status: 'up' | 'down'
  responseTime?: number
  connections?: {
    active: number
    idle: number
    total: number
  }
  error?: string
}

export interface RedisCheck {
  status: 'up' | 'down' | 'n/a'
  responseTime?: number
  memory?: {
    used: number
    peak: number
    fragmentation: number
  }
  connections?: {
    connected: number
    total: number
  }
  error?: string
}

export interface MemoryCheck {
  status: 'healthy' | 'warning' | 'critical'
  process: {
    rss: number
    heapTotal: number
    heapUsed: number
    external: number
    heapUsagePercent: number
  }
  system: {
    total: number
    free: number
    used: number
    usagePercent: number
  }
}

export interface CpuCheck {
  status: 'healthy' | 'warning' | 'critical'
  loadAverage: number[]
  cores: number
  loadPerCore: number
  usage: {
    user: number
    system: number
  }
}

export interface DiskCheck {
  status: 'healthy' | 'warning' | 'critical'
  available: number
  total: number
  used: number
  usagePercent: number
  path: string
}

export interface DependencyCheck {
  name: string
  status: 'up' | 'down' | 'degraded'
  responseTime?: number
  version?: string
  error?: string
}

export interface HealthMetrics {
  performance: {
    totalRequests: number
    activeRequests: number
    requestsPerMinute: number
    averageResponseTime: number
    errorRate: number
  }
  nodejs: {
    version: string
    uptime: number
    pid: number
  }
}

export interface Alert {
  severity: 'info' | 'warning' | 'critical'
  component: string
  message: string
  value?: number
  threshold?: number
}

// ============================================================================
// Error Tracking Types
// ============================================================================

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
  context?: ErrorContext
  metadata?: Record<string, any>
  fingerprint: string
}

export interface ErrorContext {
  userId?: string
  requestId?: string
  correlationId?: string
  url?: string
  method?: string
  ip?: string
  userAgent?: string
  [key: string]: any
}

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

// ============================================================================
// API Response Types
// ============================================================================

export interface MetricsResponse {
  timestamp: string
  metrics: PerformanceData
}

export interface ErrorsListResponse {
  errors: TrackedError[]
  total: number
  returned: number
}

export interface ErrorDetailsResponse {
  error: TrackedError
}

export interface ErrorStatisticsResponse {
  statistics: ErrorStatistics
}

export interface ErrorAggregationsResponse {
  aggregations: Record<ErrorCategory, ErrorAggregation>
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface MonitoringConfig {
  logging: {
    level: string
    directory: string
    maxFileSize: string
    maxFiles: string
    compress: boolean
  }
  performance: {
    thresholds: {
      fast: number
      normal: number
      slow: number
      critical: number
    }
    memory: {
      warning: number
      critical: number
    }
  }
  errorTracking: {
    maxStoredErrors: number
    errorTtl: number
    persistCritical: boolean
  }
  health: {
    checks: string[]
    timeout: number
  }
}

// ============================================================================
// Middleware Types
// ============================================================================

export interface RequestWithContext extends Request {
  requestId?: string
  startTime?: number
  user?: {
    id: string
    email: string
    role: string
  }
}

// ============================================================================
// Utility Types
// ============================================================================

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'http' | 'debug' | 'trace'

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'

export type CheckStatus = 'up' | 'down' | 'n/a' | 'healthy' | 'warning' | 'critical'

export type ResourceStatus = 'healthy' | 'warning' | 'critical'
