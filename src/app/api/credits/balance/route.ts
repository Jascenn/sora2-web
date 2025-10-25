import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get cookies for authentication
    const cookie = request.headers.get('cookie') || ''

    if (!cookie) {
      return NextResponse.json(
        { success: false, error: '未登录,请先登录' },
        { status: 401 }
      )
    }

    // Forward to backend API
    const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101'

    const response = await fetch(`${API_URL}/api/credits/balance`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        return NextResponse.json(
          { success: false, error: '未登录或登录已过期,请重新登录' },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { success: false, error: data.message || data.error || '获取积分余额失败' },
        { status: response.status }
      )
    }

    // Return standardized response
    return NextResponse.json(
      {
        success: true,
        data: {
          balance: data.data?.balance ?? data.balance ?? 0,
          currency: data.data?.currency || data.currency || 'credits',
          userId: data.data?.userId || data.userId,
        },
        message: '获取成功',
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Credits balance API error:', error)

    // Handle network errors
    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { success: false, error: '服务暂时不可用,请稍后重试' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || '获取积分余额失败,请稍后重试' },
      { status: 500 }
    )
  }
}
