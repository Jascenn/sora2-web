import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

console.log('🔧 Proxy route loaded, API_URL:', API_URL)

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'DELETE')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'PATCH')
}

async function proxyRequest(
  request: NextRequest,
  path: string[],
  method: string
) {
  try {
    const targetPath = path.join('/')
    const targetUrl = `${API_URL}/api/${targetPath}`

    console.log(`📤 Proxying ${method} request to: ${targetUrl}`)

    // Get request body for POST/PUT/PATCH
    let body: string | undefined
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      body = await request.text()
      console.log(`📦 Request body: ${body.substring(0, 100)}...`)
    }

    // Forward headers (excluding host)
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host') {
        headers[key] = value
      }
    })

    console.log(`📋 Request headers:`, Object.keys(headers))

    // Make request to backend API
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
    })

    console.log(`📥 Response status: ${response.status}`)

    // Get response body
    const responseData = await response.text()

    console.log(`📦 Response body: ${responseData.substring(0, 200)}...`)

    // Forward important headers from backend response
    const responseHeaders = new Headers()
    responseHeaders.set('Content-Type', response.headers.get('content-type') || 'application/json')

    // Critical: Forward ALL Set-Cookie headers for httpOnly cookie authentication
    // Use getSetCookie() to get all Set-Cookie headers (not just the first one)
    const setCookies = response.headers.getSetCookie?.() || []
    if (setCookies.length > 0) {
      setCookies.forEach(cookie => {
        responseHeaders.append('Set-Cookie', cookie)
      })
      console.log(`🍪 Forwarding ${setCookies.length} Set-Cookie headers`)
    }

    // Return response with same status and headers
    return new NextResponse(responseData, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error: any) {
    console.error('❌ Proxy error:', error)
    return NextResponse.json(
      { error: 'Proxy request failed', message: error.message, stack: error.stack },
      { status: 500 }
    )
  }
}
