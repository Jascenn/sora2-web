import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101'
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // ms
const REQUEST_TIMEOUT = 30000 // 30 seconds

console.log('🔧 Proxy route loaded, API_URL:', API_URL)

// Health check cache to avoid repeated failures
let lastHealthCheck: { timestamp: number; healthy: boolean } = {
  timestamp: 0,
  healthy: false
}
const HEALTH_CHECK_TTL = 5000 // 5 seconds

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

/**
 * Check if backend API is healthy
 */
async function checkBackendHealth(): Promise<boolean> {
  const now = Date.now()

  // Return cached result if still valid
  if (now - lastHealthCheck.timestamp < HEALTH_CHECK_TTL) {
    return lastHealthCheck.healthy
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(`${API_URL}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    lastHealthCheck = {
      timestamp: now,
      healthy: response.ok
    }

    return response.ok
  } catch (error) {
    lastHealthCheck = {
      timestamp: now,
      healthy: false
    }
    return false
  }
}

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Main proxy request handler with retry mechanism
 */
async function proxyRequest(
  request: NextRequest,
  path: string[],
  method: string
) {
  const startTime = Date.now()

  try {
    // Construct the correct API path
    const urlPath = path.length > 0 ? '/' + path.join('/') : ''
    const targetUrl = `${API_URL}/api${urlPath}`

    console.log(`📤 [${method}] Proxying request to: ${targetUrl}`)

    // Check backend health before proceeding (for non-health endpoints)
    if (!urlPath.includes('/health')) {
      const isHealthy = await checkBackendHealth()
      if (!isHealthy) {
        console.warn(`⚠️  Backend API at ${API_URL} appears to be down`)
        return NextResponse.json(
          {
            error: 'Backend API Unavailable',
            message: `Cannot connect to backend API at ${API_URL}. Please ensure the API server is running on port 3101.`,
            details: {
              apiUrl: API_URL,
              suggestion: 'Run "cd apps/api && npm run dev" to start the backend API server',
              healthCheckFailed: true
            }
          },
          { status: 503 }
        )
      }
    }

    // Get request body for POST/PUT/PATCH
    let body: string | undefined
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      body = await request.text()
      if (body.length > 100) {
        console.log(`📦 Request body: ${body.substring(0, 100)}... (${body.length} chars)`)
      } else {
        console.log(`📦 Request body: ${body}`)
      }
    }

    // Forward headers (excluding host and connection)
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase()
      if (lowerKey !== 'host' && lowerKey !== 'connection') {
        headers[key] = value
      }
    })

    console.log(`📋 Request headers:`, Object.keys(headers))

    // Retry logic
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${MAX_RETRIES} for ${method} ${targetUrl}`)

        // Create abort controller for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

        // Make request to backend API
        const response = await fetch(targetUrl, {
          method,
          headers,
          body,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        const duration = Date.now() - startTime
        console.log(`📥 Response status: ${response.status} (${duration}ms)`)

        // Get response body
        const responseData = await response.text()

        if (responseData.length > 200) {
          console.log(`📦 Response body: ${responseData.substring(0, 200)}... (${responseData.length} chars)`)
        } else {
          console.log(`📦 Response body: ${responseData}`)
        }

        // Forward important headers from backend response
        const responseHeaders = new Headers()
        responseHeaders.set('Content-Type', response.headers.get('content-type') || 'application/json')

        // Add CORS headers to support credentials
        const origin = request.headers.get('origin') || 'http://127.0.0.1:3000'
        responseHeaders.set('Access-Control-Allow-Origin', origin)
        responseHeaders.set('Access-Control-Allow-Credentials', 'true')
        responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
        responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, Cookie')

        // Critical: Forward ALL Set-Cookie headers for httpOnly cookie authentication
        const setCookies = response.headers.getSetCookie?.() || []
        if (setCookies.length > 0) {
          setCookies.forEach(cookie => {
            responseHeaders.append('Set-Cookie', cookie)
          })
          console.log(`🍪 Forwarding ${setCookies.length} Set-Cookie headers`)
        }

        // Success - update health check cache
        lastHealthCheck = {
          timestamp: Date.now(),
          healthy: true
        }

        // Return response with same status and headers
        return new NextResponse(responseData, {
          status: response.status,
          headers: responseHeaders,
        })

      } catch (fetchError: any) {
        lastError = fetchError

        // Check if it's a timeout or abort error
        if (fetchError.name === 'AbortError') {
          console.error(`⏱️  Request timeout on attempt ${attempt}/${MAX_RETRIES}`)
        } else if (fetchError.code === 'ECONNREFUSED') {
          console.error(`🔌 Connection refused on attempt ${attempt}/${MAX_RETRIES}: ${API_URL}`)
        } else {
          console.error(`❌ Fetch error on attempt ${attempt}/${MAX_RETRIES}:`, fetchError.message)
        }

        // Don't retry on the last attempt
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY * attempt // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`)
          await sleep(delay)
        }
      }
    }

    // All retries failed
    throw lastError || new Error('Unknown error occurred during proxy request')

  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error(`❌ Proxy error after ${duration}ms:`, {
      message: error.message,
      code: error.code,
      cause: error.cause,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    })

    // Determine appropriate error response based on error type
    if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      return NextResponse.json(
        {
          error: 'Backend API Connection Refused',
          message: `Failed to connect to backend API at ${API_URL}. The API server is not running.`,
          details: {
            apiUrl: API_URL,
            errorCode: 'ECONNREFUSED',
            suggestion: 'Please start the backend API server:\n1. cd apps/api\n2. npm run dev\n\nThe server should start on port 3101',
            retries: MAX_RETRIES,
            duration: `${duration}ms`
          }
        },
        { status: 503 }
      )
    } else if (error.name === 'AbortError') {
      return NextResponse.json(
        {
          error: 'Request Timeout',
          message: `Request to backend API timed out after ${REQUEST_TIMEOUT}ms`,
          details: {
            timeout: REQUEST_TIMEOUT,
            retries: MAX_RETRIES,
            duration: `${duration}ms`
          }
        },
        { status: 504 }
      )
    } else {
      return NextResponse.json(
        {
          error: 'Proxy Request Failed',
          message: error.message || 'An unexpected error occurred',
          details: {
            errorCode: error.code,
            retries: MAX_RETRIES,
            duration: `${duration}ms`,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
          }
        },
        { status: 500 }
      )
    }
  }
}
