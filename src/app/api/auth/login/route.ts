import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Supabase admin client not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { email, password } = body

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '请输入邮箱和密码' },
        { status: 400 }
      )
    }

    // Find user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: '邮箱或密码错误' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (user.status !== 'active') {
      return NextResponse.json(
        { success: false, error: '账号已被禁用' },
        { status: 403 }
      )
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: '邮箱或密码错误' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }
    // @ts-ignore - Type issue with jsonwebtoken expiresIn
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

    // Return user without password
    const { password_hash: _, ...userWithoutPassword } = user

    // Set HTTP-only cookie
    const response = NextResponse.json(
      {
        success: true,
        message: '登录成功',
        data: {
          user: userWithoutPassword,
          token,
        },
      },
      { status: 200 }
    )

    // Set cookie with token
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: error.message || '登录失败' },
      { status: 500 }
    )
  }
}
