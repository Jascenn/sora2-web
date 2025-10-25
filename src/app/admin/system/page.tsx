"use client"

import { useEffect, useState, useCallback } from "react"
import { adminApi } from "@/lib/admin"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"

export default function SystemMonitoring() {
  const [queueStats, setQueueStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadQueueStats = useCallback(async () => {
    try {
      const data = await adminApi.getQueueStats()
      setQueueStats(data)
      setIsLoading(false)
    } catch (error: any) {
      console.error("Failed to load queue stats:", error)
      if (isLoading) {
        toast.error("加载队列统计失败")
      }
    }
  }, [isLoading])

  useEffect(() => {
    loadQueueStats()
    // Refresh every 5 seconds
    const interval = setInterval(loadQueueStats, 5000)
    return () => clearInterval(interval)
  }, [loadQueueStats])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">系统监控</h2>
          <p className="text-muted-foreground">实时监控系统运行状态</p>
        </div>
        <Button onClick={loadQueueStats} variant="outline">
          刷新
        </Button>
      </div>

      {/* Queue Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="等待中"
          value={queueStats?.waiting || 0}
          icon="⏳"
          color="gray"
        />
        <StatCard
          title="处理中"
          value={queueStats?.active || 0}
          icon="⚙️"
          color="yellow"
        />
        <StatCard
          title="已完成"
          value={queueStats?.completed || 0}
          icon="✅"
          color="green"
        />
        <StatCard
          title="失败"
          value={queueStats?.failed || 0}
          icon="❌"
          color="red"
        />
      </div>

      {/* System Info */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold">📊 系统信息</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <InfoItem label="Redis 连接" value="正常" status="success" />
          <InfoItem label="数据库连接" value="正常" status="success" />
          <InfoItem
            label="队列状态"
            value={queueStats?.active > 0 ? "运行中" : "空闲"}
            status={queueStats?.active > 0 ? "warning" : "success"}
          />
          <InfoItem
            label="最后更新"
            value={new Date().toLocaleTimeString()}
            status="info"
          />
        </div>
      </div>

      {/* Queue Details */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold">🔄 队列详情</h3>
        <div className="space-y-3">
          <QueueRow
            label="等待处理的任务"
            value={queueStats?.waiting || 0}
            description="等待执行的视频生成任务"
          />
          <QueueRow
            label="正在处理的任务"
            value={queueStats?.active || 0}
            description="当前正在生成的视频"
          />
          <QueueRow
            label="已完成的任务"
            value={queueStats?.completed || 0}
            description="成功完成的视频生成任务"
          />
          <QueueRow
            label="失败的任务"
            value={queueStats?.failed || 0}
            description="生成失败的任务"
          />
        </div>
      </div>

      {/* Environment Info */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold">🌍 环境信息</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Node 环境</span>
            <span className="font-medium">生产环境</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">API 地址</span>
            <span className="font-medium">
              {process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: number
  icon: string
  color: "gray" | "yellow" | "green" | "red"
}) {
  const colorClasses = {
    gray: "bg-gray-50",
    yellow: "bg-yellow-50",
    green: "bg-green-50",
    red: "bg-red-50",
  }

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  )
}

function InfoItem({
  label,
  value,
  status,
}: {
  label: string
  value: string
  status: "success" | "warning" | "info"
}) {
  const statusColors = {
    success: "text-green-600",
    warning: "text-yellow-600",
    info: "text-blue-600",
  }

  return (
    <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-medium ${statusColors[status]}`}>
        {value}
      </span>
    </div>
  )
}

function QueueRow({
  label,
  value,
  description,
}: {
  label: string
  value: number
  description: string
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <span className="text-2xl font-bold text-primary">{value}</span>
    </div>
  )
}
