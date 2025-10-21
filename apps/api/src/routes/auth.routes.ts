import { Router } from 'express'
import type { Router as RouterType } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth.middleware'
import {
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateForgotPassword,
  validateResetPassword,
  handleValidationErrors
} from '../middleware/validation.middleware'

export const authRouter: RouterType = Router()
const authController = new AuthController()

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: 用户注册
 *     description: 创建新用户账户
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - username
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: 用户邮箱
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: password123
 *                 description: 用户密码(至少6位)
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 example: johndoe
 *                 description: 用户名(至少3位)
 *     responses:
 *       201:
 *         description: 注册成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 accessToken:
 *                   type: string
 *                   description: JWT 访问令牌
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
authRouter.post('/register', validateRegister, handleValidationErrors, authController.register)

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: 用户登录
 *     description: 使用邮箱和密码登录
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: 用户邮箱
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *                 description: 用户密码
 *     responses:
 *       200:
 *         description: 登录成功
 *         headers:
 *           Set-Cookie:
 *             description: Refresh Token (httpOnly cookie)
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 accessToken:
 *                   type: string
 *                   description: JWT 访问令牌
 *       401:
 *         description: 登录失败 - 邮箱或密码错误
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
authRouter.post('/login', validateLogin, handleValidationErrors, authController.login)

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: 用户登出
 *     description: 退出登录并清除 refresh token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 登出成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 登出成功
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
authRouter.post('/logout', authenticate, authController.logout)

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     tags:
 *       - Auth
 *     summary: 刷新访问令牌
 *     description: 使用 refresh token 获取新的 access token
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh Token (也可从 Cookie 中读取)
 *     responses:
 *       200:
 *         description: Token 刷新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: 新的 JWT 访问令牌
 *       401:
 *         description: Refresh Token 无效或过期
 */
authRouter.post('/refresh-token', validateRefreshToken, handleValidationErrors, authController.refreshToken)

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: 忘记密码
 *     description: 发送密码重置邮件
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: 注册邮箱
 *     responses:
 *       200:
 *         description: 密码重置邮件已发送
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 密码重置邮件已发送
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         description: 邮箱不存在
 */
authRouter.post('/forgot-password', validateForgotPassword, handleValidationErrors, authController.forgotPassword)

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: 重置密码
 *     description: 使用重置令牌设置新密码
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: 密码重置令牌(从邮件链接获取)
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: newPassword123
 *                 description: 新密码(至少6位)
 *     responses:
 *       200:
 *         description: 密码重置成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 密码重置成功
 *       400:
 *         description: Token 无效或已过期
 */
authRouter.post('/reset-password', validateResetPassword, handleValidationErrors, authController.resetPassword)
