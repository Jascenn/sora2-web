"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { adminApi, type AdminVideo } from "@/lib/admin"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"

export default function VideosManagement() {
  const [videos, setVideos] = useState<AdminVideo[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")

  const loadVideos = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await adminApi.getVideos({
        page,
        limit: 20,
        status: statusFilter || undefined,
      })
      setVideos(data.videos)
      setTotal(data.total)
    } catch (error: any) {
      console.error("Failed to load videos:", error)
      toast.error("加载视频列表失败")
    } finally {
      setIsLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    loadVideos()
  }, [loadVideos])

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm("确定要删除该视频吗？此操作不可恢复。")) return

    try {
      await adminApi.deleteVideo(videoId)
      toast.success("删除成功")
      loadVideos()
    } catch (error: any) {
      toast.error(`删除失败: ${error.message}`)
    }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">视频管理</h2>
        <p className="text-muted-foreground">管理和审核用户生成的视频</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="rounded-md border px-4 py-2"
        >
          <option value="">全部状态</option>
          <option value="pending">等待中</option>
          <option value="processing">处理中</option>
          <option value="completed">已完成</option>
          <option value="failed">失败</option>
        </select>
      </div>

      {/* Videos Table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">缩略图</th>
                <th className="px-4 py-3 text-left text-sm font-medium">提示词</th>
                <th className="px-4 py-3 text-left text-sm font-medium">用户</th>
                <th className="px-4 py-3 text-left text-sm font-medium">参数</th>
                <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium">创建时间</th>
                <th className="px-4 py-3 text-right text-sm font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : videos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    暂无视频数据
                  </td>
                </tr>
              ) : (
                videos.map((video) => (
                  <tr key={video.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {video.thumbnailUrl ? (
                        <Image
                          src={video.thumbnailUrl}
                          alt="thumbnail"
                          width={112}
                          height={64}
                          className="rounded object-cover"
                        />
                      ) : (
                        <div className="h-16 w-28 rounded bg-gray-200 flex items-center justify-center text-gray-400">
                          无
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="truncate text-sm">{video.prompt}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium">{video.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {video.userEmail}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="space-y-1">
                        <p>{video.duration}秒</p>
                        <p className="text-xs text-muted-foreground">
                          {video.resolution} · {video.aspectRatio}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
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
                          ? "处理中"
                          : video.status === "failed"
                          ? "失败"
                          : "等待中"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(video.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {video.fileUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(video.fileUrl, "_blank")}
                          >
                            查看
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteVideo(video.id)}
                        >
                          删除
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="text-sm text-muted-foreground">
              共 {total} 个视频，第 {page}/{totalPages} 页
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
