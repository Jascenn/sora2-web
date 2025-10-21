"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useGenerateVideo, useEstimateCredits, useUserBalance } from "@/hooks"
import { useAuthStore, useVideoStore } from "@/store"
import { generateVideoSchema, type GenerateVideoFormData } from "@/lib/schemas"

export default function GeneratePageRefactored() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { isGenerating, generationProgress, generationMessage } = useVideoStore()

  const { data: balance } = useUserBalance()
  const { mutate: generateVideo } = useGenerateVideo()
  const { calculateCredits } = useEstimateCredits()

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<GenerateVideoFormData>({
    resolver: zodResolver(generateVideoSchema),
    defaultValues: {
      duration: 10,
      resolution: '1080p',
      aspectRatio: '16:9',
      fps: 30,
      model: 'sora-2',
    },
  })

  // Watch form values for credit estimation
  const watchedValues = watch()
  const estimatedCredits = calculateCredits({
    duration: watchedValues.duration || 10,
    resolution: watchedValues.resolution || '1080p',
    aspectRatio: watchedValues.aspectRatio || '16:9',
    fps: watchedValues.fps || 30,
  })

  const onSubmit = (data: GenerateVideoFormData) => {
    // Check credits
    if (balance !== undefined && balance < estimatedCredits) {
      alert(`积分不足！需要 ${estimatedCredits} 积分，当前余额 ${balance} 积分`)
      return
    }

    generateVideo({
      prompt: data.prompt,
      negativePrompt: data.negativePrompt,
      config: {
        duration: data.duration,
        resolution: data.resolution,
        aspectRatio: data.aspectRatio,
        fps: data.fps,
      },
    })
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-2xl font-bold text-primary">
            Sora2
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/gallery" className="text-sm hover:text-primary">
              作品展示
            </Link>
            <Link href="/profile" className="text-sm hover:text-primary">
              个人中心
            </Link>
            {user?.role === 'admin' && (
              <Link href="/admin" className="text-sm font-medium text-purple-600">
                ⚙️ 管理后台
              </Link>
            )}
            <span className="text-sm font-medium text-primary">
              💎 {balance ?? user?.credits ?? 0} 积分
            </span>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-2 text-4xl font-bold">AI 视频生成</h1>
          <p className="mb-8 text-muted-foreground">
            输入文字描述，让 AI 为你创造精美视频
          </p>

          <div className="rounded-lg border bg-white p-8 shadow-sm">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Prompt Input */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  视频描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register("prompt")}
                  rows={4}
                  placeholder="描述你想要生成的视频内容，例如：一只可爱的猫咪在花园里玩耍，阳光明媚..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {errors.prompt && (
                  <p className="mt-1 text-sm text-red-600">{errors.prompt.message}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {watchedValues.prompt?.length || 0} / 500 字符
                </p>
              </div>

              {/* Negative Prompt (Optional) */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  负面提示词 (可选)
                </label>
                <input
                  {...register("negativePrompt")}
                  type="text"
                  placeholder="不想出现的内容，例如：模糊、低质量、水印..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {errors.negativePrompt && (
                  <p className="mt-1 text-sm text-red-600">{errors.negativePrompt.message}</p>
                )}
              </div>

              {/* Duration */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  视频时长: {watchedValues.duration || 10} 秒
                </label>
                <input
                  {...register("duration", { valueAsNumber: true })}
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  className="w-full"
                />
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-600">{errors.duration.message}</p>
                )}
              </div>

              {/* Resolution */}
              <div>
                <label className="mb-2 block text-sm font-medium">分辨率</label>
                <select
                  {...register("resolution")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="720p">720p (HD)</option>
                  <option value="1080p">1080p (Full HD)</option>
                  <option value="4K">4K (Ultra HD)</option>
                </select>
                {errors.resolution && (
                  <p className="mt-1 text-sm text-red-600">{errors.resolution.message}</p>
                )}
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="mb-2 block text-sm font-medium">宽高比</label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { value: '16:9', label: '16:9 (横屏)' },
                    { value: '9:16', label: '9:16 (竖屏)' },
                    { value: '1:1', label: '1:1 (正方形)' },
                    { value: '4:3', label: '4:3 (传统)' },
                  ].map((ratio) => (
                    <label key={ratio.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        {...register("aspectRatio")}
                        type="radio"
                        value={ratio.value}
                        className="rounded"
                      />
                      <span className="text-sm">{ratio.label}</span>
                    </label>
                  ))}
                </div>
                {errors.aspectRatio && (
                  <p className="mt-1 text-sm text-red-600">{errors.aspectRatio.message}</p>
                )}
              </div>

              {/* Credit Estimation */}
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">预计消耗积分</span>
                  <span className="text-2xl font-bold text-primary">
                    {estimatedCredits} 积分
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  当前余额: {balance ?? user?.credits ?? 0} 积分
                </p>
              </div>

              {/* Progress Bar */}
              {isGenerating && (
                <div className="rounded-lg border bg-gray-50 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">{generationMessage}</span>
                    <span className="text-primary">{generationProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isGenerating || (balance !== undefined && balance < estimatedCredits)}
              >
                {isGenerating ? "生成中..." : "开始生成视频"}
              </Button>
            </form>
          </div>

          {/* Tips */}
          <div className="mt-8 rounded-lg border bg-white p-6">
            <h3 className="mb-4 font-semibold">💡 提示词技巧</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• 详细描述场景、动作、氛围和风格</li>
              <li>• 使用具体的形容词，如&ldquo;阳光明媚的&rdquo;、&ldquo;慢动作的&rdquo;等</li>
              <li>• 指定镜头角度，如&ldquo;俯视&rdquo;、&ldquo;特写&rdquo;等</li>
              <li>• 建议使用英文提示词获得更好效果</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
