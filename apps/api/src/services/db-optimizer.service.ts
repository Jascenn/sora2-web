/**
 * Database Query Optimizer Service
 *
 * This service provides advanced database optimization features:
 * - Query result caching with Redis integration
 * - Connection pool monitoring and optimization
 * - Query performance analysis and logging
 * - Batch query execution
 * - Prepared statement caching
 */

import { db } from '../lib/db'
import { cacheService, CacheTTL } from './cache.service'
import logger from '../lib/logger'
import { QueryResult, QueryResultRow } from 'pg'

/**
 * Cache configuration for different query types
 */
export const QueryCacheConfig = {
  // User queries - cached for 5 minutes
  user: {
    ttl: CacheTTL.USER_DATA,
    prefix: 'db:user:',
  },
  // User balance - cached for 1 minute (changes frequently)
  userBalance: {
    ttl: CacheTTL.USER_BALANCE,
    prefix: 'db:balance:',
  },
  // Video list - cached for 3 minutes
  videoList: {
    ttl: CacheTTL.VIDEO_LIST,
    prefix: 'db:videos:',
  },
  // Video detail - cached for 5 minutes
  videoDetail: {
    ttl: CacheTTL.VIDEO_DETAIL,
    prefix: 'db:video:',
  },
  // Order list - cached for 2 minutes
  orderList: {
    ttl: CacheTTL.API_RESPONSE,
    prefix: 'db:orders:',
  },
  // Transaction list - cached for 3 minutes
  transactionList: {
    ttl: 180,
    prefix: 'db:transactions:',
  },
  // Template list - cached for 10 minutes (rarely changes)
  templateList: {
    ttl: 600,
    prefix: 'db:templates:',
  },
  // Statistics - cached for 5 minutes
  statistics: {
    ttl: 300,
    prefix: 'db:stats:',
  },
}

/**
 * Database Optimizer Service
 */
