import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Query parameters validation schema
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'all']).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  return forwarded?.split(',')[0] || realIP || 'unknown'
}

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      sortBy: searchParams.get('sortBy'),
      order: searchParams.get('order'),
    }

    // Validate query parameters
    const validationResult = querySchema.safeParse(queryParams)

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }))
      return NextResponse.json(
        { success: false, error: '请求参数验证失败', details: errors },
        { status: 400 }
      )
    }

    const { page, limit, status, sortBy, order } = validationResult.data

    // Get cookies for authentication
    const cookie = request.headers.get('cookie') || ''

    // Forward to backend API
    const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101'

    // Build query string
    const queryString = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      order,
      ...(status && status !== 'all' && { status }),
    }).toString()

    const response = await fetch(`${API_URL}/api/videos?${queryString}`, {
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
        { success: false, error: data.message || data.error || '获取视频列表失败' },
        { status: response.status }
      )
    }

    // Return standardized response
    return NextResponse.json(
      {
        success: true,
        data: {
          videos: data.data?.videos || data.videos || [],
          pagination: {
            page: data.data?.pagination?.page || page,
            limit: data.data?.pagination?.limit || limit,
            total: data.data?.pagination?.total || 0,
            totalPages: data.data?.pagination?.totalPages || 0,
          },
        },
        message: '获取成功',
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Videos list API error:', error)

    // Handle network errors
    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { success: false, error: '服务暂时不可用,请稍后重试' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || '获取视频列表失败,请稍后重试' },
      { status: 500 }
    )
  }
}

// Support POST for complex filters (future enhancement)
export async function POST(request: NextRequest) {
  try {
    // Get cookies for authentication
    const cookie = request.headers.get('cookie') || ''

    // Parse request body
    const body = await request.json()
    const { page = 1, limit = 20, filters = {} } = body

    // Forward to backend API
    const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101'

    const response = await fetch(`${API_URL}/api/videos/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie,
      },
      body: JSON.stringify({ page, limit, filters }),
    })

    const data = await response.json()

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { success: false, error: '未登录或登录已过期,请重新登录' },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { success: false, error: data.message || data.error || '搜索视频失败' },
        { status: response.status }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          videos: data.data?.videos || data.videos || [],
          pagination: data.data?.pagination || {},
        },
        message: '搜索成功',
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Videos search API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || '搜索视频失败,请稍后重试' },
      { status: 500 }
    )
  }
}
