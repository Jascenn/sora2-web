import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { tokenBlacklistService } from '../services/token-blacklist.service'

// Development bypass mode - allows frontend to work without authentication
const BYPASS_AUTH = process.env.BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development'

// Mock admin user for development bypass mode
const MOCK_ADMIN_USER = {
  userId: 'admin-001',
  role: 'admin',
  jti: 'dev-bypass-token',
}

if (BYPASS_AUTH) {
  console.log('⚠️  AUTH BYPASS ENABLED - Development mode only!')
  console.log('   All requests will be authenticated as admin user')
  console.log('   This should NEVER be enabled in production!')
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Development bypass: auto-authenticate as admin
    if (BYPASS_AUTH) {
      req.userId = MOCK_ADMIN_USER.userId
      req.userRole = MOCK_ADMIN_USER.role
      req.tokenJti = MOCK_ADMIN_USER.jti
      return next()
    }

    // Try to get token from httpOnly cookie first (more secure)
    // Fall back to Authorization header for backwards compatibility
    let token = req.cookies?.token

    if (!token) {
      token = req.headers.authorization?.replace('Bearer ', '')
    }

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    // Check if token is blacklisted (logout, password change, etc.)
    if (decoded.jti) {
      const isBlacklisted = await tokenBlacklistService.isBlacklisted(
        decoded.jti
      )
      if (isBlacklisted) {
        return res.status(401).json({ error: 'Token has been revoked' })
      }
    }

    req.userId = decoded.userId
    req.userRole = decoded.role
    req.tokenJti = decoded.jti

    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // In bypass mode, all requests are already admin
  if (BYPASS_AUTH) {
    return next()
  }

  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}
