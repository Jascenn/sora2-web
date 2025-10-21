import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { tokenBlacklistService } from '../services/token-blacklist.service'

export interface AuthRequest extends Request {
  userId?: string
  userRole?: string
  tokenJti?: string
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Try to get token from httpOnly cookie first (more secure)
    // Fall back to Authorization header for backwards compatibility
    let token = req.cookies?.token

    if (!token) {
      token = req.headers.authorization?.replace('Bearer ', '')
    }

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string
      role: string
      jti?: string
    }

    // Check if token is blacklisted (logout, password change, etc.)
    if (decoded.jti) {
      const isBlacklisted = await tokenBlacklistService.isBlacklisted(decoded.jti)
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

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}
