import { Request, Response, NextFunction } from 'express'
import { body, validationResult, ValidationChain } from 'express-validator'

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '输入验证失败',
      errors: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : 'unknown',
        message: err.msg
      }))
    })
  }
  next()
}

/**
 * Validation rules for user registration
 */
export const validateRegister: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('请提供有效的邮箱地址')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码至少需要6个字符'),
  body('nickname')
    .isLength({ min: 2, max: 50 })
    .withMessage('昵称长度必须在2到50个字符之间')
    .trim()
]

/**
 * Validation rules for user login
 */
export const validateLogin: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('请提供有效的邮箱地址')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
]

/**
 * Validation rules for video generation
 */
export const validateVideoGeneration: ValidationChain[] = [
  body('prompt')
    .notEmpty()
    .withMessage('提示词不能为空')
    .isLength({ max: 500 })
    .withMessage('提示词不能超过500个字符')
    .trim(),
  body('duration')
    .optional()
    .isInt({ min: 5, max: 20 })
    .withMessage('视频时长必须在5到20秒之间'),
  body('model')
    .optional()
    .isIn(['sora-1.0', 'sora-1.5', 'sora-turbo'])
    .withMessage('模型类型无效，请选择: sora-1.0, sora-1.5 或 sora-turbo'),
  body('aspectRatio')
    .optional()
    .isIn(['16:9', '9:16', '1:1', '4:3', '3:4'])
    .withMessage('宽高比无效，请选择: 16:9, 9:16, 1:1, 4:3 或 3:4')
]

/**
 * Validation rules for profile update
 */
export const validateProfileUpdate: ValidationChain[] = [
  body('nickname')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('昵称长度必须在2到50个字符之间')
    .trim(),
  body('avatarUrl')
    .optional()
    .isURL()
    .withMessage('请提供有效的头像URL地址')
]

/**
 * Validation rules for forgot password
 */
export const validateForgotPassword: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('请提供有效的邮箱地址')
    .normalizeEmail()
]

/**
 * Validation rules for reset password
 */
export const validateResetPassword: ValidationChain[] = [
  body('token')
    .notEmpty()
    .withMessage('重置令牌不能为空'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码至少需要6个字符')
]

/**
 * Validation rules for refresh token
 */
export const validateRefreshToken: ValidationChain[] = [
  body('refreshToken')
    .notEmpty()
    .withMessage('刷新令牌不能为空')
]
