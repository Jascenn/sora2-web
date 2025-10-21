import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { AppError } from '../middleware/error.middleware'
import { db } from '../lib/db'
import logger from '../lib/logger'
import { success } from '../lib/response'
import { tokenBlacklistService } from '../services/token-blacklist.service'
import { refreshTokenService } from '../services/refresh-token.service'
import { AuthRequest } from '../middleware/auth.middleware'

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password, nickname } = req.body

      // Check if user exists
      const existingUserResult = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      )

      if (existingUserResult.rows.length > 0) {
        throw new AppError('Email already registered', 400)
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10)

      // Use transaction to create user and credit transaction
      const result = await db.transaction(async (client) => {
        // Create user with initial credits
        const userResult = await client.query(
          `INSERT INTO users (email, password_hash, nickname, credits, role, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
           RETURNING id, email, nickname, credits, role, created_at`,
          [email, passwordHash, nickname, 100, 'user', 'active']
        )

        const user = userResult.rows[0]

        // Create initial credit transaction
        await client.query(
          `INSERT INTO credit_transactions (user_id, type, amount, balance_after, description, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [user.id, 'gift', 100, 100, 'New user registration gift']
        )

        return user
      })

      // Generate JWT access token with JTI for blacklist support
      const jti = uuidv4()
      const token = jwt.sign(
        { userId: result.id, role: result.role, jti },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
      )

      // Generate refresh token
      const deviceInfo = req.headers['user-agent']
      const ipAddress = req.ip || req.socket.remoteAddress
      const refreshToken = await refreshTokenService.createRefreshToken(
        result.id,
        deviceInfo,
        ipAddress
      )

      // Set httpOnly cookies for security
      // Access token - short-lived
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      })

      // Refresh token - long-lived
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/api/auth/refresh-token', // Only send to refresh endpoint
      })

      res.status(201).json(success({
        user: {
          id: result.id,
          email: result.email,
          nickname: result.nickname,
          credits: result.credits,
          role: result.role,
          createdAt: result.created_at,
        },
      }, 'User registered successfully'))
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error
      }
      logger.error('Registration error:', { error: error.message, stack: error.stack })
      throw new AppError('Registration failed', 400)
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body

      // Find user by email
      const userResult = await db.query(
        'SELECT id, email, nickname, password_hash, credits, role, status, avatar_url FROM users WHERE email = $1',
        [email]
      )

      if (userResult.rows.length === 0) {
        throw new AppError('Invalid email or password', 401)
      }

      const user = userResult.rows[0]

      // Check if user is banned
      if (user.status === 'banned') {
        throw new AppError('Account has been banned', 403)
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash)

      if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401)
      }

      // Generate JWT access token with JTI for blacklist support
      const jti = uuidv4()
      const token = jwt.sign(
        { userId: user.id, role: user.role, jti },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
      )

      // Generate refresh token
      const deviceInfo = req.headers['user-agent']
      const ipAddress = req.ip || req.socket.remoteAddress
      const refreshToken = await refreshTokenService.createRefreshToken(
        user.id,
        deviceInfo,
        ipAddress
      )

      // Set httpOnly cookies for security
      // Access token - short-lived
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      })

      // Refresh token - long-lived
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/api/auth/refresh-token', // Only send to refresh endpoint
      })

      res.json(success({
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          credits: user.credits,
          role: user.role,
          avatarUrl: user.avatar_url,
        },
      }, 'Login successful'))
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error
      }
      logger.error('Login error:', { error: error.message, stack: error.stack })
      throw new AppError('Login failed', 401)
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      // Get refresh token from cookie
      const refreshToken = req.cookies?.refreshToken

      if (!refreshToken) {
        throw new AppError('No refresh token provided', 401)
      }

      // Validate refresh token
      const tokenData = await refreshTokenService.validateRefreshToken(refreshToken)

      if (!tokenData) {
        throw new AppError('Invalid or expired refresh token', 401)
      }

      // Get user data
      const userResult = await db.query(
        'SELECT id, role, status FROM users WHERE id = $1',
        [tokenData.userId]
      )

      if (userResult.rows.length === 0) {
        throw new AppError('User not found', 404)
      }

      const user = userResult.rows[0]

      // Check if user is banned
      if (user.status === 'banned') {
        throw new AppError('Account has been banned', 403)
      }

      // Generate new JWT access token
      const jti = uuidv4()
      const newAccessToken = jwt.sign(
        { userId: user.id, role: user.role, jti },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
      )

      // Set new access token cookie
      res.cookie('token', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      })

      logger.info('Token refreshed successfully', { userId: user.id })

      res.json(success({}, 'Token refreshed successfully'))
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error
      }
      logger.error('Token refresh error:', { error: error.message, stack: error.stack })
      throw new AppError('Token refresh failed', 401)
    }
  }

  async forgotPassword(req: Request, res: Response) {
    // TODO: Implement forgot password
    res.json(success({}, 'Password reset email sent'))
  }

  async resetPassword(req: Request, res: Response) {
    // TODO: Implement password reset
    res.json(success({}, 'Password reset successfully'))
  }

  async logout(req: AuthRequest, res: Response) {
    try {
      // Add access token to blacklist if JTI is present
      if (req.tokenJti && req.userId) {
        const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '')
        if (token) {
          const decoded = jwt.decode(token) as any
          const expiresAt = new Date(decoded.exp * 1000)

          await tokenBlacklistService.blacklistToken(
            req.tokenJti,
            req.userId,
            expiresAt,
            'logout'
          )

          logger.info('Access token blacklisted on logout', {
            userId: req.userId,
            jti: req.tokenJti,
          })
        }
      }

      // Delete refresh token if present
      const refreshToken = req.cookies?.refreshToken
      if (refreshToken) {
        await refreshTokenService.deleteRefreshToken(refreshToken)
        logger.info('Refresh token deleted on logout', { userId: req.userId })
      }

      // Clear both cookies
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      })

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth/refresh-token',
      })

      res.json(success({}, 'Logout successful'))
    } catch (error: any) {
      logger.error('Logout error:', { error: error.message, stack: error.stack })
      throw new AppError('Logout failed', 500)
    }
  }
}
