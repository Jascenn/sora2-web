/**
 * Jest Setup for API Tests
 *
 * Week 4: Testing Framework - API Test Configuration
 */

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
process.env.DATABASE_URL = 'postgresql://sora2user:sora2pass@localhost:5432/sora2_test'
process.env.REDIS_URL = 'redis://localhost:6379/1' // Use DB 1 for testing

// Mock external API calls
jest.mock('./src/services/sora.service', () => ({
  soraService: {
    generateVideo: jest.fn().mockResolvedValue({
      videoId: 'test-video-id',
      status: 'processing',
      url: null,
    }),
    getVideoStatus: jest.fn().mockResolvedValue({
      videoId: 'test-video-id',
      status: 'completed',
      url: 'https://example.com/video.mp4',
    }),
  },
}))

// Increase timeout for integration tests
jest.setTimeout(10000)

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  // Keep errors and warnings
  error: console.error,
  warn: console.warn,
}
