"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export default function SimpleGeneratePage() {
  const [apiKey, setApiKey] = useState("")
  const [prompt, setPrompt] = useState("")
  const [aspectRatio, setAspectRatio] = useState("16:9")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [videoId, setVideoId] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [gifUrl, setGifUrl] = useState<string | null>(null)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [completedPrompt, setCompletedPrompt] = useState<string>("")
  const [progressLogs, setProgressLogs] = useState<string[]>([])
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [progressPercent, setProgressPercent] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [enlargedMedia, setEnlargedMedia] = useState<{ type: 'video' | 'image' | 'gif', url: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load API key from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('sora2_api_key')
    if (savedKey) {
      setApiKey(savedKey)
    }
  }, [])

  // Timer effect for elapsed time and progress
  useEffect(() => {
    if (!isGenerating || !startTime) return

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setElapsedTime(elapsed)

      // Estimate progress (assume 90 seconds total, cap at 95%)
      const estimatedProgress = Math.min((elapsed / 90) * 100, 95)
      setProgressPercent(estimatedProgress)
    }, 1000)

    return () => clearInterval(interval)
  }, [isGenerating, startTime])

  const handleApiKeyChange = (value: string) => {
    setApiKey(value)
    if (value) {
      localStorage.setItem('sora2_api_key', value)
    } else {
      localStorage.removeItem('sora2_api_key')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const downloadFile = (url: string, filename: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePasteImage = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read()
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type)
            const file = new File([blob], 'pasted-image.png', { type })
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
              setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
            return
          }
        }
      }
      setErrorMessage('剪贴板中没有图片')
    } catch (err) {
      setErrorMessage('无法访问剪贴板，请手动上传图片')
    }
  }

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setErrorMessage('请输入 API 密钥')
      return
    }

    if (!prompt.trim()) {
      setErrorMessage('请输入视频提示词')
      return
    }

    setIsGenerating(true)
    setErrorMessage('')
    setStatusMessage('开始生成视频...')
    setVideoId(null)
    setVideoUrl(null)
    setThumbnailUrl(null)
    setGifUrl(null)
    setTaskId(null)
    setGenerationId(null)
    setCreatedAt(null)
    setCompletedPrompt("")
    setShowDetails(false)
    setStartTime(Date.now())
    setElapsedTime(0)
    setProgressPercent(0)
    setProgressLogs([`[${new Date().toLocaleTimeString()}] 🚀 初始化生成请求...`])

    try {
      // Call API with SSE
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          image: imagePreview,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'API 请求失败')
      }

      // Handle SSE stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('无法读取响应流')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            try {
              const event = JSON.parse(data)

              const timestamp = new Date().toLocaleTimeString()

              if (event.type === 'start') {
                const msg = event.message || '开始生成视频...'
                setStatusMessage(msg)
                setProgressLogs(prev => [...prev, `[${timestamp}] ✅ ${msg}`])
              } else if (event.type === 'progress') {
                const msg = event.message || '生成中...'
                setStatusMessage(msg)
                setProgressLogs(prev => [...prev, `[${timestamp}] ⏳ ${msg}`])
              } else if (event.type === 'complete') {
                setStatusMessage('视频生成完成！')
                setProgressPercent(100)
                setProgressLogs(prev => [...prev, `[${timestamp}] 🎉 视频生成完成！`, `[${timestamp}] 📹 视频URL: ${event.videoUrl}`])
                setVideoId(event.videoId || event.id || `video-${Date.now()}`)
                setVideoUrl(event.videoUrl)
                setThumbnailUrl(event.thumbnailUrl)
                setGifUrl(event.gifUrl)
                setTaskId(event.taskId || event.videoId || event.id)
                setGenerationId(event.generationId || event.id)
                setCreatedAt(new Date().toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }))
                setCompletedPrompt(prompt)
                setShowDetails(true)
                setIsGenerating(false)
              } else if (event.type === 'error') {
                setErrorMessage(event.error || '生成失败')
                setProgressLogs(prev => [...prev, `[${timestamp}] ❌ 错误: ${event.error || '生成失败'}`])
                setIsGenerating(false)
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error: any) {
      setErrorMessage(error.message || '视频生成失败')
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      {/* Header - Notion style */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="container mx-auto flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="text-2xl">🎬</div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Sora-2 视频生成器</h1>
            </div>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-md hover:bg-gray-50">
              返回首页
            </Link>
            <Link href="/generate">
              <Button variant="ghost" size="sm" className="font-medium text-sm h-8">
                完整版
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* WeChat QR Code Section - Notion style callout */}
      <div className="bg-amber-50/30 border-b border-amber-100/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-start gap-3 max-w-3xl mx-auto">
            <div className="text-xl mt-0.5">📱</div>
            <div className="flex-1">
              <h2 className="font-semibold text-sm text-gray-900 mb-0.5">加微信领取邀请码和提示词</h2>
              <p className="text-xs text-gray-600">扫描二维码，获取专属资源</p>
            </div>
            <button className="group relative">
              <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-all">
                <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                  <span className="text-xl">🔍</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Notion page style */}
      <main className="container mx-auto px-6 py-12 max-w-3xl">
        <div className="bg-white rounded-lg border border-gray-100 p-10 shadow-sm hover:shadow-md transition-shadow">
          {/* API Key Input - Notion style */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API 密钥 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder="请输入您的 Sora-2 API 密钥"
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-gray-400 focus:ring-0 transition-colors hover:border-gray-300"
              />
              {apiKey && (
                <button
                  onClick={() => handleApiKeyChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm p-1"
                >
                  ✕
                </button>
              )}
            </div>
            {apiKey ? (
              <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
                <span>✓</span> 密钥已保存到本地
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-gray-500">
                还没有 API 密钥？
                <a
                  href="https://vibecodingapi.ai/register"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-1"
                >
                  点击注册获取 →
                </a>
              </p>
            )}
          </div>

          {/* Prompt Input - Notion style */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              视频提示词 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述你想要生成的视频内容，例如：一支笔自己画了一幅画"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm leading-relaxed focus:outline-none focus:border-gray-400 focus:ring-0 transition-colors hover:border-gray-300 min-h-[120px] resize-y"
              maxLength={1000}
            />
            <p className="mt-1.5 text-xs text-gray-400">{prompt.length}/1000 字符</p>
          </div>

          {/* Aspect Ratio - Notion style */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              视频方向
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAspectRatio("16:9")}
                className={`rounded-md border p-3 text-center transition-all ${
                  aspectRatio === "16:9"
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="text-xl mb-1">🖼️</div>
                <div className="text-xs font-medium text-gray-700">横屏 (16:9)</div>
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio("9:16")}
                className={`rounded-md border p-3 text-center transition-all ${
                  aspectRatio === "9:16"
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="text-xl mb-1">📱</div>
                <div className="text-xs font-medium text-gray-700">竖屏 (9:16)</div>
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio("1:1")}
                className={`rounded-md border p-3 text-center transition-all ${
                  aspectRatio === "1:1"
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="text-xl mb-1">⬜</div>
                <div className="text-xs font-medium text-gray-700">方形 (1:1)</div>
              </button>
            </div>
          </div>

          {/* Image Upload - Notion style */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              参考图片（可选）
            </label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating}
                className="flex-1"
              >
                📁 上传图片
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handlePasteImage}
                disabled={isGenerating}
                className="flex-1"
              >
                📋 粘贴图片
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            {imagePreview && (
              <div className="mt-3 relative inline-block">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={200}
                  height={200}
                  className="max-w-[200px] max-h-[200px] rounded-lg border-2 border-gray-200 object-cover"
                />
                <button
                  onClick={() => {
                    setImageFile(null)
                    setImagePreview(null)
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Generate Button - Notion style */}
          <div className="space-y-2">
            <button
              onClick={handleGenerate}
              disabled={!apiKey || !prompt || isGenerating}
              className="w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
            >
              {isGenerating ? "生成中..." : "生成视频"}
            </button>
          </div>

          {/* Progress Logs - Notion style */}
          {isGenerating && progressLogs.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              {/* Header with spinner */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{statusMessage}</p>
                    <p className="text-xs text-gray-500">已用时: {formatTime(elapsedTime)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-gray-700 tabular-nums">{Math.round(progressPercent)}%</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gray-700 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Logs */}
              <div className="bg-white rounded-md border border-gray-200 p-3 max-h-40 overflow-y-auto">
                <div className="space-y-1">
                  {progressLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-gray-600 font-mono leading-relaxed border-l-2 border-gray-300 pl-2"
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer tip */}
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-600 bg-white rounded-md border border-gray-200 p-2">
                <span>💡</span>
                <span>视频生成通常需要 1-2 分钟，系统正在努力工作中...</span>
              </div>
            </div>
          )}

          {/* Status Messages (when not generating) - Notion style */}
          {!isGenerating && statusMessage && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-700">ℹ️ {statusMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">⚠️ {errorMessage}</p>
            </div>
          )}

          {/* Video Details - Notion style */}
          {showDetails && videoUrl && (
            <div className="mt-6 bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Success Header - Notion style */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">✓</div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">视频生成完成</h3>
                    <p className="text-sm text-gray-500">Generation Completed</p>
                  </div>
                </div>
              </div>

              {/* Details Grid - Notion style */}
              <div className="p-6 space-y-4">
                {/* Task Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">🆔 任务 ID</p>
                    <p className="font-mono text-sm text-gray-900 break-all">{taskId}</p>
                  </div>
                  <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">🔖 生成 ID</p>
                    <p className="font-mono text-sm text-gray-900 break-all">{generationId}</p>
                  </div>
                  <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">🕐 创建时间</p>
                    <p className="font-mono text-sm text-gray-900 tabular-nums">{createdAt}</p>
                  </div>
                  <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">📐 视频方向</p>
                    <p className="text-sm text-gray-900 font-medium">
                      {aspectRatio === '16:9' && '🖼️ 横屏 (16:9)'}
                      {aspectRatio === '9:16' && '📱 竖屏 (9:16)'}
                      {aspectRatio === '1:1' && '⬜ 方形 (1:1)'}
                    </p>
                  </div>
                </div>

                {/* Prompt - Notion style */}
                <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">💬 提示词</p>
                    <button
                      onClick={() => copyToClipboard(completedPrompt)}
                      className="text-xs px-3 py-1.5 border border-gray-300 hover:border-gray-400 hover:bg-gray-100 text-gray-700 rounded-md transition-colors flex items-center gap-1.5"
                    >
                      {copySuccess ? '✓ 已复制' : '📋 复制'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words">{completedPrompt}</p>
                </div>

                {/* Video Preview - Notion style */}
                <div className="bg-white rounded-md p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700">📹 视频预览</p>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">主要内容</span>
                  </div>
                  <video
                    controls
                    className="w-full rounded-md border border-gray-200"
                    poster={thumbnailUrl || undefined}
                  >
                    <source src={videoUrl} type="video/mp4" />
                    您的浏览器不支持视频播放
                  </video>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => downloadFile(videoUrl, `sora-video-${taskId}.mp4`)}
                      className="flex-1 py-2 px-3 bg-gray-900 hover:bg-gray-800 text-white rounded-md transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <span>⬇️</span>
                      <span>下载视频</span>
                    </button>
                    <button
                      onClick={() => setEnlargedMedia({ type: 'video', url: videoUrl })}
                      className="py-2 px-4 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 rounded-md transition-colors text-sm font-medium"
                    >
                      🔍 放大
                    </button>
                  </div>
                </div>

                {/* Thumbnail and GIF - Side by Side - Notion style */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Thumbnail */}
                  {thumbnailUrl && (
                    <div className="group bg-white rounded-md p-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-700">🖼️ 缩略图</p>
                      </div>
                      <div
                        className="relative aspect-video bg-gray-100 rounded-md overflow-hidden cursor-pointer border border-gray-200 hover:border-gray-300 transition-all"
                        onClick={() => setEnlargedMedia({ type: 'image', url: thumbnailUrl })}
                      >
                        <Image
                          src={thumbnailUrl}
                          alt="Video thumbnail"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                      </div>
                      <button
                        onClick={() => downloadFile(thumbnailUrl, `sora-thumbnail-${taskId}.webp`)}
                        className="mt-2 w-full py-2 px-3 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 rounded-md transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <span>⬇️</span>
                        <span>下载缩略图</span>
                      </button>
                    </div>
                  )}

                  {/* GIF Preview - Notion style */}
                  {gifUrl ? (
                    <div className="group bg-white rounded-md p-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-700">🎞️ GIF 预览</p>
                      </div>
                      <div
                        className="relative aspect-video bg-gray-100 rounded-md overflow-hidden cursor-pointer border border-gray-200 hover:border-gray-300 transition-all"
                        onClick={() => setEnlargedMedia({ type: 'gif', url: gifUrl })}
                      >
                        <Image
                          src={gifUrl}
                          alt="Video GIF"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                      </div>
                      <button
                        onClick={() => downloadFile(gifUrl, `sora-gif-${taskId}.gif`)}
                        className="mt-2 w-full py-2 px-3 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 rounded-md transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <span>⬇️</span>
                        <span>下载 GIF</span>
                      </button>
                    </div>
                  ) : (
                    /* Placeholder if no GIF - Notion style */
                    thumbnailUrl && (
                      <div className="bg-gray-50 rounded-md p-3 border border-dashed border-gray-300">
                        <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                          <div className="text-5xl mb-3 opacity-20">🎞️</div>
                          <p className="text-sm font-medium text-gray-600 mb-1">GIF 未生成</p>
                          <p className="text-xs text-gray-400">API 响应中未包含<br/>GIF 资源</p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Notion style */}
        <footer className="mt-8 text-center text-sm text-gray-400">
          <p>
            Powered by{" "}
            <a
              href="https://vibecodingapi.ai/register"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sora-2 API
            </a>
          </p>
        </footer>
      </main>

      {/* Enlarged Media Modal - Notion style */}
      {enlargedMedia && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setEnlargedMedia(null)}
        >
          <div className="relative max-w-7xl w-full max-h-[90vh]">
            {/* Close Button */}
            <button
              onClick={() => setEnlargedMedia(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors flex items-center gap-2 text-base font-medium"
            >
              <span>✕ 关闭</span>
            </button>

            {/* Download Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                const filename = enlargedMedia.type === 'video' ? `sora-video-${taskId}.mp4`
                  : enlargedMedia.type === 'gif' ? `sora-gif-${taskId}.gif`
                  : `sora-thumbnail-${taskId}.webp`
                downloadFile(enlargedMedia.url, filename)
              }}
              className="absolute -top-12 right-24 text-white hover:text-gray-300 transition-colors flex items-center gap-2 text-base font-medium"
            >
              <span>⬇️ 下载</span>
            </button>

            {/* Media Content */}
            <div
              className="bg-black rounded-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {enlargedMedia.type === 'video' ? (
                <video
                  controls
                  autoPlay
                  className="w-full h-auto max-h-[85vh]"
                  src={enlargedMedia.url}
                />
              ) : (
                <div className="relative w-full" style={{ maxHeight: '85vh' }}>
                  <Image
                    src={enlargedMedia.url}
                    alt="Enlarged media"
                    width={1920}
                    height={1080}
                    className="w-full h-auto max-h-[85vh] object-contain"
                    unoptimized={enlargedMedia.type === 'gif'}
                  />
                </div>
              )}
            </div>

            {/* Type Label */}
            <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1.5 rounded-md text-sm font-medium">
              {enlargedMedia.type === 'video' && '📹 视频预览'}
              {enlargedMedia.type === 'image' && '🖼️ 缩略图'}
              {enlargedMedia.type === 'gif' && '🎞️ GIF 预览'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
