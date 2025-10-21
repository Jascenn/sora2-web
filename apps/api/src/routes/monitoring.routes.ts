import { Router } from 'express'
import {
  enhancedHealthCheck,
  livenessProbe,
  readinessProbe,
} from '../controllers/health-enhanced.controller'
import {
  metricsEndpoint,
  getPerformanceMetrics,
} from '../middleware/performance.middleware'
import { ErrorTrackingService } from '../services/error-tracking.service'
import { authenticate } from '../middleware/auth.middleware'

const router: Router = Router()

/**
 * @swagger
 * /api/monitoring/health:
 *   get:
 *     summary: Enhanced health check endpoint
 *     description: Returns detailed health status including database, redis, memory, cpu, disk checks and system metrics
 *     tags:
 *       - Monitoring
 *     responses:
 *       200:
 *         description: System is healthy or degraded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 version:
 *                   type: string
 *                 environment:
 *                   type: string
 *                 checks:
 *                   type: object
 *                 metrics:
 *                   type: object
 *                 alerts:
 *                   type: array
 *       503:
 *         description: System is unhealthy
 */
router.get('/health', enhancedHealthCheck)

/**
 * @swagger
 * /api/monitoring/liveness:
 *   get:
 *     summary: Liveness probe
 *     description: Simple endpoint to check if the application is running
 *     tags:
 *       - Monitoring
 *     responses:
 *       200:
 *         description: Application is alive
 */
router.get('/liveness', livenessProbe)

/**
 * @swagger
 * /api/monitoring/readiness:
 *   get:
 *     summary: Readiness probe
 *     description: Check if the application is ready to accept traffic
 *     tags:
 *       - Monitoring
 *     responses:
 *       200:
 *         description: Application is ready
 *       503:
 *         description: Application is not ready
 */
router.get('/readiness', readinessProbe)

/**
 * @swagger
 * /api/monitoring/metrics:
 *   get:
 *     summary: Performance metrics endpoint
 *     description: Returns current performance metrics including request stats, memory, and CPU usage
 *     tags:
 *       - Monitoring
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 metrics:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/metrics', authenticate, metricsEndpoint)

/**
 * @swagger
 * /api/monitoring/errors/statistics:
 *   get:
 *     summary: Error statistics
 *     description: Returns aggregated error statistics including counts by category and severity
 *     tags:
 *       - Monitoring
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Error statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                 byCategory:
 *                   type: object
 *                 bySeverity:
 *                   type: object
 *                 topErrors:
 *                   type: array
 *                 trend:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/errors/statistics', authenticate, (req, res) => {
  const statistics = ErrorTrackingService.getStatistics()
  res.json(statistics)
})

/**
 * @swagger
 * /api/monitoring/errors/aggregations:
 *   get:
 *     summary: Error aggregations by category
 *     description: Returns aggregated errors grouped by category
 *     tags:
 *       - Monitoring
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Error aggregations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/errors/aggregations', authenticate, (req, res) => {
  const aggregations = ErrorTrackingService.getAggregations()
  const result: any = {}

  aggregations.forEach((agg, category) => {
    result[category] = agg
  })

  res.json(result)
})

/**
 * @swagger
 * /api/monitoring/errors/{fingerprint}:
 *   get:
 *     summary: Get error details by fingerprint
 *     description: Returns detailed information about a specific error
 *     tags:
 *       - Monitoring
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fingerprint
 *         required: true
 *         schema:
 *           type: string
 *         description: Error fingerprint
 *     responses:
 *       200:
 *         description: Error details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Error not found
 *       401:
 *         description: Unauthorized
 */
router.get('/errors/:fingerprint', authenticate, (req, res) => {
  const { fingerprint } = req.params
  const error = ErrorTrackingService.getError(fingerprint)

  if (!error) {
    return res.status(404).json({ error: 'Error not found' })
  }

  res.json(error)
})

/**
 * @swagger
 * /api/monitoring/errors:
 *   get:
 *     summary: Get all tracked errors
 *     description: Returns all tracked errors with optional filtering
 *     tags:
 *       - Monitoring
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by error category
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *         description: Filter by error severity
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 100
 *         description: Maximum number of errors to return
 *     responses:
 *       200:
 *         description: List of errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                 total:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/errors', authenticate, (req, res) => {
  const { category, severity, limit = 100 } = req.query

  let errors = ErrorTrackingService.getAllErrors()

  if (category) {
    errors = ErrorTrackingService.getErrorsByCategory(category as any)
  }

  if (severity) {
    const filtered = ErrorTrackingService.getErrorsBySeverity(severity as any)
    errors = category ? errors.filter((e) => filtered.includes(e)) : filtered
  }

  // Sort by last occurrence
  errors.sort((a, b) => b.lastOccurrence.getTime() - a.lastOccurrence.getTime())

  // Apply limit
  const limitNum = parseInt(limit as string)
  const limitedErrors = errors.slice(0, limitNum)

  res.json({
    errors: limitedErrors,
    total: errors.length,
    returned: limitedErrors.length,
  })
})

/**
 * @swagger
 * /api/monitoring/performance/detailed:
 *   get:
 *     summary: Detailed performance metrics
 *     description: Returns comprehensive performance metrics including active requests
 *     tags:
 *       - Monitoring
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Detailed performance metrics
 *       401:
 *         description: Unauthorized
 */
router.get('/performance/detailed', authenticate, (req, res) => {
  const metrics = getPerformanceMetrics()
  res.json({
    timestamp: new Date().toISOString(),
    ...metrics,
  })
})

export default router
