/**
 * Health Check API Tests
 *
 * Week 4: Testing Framework - API Integration Tests
 */

import request from 'supertest'
import express from 'express'
import { healthRouter } from '../health'

describe('Health Check API', () => {
  let app: express.Application

  beforeAll(() => {
    app = express()
    app.use('/health', healthRouter)
  })

  describe('GET /health', () => {
    it('should return 200 OK', async () => {
      const response = await request(app).get('/health')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('status')
    })

    it('should return status and timestamp', async () => {
      const response = await request(app).get('/health')

      expect(response.body).toMatchObject({
        status: expect.any(String),
        timestamp: expect.any(String),
      })
    })

    it('should have valid timestamp format', async () => {
      const response = await request(app).get('/health')

      const timestamp = new Date(response.body.timestamp)
      expect(timestamp.toString()).not.toBe('Invalid Date')
    })
  })

  describe('GET /health/detailed', () => {
    it('should return detailed health information', async () => {
      const response = await request(app).get('/health/detailed')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('checks')
    })

    it('should include database check', async () => {
      const response = await request(app).get('/health/detailed')

      expect(response.body.checks).toHaveProperty('database')
      expect(response.body.checks.database).toHaveProperty('status')
    })

    it('should include redis check', async () => {
      const response = await request(app).get('/health/detailed')

      expect(response.body.checks).toHaveProperty('redis')
      expect(response.body.checks.redis).toHaveProperty('status')
    })

    it('should include memory usage', async () => {
      const response = await request(app).get('/health/detailed')

      expect(response.body.checks).toHaveProperty('memory')
      expect(response.body.checks.memory).toMatchObject({
        used: expect.any(Number),
        total: expect.any(Number),
        percentage: expect.any(Number),
      })
    })
  })
})
