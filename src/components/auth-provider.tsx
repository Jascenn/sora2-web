"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/store/auth.store"

// Temporary bypass login for development (controlled by BYPASS_AUTH env var)
const BYPASS_LOGIN = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setLoading, isLoading, _hasHydrated } = useAuthStore()

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

    // TEMPORARILY DISABLE ALL AUTH CHECKS
    setLoading(false)
    console.log('[AuthProvider] Auth checks DISABLED to prevent refresh loop')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated])

  // Show loading while hydrating
  if (!_hasHydrated || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    )
  }

  return <>{children}</>
}
