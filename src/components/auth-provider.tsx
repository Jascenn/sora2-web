"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/store/auth.store"
import { authApi } from "@/lib/auth"

// Temporary bypass login for development (controlled by BYPASS_AUTH env var)
const BYPASS_LOGIN = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, isLoading, _hasHydrated } = useAuthStore()

  useEffect(() => {
    // Skip auth check in development mode
    if (BYPASS_LOGIN) {
      setLoading(false)
      return
    }

    // Wait for zustand to finish hydrating from localStorage
    if (!_hasHydrated) {
      console.log('[AuthProvider] Waiting for state hydration...')
      return
    }

    const checkUser = async () => {
      setLoading(true)

      try {
        // Fetch user profile from server using httpOnly cookie
        // Middleware already verified the token, so this should succeed
        const response = await authApi.getProfile()
        console.log('[AuthProvider] Profile loaded:', response.user?.email, 'role:', response.user?.role)

        if (response && response.user) {
          setUser(response.user)
        } else {
          console.log('[AuthProvider] No user data returned')
          setUser(null)
        }
      } catch (error: any) {
        console.log('[AuthProvider] Failed to load profile:', error?.response?.status)
        // Clear user state on error
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated])

  // Show loading while hydrating or checking auth
  if (!_hasHydrated || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    )
  }

  return <>{children}</>
}
