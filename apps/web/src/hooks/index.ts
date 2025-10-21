/**
 * Custom Hooks Index
 *
 * Week 3: Frontend Architecture Upgrade - TanStack Query Data Fetching
 */

// Auth hooks
export { useLogin, useRegister, useLogout, useRefreshToken } from './use-auth'

// User hooks
export {
  useUserBalance,
  useUserProfile,
  useUpdateProfile,
  useCreditTransactions,
} from './use-user'

// Video hooks
export {
  useVideos,
  useVideo,
  useDeleteVideo,
  useRegenerateVideo,
  // useDownloadVideo, // TODO: Implement download API endpoint
} from './use-videos'

// Generation hooks
export { useGenerateVideo, useEstimateCredits } from './use-generate'
