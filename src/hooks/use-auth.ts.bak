import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/lib/auth'
import { useAuthStore } from '@/store/auth.store'
import type { User } from '@/store/auth.store'
import { toast } from '@/lib/toast'
import { useRouter } from 'next/navigation'

interface LoginData {
  email: string
  password: string
}

interface RegisterData {
  email: string
  password: string
  nickname: string
}

/**
 * Login mutation
 */
export function useLogin() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LoginData) => authApi.login(data),
    onSuccess: async (response) => {
      console.log('[Login] Success, user:', response.user.email, 'role:', response.user.role)

      toast.success('登录成功')

      // Cookie is set by server, middleware will handle routing based on role
      // Just navigate to trigger middleware check
      const targetPath = response.user.role === 'admin' ? '/admin' : '/generate'
      console.log('[Login] Redirecting to:', targetPath)

      // Use full page reload to ensure middleware runs
      window.location.href = targetPath
    },
    onError: (error: any) {
      const message = error.response?.data?.error || '登录失败，请检查邮箱和密码'
      toast.error(message)
    },
  })
}

/**
 * Register mutation
 */
export function useRegister() {
  const router = useRouter()
  const { setUser } = useAuthStore()

  return useMutation({
    mutationFn: (data: RegisterData) => authApi.register(data),
    onSuccess: (response) => {
      // Update auth store
      setUser(response.user as User)

      toast.success(`注册成功！已赠送 ${response.user.credits} 积分`)

      // Redirect to generate page
      router.push('/generate')
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || '注册失败，请稍后再试'
      toast.error(message)
    },
  })
}

/**
 * Logout mutation
 */
export function useLogout() {
  const router = useRouter()
  const { logout } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      // Clear auth store
      logout()

      // Clear all queries
      queryClient.clear()

      toast.success('已退出登录')

      // Redirect to home
      router.push('/')
    },
    onError: (error: any) => {
      // Even if API call fails, still log out client-side
      logout()
      queryClient.clear()
      router.push('/')

      console.error('Logout error:', error)
    },
  })
}

/**
 * Refresh token mutation
 */
export function useRefreshToken() {
  const { setUser, logout } = useAuthStore()
  const router = useRouter()

  return useMutation({
    mutationFn: () => authApi.refreshToken(),
    onSuccess: (response) => {
      // Update auth store with refreshed user data
      if (response.user) {
        setUser(response.user as User)
      }
    },
    onError: () => {
      // If refresh fails, log out user
      logout()
      router.push('/login')
      toast.error('登录已过期，请重新登录')
    },
  })
}
