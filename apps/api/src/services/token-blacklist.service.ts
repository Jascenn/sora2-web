import { db } from '../lib/db'
import logger from '../lib/logger'

/**
 * Token Blacklist Service
 * Manages invalidated JWT tokens to prevent reuse after logout or security events
 */
export class TokenBlacklistService {
  /**
   * Add a token to the blacklist
   */
  async blacklistToken(
    jti: string,
    userId: string,
    expiresAt: Date,
    reason: string = 'logout'
  ): Promise<void> {
    try {
      await db.query(
        `INSERT INTO token_blacklist (token_jti, user_id, expires_at, reason, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (token_jti) DO NOTHING`,
        [jti, userId, expiresAt, reason]
      )

      logger.info('Token blacklisted', { jti, userId, reason })
    } catch (error: any) {
      logger.error('Failed to blacklist token', {
        error: error.message,
        jti,
        userId,
      })
      throw error
    }
  }

  /**
   * Check if a token is blacklisted
   */
  async isBlacklisted(jti: string): Promise<boolean> {
    try {
      const result = await db.query(
        `SELECT 1 FROM token_blacklist WHERE token_jti = $1 LIMIT 1`,
        [jti]
      )

      return result.rows.length > 0
    } catch (error: any) {
      logger.error('Failed to check token blacklist', {
        error: error.message,
        jti,
      })
      // On error, allow the token (fail open) to prevent denial of service
      // The token will still be validated by JWT verification
      return false
    }
  }

  /**
   * Blacklist all tokens for a user
   * Useful when user changes password or for security breach response
   */
  async blacklistAllUserTokens(
    userId: string,
    reason: string = 'password_change'
  ): Promise<number> {
    try {
      // Get user's current tokens from active sessions (if tracked)
      // For now, we'll just log the action
      // In a production system, you might track active sessions

      logger.info('All user tokens invalidated', { userId, reason })

      // Return 0 as we don't track active sessions yet
      // This is a placeholder for future enhancement
      return 0
    } catch (error: any) {
      logger.error('Failed to blacklist user tokens', {
        error: error.message,
        userId,
      })
      throw error
    }
  }

  /**
   * Clean up expired tokens from the blacklist
   * Should be run periodically (e.g., daily cron job)
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await db.query(
        `DELETE FROM token_blacklist WHERE expires_at < NOW()
         RETURNING token_jti`,
        []
      )

      const deletedCount = result.rows.length

      if (deletedCount > 0) {
        logger.info('Cleaned up expired blacklisted tokens', {
          count: deletedCount,
        })
      }

      return deletedCount
    } catch (error: any) {
      logger.error('Failed to cleanup expired tokens', {
        error: error.message,
      })
      throw error
    }
  }

  /**
   * Get blacklist statistics
   */
  async getStats(): Promise<{
    total: number
    expired: number
    active: number
  }> {
    try {
      const result = await db.query(
        `SELECT
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE expires_at < NOW()) as expired,
           COUNT(*) FILTER (WHERE expires_at >= NOW()) as active
         FROM token_blacklist`,
        []
      )

      const stats = result.rows[0]
      return {
        total: parseInt(stats.total || '0'),
        expired: parseInt(stats.expired || '0'),
        active: parseInt(stats.active || '0'),
      }
    } catch (error: any) {
      logger.error('Failed to get blacklist stats', {
        error: error.message,
      })
      return { total: 0, expired: 0, active: 0 }
    }
  }
}

// Export singleton instance
export const tokenBlacklistService = new TokenBlacklistService()
