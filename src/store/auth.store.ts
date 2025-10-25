import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { authApi } from '@/lib/auth'

export interface User {
  id: string
  email: string
  nickname: string
  credits: number
  role: string
  avatarUrl?: string
}

// Non-sensitive user data for persistence
interface PersistedAuthData {
  isAuthenticated: boolean
  userId?: string
  nickname?: string
  avatarUrl?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthActions {
  setUser: (user: User | null) => void
  updateCredits: (credits: number) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  refreshUser: () => Promise<void>
}

type AuthStore = AuthState & AuthActions

// Secure storage that only persists non-sensitive data
const secureStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null
    try {
      const item = window.localStorage.getItem(name)
      if (!item) return null

      const data = JSON.parse(item) as PersistedAuthData

      // Verify session is still valid by checking with server
      if (data.isAuthenticated && data.userId) {
        // Return the persisted data for rehydration
        return JSON.stringify({
          isAuthenticated: true,
          user: {
            id: data.userId,
            nickname: data.nickname,
            avatarUrl: data.avatarUrl,
            email: '', // Will be filled by refreshUser
            credits: 0, // Will be filled by refreshUser
            role: 'user', // Will be filled by refreshUser
          },
          isLoading: false,
        } as AuthState)
      }

      // Clear invalid data
      window.localStorage.removeItem(name)
      return null
    } catch {
      return null
    }
  },

  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return
    try {
      const fullData = JSON.parse(value) as AuthState

      // Only persist non-sensitive data when authenticated
      if (fullData.isAuthenticated && fullData.user) {
        const secureData: PersistedAuthData = {
          isAuthenticated: true,
          userId: fullData.user.id,
          nickname: fullData.user.nickname,
          avatarUrl: fullData.user.avatarUrl,
        }

        window.localStorage.setItem(name, JSON.stringify(secureData))
      } else {
        // Clear storage when not authenticated
        window.localStorage.removeItem(name)
      }
    } catch {
      // If we can't parse, don't persist
      window.localStorage.removeItem(name)
    }
  },

  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(name)
  },
}

// Temporary bypass login for development (controlled by BYPASS_AUTH env var)
const BYPASS_LOGIN = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State - Default to logged in as admin in development
      user: BYPASS_LOGIN ? {
        id: 'admin-001',
        email: 'admin@sora2.com',
        nickname: 'Administrator',
        credits: 999999,
        role: 'admin',
        avatarUrl: undefined,
      } : null,
      isAuthenticated: BYPASS_LOGIN ? true : false,
      isLoading: false,

      // Actions
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      updateCredits: (credits) =>
        set((state) => ({
          user: state.user ? { ...state.user, credits } : null,
        })),

      logout: async () => {
        try {
          // Call server to invalidate session
          await authApi.logout()
        } catch (error) {
          console.error('Logout error:', error)
        }

        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      setLoading: (loading) =>
        set({
          isLoading: loading,
        }),

      refreshUser: async () => {
        try {
          const response = await authApi.getProfile()
          const user = response.user || response
          set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
          })
        } catch (error) {
          // User is not authenticated
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },
    }),
    {
      name: 'sora2-auth',
      storage: createJSONStorage(() => secureStorage as any),

      // Rehydrate: Only restore authentication status, fetch fresh user data
      onRehydrateStorage: () => (state) => {
        if (state?.isAuthenticated) {
          // Refresh user data from server on app load
          state.refreshUser()
        } else {
          if (state) {
            state.isLoading = false
          }
        }
      },

      // Don't persist sensitive data
      skipHydration: false,
      version: 1,
    }
  )
)