export class DbOptimizerService {
  /**
   * Execute a query with automatic caching
   *
   * @param cacheKey - Unique cache key for this query
   * @param queryFn - Function that executes the database query
   * @param ttl - Time to live in seconds (default: 300)
   * @param skipCache - Force skip cache and fetch from DB
   */
  async cachedQuery<T = any>(
    cacheKey: string,
    queryFn: () => Promise<T>,
    ttl: number = 300,
    skipCache: boolean = false
  ): Promise<T> {
    // Try to get from cache first
    if (!skipCache) {
      const cached = await cacheService.get<T>(cacheKey)
      if (cached !== null) {
        logger.info('Cache hit for query', { cacheKey })
        return cached
      }
    }

    // Cache miss - execute query
    logger.info('Cache miss for query', { cacheKey })
    const start = Date.now()

    try {
      const result = await queryFn()
      const duration = Date.now() - start

      logger.info('Query executed', {
        cacheKey,
        duration: `${duration}ms`,
      })

      // Store in cache
      await cacheService.set(cacheKey, result, ttl)

      return result
    } catch (error) {
      logger.error('Cached query failed', {
        cacheKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  /**
   * Invalidate cache for a specific key or pattern
   *
   * @param keyOrPattern - Cache key or pattern (e.g., 'db:user:*')
   */
  async invalidateCache(keyOrPattern: string): Promise<void> {
    if (keyOrPattern.includes('*')) {
      const deleted = await cacheService.deletePattern(keyOrPattern)
      logger.info('Cache invalidated by pattern', {
        pattern: keyOrPattern,
        deleted,
      })
    } else {
      await cacheService.delete(keyOrPattern)
      logger.info('Cache invalidated', { key: keyOrPattern })
    }
  }

  /**
   * Invalidate all cached queries for a user
   *
   * @param userId - User ID
   */
  async invalidateUserCache(userId: string): Promise<void> {
    await Promise.all([
      this.invalidateCache(`${QueryCacheConfig.user.prefix}${userId}*`),
      this.invalidateCache(`${QueryCacheConfig.userBalance.prefix}${userId}*`),
      this.invalidateCache(`${QueryCacheConfig.videoList.prefix}${userId}*`),
      this.invalidateCache(`${QueryCacheConfig.orderList.prefix}${userId}*`),
      this.invalidateCache(`${QueryCacheConfig.transactionList.prefix}${userId}*`),
    ])

    logger.info('User cache invalidated', { userId })
  }

  /**
   * Execute multiple queries in parallel
   * Useful for dashboard/analytics queries
   *
   * @param queries - Array of query functions
   */
  async batchQuery<T = any>(
    queries: Array<() => Promise<T>>
  ): Promise<T[]> {
    const start = Date.now()

    try {
      const results = await Promise.all(queries.map(q => q()))
      const duration = Date.now() - start

      logger.info('Batch query completed', {
        count: queries.length,
        duration: `${duration}ms`,
        averagePerQuery: `${(duration / queries.length).toFixed(2)}ms`,
      })

      return results
    } catch (error) {
      logger.error('Batch query failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  /**
   * Execute a paginated query with cursor-based pagination
   * More efficient than OFFSET-based pagination for large datasets
   *
   * @param tableName - Table name
   * @param cursorColumn - Column to use as cursor (usually 'id' or 'created_at')
   * @param cursor - Last cursor value from previous page
   * @param limit - Number of records per page
   * @param orderDirection - 'ASC' or 'DESC'
   * @param whereClause - Additional WHERE conditions
   */
  async cursorPaginatedQuery<T extends QueryResultRow = any>(
    tableName: string,
    cursorColumn: string,
    cursor: string | null,
    limit: number,
    orderDirection: 'ASC' | 'DESC' = 'DESC',
    whereClause: string = '',
    params: any[] = []
  ): Promise<{ data: T[]; nextCursor: string | null }> {
    const operator = orderDirection === 'DESC' ? '<' : '>'
    const cursorCondition = cursor
      ? `AND ${cursorColumn} ${operator} $${params.length + 1}`
      : ''

    const query = `
      SELECT *
      FROM ${tableName}
      WHERE 1=1
        ${whereClause}
        ${cursorCondition}
      ORDER BY ${cursorColumn} ${orderDirection}
      LIMIT $${params.length + (cursor ? 2 : 1)}
    `

    const queryParams = cursor ? [...params, cursor, limit] : [...params, limit]

    const result = await db.query<T>(query, queryParams)

    const nextCursor =
      result.rows.length === limit
        ? result.rows[result.rows.length - 1][cursorColumn]
        : null

    return {
      data: result.rows,
      nextCursor,
    }
  }

  /**
   * Bulk insert with conflict handling
   * More efficient than individual inserts
   *
   * @param tableName - Table name
   * @param columns - Column names
   * @param values - Array of value arrays
   * @param conflictColumn - Column for ON CONFLICT clause
   * @param updateColumns - Columns to update on conflict
   */
  async bulkInsert<T extends QueryResultRow = any>(
    tableName: string,
    columns: string[],
    values: any[][],
    conflictColumn?: string,
    updateColumns?: string[]
  ): Promise<QueryResult<T>> {
    if (values.length === 0) {
      throw new Error('No values provided for bulk insert')
    }

    // Build value placeholders
    const valuePlaceholders = values
      .map(
        (_, rowIndex) =>
          `(${columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')})`
      )
      .join(', ')

    // Build conflict clause
    const conflictClause = conflictColumn
      ? updateColumns && updateColumns.length > 0
        ? `ON CONFLICT (${conflictColumn}) DO UPDATE SET ${updateColumns.map(col => `${col} = EXCLUDED.${col}`).join(', ')}`
        : `ON CONFLICT (${conflictColumn}) DO NOTHING`
      : ''

    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES ${valuePlaceholders}
      ${conflictClause}
      RETURNING *
    `

    // Flatten values array
    const flatValues = values.flat()

    const start = Date.now()
    const result = await db.query<T>(query, flatValues)
    const duration = Date.now() - start

    logger.info('Bulk insert completed', {
      tableName,
      rowCount: values.length,
      duration: `${duration}ms`,
      averagePerRow: `${(duration / values.length).toFixed(2)}ms`,
    })

    return result
  }

  /**
   * Get query performance statistics
   * Useful for identifying slow queries and optimization opportunities
   */
  async getQueryStats(): Promise<{
    slowestQueries: any[]
    mostFrequentQueries: any[]
    indexUsage: any[]
  }> {
    const [slowestQueries, mostFrequentQueries, indexUsage] = await Promise.all([
      // Top 10 slowest queries
      db.query(`
        SELECT
          query,
          calls,
          total_time,
          mean_time,
          max_time,
          min_time
        FROM pg_stat_statements
        ORDER BY mean_time DESC
        LIMIT 10
      `).catch(() => ({ rows: [] })),

      // Top 10 most frequently executed queries
      db.query(`
        SELECT
          query,
          calls,
          total_time,
          mean_time
        FROM pg_stat_statements
        ORDER BY calls DESC
        LIMIT 10
      `).catch(() => ({ rows: [] })),

      // Index usage statistics
      db.query(`
        SELECT
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC
        LIMIT 20
      `).catch(() => ({ rows: [] })),
    ])

    return {
      slowestQueries: slowestQueries.rows,
      mostFrequentQueries: mostFrequentQueries.rows,
      indexUsage: indexUsage.rows,
    }
  }

  /**
   * Get database performance metrics
   */
  async getDatabaseMetrics(): Promise<{
    connectionStats: any
    tableStats: any[]
    cacheHitRatio: number
  }> {
    const [connectionStats, tableStats, cacheStats] = await Promise.all([
      // Connection pool statistics
      db.query(`
        SELECT
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections,
          count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
        FROM pg_stat_activity
        WHERE datname = current_database()
      `),

      // Table statistics
      db.query(`
        SELECT
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
      `),

      // Cache hit ratio
      db.query(`
        SELECT
          sum(heap_blks_read) as heap_read,
          sum(heap_blks_hit) as heap_hit,
          sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) as ratio
        FROM pg_statio_user_tables
      `),
    ])

    return {
      connectionStats: connectionStats.rows[0],
      tableStats: tableStats.rows,
      cacheHitRatio: parseFloat(cacheStats.rows[0]?.ratio || '0'),
    }
  }

  /**
   * Analyze query plan for optimization
   *
   * @param query - SQL query to analyze
   * @param params - Query parameters
   */
  async explainQuery(
    query: string,
    params: any[] = []
  ): Promise<{ plan: any[]; analysis: string }> {
    const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`

    const result = await db.query(explainQuery, params)
    const plan = result.rows[0]['QUERY PLAN']

    // Extract key metrics
    const executionTime = plan[0]['Execution Time']
    const planningTime = plan[0]['Planning Time']
    const totalTime = executionTime + planningTime

    const analysis = `
Query Analysis:
- Planning Time: ${planningTime.toFixed(2)}ms
- Execution Time: ${executionTime.toFixed(2)}ms
- Total Time: ${totalTime.toFixed(2)}ms

Performance Tips:
${totalTime > 100 ? '⚠️  SLOW QUERY - Consider optimization' : '✓ Query performance is acceptable'}
${plan[0].Plan['Node Type'] === 'Seq Scan' ? '⚠️  Sequential scan detected - consider adding indexes' : ''}
${plan[0].Plan.Rows > 10000 ? '⚠️  Large result set - consider pagination' : ''}
    `.trim()

    return {
      plan,
      analysis,
    }
  }

  /**
   * Warmup cache with commonly accessed data
   * Call this on application startup
   */
  async warmupCache(): Promise<void> {
    logger.info('Starting cache warmup...')

    try {
      // Add warmup logic here based on your application needs
      // Example: Pre-cache public templates, pricing configs, etc.

      logger.info('Cache warmup completed')
    } catch (error) {
      logger.error('Cache warmup failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Health check for database and cache
   */
  async healthCheck(): Promise<{
    database: { status: string; responseTime: number }
    cache: { status: string; stats: any }
  }> {
    // Database health check
    const dbStart = Date.now()
    let dbStatus = 'healthy'
    let dbResponseTime = 0

    try {
      await db.query('SELECT 1')
      dbResponseTime = Date.now() - dbStart
    } catch (error) {
      dbStatus = 'unhealthy'
      logger.error('Database health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    // Cache health check
    let cacheStatus = 'healthy'
    let cacheStats = {}

    try {
      cacheStats = await cacheService.getStats()
      if (!(cacheStats as any).connected) {
        cacheStatus = 'unhealthy'
      }
    } catch (error) {
      cacheStatus = 'unhealthy'
      logger.error('Cache health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    return {
      database: {
        status: dbStatus,
        responseTime: dbResponseTime,
      },
      cache: {
        status: cacheStatus,
        stats: cacheStats,
      },
    }
  }
}

// Singleton instance
export const dbOptimizerService = new DbOptimizerService()

/**
 * Helper function to generate cache keys
 */
export const generateCacheKey = (
  prefix: string,
  ...parts: (string | number | undefined)[]
): string => {
  return `${prefix}${parts.filter(Boolean).join(':')}`
}

/**
 * Decorator for automatic query caching
 * Usage: @cachedQuery('prefix', 300)
 */
export function cachedQuery(prefix: string, ttl: number = 300) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = generateCacheKey(prefix, ...args)
      return dbOptimizerService.cachedQuery(
        cacheKey,
        () => originalMethod.apply(this, args),
        ttl
      )
    }

    return descriptor
  }
}
