import { PoolConfig } from 'pg'

/**
 * Database Connection Pool Configuration
 *
 * Optimized settings for production use with PostgreSQL
 *
 * Performance considerations:
 * 1. Connection Pool Size:
 *    - max: Maximum concurrent connections (20 is good for most apps)
 *    - min: Minimum idle connections to maintain (prevents cold starts)
 *    - Formula: max = (core_count * 2) + effective_spindle_count
 *
 * 2. Timeouts:
 *    - connectionTimeoutMillis: How long to wait for available connection
 *    - idleTimeoutMillis: When to close idle connections
 *    - statementTimeout: Maximum query execution time (prevents long-running queries)
 *
 * 3. Connection Quality:
 *    - keepAlive: Keeps connections alive to prevent firewall/proxy timeouts
 *    - keepAliveInitialDelayMillis: Initial delay before first keepalive probe
 */

// Development configuration
const developmentConfig: PoolConfig = {
  // Connection string from environment
  connectionString: process.env.DATABASE_URL,

  // Pool size configuration
  max: 10, // Smaller pool for development
  min: 2,  // Maintain minimum connections

  // Connection lifecycle
  idleTimeoutMillis: 30000,        // 30 seconds - close idle connections faster
  connectionTimeoutMillis: 5000,   // 5 seconds - fail fast in development

  // Statement timeout (PostgreSQL server-side)
  statement_timeout: 30000,        // 30 seconds max query time

  // Keep connections alive
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000, // 10 seconds

  // Application name for monitoring
  application_name: 'sora2-api-dev',
}

// Production configuration
const productionConfig: PoolConfig = {
  // Connection string from environment
  connectionString: process.env.DATABASE_URL,

  // Pool size configuration
  // Recommended: (CPU cores * 2) + number of disks
  // For most cloud instances: 4 cores * 2 + 1 disk = 9, rounded to 20 for safety
  max: 20,
  min: 5,  // Keep 5 connections warm for fast response

  // Connection lifecycle
  idleTimeoutMillis: 30000,        // 30 seconds - balance between connection reuse and resource usage
  connectionTimeoutMillis: 3000,   // 3 seconds - faster timeout for production

  // Statement timeout (PostgreSQL server-side)
  statement_timeout: 60000,        // 60 seconds max query time

  // Keep connections alive to prevent proxy/firewall timeouts
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000, // 10 seconds

  // Application name for monitoring
  application_name: 'sora2-api-prod',

  // SSL configuration for production
  ssl: process.env.DATABASE_SSL === 'true' ? {
    rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false'
  } : undefined,
}

// Test configuration (for integration tests)
const testConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL || process.env.TEST_DATABASE_URL,

  // Smaller pool for testing
  max: 5,
  min: 1,

  // Faster timeouts for tests
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 2000,
  statement_timeout: 10000,

  keepAlive: true,
  keepAliveInitialDelayMillis: 5000,

  application_name: 'sora2-api-test',
}

/**
 * Get database configuration based on environment
 */
export function getDatabaseConfig(): PoolConfig {
  const env = process.env.NODE_ENV || 'development'

  switch (env) {
    case 'production':
      return productionConfig
    case 'test':
      return testConfig
    case 'development':
    default:
      return developmentConfig
  }
}

/**
 * Database Performance Optimization Guidelines
 *
 * 1. Connection Pooling:
 *    - Use connection pools to reuse connections
 *    - Don't create new pools for each request
 *    - Monitor pool metrics (idle, active, waiting)
 *
 * 2. Query Optimization:
 *    - Use indexes on frequently queried columns
 *    - Avoid SELECT * - specify only needed columns
 *    - Use EXPLAIN ANALYZE to understand query plans
 *    - Add composite indexes for common filter combinations
 *
 * 3. Transaction Management:
 *    - Keep transactions short
 *    - Avoid network calls inside transactions
 *    - Use appropriate isolation levels
 *    - Release connections immediately after commit/rollback
 *
 * 4. Monitoring:
 *    - Track slow queries (> 100ms)
 *    - Monitor connection pool utilization
 *    - Set up alerts for connection pool exhaustion
 *    - Use pg_stat_statements for query analysis
 *
 * 5. Indexing Strategy:
 *    - Single column indexes for unique lookups
 *    - Composite indexes for common query patterns
 *    - Consider partial indexes for filtered queries
 *    - B-tree indexes for equality and range queries
 *    - GiN/GiST indexes for full-text search
 *
 * 6. Query Patterns to Avoid:
 *    - N+1 queries (use JOINs or batch queries)
 *    - Large OFFSET values (use cursor-based pagination)
 *    - Unbounded queries (always use LIMIT)
 *    - Cartesian joins (ensure proper JOIN conditions)
 */

// Export default configuration
export default getDatabaseConfig()
