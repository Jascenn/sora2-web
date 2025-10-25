import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get JWT token from cookie
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      )
    }

    // Verify JWT token
    let decoded: any
    try {
      const secret = process.env.JWT_SECRET
      if (!secret) {
        console.error('JWT_SECRET is not configured')
        return NextResponse.json(
          { success: false, error: '服务器配置错误' },
          { status: 500 }
        )
      }
      decoded = jwt.verify(token, secret)
    } catch (error) {
      console.error('JWT verification failed:', error)
      return NextResponse.json(
        { success: false, error: '登录已过期,请重新登录' },
        { status: 401 }
      )
    }

    const userId = decoded.userId

    // Query user from Supabase
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, nickname, avatar_url, credits, role, status, created_at')
      .eq('id', userId)
      .is('deleted_at', null)
      .single()

    if (error || !user) {
      console.error('Query user error:', error)
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      )
    }

    // Check if user is active
    if (user.status !== 'active') {
      return NextResponse.json(
        { success: false, error: '账号已被禁用' },
        { status: 403 }
      )
    }

    // Return user profile (convert snake_case to camelCase for frontend)
    const userProfile = {
      id: user.id,
      email: user.email,
      nickname: user.nickname || 'User',
      avatarUrl: user.avatar_url,
      credits: user.credits || 0,
      role: user.role,
      status: user.status,
      createdAt: user.created_at,
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user: userProfile,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Get profile API error:', error)

    return NextResponse.json(
      { success: false, error: error.message || '获取用户信息失败' },
      { status: 500 }
    )
  }
}
