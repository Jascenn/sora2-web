import crypto from 'crypto'
import { db } from '../lib/db'
import logger from '../lib/logger'

/**
 * Refresh Token Service
 * Manages long-lived refresh tokens for token renewal
 */
export class RefreshTokenService {
  private readonly REFRESH_TOKEN_EXPIRES_DAYS = 30

  /**
   * Generate a secure random refresh token
   */
  private generateToken(): string {
    return crypto.randomBytes(64).toString('hex')
  }

  /**
   * Hash a refresh token for storage
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  /**
   * Create a new refresh token
   */
  async createRefreshToken(
    userId: string,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<string> {
    try {
      const token = this.generateToken()
      const tokenHash = this.hashToken(token)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRES_DAYS)

      await db.query(
        `INSERT INTO refresh_tokens (token_hash, user_id, device_info, ip_address, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [tokenHash, userId, deviceInfo || null, ipAddress || null, expiresAt]
      )

      logger.info('Refresh token created', { userId, deviceInfo })

      return token
    } catch (error: any) {
      logger.error('Failed to create refresh token', {
        error: error.message,
        userId,
      })
      throw error
    }
  }

  /**
   * Validate and retrieve refresh token info
   */
  async validateRefreshToken(token: string): Promise<{
    userId: string
    tokenId: string
  } | null> {
    try {
      const tokenHash = this.hashToken(token)

      const result = await db.query(
        `SELECT id, user_id as "userId", expires_at as "expiresAt"
         FROM refresh_tokens
         WHERE token_hash = $1`,
        [tokenHash]
      )

      if (result.rows.length === 0) {
        return null
      }

      const tokenData = result.rows[0]

      // Check if token is expired
      if (new Date(tokenData.expiresAt) < new Date()) {
        // Delete expired token
        await this.deleteRefreshToken(token)
        return null
      }

      // Update last used timestamp
      await db.query(
        `UPDATE refresh_tokens SET last_used_at = NOW() WHERE id = $1`,
        [tokenData.id]
      )

      return {
        userId: tokenData.userId,
        tokenId: tokenData.id,
      }
    } catch (error: any) {
      logger.error('Failed to validate refresh token', {
        error: error.message,
      })
      return null
    }
  }

  /**
   * Delete a refresh token (logout)
   */
  async deleteRefreshToken(token: string): Promise<void> {
    try {
      const tokenHash = this.hashToken(token)

      await db.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [
        tokenHash,
      ])

      logger.info('Refresh token deleted')
    } catch (error: any) {
      logger.error('Failed to delete refresh token', {
        error: error.message,
      })
      throw error
    }
  }

  /**
   * Delete all refresh tokens for a user
   */
  async deleteAllUserTokens(userId: string): Promise<number> {
    try {
      const result = await db.query(
        `DELETE FROM refresh_tokens WHERE user_id = $1 RETURNING id`,
        [userId]
      )

      const deletedCount = result.rows.length

      logger.info('All user refresh tokens deleted', { userId, count: deletedCount })

      return deletedCount
    } catch (error: any) {
      logger.error('Failed to delete user refresh tokens', {
        error: error.message,
        userId,
      })
      throw error
    }
  }

  /**
   * Clean up expired refresh tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await db.query(
        `DELETE FROM refresh_tokens WHERE expires_at < NOW() RETURNING id`,
        []
      )

      const deletedCount = result.rows.length

      if (deletedCount > 0) {
        logger.info('Cleaned up expired refresh tokens', { count: deletedCount })
      }

      return deletedCount
    } catch (error: any) {
      logger.error('Failed to cleanup expired refresh tokens', {
        error: error.message,
      })
      throw error
    }
  }

  /**
   * Get refresh token statistics
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
         FROM refresh_tokens`,
        []
      )

      const stats = result.rows[0]
      return {
        total: parseInt(stats.total || '0'),
        expired: parseInt(stats.expired || '0'),
        active: parseInt(stats.active || '0'),
      }
    } catch (error: any) {
      logger.error('Failed to get refresh token stats', {
        error: error.message,
      })
      return { total: 0, expired: 0, active: 0 }
    }
  }

  /**
   * List all refresh tokens for a user
   */
  async getUserTokens(userId: string): Promise<
    Array<{
      id: string
      deviceInfo: string | null
      ipAddress: string | null
      createdAt: Date
      lastUsedAt: Date | null
      expiresAt: Date
    }>
  > {
    try {
      const result = await db.query(
        `SELECT id, device_info as "deviceInfo", ip_address as "ipAddress",
                created_at as "createdAt", last_used_at as "lastUsedAt",
                expires_at as "expiresAt"
         FROM refresh_tokens
         WHERE user_id = $1
         ORDER BY last_used_at DESC NULLS LAST, created_at DESC`,
        [userId]
      )

      return result.rows
    } catch (error: any) {
      logger.error('Failed to get user refresh tokens', {
        error: error.message,
        userId,
      })
      return []
    }
  }
}

// Export singleton instance
export const refreshTokenService = new RefreshTokenService()
