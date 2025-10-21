import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { AppError } from '../middleware/error.middleware'
import { db } from '../lib/db'
import { success } from '../lib/response'
import bcrypt from 'bcryptjs'

export class UserController {
  async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!

      const result = await db.query(
        `SELECT id, email, nickname, avatar_url as "avatarUrl", credits, role, status,
                to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "createdAt"
         FROM users
         WHERE id = $1`,
        [userId]
      )

      if (result.rows.length === 0) {
        throw new AppError('User not found', 404)
      }

      res.json(success({ user: result.rows[0] }))
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error
      }
      console.error('Failed to get profile:', error)
      throw new AppError('Failed to get profile', 400)
    }
  }

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!
      const { nickname, avatarUrl } = req.body

      // 验证昵称
      if (!nickname || typeof nickname !== 'string') {
        throw new AppError('昵称不能为空', 400)
      }

      const trimmedNickname = nickname.trim()
      if (trimmedNickname.length < 2 || trimmedNickname.length > 50) {
        throw new AppError('昵称长度必须在2-50个字符之间', 400)
      }

      // 更新用户信息
      await db.query(
        `UPDATE users SET nickname = $1, avatar_url = $2, updated_at = NOW() WHERE id = $3`,
        [trimmedNickname, avatarUrl || null, userId]
      )

      // 获取更新后的用户信息
      const result = await db.query(
        `SELECT id, email, nickname, avatar_url as "avatarUrl", credits, role, status,
                to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "createdAt"
         FROM users WHERE id = $1`,
        [userId]
      )

      res.json(success({
        user: result.rows[0]
      }, '更新成功'))
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error
      }
      console.error('Failed to update profile:', error)
      throw new AppError('更新失败', 400)
    }
  }

  async uploadAvatar(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId

      // TODO: Upload avatar to storage

      res.json(success({ avatarUrl: 'placeholder-url' }))
    } catch (error) {
      throw new AppError('Failed to upload avatar', 400)
    }
  }

  async changePassword(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!
      const { currentPassword, newPassword } = req.body

      // 验证输入
      if (!currentPassword || !newPassword) {
        throw new AppError('请提供当前密码和新密码', 400)
      }

      if (newPassword.length < 6) {
        throw new AppError('新密码长度至少为6位', 400)
      }

      // 获取用户当前密码
      const result = await db.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      )

      if (result.rows.length === 0) {
        throw new AppError('用户不存在', 404)
      }

      const user = result.rows[0]

      // 验证当前密码
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash)
      if (!isPasswordValid) {
        throw new AppError('当前密码错误', 400)
      }

      // 加密新密码
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      // 更新密码
      await db.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [hashedPassword, userId]
      )

      res.json(success(null, '密码修改成功'))
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error
      }
      console.error('Failed to change password:', error)
      throw new AppError('密码修改失败', 400)
    }
  }
}
