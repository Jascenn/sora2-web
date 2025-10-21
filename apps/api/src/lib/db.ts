import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import logger from './logger'
import databaseConfig from '../config/database.config'

// Load .env file
dotenv.config({ path: path.join(__dirname, '../../.env') })

// Performance metrics interface
interface QueryMetrics {
  totalQueries: number
  totalDuration: number
  slowQueryCount: number
}

class Database {
  private pool: Pool
  private metrics: QueryMetrics = {
    totalQueries: 0,
    totalDuration: 0,
    slowQueryCount: 0,
  }
  private readonly SLOW_QUERY_THRESHOLD = 100 // milliseconds
  private poolMonitorInterval?: NodeJS.Timeout

  constructor() {
    const env = process.env.NODE_ENV || 'development'

    logger.info('Initializing database connection', {
      environment: env,
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
      poolConfig: {
        max: databaseConfig.max,
        min: databaseConfig.min,
        idleTimeout: databaseConfig.idleTimeoutMillis,
        connectionTimeout: databaseConfig.connectionTimeoutMillis,
      }
    })

    if (!process.env.DATABASE_URL) {
      logger.error('DATABASE_URL environment variable is not set!')
      throw new Error('DATABASE_URL is required')
    }

    // Use optimized configuration from database.config.ts
    this.pool = new Pool(databaseConfig)

    // Connection event handlers
    this.pool.on('connect', () => {
      logger.info('Database client connected to pool')
    })

    this.pool.on('error', (err) => {
      logger.error('Unexpected database pool error', {
        error: err.message,
        stack: err.stack,
        name: err.name
      })
    })

    this.pool.on('remove', () => {
      logger.info('Database client removed from pool')
    })

    // Start connection pool monitoring
    this.startPoolMonitoring()
  }

  /**
   * Start monitoring connection pool statistics
   * Logs pool metrics every 60 seconds
   */
  private startPoolMonitoring(): void {
    this.poolMonitorInterval = setInterval(() => {
      const avgQueryTime = this.metrics.totalQueries > 0
        ? (this.metrics.totalDuration / this.metrics.totalQueries).toFixed(2)
        : '0'

      logger.info('Connection pool stats', {
        pool: {
          totalConnections: this.pool.totalCount,
          idleConnections: this.pool.idleCount,
          waitingRequests: this.pool.waitingCount,
        },
        metrics: {
          totalQueries: this.metrics.totalQueries,
          averageQueryTime: `${avgQueryTime}ms`,
          slowQueryCount: this.metrics.slowQueryCount,
          slowQueryPercentage: this.metrics.totalQueries > 0
            ? `${((this.metrics.slowQueryCount / this.metrics.totalQueries) * 100).toFixed(2)}%`
            : '0%'
        }
      })
    }, 60000) // Every 60 seconds
  }

  /**
   * Execute a database query with performance monitoring
   *
   * Performance notes:
   * - Consider caching results for frequently accessed, rarely changing data
   * - Add indexes for columns used in WHERE, JOIN, ORDER BY clauses
   * - Use EXPLAIN ANALYZE to identify slow queries
   */
  async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now()
    const queryId = `q${Date.now()}${Math.random().toString(36).substr(2, 9)}`

    try {
      const res = await this.pool.query<T>(text, params)
      const duration = Date.now() - start

      // Update metrics
      this.metrics.totalQueries++
      this.metrics.totalDuration += duration

      // Check for slow query
      if (duration >= this.SLOW_QUERY_THRESHOLD) {
        this.metrics.slowQueryCount++
        logger.warn('Slow query detected', {
          queryId,
          duration: `${duration}ms`,
          threshold: `${this.SLOW_QUERY_THRESHOLD}ms`,
          query: text,
          params: params || [],
          rowCount: res.rowCount,
          command: res.command,
          // Performance hints
          hint: 'Consider adding indexes or optimizing query structure'
        })
      } else {
        logger.info('Query executed', {
          queryId,
          duration: `${duration}ms`,
          query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          rowCount: res.rowCount,
          command: res.command
        })
      }

      return res
    } catch (error) {
      const duration = Date.now() - start
      const err = error as Error

      logger.error('Query execution failed', {
        queryId,
        duration: `${duration}ms`,
        query: text,
        params: params || [],
        error: err.message,
        stack: err.stack,
        name: err.name,
        // Additional context for debugging
        poolStats: {
          totalConnections: this.pool.totalCount,
          idleConnections: this.pool.idleCount,
          waitingRequests: this.pool.waitingCount
        }
      })

      throw error
    }
  }

  /**
   * Get a client from the connection pool
   * Use this for transactions or multiple related queries
   *
   * Important: Always release the client when done!
   */
  async getClient(): Promise<PoolClient> {
    const start = Date.now()
    try {
      const client = await this.pool.connect()
      const duration = Date.now() - start

      logger.info('Client acquired from pool', {
        duration: `${duration}ms`,
        poolStats: {
          totalConnections: this.pool.totalCount,
          idleConnections: this.pool.idleCount,
          waitingRequests: this.pool.waitingCount
        }
      })

      return client
    } catch (error) {
      const duration = Date.now() - start
      const err = error as Error

      logger.error('Failed to acquire client from pool', {
        duration: `${duration}ms`,
        error: err.message,
        stack: err.stack,
        poolStats: {
          totalConnections: this.pool.totalCount,
          idleConnections: this.pool.idleCount,
          waitingRequests: this.pool.waitingCount
        }
      })

      throw error
    }
  }

  /**
   * Execute a transaction with automatic rollback on error
   *
   * Performance notes:
   * - Keep transactions as short as possible to avoid locking
   * - Consider using READ COMMITTED isolation level for better concurrency
   * - Batch related operations within a single transaction
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const transactionId = `tx${Date.now()}${Math.random().toString(36).substr(2, 9)}`
    const client = await this.pool.connect()
    const start = Date.now()

    try {
      await client.query('BEGIN')
      logger.info('Transaction started', { transactionId })

      const result = await callback(client)

      await client.query('COMMIT')
      const duration = Date.now() - start

      logger.info('Transaction committed', {
        transactionId,
        duration: `${duration}ms`
      })

      return result
    } catch (error) {
      await client.query('ROLLBACK')
      const duration = Date.now() - start
      const err = error as Error

      logger.error('Transaction rolled back', {
        transactionId,
        duration: `${duration}ms`,
        error: err.message,
        stack: err.stack,
        name: err.name,
        // Additional context for debugging
        reason: 'Error occurred during transaction execution'
      })

      throw error
    } finally {
      client.release()
      logger.info('Transaction client released', { transactionId })
    }
  }

  /**
   * Close all database connections
   * Call this when shutting down the application
   */
  async close(): Promise<void> {
    // Stop pool monitoring
    if (this.poolMonitorInterval) {
      clearInterval(this.poolMonitorInterval)
      this.poolMonitorInterval = undefined
    }

    logger.info('Closing database connection pool', {
      finalMetrics: {
        totalQueries: this.metrics.totalQueries,
        totalDuration: `${this.metrics.totalDuration}ms`,
        averageQueryTime: this.metrics.totalQueries > 0
          ? `${(this.metrics.totalDuration / this.metrics.totalQueries).toFixed(2)}ms`
          : '0ms',
        slowQueryCount: this.metrics.slowQueryCount
      }
    })

    await this.pool.end()
    logger.info('Database connection pool closed')
  }
}

export const db = new Database()
