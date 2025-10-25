import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Temporary bypass for development
const BYPASS_AUTH = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'

// Public routes that don't require authentication
const publicRoutes = ['/', '/login', '/register', '/gallery', '/terms', '/privacy', '/forgot-password', '/api']

// Check if a path is public
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route =>
    pathname === route ||
    pathname.startsWith(route + '/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')  // Static files
  )
}

export async function middleware(request: NextRequest) {
  // Skip middleware in development bypass mode
  if (BYPASS_AUTH) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  // Get token from cookie
  const token = request.cookies.get('token')?.value

  console.log('[Middleware]', pathname, 'has token:', !!token)

  // Special handling for login page
  if (pathname === '/login' || pathname === '/register') {
    // If has valid token, redirect away from login/register
    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key')
        const { payload } = await jwtVerify(token, secret)

        console.log('[Middleware] User already logged in, redirecting from auth page')
        const url = request.nextUrl.clone()
        url.pathname = payload.role === 'admin' ? '/admin' : '/generate'
        return NextResponse.redirect(url)
      } catch {
        // Invalid token, allow access to login page
        console.log('[Middleware] Invalid token on auth page, allowing access')
        return NextResponse.next()
      }
    }
    // No token, allow access to login/register
    return NextResponse.next()
  }

  // For all other routes, check if it's public
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Protected route - require valid token
  if (!token) {
    console.log('[Middleware] No token for protected route, redirecting to /login')
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Verify token for protected routes
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key')
    const { payload } = await jwtVerify(token, secret)

    console.log('[Middleware] Token verified for', pathname, 'user:', payload.email, 'role:', payload.role)

    // Check admin routes
    if (pathname.startsWith('/admin') && payload.role !== 'admin') {
      console.log('[Middleware] Non-admin trying to access admin route, redirecting to /generate')
      const url = request.nextUrl.clone()
      url.pathname = '/generate'
      return NextResponse.redirect(url)
    }

    // Token valid, allow request
    return NextResponse.next()
  } catch (error) {
    console.log('[Middleware] Token verification failed for', pathname, error)
    // Invalid token - redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
