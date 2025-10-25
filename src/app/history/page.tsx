"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store/auth.store"

// Mock data for video history
const mockHistory = [
  {
    id: "1",
    title: "未来城市",
    description: "展示2050年的智能城市",
    thumbnail: "/api/placeholder/1",
    videoUrl: "/api/placeholder/video/1",
    createdAt: "2025-01-20T10:30:00Z",
    duration: "30s",
    status: "completed",
    creditsUsed: 50
  },
  {
    id: "2",
    title: "自然风光",
    description: "山川河流的壮丽景色",
    thumbnail: "/api/placeholder/2",
    videoUrl: "/api/placeholder/video/2",
    createdAt: "2025-01-19T15:45:00Z",
    duration: "45s",
    status: "completed",
    creditsUsed: 75
  },
  {
    id: "3",
    title: "科技生活",
    description: "AI改变日常生活的场景",
    thumbnail: "/api/placeholder/3",
    videoUrl: null,
    createdAt: "2025-01-18T09:20:00Z",
    duration: "60s",
    status: "processing",
    creditsUsed: 100
  },
  {
    id: "4",
    title: "艺术创作",
    description: "AI生成的艺术作品",
    thumbnail: "/api/placeholder/4",
    videoUrl: "/api/placeholder/video/4",
    createdAt: "2025-01-17T14:10:00Z",
    duration: "25s",
    status: "completed",
    creditsUsed: 40
  }
]

export default function HistoryPage() {
  const { user } = useAuthStore()
  const [videos, setVideos] = useState(mockHistory)
  const [filter, setFilter] = useState<"all" | "completed" | "processing">("all")

  const filteredVideos = videos.filter(video => {
    if (filter === "all") return true
    return video.status === filter
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-primary">
                ← 返回首页
              </Link>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">
              历史记录
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {user?.nickname || "用户"}的生成历史
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  共生成 {videos.length} 个视频，消耗 {videos.reduce((sum, v) => sum + v.creditsUsed, 0)} 积分
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">当前积分</p>
                <p className="text-2xl font-bold text-primary">
                  {user?.credits || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            全部 ({videos.length})
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "outline"}
            onClick={() => setFilter("completed")}
          >
            已完成 ({videos.filter(v => v.status === "completed").length})
          </Button>
          <Button
            variant={filter === "processing" ? "default" : "outline"}
            onClick={() => setFilter("processing")}
          >
            处理中 ({videos.filter(v => v.status === "processing").length})
          </Button>
        </div>

        {/* Video Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-200 relative">
                {video.videoUrl ? (
                  <video
                    className="w-full h-full object-cover"
                    controls
                    poster={video.thumbnail}
                  >
                    <source src={video.videoUrl} type="video/mp4" />
                    您的浏览器不支持视频播放
                  </video>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-gray-500">处理中...</p>
                    </div>
                  </div>
                )}
                <Badge
                  className="absolute top-2 right-2"
                  variant={video.status === "completed" ? "default" : "secondary"}
                >
                  {video.status === "completed" ? "已完成" : "处理中"}
                </Badge>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{video.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {video.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{video.duration}</span>
                  <span>-{video.creditsUsed} 积分</span>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  {formatDate(video.createdAt)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📹</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              暂无{filter === "completed" ? "已完成的" : filter === "processing" ? "处理中的" : ""}视频
            </h3>
            <p className="text-gray-500 mb-4">
              {filter === "all"
                ? "您还没有生成任何视频"
                : filter === "completed"
                  ? "还没有已完成的视频"
                  : "还没有正在处理的视频"}
            </p>
            <Link href="/generate">
              <Button>开始生成视频</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}