"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"

interface Video {
  id: string
  prompt: string
  duration: number
  resolution: string
  status: string
  thumbnailUrl?: string
  fileUrl?: string
  createdAt: string
}

export default function GalleryPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [detailVideo, setDetailVideo] = useState<Video | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)

  useEffect(() => {
    checkLoginStatus()
    loadVideos()
  }, [])

  const checkLoginStatus = async () => {
    try {
      const { getUser } = await import("@/lib/auth")
      const user = getUser()

      if (user) {
        setIsLoggedIn(true)
        setUserInfo(user)
      }
    } catch (error) {
      console.error("Failed to check login status:", error)
    }
  }

  const handleLogout = async () => {
    const { logout } = await import("@/lib/auth")
    logout()
  }

  // Auto-refresh when there are processing/pending videos
  useEffect(() => {
    const hasProcessingVideos = videos.some(
      (v) => v.status === "processing" || v.status === "pending"
    )

    if (hasProcessingVideos) {
      console.log("🔄 Auto-refresh enabled - detected processing videos")
      const interval = setInterval(() => {
        console.log("🔄 Auto-refreshing video list...")
        loadVideos()
      }, 10000) // Refresh every 10 seconds

      return () => {
        console.log("🛑 Auto-refresh disabled")
        clearInterval(interval)
      }
    }
  }, [videos])

  const loadVideos = async () => {
    try {
      const { videoApi } = await import("@/lib/video")
      const { getUser } = await import("@/lib/auth")

      const user = getUser()
      if (!user) {
        // Not logged in, show empty state
        setIsLoading(false)
        return
      }

      const result = await videoApi.list()
      setVideos(result.videos || [])
    } catch (error) {
      console.error("Failed to load videos:", error)
      // If cookie expired, clear user data
      if ((error as any).response?.status === 401) {
        const { removeUser } = await import("@/lib/auth")
        removeUser()
        setIsLoggedIn(false)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegenerate = async (videoId: string) => {
    try {
      const { videoApi } = await import("@/lib/video")

      // 调用重新生成接口
      await videoApi.regenerate(videoId)

      // 刷新列表
      await loadVideos()

      toast.success("视频已重新提交生成！")
    } catch (error: any) {
      console.error("Failed to regenerate video:", error)
      toast.error(error.message || "重新生成失败，请稍后重试")
    }
  }

  const handlePreview = (video: Video) => {
    if (video.status === "completed" && video.fileUrl) {
      setSelectedVideo(video)
    }
  }

  const handleDownload = async (video: Video) => {
    if (!video.fileUrl) {
      toast.error('视频文件不可用')
      return
    }

    setDownloadingId(video.id)
    try {
      // 获取视频
      const response = await fetch(video.fileUrl)
      if (!response.ok) throw new Error('下载失败')

      const blob = await response.blob()

      // 创建下载链接
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sora-video-${video.id}-${Date.now()}.mp4`
      document.body.appendChild(a)
      a.click()

      // 清理
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('下载成功')
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('下载失败，请重试')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = async (videoId: string) => {
    try {
      const { videoApi } = await import("@/lib/video")

      await videoApi.delete(videoId)

      // 刷新列表
      await loadVideos()

      // 关闭确认对话框
      setDeleteConfirm(null)

      toast.success("视频已删除")
    } catch (error: any) {
      console.error("Failed to delete video:", error)
      toast.error(error.message || "删除失败，请稍后重试")
    }
  }

  const handleShowDetails = (video: Video) => {
    setDetailVideo(video)
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
            <Link href="/generate" className="text-sm hover:text-primary">
              开始创作
            </Link>
            {isLoggedIn ? (
              <>
                <Link href="/profile" className="text-sm hover:text-primary">
                  个人中心
                </Link>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {userInfo?.nickname || userInfo?.email}
                  </span>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    退出
                  </Button>
                </div>
              </>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">
                  登录
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">作品展示</h1>
          <p className="text-muted-foreground">
            浏览由 AI 生成的精彩视频作品
          </p>
        </div>

        {/* Status Banner - Show count of processing videos */}
        {!isLoading && videos.some((v) => v.status === "processing" || v.status === "pending") && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 animate-spin text-yellow-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm font-medium text-yellow-800">
                正在生成 {videos.filter((v) => v.status === "processing" || v.status === "pending").length} 个视频，页面将自动刷新...
              </span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 flex gap-4">
          <select className="rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option>全部分辨率</option>
            <option>720p</option>
            <option>1080p</option>
            <option>4K</option>
          </select>
          <select className="rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option>最新发布</option>
            <option>最多观看</option>
            <option>最多点赞</option>
          </select>
        </div>

        {/* Loading State with Skeleton */}
        {isLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-lg border bg-white shadow-sm"
              >
                <div className="aspect-video animate-pulse bg-gray-200" />
                <div className="p-4">
                  <div className="mb-2 h-4 animate-pulse rounded bg-gray-200" />
                  <div className="mb-3 h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                  <div className="flex gap-2">
                    <div className="h-8 flex-1 animate-pulse rounded bg-gray-200" />
                    <div className="h-8 flex-1 animate-pulse rounded bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Video Grid */}
        {!isLoading && videos.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <div
                key={video.id}
                className="overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div
                  className={`relative aspect-video bg-gray-200 ${
                    video.status === "completed" && video.fileUrl
                      ? "cursor-pointer"
                      : ""
                  }`}
                  onClick={() => handlePreview(video)}
                >
                  {video.thumbnailUrl ? (
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.prompt}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-sm text-muted-foreground">
                        {video.status === "completed" ? "点击播放视频" : "生成中..."}
                      </p>
                    </div>
                  )}
                  {video.status === "completed" && video.fileUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100">
                      <div className="rounded-full bg-white/90 p-4">
                        <svg
                          className="h-8 w-8 text-primary"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                    {video.duration}s
                  </div>
                  <div className="absolute top-2 left-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        video.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : video.status === "processing"
                          ? "bg-yellow-100 text-yellow-700"
                          : video.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {video.status === "completed"
                        ? "已完成"
                        : video.status === "processing"
                        ? "生成中"
                        : video.status === "failed"
                        ? "失败"
                        : "等待中"}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="mb-2 line-clamp-2 text-sm">
                    {video.prompt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{video.resolution}</span>
                    <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* 操作按钮 */}
                  <div className="mt-3 flex gap-2">
                    {/* 查看详情按钮 - 所有视频都显示 */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleShowDetails(video)
                      }}
                    >
                      📋 详情
                    </Button>

                    {/* 下载按钮 - 仅对已完成的视频显示 */}
                    {video.status === "completed" && video.fileUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(video)
                        }}
                        disabled={downloadingId === video.id}
                      >
                        {downloadingId === video.id ? '下载中...' : '📥 下载'}
                      </Button>
                    )}

                    {/* 重新生成按钮 - 仅对失败的视频显示 */}
                    {video.status === "failed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => handleRegenerate(video.id)}
                      >
                        🔄 重新生成
                      </Button>
                    )}

                    {/* 删除按钮 - 所有视频都显示 */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteConfirm(video.id)
                      }}
                    >
                      🗑️ 删除
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State (if no videos) */}
        {!isLoading && videos.length === 0 && (
          <div className="py-16 text-center">
            <div className="mb-4 flex justify-center">
              <svg className="h-24 w-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold">还没有生成任何视频</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              开始创作您的第一个 AI 视频作品
            </p>
            <Link href="/generate">
              <Button size="lg">立即开始创作</Button>
            </Link>
          </div>
        )}
      </main>

      {/* Video Player Modal */}
      {selectedVideo && selectedVideo.fileUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              className="absolute -top-12 right-0 text-white hover:text-gray-300"
              onClick={() => setSelectedVideo(null)}
            >
              <svg
                className="h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Video Player */}
            <video
              className="w-full rounded-lg shadow-2xl"
              controls
              autoPlay
              src={selectedVideo.fileUrl}
            >
              您的浏览器不支持视频播放
            </video>

            {/* Video Info */}
            <div className="mt-4 rounded-lg bg-white p-4">
              <h3 className="mb-2 text-lg font-semibold">
                {selectedVideo.prompt}
              </h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>时长: {selectedVideo.duration}秒</span>
                <span>分辨率: {selectedVideo.resolution}</span>
                <span>
                  创建时间:{" "}
                  {new Date(selectedVideo.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(selectedVideo)}
                  disabled={downloadingId === selectedVideo.id}
                >
                  {downloadingId === selectedVideo.id ? '下载中...' : '📥 下载视频'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedVideo.fileUrl!)
                    toast.success("视频链接已复制到剪贴板")
                  }}
                >
                  🔗 复制链接
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Details Modal */}
      {detailVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDetailVideo(null)}
        >
          <div
            className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">视频详情</h2>
              <button
                onClick={() => setDetailVideo(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  提示词
                </label>
                <p className="mt-1 text-base">{detailVideo.prompt}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    状态
                  </label>
                  <p className="mt-1">
                    <span
                      className={`rounded-full px-3 py-1 text-sm ${
                        detailVideo.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : detailVideo.status === "processing"
                          ? "bg-yellow-100 text-yellow-700"
                          : detailVideo.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {detailVideo.status === "completed"
                        ? "已完成"
                        : detailVideo.status === "processing"
                        ? "生成中"
                        : detailVideo.status === "failed"
                        ? "失败"
                        : "等待中"}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    创建时间
                  </label>
                  <p className="mt-1">
                    {new Date(detailVideo.createdAt).toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    时长
                  </label>
                  <p className="mt-1">{detailVideo.duration} 秒</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    分辨率
                  </label>
                  <p className="mt-1">{detailVideo.resolution}</p>
                </div>
              </div>

              {detailVideo.fileUrl && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    视频URL
                  </label>
                  <p className="mt-1 truncate text-sm text-blue-600">
                    {detailVideo.fileUrl}
                  </p>
                </div>
              )}

              {detailVideo.thumbnailUrl && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    缩略图
                  </label>
                  <div className="relative mt-2 aspect-video">
                    <Image
                      src={detailVideo.thumbnailUrl}
                      alt="Thumbnail"
                      fill
                      className="rounded-lg border object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDetailVideo(null)}
              >
                关闭
              </Button>
              {detailVideo.status === "completed" && detailVideo.fileUrl && (
                <Button onClick={() => handlePreview(detailVideo)}>
                  播放视频
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-xl font-bold">确认删除</h2>
            <p className="mb-6 text-gray-600">
              确定要删除这个视频吗？此操作不可撤销。
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
              >
                取消
              </Button>
              <Button
                variant="outline"
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={() => handleDelete(deleteConfirm)}
              >
                确认删除
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
