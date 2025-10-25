"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/store/auth.store"
import { authApi } from "@/lib/auth"
import { usePathname, useRouter } from "next/navigation"

// Temporary bypass login for development (controlled by BYPASS_AUTH env var)
const BYPASS_LOGIN = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'

// List of routes that are publicly accessible
const publicRoutes = ["/", "/login", "/register", "/gallery", "/terms", "/privacy", "/forgot-password"]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, setUser, setLoading, isLoading, _hasHydrated } = useAuthStore()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Skip auth check in development mode
    if (BYPASS_LOGIN) {
      setLoading(false)
      return
    }

    // CRITICAL: Wait for zustand to finish hydrating from localStorage
    if (!_hasHydrated) {
      console.log('[AuthProvider] Waiting for state hydration...')
      return
    }

    const checkUser = async () => {
      setLoading(true)

      try {
        // ALWAYS check with server using the httpOnly cookie - don't trust local state
        const response = await authApi.getProfile()
        console.log('[AuthProvider] Profile check response:', response)

        if (response && response.user) {
          console.log('[AuthProvider] Setting user:', response.user.email, 'role:', response.user.role)
          setUser(response.user)
        } else {
          console.log('[AuthProvider] No user found, clearing state')
          setUser(null)
        }
      } catch (error: any) {
        console.log('[AuthProvider] Profile check failed, status:', error?.response?.status)
        // Clear user state on any error
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated])

  useEffect(() => {
    // Skip auth checks in development mode
    if (BYPASS_LOGIN) {
      return
    }

    // Skip auth checks while loading
    if (isLoading) {
      return
    }

    const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))
    const isLoginPage = pathname === "/login"
    const isRegisterPage = pathname === "/register"
    const isAdminRoute = pathname.startsWith("/admin")

    console.log('[AuthProvider] Auth check:', {
      isAuthenticated,
      pathname,
      user: user?.email,
      isLoading
    })

    // Don't redirect on login/register pages - let login flow handle it
    if (isLoginPage || isRegisterPage) {
      console.log('[AuthProvider] On auth page, skipping checks')
      return
    }

    // If not authenticated and not on a public route, redirect to login
    if (!isAuthenticated && !isPublicRoute) {
      console.log('[AuthProvider] Not authenticated, redirecting to login')
      router.replace("/login")
      return
    }

    // If authenticated but not an admin and trying to access admin route, redirect
    if (isAuthenticated && user?.role !== 'admin' && isAdminRoute) {
      console.log('[AuthProvider] Non-admin user trying to access admin route')
      router.replace("/generate")
      return
    }
  }, [isLoading, isAuthenticated, user, pathname, router])


  // Show loading while hydrating or checking auth
  if (!_hasHydrated || isLoading) {
    // You can return a global loading spinner here
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    )
  }

  return <>{children}</>
}
