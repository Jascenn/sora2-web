import { Request, Response } from 'express'
import { db } from '../lib/db'
import logger, { enhancedLoggers } from '../lib/logger-enhanced'
import Redis from 'ioredis'
import os from 'os'
import { promises as fs } from 'fs'
import path from 'path'
import { getPerformanceMetrics } from '../middleware/performance.middleware'

// Enhanced health check response interface
interface EnhancedHealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  environment: string
  checks: {
    database: DatabaseCheck
    redis: RedisCheck
    memory: MemoryCheck
    cpu: CpuCheck
    disk: DiskCheck
    dependencies: DependencyCheck[]
  }
  metrics: SystemMetrics
  alerts: Alert[]
}

interface DatabaseCheck {
  status: 'up' | 'down'
  responseTime?: number
  connections?: {
    active: number
    idle: number
    total: number
  }
  error?: string
}

interface RedisCheck {
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

interface MemoryCheck {
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

interface CpuCheck {
  status: 'healthy' | 'warning' | 'critical'
  loadAverage: number[]
  cores: number
  loadPerCore: number
  usage: {
    user: number
    system: number
  }
}

interface DiskCheck {
  status: 'healthy' | 'warning' | 'critical'
  available: number
  total: number
  used: number
  usagePercent: number
  path: string
}

interface DependencyCheck {
  name: string
  status: 'up' | 'down' | 'degraded'
  responseTime?: number
  version?: string
  error?: string
}

interface SystemMetrics {
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

interface Alert {
  severity: 'info' | 'warning' | 'critical'
  component: string
  message: string
  value?: number
  threshold?: number
}

// Cache Redis client to avoid creating multiple connections
let redisClient: Redis | null = null
let redisError: string | null = null

/**
 * Initialize Redis client if REDIS_URL is configured
 */
function getRedisClient(): Redis | null {
  if (redisClient) return redisClient

  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) return null

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
      enableReadyCheck: true,
    })

    redisClient.on('error', (err) => {
      redisError = err.message
    })

    return redisClient
  } catch (error: any) {
    redisError = error.message
    return null
  }
}

/**
 * Check database connectivity with detailed information
 */
async function checkDatabase(): Promise<DatabaseCheck> {
  const start = Date.now()
  try {
    // Basic connectivity check
    await db.query('SELECT 1')
    const responseTime = Date.now() - start

    // Get connection pool statistics
    let connections = { active: 0, idle: 0, total: 0 }
    try {
      const poolStats = await db.query(`
        SELECT
          count(*) FILTER (WHERE state = 'active') as active,
          count(*) FILTER (WHERE state = 'idle') as idle,
          count(*) as total
        FROM pg_stat_activity
        WHERE datname = current_database()
      `)
      if (poolStats.rows[0]) {
        connections = {
          active: parseInt(poolStats.rows[0].active),
          idle: parseInt(poolStats.rows[0].idle),
          total: parseInt(poolStats.rows[0].total),
        }
      }
    } catch (e) {
      // Connection stats are optional
    }

    return { status: 'up', responseTime, connections }
  } catch (error: any) {
    const responseTime = Date.now() - start
    logger.error('Health check: Database connection failed', { error: error.message })
    return { status: 'down', responseTime, error: error.message }
  }
}

/**
 * Check Redis connectivity with detailed information
 */
async function checkRedis(): Promise<RedisCheck> {
  const client = getRedisClient()

  if (!client) {
    return { status: 'n/a' }
  }

  const start = Date.now()
  try {
    // Ping check
    await client.ping()
    const responseTime = Date.now() - start

    // Get Redis info
    const info = await client.info('memory')
    const memoryInfo = parseRedisInfo(info)

    const statsInfo = await client.info('stats')
    const statsData = parseRedisInfo(statsInfo)

    return {
      status: 'up',
      responseTime,
      memory: {
        used: parseInt(memoryInfo.used_memory || '0'),
        peak: parseInt(memoryInfo.used_memory_peak || '0'),
        fragmentation: parseFloat(memoryInfo.mem_fragmentation_ratio || '1'),
      },
      connections: {
        connected: parseInt(statsData.connected_clients || '0'),
        total: parseInt(statsData.total_connections_received || '0'),
      },
    }
  } catch (error: any) {
    const responseTime = Date.now() - start
    const errorMsg = redisError || error.message
    logger.warn('Health check: Redis connection failed', { error: errorMsg })
    return { status: 'down', responseTime, error: errorMsg }
  }
}

