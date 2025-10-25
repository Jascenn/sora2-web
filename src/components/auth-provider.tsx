"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/store/auth.store"
import { authApi } from "@/lib/auth"
import { usePathname, useRouter } from "next/navigation"

// Temporary bypass login for development
const BYPASS_LOGIN = process.env.NODE_ENV === 'development'

// List of routes that are publicly accessible
const publicRoutes = ["/login", "/register"]

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
      const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
      const isAdminRoute = pathname.startsWith("/admin")

      if (!isAuthenticated && !isPublicRoute) {
        // If not authenticated and not on a public route, redirect to login
        router.push("/login")
      } else if (isAuthenticated && user?.role !== 'admin' && isAdminRoute) {
        // If authenticated but not an admin and trying to access admin route, redirect
        router.push("/profile")
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
