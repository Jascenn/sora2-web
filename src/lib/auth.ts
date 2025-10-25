import { api } from "./api"
import { useAuthStore } from "@/store/auth.store"

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  nickname: string
}

export interface User {
  id: string
  email: string
  nickname: string
  credits: number
  role: string
  avatarUrl?: string
}

export interface AuthResponse {
  user: User
}

/**
 * Get current user from auth store
 * Note: This function accesses the store directly and should only be used
 * in non-reactive contexts (e.g., callbacks, event handlers)
 */
export function getUser(): User | null {
  return useAuthStore.getState().user
}

/**
 * Remove user from auth store (logout)
 * Note: This function accesses the store directly and should only be used
 * in non-reactive contexts (e.g., callbacks, event handlers)
 */
export function removeUser(): void {
  useAuthStore.getState().logout()
}

/**
 * Logout user - both clears local state and calls logout API
 * Note: This function accesses the store directly and should only be used
 * in non-reactive contexts (e.g., callbacks, event handlers)
 */
export async function logout(): Promise<void> {
  try {
    await authApi.logout()
  } catch (error) {
    console.error('Logout API call failed:', error)
  } finally {
    useAuthStore.getState().logout()
  }
}

export const authApi = {
  async login(data: LoginData): Promise<AuthResponse> {
    console.log('[authApi] Sending login request')
    const response = await api.post("/auth/login", data)
    console.log('[authApi] Login response:', response.data)
    return response.data.data // Extract data from success wrapper
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post("/auth/register", data)
    return response.data.data // Extract data from success wrapper
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout")
  },

  async getProfile(): Promise<any> {
    console.log('[authApi] Fetching profile')
    const response = await api.get("/users/profile")
    console.log('[authApi] Profile API response:', response.data)

    // The API returns { success: true, data: { user: {...} } }
    const user = response.data.data?.user || response.data.user || response.data.data
    console.log('[authApi] Extracted user:', user)
    return { user }
  },

  async refreshToken() {
    const response = await api.post("/auth/refresh")
    return response.data
  },
}
