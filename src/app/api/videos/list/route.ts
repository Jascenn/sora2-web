import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

// Query parameters validation schema
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'all']).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

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

    // Get JWT token from cookie
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: '未登录或登录已过期,请重新登录' },
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
    const userRole = decoded.role

    // Build query
    let query = supabaseAdmin
      .from('videos')
      .select('*', { count: 'exact' })

    // Filter by user (non-admin users can only see their own videos)
    if (userRole !== 'admin') {
      query = query.eq('user_id', userId)
    }

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Filter out soft-deleted videos
    query = query.is('deleted_at', null)

    // Sort
    const sortColumn = sortBy === 'createdAt' ? 'created_at' : 'updated_at'
    query = query.order(sortColumn, { ascending: order === 'asc' })

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // Execute query
    const { data: videos, error, count } = await query

    if (error) {
      console.error('Query videos error:', error)
      return NextResponse.json(
        { success: false, error: '获取视频列表失败' },
        { status: 500 }
      )
    }

    // Calculate pagination
    const totalPages = count ? Math.ceil(count / limit) : 0

    return NextResponse.json(
      {
        success: true,
        data: {
          videos: videos || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages,
            hasMore: page < totalPages,
          },
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Videos list API error:', error)

    return NextResponse.json(
      { success: false, error: error.message || '获取视频列表失败,请稍后重试' },
      { status: 500 }
    )
  }
}

// Search endpoint
const searchSchema = z.object({
  q: z.string().min(1, '搜索关键词不能为空'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate search parameters
    const validationResult = searchSchema.safeParse(body)

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

    const { q, page, limit } = validationResult.data

    // Get JWT token from cookie
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: '未登录或登录已过期,请重新登录' },
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
    const userRole = decoded.role

    // Build search query
    let query = supabaseAdmin
      .from('videos')
      .select('*', { count: 'exact' })
      .ilike('prompt', `%${q}%`)

    // Filter by user (non-admin users can only see their own videos)
    if (userRole !== 'admin') {
      query = query.eq('user_id', userId)
    }

    // Filter out soft-deleted videos
    query = query.is('deleted_at', null)

    // Sort by relevance (created_at desc)
    query = query.order('created_at', { ascending: false })

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // Execute query
    const { data: videos, error, count } = await query

    if (error) {
      console.error('Search videos error:', error)
      return NextResponse.json(
        { success: false, error: '搜索视频失败' },
        { status: 500 }
      )
    }

    // Calculate pagination
    const totalPages = count ? Math.ceil(count / limit) : 0

    return NextResponse.json(
      {
        success: true,
        data: {
          videos: videos || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages,
            hasMore: page < totalPages,
          },
          query: q,
        },
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
