import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { videoApi } from '@/lib/video'
import { useAuthStore } from '@/store/auth.store'
import { useVideoStore } from '@/store/video.store'
import type { Video } from '@/store/video.store'
import { toast } from '@/lib/toast'

/**
 * Get all videos for current user
 */
export function useVideos(filters?: {
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  limit?: number
  offset?: number
}) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['videos', user?.id, filters],
    queryFn: async () => {
      const response = await videoApi.list(filters)
      return response.videos as Video[]
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Get a single video by ID
 */
export function useVideo(videoId: string) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['video', videoId],
    queryFn: async () => {
      const response = await videoApi.getById(videoId)
      return response.video as Video
    },
    enabled: !!user && !!videoId,
  })
}

/**
 * Delete a video
 */
export function useDeleteVideo() {
  const queryClient = useQueryClient()
  const { deleteVideo } = useVideoStore()

  return useMutation({
    mutationFn: (videoId: string) => videoApi.delete(videoId),
    onSuccess: (_, videoId) => {
      // Update cache
      queryClient.invalidateQueries({ queryKey: ['videos'] })

      // Update store
      deleteVideo(videoId)

      toast.success('视频已删除')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || '删除失败')
    },
  })
}

/**
 * Regenerate a video
 */
export function useRegenerateVideo() {
  const queryClient = useQueryClient()
  const { addVideo } = useVideoStore()

  return useMutation({
    mutationFn: (videoId: string) => videoApi.regenerate(videoId),
    onSuccess: (response) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['videos'] })

      // Add to store
      if (response.video) {
        addVideo(response.video as Video)
      }

      toast.success('视频已重新加入生成队列')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || '重新生成失败')
    },
  })
}

/**
 * Download a video
 * Downloads the video file to the user's device
 * Only allows downloading videos owned by the current user
 */
export function useDownloadVideo() {
  return useMutation({
    mutationFn: async (videoId: string) => {
      const downloadUrl = await videoApi.download(videoId)
      return downloadUrl
    },
    onSuccess: (downloadUrl) => {
      // Trigger download by opening the download URL in a new window
      // The API endpoint will handle authentication and return the file with proper headers
      window.open(downloadUrl, '_blank')
      toast.success('下载已开始')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || '下载失败')
    },
  })
}
