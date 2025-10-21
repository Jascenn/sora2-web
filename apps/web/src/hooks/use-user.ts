import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '@/lib/user'
import { useAuthStore } from '@/store/auth.store'

/**
 * Get user credit balance
 */
export function useUserBalance() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['user', 'balance', user?.id],
    queryFn: async () => {
      const response = await userApi.getCreditBalance()
      return response.balance
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Get user profile
 */
export function useUserProfile() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['user', 'profile', user?.id],
    queryFn: async () => {
      const response = await userApi.getProfile()
      return response.user
    },
    enabled: !!user,
  })
}

/**
 * Update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { user, setUser } = useAuthStore()

  return useMutation({
    mutationFn: (data: { nickname?: string; avatarUrl?: string }) =>
      userApi.updateProfile(data),
    onSuccess: (response) => {
      // Update cache
      queryClient.setQueryData(['user', 'profile', user?.id], response.user)

      // Update auth store
      if (user) {
        setUser({ ...user, ...response.user })
      }
    },
  })
}

/**
 * Get user credit transactions
 */
export function useCreditTransactions(page: number = 1, limit: number = 20) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['user', 'transactions', user?.id, page, limit],
    queryFn: async () => {
      const response = await userApi.getCreditTransactions({ page, limit })
      return response
    },
    enabled: !!user,
  })
}
