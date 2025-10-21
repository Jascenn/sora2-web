import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { prompt, aspectRatio, image } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
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
            },
            body: JSON.stringify({
              prompt,
              aspectRatio: aspectRatio || '16:9',
              duration: 10, // Default 10 seconds
              model: 'sora-2-hd',
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
