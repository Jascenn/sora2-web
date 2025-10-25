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
  const { user, isAuthenticated, setUser, setLoading, isLoading } = useAuthStore()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Skip auth check in development mode
    if (BYPASS_LOGIN) {
      setLoading(false)
      return
    }

    const checkUser = async () => {
      // If we already have a user from persisted state, trust it for a moment
      // but revalidate in the background.
      if (isAuthenticated) {
        setLoading(false)
        // Revalidate user data
        authApi.getProfile().then(response => {
          if (response.user) {
            setUser(response.user)
          } else {
            setUser(null)
          }
        }).catch(() => {
          setUser(null)
        })
        return
      }

      try {
        // Try to get user profile from the server using the httpOnly cookie
        const response = await authApi.getProfile()
        if (response.user) {
          setUser(response.user)
        } else {
          // No user from API, ensure we are logged out
          setUser(null)
          setLoading(false)
        }
      } catch (error) {
        // Error fetching profile, means we are not authenticated
        setUser(null)
        setLoading(false)
      }
    }

    checkUser()
  }, [isAuthenticated, setUser, setLoading])

  useEffect(() => {
    // Skip auth checks in development mode
    if (BYPASS_LOGIN) {
      return
    }

    if (!isLoading) {
      const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))
      const isLoginPage = pathname === "/login"
      const isAdminRoute = pathname.startsWith("/admin")

      console.log('[AuthProvider] Auth check:', {
        isAuthenticated,
        isLoginPage,
        isPublicRoute,
        pathname,
        user: user?.email
      })

      // If authenticated and on login page, redirect to appropriate page
      if (isAuthenticated && isLoginPage) {
        console.log('[AuthProvider] User authenticated on login page, redirecting...')
        if (user?.role === 'admin') {
          router.push("/admin")
        } else {
          router.push("/generate")
        }
        return
      }

      // If not authenticated and not on a public route, redirect to login
      if (!isAuthenticated && !isPublicRoute) {
        console.log('[AuthProvider] Not authenticated, redirecting to login')
        router.push("/login")
        return
      }

      // If authenticated but not an admin and trying to access admin route, redirect
      if (isAuthenticated && user?.role !== 'admin' && isAdminRoute) {
        console.log('[AuthProvider] Non-admin user trying to access admin route')
        router.push("/generate")
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, router])


  if (isLoading) {
    // You can return a global loading spinner here
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    )
  }

  return <>{children}</>
}
