import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schema
const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(6, '密码至少6个字符')
    .max(100, '密码最多100个字符')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, '密码必须包含字母和数字'),
  nickname: z
    .string()
    .min(2, '昵称至少2个字符')
    .max(50, '昵称最多50个字符'),
})

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 registration attempts per window
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  return forwarded?.split(',')[0] || realIP || 'unknown'
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    })
    return true
  }

  if (record.count >= RATE_LIMIT.maxRequests) {
    return false
  }

  record.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = getClientIP(request)
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        {
          success: false,
          error: '注册请求过于频繁,请稍后再试',
          retryAfter: Math.ceil(RATE_LIMIT.windowMs / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    // Validate content type
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: '无效的请求格式' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = registerSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => err.message)
      return NextResponse.json(
        { success: false, error: errors[0] || '请求数据验证失败' },
        { status: 400 }
      )
    }

    const { email, password, nickname } = validationResult.data

    // Use Supabase directly (no backend API needed)
    const { supabaseAdmin } = await import('@/lib/supabase')
    const bcrypt = await import('bcryptjs')

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database service unavailable' },
        { status: 500 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: '该邮箱已被注册' },
        { status: 400 }
      )
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10)

    // Get default signup credits from system config
    const { data: config } = await supabaseAdmin
      .from('system_config')
      .select('value')
      .eq('key', 'default_signup_credits')
      .single()

    const defaultCredits = config ? parseInt(config.value) : 100

    // Create user
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password_hash,
        nickname,
        credits: defaultCredits,
        role: 'user',
        status: 'active',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { success: false, error: '创建用户失败' },
        { status: 500 }
      )
    }

    // Return user without password
    const { password_hash: _, ...userWithoutPassword } = newUser

    return NextResponse.json(
      {
        success: true,
        message: '注册成功',
        data: { user: userWithoutPassword },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Register API error:', error)

    // Handle network errors
    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { success: false, error: '服务暂时不可用,请稍后重试' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || '注册失败,请稍后重试' },
      { status: 500 }
    )
  }
}
