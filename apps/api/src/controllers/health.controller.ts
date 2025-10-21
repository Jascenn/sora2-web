import { Request, Response } from 'express'
import { db } from '../lib/db'
import logger from '../lib/logger'
import Redis from 'ioredis'
import os from 'os'
import { promises as fs } from 'fs'
import path from 'path'

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  environment: string
  checks: {
    database: {
      status: 'up' | 'down'
      responseTime?: number
      error?: string
    }
    redis: {
      status: 'up' | 'down' | 'n/a'
      responseTime?: number
      error?: string
    }
    memory: {
      used: number
      total: number
      percentage: number
    }
    disk: {
      available: number
    }
  }
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
      connectTimeout: 1000,
      lazyConnect: true,
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
 * Check database connectivity
 */
async function checkDatabase(): Promise<{ status: 'up' | 'down'; responseTime?: number; error?: string }> {
  const start = Date.now()
  try {
    await db.query('SELECT 1')
    const responseTime = Date.now() - start
    return { status: 'up', responseTime }
  } catch (error: any) {
    const responseTime = Date.now() - start
    logger.error('Health check: Database connection failed', { error: error.message })
    return { status: 'down', responseTime, error: error.message }
  }
}

/**
 * Check Redis connectivity
 */
async function checkRedis(): Promise<{ status: 'up' | 'down' | 'n/a'; responseTime?: number; error?: string }> {
  const client = getRedisClient()

  if (!client) {
    return { status: 'n/a' }
  }

  const start = Date.now()
  try {
    await client.ping()
    const responseTime = Date.now() - start
    return { status: 'up', responseTime }
  } catch (error: any) {
    const responseTime = Date.now() - start
    const errorMsg = redisError || error.message
    logger.warn('Health check: Redis connection failed', { error: errorMsg })
    return { status: 'down', responseTime, error: errorMsg }
  }
}

/**
 * Check memory usage
 */
function checkMemory(): { used: number; total: number; percentage: number } {
  const memUsage = process.memoryUsage()
  const totalMemory = os.totalmem()
  const freeMemory = os.freemem()
  const usedMemory = totalMemory - freeMemory

  // Convert to MB
  const usedMB = Math.round(usedMemory / 1024 / 1024)
  const totalMB = Math.round(totalMemory / 1024 / 1024)
  const percentage = Math.round((usedMemory / totalMemory) * 100)

  return {
    used: usedMB,
    total: totalMB,
    percentage,
  }
}

/**
 * Check disk space
 */
async function checkDisk(): Promise<{ available: number }> {
  try {
    // Get the disk space for the current working directory
    const stats = await fs.statfs(process.cwd())

    // Calculate available space in GB
    const availableGB = Math.round((stats.bavail * stats.bsize) / 1024 / 1024 / 1024)

    return { available: availableGB }
  } catch (error: any) {
    logger.warn('Health check: Could not determine disk space', { error: error.message })
    return { available: 0 }
  }
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
 * Determine overall health status
 */
function determineHealthStatus(checks: HealthCheckResponse['checks']): 'healthy' | 'degraded' | 'unhealthy' {
  // Database is critical - if down, system is unhealthy
  if (checks.database.status === 'down') {
    return 'unhealthy'
  }

  // Redis is optional - if down, system is degraded (not unhealthy)
  if (checks.redis.status === 'down') {
    return 'degraded'
  }

  // Check memory usage - if above 90%, system is degraded
  if (checks.memory.percentage > 90) {
    return 'degraded'
  }

  // Check disk space - if less than 1GB, system is degraded
  if (checks.disk.available < 1) {
    return 'degraded'
  }

  return 'healthy'
}

/**
 * Health check endpoint handler
 */
export async function healthCheck(req: Request, res: Response): Promise<void> {
  const startTime = Date.now()

  try {
    // Run all checks in parallel for better performance
    const [databaseCheck, redisCheck, memoryCheck, diskCheck] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkMemory(),
      Promise.resolve(checkDisk()), // Wrap sync function
    ])

    const diskResult = await diskCheck

    const checks: HealthCheckResponse['checks'] = {
      database: databaseCheck,
      redis: redisCheck,
      memory: memoryCheck,
      disk: diskResult,
    }

    const status = determineHealthStatus(checks)

    const response: HealthCheckResponse = {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      version: getVersion(),
      environment: process.env.NODE_ENV || 'development',
      checks,
    }

    const responseTime = Date.now() - startTime

    // Log if health check is not healthy or took too long
    if (status !== 'healthy' || responseTime > 500) {
      logger.warn('Health check completed', {
        status,
        responseTime,
        checks,
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
        disk: { available: 0 },
      },
    })
  }
}
