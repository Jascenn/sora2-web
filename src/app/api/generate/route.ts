import { NextRequest, NextResponse } from 'next/server'

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 requests per window per IP
}

// API Key validation regex
const API_KEY_REGEX = /^sk-[a-zA-Z0-9]{48}$/

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIP || 'unknown'
  return ip
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
    // Get client IP for rate limiting
    const clientIP = getClientIP(request)

    // Check rate limiting
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(RATE_LIMIT.windowMs / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + RATE_LIMIT.windowMs).toUTCString(),
          }
        }
      )
    }

    const apiKey = request.headers.get('X-API-Key')

    // Enhanced API key validation
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      )
    }

    if (!API_KEY_REGEX.test(apiKey)) {
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 401 }
      )
    }

    // Validate Origin header for CSRF protection
    const origin = request.headers.get('origin')
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3200',
      process.env.NEXT_PUBLIC_SITE_URL,
    ].filter(Boolean)

    if (origin && !allowedOrigins.includes(origin)) {
      return NextResponse.json(
        { error: 'Origin not allowed' },
        { status: 403 }
      )
    }

    // Validate content type
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { prompt, aspectRatio, image, duration, model } = body

    // Enhanced prompt validation
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      )
    }

    // Sanitize and validate prompt
    const sanitizedPrompt = prompt.trim().slice(0, 2000) // Max 2000 chars
    if (sanitizedPrompt.length < 10) {
      return NextResponse.json(
        { error: 'Prompt must be at least 10 characters long' },
        { status: 400 }
      )
    }

    // Basic content filtering
    const forbiddenPatterns = [
      /password/i,
      /api[-_]?key/i,
      /secret/i,
      /token/i,
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card pattern
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Email pattern
    ]

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(sanitizedPrompt)) {
        return NextResponse.json(
          { error: 'Prompt contains prohibited content' },
          { status: 400 }
        )
      }
    }

    // Validate aspect ratio
    const validAspectRatios = ['16:9', '9:16', '1:1', '4:3', '3:4']
    if (aspectRatio && !validAspectRatios.includes(aspectRatio)) {
      return NextResponse.json(
        { error: `Invalid aspect ratio. Must be one of: ${validAspectRatios.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate duration
    if (duration && (typeof duration !== 'number' || duration < 1 || duration > 20)) {
      return NextResponse.json(
        { error: 'Duration must be a number between 1 and 20 seconds' },
        { status: 400 }
      )
    }

    // Validate image if provided
    if (image) {
      if (typeof image !== 'string' || !image.startsWith('data:image/')) {
        return NextResponse.json(
          { error: 'Invalid image format' },
          { status: 400 }
        )
      }

      // Check image size (max 5MB base64)
      const imageSize = Buffer.byteLength(image, 'base64')
      if (imageSize > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Image size must be less than 5MB' },
          { status: 400 }
        )
      }
    }

    // Forward to backend API
    // Use API_URL or NEXT_PUBLIC_API_URL (for server-side routing, prefer non-public)
    const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101'

    // Create SSE stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send start event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'start', message: '开始生成视频...' })}\n\n`)
          )

          // Call backend public API
          const response = await fetch(`${API_URL}/api/public/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': apiKey,
              'User-Agent': 'Sora2-Web/1.0',
            },
            body: JSON.stringify({
              prompt: sanitizedPrompt,
              aspectRatio: aspectRatio || '16:9',
              duration: duration || 10,
              model: model || 'sora-2-hd',
              image,
            }),
          })

          if (!response.ok) {
            const errorData = await response.text().catch(() => '')
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'error',
                  error: errorData || `API 请求失败: ${response.status}`
                })}\n\n`
              )
            )
            controller.close()
            return
          }

          // Stream the SSE response from backend
          const reader = response.body?.getReader()
          if (!reader) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'error', error: '无法读取响应流' })}\n\n`
              )
            )
            controller.close()
            return
          }

          const decoder = new TextDecoder()
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            // Forward the chunk to the client
            controller.enqueue(value)
          }

          controller.close()
        } catch (error: any) {
          console.error('Stream error:', error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', error: error.message || '生成失败' })}\n\n`
            )
          )
          controller.close()
        }
      },
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
