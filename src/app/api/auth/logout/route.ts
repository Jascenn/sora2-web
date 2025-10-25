import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Forward to backend API
    const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101'

    // Get cookies from request to forward to backend
    const cookie = request.headers.get('cookie') || ''

    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie,
      },
    })

    // Create response headers
    const responseHeaders = new Headers()
    responseHeaders.set('Content-Type', 'application/json')

    // Forward Set-Cookie headers from backend to clear cookies
    const setCookies = response.headers.getSetCookie?.() || []
    if (setCookies.length > 0) {
      setCookies.forEach((cookie) => {
        responseHeaders.append('Set-Cookie', cookie)
      })
    } else {
      // Fallback: manually clear auth cookies if backend doesn't send them
      responseHeaders.append(
        'Set-Cookie',
        'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax'
      )
      responseHeaders.append(
        'Set-Cookie',
        'refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax'
      )
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      return NextResponse.json(
        { success: false, error: data.message || data.error || '登出失败' },
        { status: response.status, headers: responseHeaders }
      )
    }

    const data = await response.json().catch(() => ({}))

    return NextResponse.json(
      {
        success: true,
        data: data.data || null,
        message: '登出成功',
      },
      {
        status: 200,
        headers: responseHeaders,
      }
    )
  } catch (error: any) {
    console.error('Logout API error:', error)

    // Even on error, we should clear cookies client-side
    const responseHeaders = new Headers()
    responseHeaders.set('Content-Type', 'application/json')
    responseHeaders.append(
      'Set-Cookie',
      'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax'
    )
    responseHeaders.append(
      'Set-Cookie',
      'refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax'
    )

    // Handle network errors
    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { success: false, error: '服务暂时不可用,请稍后重试' },
        { status: 503, headers: responseHeaders }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || '登出失败,请稍后重试' },
      { status: 500, headers: responseHeaders }
    )
  }
}

// Support GET method for logout (some clients may use GET)
export async function GET(request: NextRequest) {
  return POST(request)
}