/**
 * Parse Redis INFO output into key-value pairs
 */
function parseRedisInfo(info: string): Record<string, string> {
  const result: Record<string, string> = {}
  const lines = info.split('\r\n')
  for (const line of lines) {
    if (line && !line.startsWith('#')) {
      const [key, value] = line.split(':')
      if (key && value) {
        result[key] = value
      }
    }
  }
  return result
}

/**
 * Check memory usage with thresholds
 */
function checkMemory(): MemoryCheck {
  const processMemory = process.memoryUsage()
  const totalMemory = os.totalmem()
  const freeMemory = os.freemem()
  const usedMemory = totalMemory - freeMemory

  const heapUsagePercent = (processMemory.heapUsed / processMemory.heapTotal) * 100
  const systemUsagePercent = (usedMemory / totalMemory) * 100

  let status: 'healthy' | 'warning' | 'critical' = 'healthy'
  if (heapUsagePercent > 90 || systemUsagePercent > 90) {
    status = 'critical'
  } else if (heapUsagePercent > 80 || systemUsagePercent > 80) {
    status = 'warning'
  }

  return {
    status,
    process: {
      rss: Math.round(processMemory.rss / 1024 / 1024), // MB
      heapTotal: Math.round(processMemory.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(processMemory.heapUsed / 1024 / 1024), // MB
      external: Math.round(processMemory.external / 1024 / 1024), // MB
      heapUsagePercent: Math.round(heapUsagePercent),
    },
    system: {
      total: Math.round(totalMemory / 1024 / 1024), // MB
      free: Math.round(freeMemory / 1024 / 1024), // MB
      used: Math.round(usedMemory / 1024 / 1024), // MB
      usagePercent: Math.round(systemUsagePercent),
    },
  }
}

/**
 * Check CPU usage with thresholds
 */
function checkCpu(): CpuCheck {
  const loadAverage = os.loadavg()
  const cores = os.cpus().length
  const loadPerCore = loadAverage[0] / cores
  const cpuUsage = process.cpuUsage()

  let status: 'healthy' | 'warning' | 'critical' = 'healthy'
  if (loadPerCore > 0.9) {
    status = 'critical'
  } else if (loadPerCore > 0.7) {
    status = 'warning'
  }

  return {
    status,
    loadAverage,
    cores,
    loadPerCore: Math.round(loadPerCore * 100) / 100,
    usage: {
      user: Math.round(cpuUsage.user / 1000), // Convert to milliseconds
      system: Math.round(cpuUsage.system / 1000),
    },
  }
}

/**
 * Check disk space with thresholds
 */
async function checkDisk(): Promise<DiskCheck> {
  try {
    const diskPath = process.cwd()
    const stats = await fs.statfs(diskPath)

    const total = (stats.blocks * stats.bsize) / 1024 / 1024 / 1024 // GB
    const available = (stats.bavail * stats.bsize) / 1024 / 1024 / 1024 // GB
    const used = total - available
    const usagePercent = (used / total) * 100

    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    if (available < 1 || usagePercent > 95) {
      status = 'critical'
    } else if (available < 5 || usagePercent > 85) {
      status = 'warning'
    }

    return {
      status,
      available: Math.round(available * 100) / 100,
      total: Math.round(total * 100) / 100,
      used: Math.round(used * 100) / 100,
      usagePercent: Math.round(usagePercent),
      path: diskPath,
    }
  } catch (error: any) {
    logger.warn('Health check: Could not determine disk space', { error: error.message })
    return {
      status: 'warning',
      available: 0,
      total: 0,
      used: 0,
      usagePercent: 0,
      path: process.cwd(),
    }
  }
}

/**
 * Check external dependencies
 */
async function checkDependencies(): Promise<DependencyCheck[]> {
  const dependencies: DependencyCheck[] = []

  // Add more dependency checks as needed
  // Example: External API checks, Queue service checks, etc.

  return dependencies
}

/**
 * Get application version from package.json
 */
function getVersion(): string {
  try {
    const packageJson = require('../../package.json')
    return packageJson.version || '1.0.0'
  } catch (error) {
    return '1.0.0'
  }
}

/**
 * Collect system metrics
 */
function getSystemMetrics(): SystemMetrics {
  const perfMetrics = getPerformanceMetrics()
  const globalMetrics = perfMetrics.global

  const errorRate = globalMetrics.totalRequests > 0
    ? (globalMetrics.totalErrors / globalMetrics.totalRequests) * 100
    : 0

  return {
    performance: {
      totalRequests: globalMetrics.totalRequests,
      activeRequests: globalMetrics.activeRequests,
      requestsPerMinute: globalMetrics.requestsPerMinute,
      averageResponseTime: Math.round(globalMetrics.averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
    },
    nodejs: {
      version: process.version,
      uptime: Math.round(process.uptime()),
      pid: process.pid,
    },
  }
}

/**
 * Generate alerts based on checks
 */
function generateAlerts(checks: EnhancedHealthCheckResponse['checks']): Alert[] {
  const alerts: Alert[] = []

  // Database alerts
  if (checks.database.status === 'down') {
    alerts.push({
      severity: 'critical',
      component: 'database',
      message: 'Database is down',
    })
  } else if (checks.database.responseTime && checks.database.responseTime > 1000) {
    alerts.push({
      severity: 'warning',
      component: 'database',
      message: 'Database response time is slow',
      value: checks.database.responseTime,
      threshold: 1000,
    })
  }

  // Redis alerts
  if (checks.redis.status === 'down') {
    alerts.push({
      severity: 'warning',
      component: 'redis',
      message: 'Redis is down',
    })
  }

  // Memory alerts
  if (checks.memory.status === 'critical') {
    alerts.push({
      severity: 'critical',
      component: 'memory',
      message: 'Memory usage is critical',
      value: checks.memory.system.usagePercent,
      threshold: 90,
    })
  } else if (checks.memory.status === 'warning') {
    alerts.push({
      severity: 'warning',
      component: 'memory',
      message: 'Memory usage is elevated',
      value: checks.memory.system.usagePercent,
      threshold: 80,
    })
  }

  // CPU alerts
  if (checks.cpu.status === 'critical') {
    alerts.push({
      severity: 'critical',
      component: 'cpu',
      message: 'CPU load is critical',
      value: checks.cpu.loadPerCore,
      threshold: 0.9,
    })
  } else if (checks.cpu.status === 'warning') {
    alerts.push({
      severity: 'warning',
      component: 'cpu',
      message: 'CPU load is elevated',
      value: checks.cpu.loadPerCore,
      threshold: 0.7,
    })
  }

  // Disk alerts
  if (checks.disk.status === 'critical') {
    alerts.push({
      severity: 'critical',
      component: 'disk',
      message: 'Disk space is critically low',
      value: checks.disk.available,
      threshold: 1,
    })
  } else if (checks.disk.status === 'warning') {
    alerts.push({
      severity: 'warning',
      component: 'disk',
      message: 'Disk space is running low',
      value: checks.disk.available,
      threshold: 5,
    })
  }

  // Dependency alerts
  checks.dependencies.forEach((dep) => {
    if (dep.status === 'down') {
      alerts.push({
        severity: 'critical',
        component: dep.name,
        message: `Dependency ${dep.name} is down`,
      })
    } else if (dep.status === 'degraded') {
      alerts.push({
        severity: 'warning',
        component: dep.name,
        message: `Dependency ${dep.name} is degraded`,
      })
    }
  })

  return alerts
}

/**
 * Determine overall health status
 */
function determineHealthStatus(
  checks: EnhancedHealthCheckResponse['checks'],
  alerts: Alert[]
): 'healthy' | 'degraded' | 'unhealthy' {
  // Critical alerts mean unhealthy
  if (alerts.some((alert) => alert.severity === 'critical')) {
    return 'unhealthy'
  }

  // Database is critical - if down, system is unhealthy
  if (checks.database.status === 'down') {
    return 'unhealthy'
  }

  // Warning alerts or degraded dependencies mean degraded
  if (alerts.some((alert) => alert.severity === 'warning')) {
    return 'degraded'
  }

  // Any non-healthy component means degraded
  if (
    checks.memory.status !== 'healthy' ||
    checks.cpu.status !== 'healthy' ||
    checks.disk.status !== 'healthy' ||
    checks.redis.status === 'down'
  ) {
    return 'degraded'
  }

  return 'healthy'
}

/**
 * Enhanced health check endpoint handler
 */
export async function enhancedHealthCheck(req: Request, res: Response): Promise<void> {
  const startTime = Date.now()

  try {
    // Run all checks in parallel for better performance
    const [databaseCheck, redisCheck, diskCheck, dependenciesCheck] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkDisk(),
      checkDependencies(),
    ])

    const memoryCheck = checkMemory()
    const cpuCheck = checkCpu()

    const checks: EnhancedHealthCheckResponse['checks'] = {
      database: databaseCheck,
      redis: redisCheck,
      memory: memoryCheck,
      cpu: cpuCheck,
      disk: diskCheck,
      dependencies: dependenciesCheck,
    }

    const metrics = getSystemMetrics()
    const alerts = generateAlerts(checks)
    const status = determineHealthStatus(checks, alerts)

    const response: EnhancedHealthCheckResponse = {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      version: getVersion(),
      environment: process.env.NODE_ENV || 'development',
      checks,
      metrics,
      alerts,
    }

    const responseTime = Date.now() - startTime

    // Log health check results
    if (status !== 'healthy' || responseTime > 500) {
      enhancedLoggers.system({
        event: 'health_check',
        component: 'health_controller',
        severity: status === 'unhealthy' ? 'error' : status === 'degraded' ? 'warn' : 'info',
        metadata: {
          status,
          responseTime,
          alerts: alerts.length,
          criticalAlerts: alerts.filter((a) => a.severity === 'critical').length,
        },
      })
    }

    // Return appropriate HTTP status code based on health
    const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503

    res.status(httpStatus).json(response)
  } catch (error: any) {
    logger.error('Health check failed', { error: error.message, stack: error.stack })

    // Return a minimal response if the health check itself fails
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      version: getVersion(),
      environment: process.env.NODE_ENV || 'development',
      error: 'Health check failed',
      checks: {
        database: { status: 'down', error: 'Health check error' },
        redis: { status: 'n/a' },
        memory: checkMemory(),
        cpu: checkCpu(),
        disk: { status: 'warning', available: 0, total: 0, used: 0, usagePercent: 0, path: process.cwd() },
        dependencies: [],
      },
      metrics: getSystemMetrics(),
      alerts: [
        {
          severity: 'critical',
          component: 'health_check',
          message: 'Health check failed to execute',
        },
      ],
    })
  }
}

/**
 * Simple liveness probe endpoint
 */
export function livenessProbe(req: Request, res: Response): void {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  })
}

/**
 * Simple readiness probe endpoint
 */
export async function readinessProbe(req: Request, res: Response): Promise<void> {
  try {
    // Check only critical dependencies
    await db.query('SELECT 1')
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
    })
  }
}
