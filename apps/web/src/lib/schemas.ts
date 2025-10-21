/**
 * Form Validation Schemas
 *
 * Week 3: Frontend Architecture Upgrade - React Hook Form with Zod
 */

import { z } from 'zod'

/**
 * Login Form Schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, '请输入邮箱')
    .email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(6, '密码至少6个字符')
    .max(100, '密码最多100个字符'),
})

export type LoginFormData = z.infer<typeof loginSchema>

/**
 * Register Form Schema
 */
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, '请输入邮箱')
    .email('请输入有效的邮箱地址'),
  nickname: z
    .string()
    .min(2, '昵称至少2个字符')
    .max(50, '昵称最多50个字符'),
  password: z
    .string()
    .min(6, '密码至少6个字符')
    .max(100, '密码最多100个字符')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      '密码必须包含字母和数字'
    ),
  confirmPassword: z.string().min(1, '请确认密码'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
})

export type RegisterFormData = z.infer<typeof registerSchema>

/**
 * Video Generation Form Schema
 */
export const generateVideoSchema = z.object({
  prompt: z
    .string()
    .min(10, '描述至少10个字符')
    .max(500, '描述最多500个字符'),
  negativePrompt: z
    .string()
    .max(200, '负面提示最多200个字符')
    .optional(),
  duration: z
    .number()
    .min(5, '视频时长至少5秒')
    .max(30, '视频时长最多30秒'),
  resolution: z.enum(['720p', '1080p', '4K'], {
    errorMap: () => ({ message: '请选择有效的分辨率' }),
  }),
  aspectRatio: z.enum(['16:9', '9:16', '1:1', '4:3'], {
    errorMap: () => ({ message: '请选择有效的宽高比' }),
  }),
  fps: z.number().refine((val) => [24, 30, 60].includes(val), {
    message: 'FPS 必须为 24、30 或 60',
  }).default(30),
  model: z.string().default('sora-2'),
})

export type GenerateVideoFormData = z.infer<typeof generateVideoSchema>

/**
 * Profile Update Form Schema
 */
export const profileUpdateSchema = z.object({
  nickname: z
    .string()
    .min(2, '昵称至少2个字符')
    .max(50, '昵称最多50个字符')
    .optional(),
  avatarUrl: z
    .string()
    .url('请输入有效的URL')
    .optional()
    .or(z.literal('')),
})

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>
