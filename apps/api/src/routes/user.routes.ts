import { Router } from 'express'
import type { Router as RouterType } from 'express'
import { UserController } from '../controllers/user.controller'
import { authenticate } from '../middleware/auth.middleware'
import { validateProfileUpdate, handleValidationErrors } from '../middleware/validation.middleware'

export const userRouter: RouterType = Router()
const userController = new UserController()

userRouter.use(authenticate)

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     tags:
 *       - User
 *     summary: 获取用户资料
 *     description: 获取当前登录用户的详细资料
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 用户资料
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
userRouter.get('/profile', userController.getProfile)

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     tags:
 *       - User
 *     summary: 更新用户资料
 *     description: 更新当前用户的资料信息
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 description: 用户名
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 邮箱地址
 *                 example: newemail@example.com
 *               bio:
 *                 type: string
 *                 description: 个人简介
 *                 example: 热爱视频创作的设计师
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 资料更新成功
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
userRouter.put('/profile', validateProfileUpdate, handleValidationErrors, userController.updateProfile)

/**
 * @swagger
 * /api/users/password:
 *   put:
 *     tags:
 *       - User
 *     summary: 修改密码
 *     description: 修改当前用户的登录密码
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: 当前密码
 *                 example: oldPassword123
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: 新密码(至少6位)
 *                 example: newPassword456
 *     responses:
 *       200:
 *         description: 密码修改成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 密码修改成功
 *       400:
 *         description: 当前密码错误或新密码格式不正确
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
userRouter.put('/password', userController.changePassword)

/**
 * @swagger
 * /api/users/avatar:
 *   post:
 *     tags:
 *       - User
 *     summary: 上传头像
 *     description: 上传或更新用户头像
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: 头像图片文件(支持 jpg, png, gif)
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - avatarBase64
 *             properties:
 *               avatarBase64:
 *                 type: string
 *                 description: Base64 编码的头像图片
 *                 example: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...
 *     responses:
 *       200:
 *         description: 头像上传成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 头像上传成功
 *                 avatarUrl:
 *                   type: string
 *                   description: 头像 URL
 *                   example: https://cdn.sora2.com/avatars/abc123.jpg
 *       400:
 *         description: 文件格式不支持或文件过大
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
userRouter.post('/avatar', userController.uploadAvatar)
