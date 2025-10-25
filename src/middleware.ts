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

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Get token from cookie
  const token = request.cookies.get('token')?.value

  // No token - redirect to login
  if (!token) {
    console.log('[Middleware] No token found, redirecting to /login')
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Verify token
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-min-32-characters-long!')
    const { payload } = await jwtVerify(token, secret)

    console.log('[Middleware] Token verified, user:', payload.email, 'role:', payload.role)

    // Check admin routes
    if (pathname.startsWith('/admin') && payload.role !== 'admin') {
      console.log('[Middleware] Non-admin trying to access admin route, redirecting to /generate')
      const url = request.nextUrl.clone()
      url.pathname = '/generate'
      return NextResponse.redirect(url)
    }

    // If on login page but already authenticated, redirect to appropriate page
    if (pathname === '/login') {
      console.log('[Middleware] Already authenticated, redirecting from login')
      const url = request.nextUrl.clone()
      url.pathname = payload.role === 'admin' ? '/admin' : '/generate'
      return NextResponse.redirect(url)
    }

    // Token valid, allow request
    return NextResponse.next()
  } catch (error) {
    console.log('[Middleware] Token verification failed:', error)
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
