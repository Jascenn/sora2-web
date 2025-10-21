import { useMutation, useQueryClient } from '@tanstack/react-query'
import { generateVideoWithSSE } from '@/lib/sse'
import { useVideoStore, type VideoConfig } from '@/store/video.store'
import { useAuthStore } from '@/store/auth.store'
import { toast } from '@/lib/toast'

interface GenerateVideoData {
  prompt: string
  negativePrompt?: string
  config: VideoConfig
}

/**
 * Generate video with SSE (Server-Sent Events) for real-time progress
 */
export function useGenerateVideo() {
  const queryClient = useQueryClient()
  const { addVideo, setGenerating, setGenerationProgress, resetGenerationState } = useVideoStore()
  const { updateCredits } = useAuthStore()

  return useMutation({
    mutationFn: async ({ prompt, negativePrompt, config }: GenerateVideoData) => {
      setGenerating(true)

      return new Promise((resolve, reject) => {
        generateVideoWithSSE(
          prompt,
          config,
          negativePrompt,
          {
            onStart: (data) => {
              setGenerationProgress(5, data.message || '开始生成...')
            },
            onProgress: (data) => {
              setGenerationProgress(data.percent, data.message)
            },
            onComplete: (data) => {
              setGenerationProgress(100, '生成完成')

              // Add video to store
              if (data.video) {
                addVideo(data.video)
              }

              // Update credits
              if (data.newBalance !== undefined) {
                updateCredits(data.newBalance)
              }

              resolve(data)
            },
            onError: (error) => {
              resetGenerationState()
              reject(error)
            },
          }
        )
      })
    },
    onSuccess: (data: any) => {
      // Invalidate videos query to refresh list
      queryClient.invalidateQueries({ queryKey: ['videos'] })

      // Reset generation state after short delay
      setTimeout(() => {
        resetGenerationState()
      }, 2000)

      toast.success('视频已加入生成队列')
    },
    onError: (error: any) => {
      resetGenerationState()

      const message = error.message || error.response?.data?.error || '生成失败，请稍后再试'
      toast.error(message)
    },
  })
}

/**
 * Calculate estimated credits based on video config
 */
export function useEstimateCredits() {
  const calculateCredits = (config: VideoConfig): number => {
    const { duration, resolution } = config

    // Base credits calculation
    let baseCredits = 0

    // Duration multiplier (credits per second)
    const durationMultiplier = 0.4 // 每秒0.4积分

    // Resolution multiplier
    let resolutionMultiplier = 1
    if (resolution === '1080p') {
      resolutionMultiplier = 2
    } else if (resolution === '4K') {
      resolutionMultiplier = 4
    }

    baseCredits = duration * durationMultiplier * resolutionMultiplier

    return Math.ceil(baseCredits)
  }

  return { calculateCredits }
}
