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
        { success: false, error: '未登录,请先登录' },
        { status: 401 }
      )
    }

    // Verify JWT token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key')
    } catch (error) {
      return NextResponse.json(
        { success: false, error: '登录已过期,请重新登录' },
        { status: 401 }
      )
    }

    const userId = decoded.userId

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: '服务器配置错误' },
        { status: 500 }
      )
    }

    // Query user credits from Supabase
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, credits')
      .eq('id', userId)
      .single()

    if (error || !user) {
      console.error('Query user credits error:', error)
      return NextResponse.json(
        { success: false, error: '获取用户信息失败' },
        { status: 500 }
      )
    }

    // Return credits balance
    return NextResponse.json(
      {
        success: true,
        data: {
          balance: user.credits || 0,
          currency: 'credits',
          userId: user.id,
        },
        message: '获取成功',
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Credits balance API error:', error)

    return NextResponse.json(
      { success: false, error: error.message || '获取积分余额失败,请稍后重试' },
      { status: 500 }
    )
  }
}
