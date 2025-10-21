"use client"

import { useEffect, useState } from "react"
import { adminApi, type SystemStats } from "@/lib/admin"
import { toast } from "@/lib/toast"

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setIsLoading(true)
      const data = await adminApi.getStats()
      setStats(data)
    } catch (error: any) {
      console.error("Failed to load stats:", error)
      toast.error("加载统计数据失败")
    } finally {
      setIsLoading(false)
    }
  }

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

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">无法加载统计数据</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">系统概览</h2>
        <p className="text-muted-foreground">实时监控系统运营数据</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* User Stats */}
        <StatsCard
          title="总用户数"
          value={stats.users.total_users}
          icon="👥"
          trend={`${stats.users.active_users} 活跃`}
        />
        <StatsCard
          title="总视频数"
          value={stats.videos.total_videos}
          icon="🎬"
          trend={`${stats.videos.completed_videos} 完成`}
        />
        <StatsCard
          title="总积分数"
          value={stats.users.total_credits}
          icon="💎"
          trend="系统总量"
        />
        <StatsCard
          title="月收入"
          value={`¥${(stats.orders.total_revenue || 0).toFixed(2)}`}
          icon="💰"
          trend={`${stats.orders.paid_orders} 笔订单`}
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* User Details */}
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-4 font-semibold flex items-center gap-2">
            <span>👥</span> 用户统计
          </h3>
          <div className="space-y-3">
            <StatRow
              label="总用户"
              value={stats.users.total_users}
              color="blue"
            />
            <StatRow
              label="活跃用户"
              value={stats.users.active_users}
              color="green"
            />
            <StatRow
              label="封禁用户"
              value={stats.users.banned_users}
              color="red"
            />
          </div>
        </div>

        {/* Video Details */}
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-4 font-semibold flex items-center gap-2">
            <span>🎬</span> 视频统计
          </h3>
          <div className="space-y-3">
            <StatRow
              label="总视频"
              value={stats.videos.total_videos}
              color="blue"
            />
            <StatRow
              label="已完成"
              value={stats.videos.completed_videos}
              color="green"
            />
            <StatRow
              label="处理中"
              value={stats.videos.processing_videos}
              color="yellow"
            />
            <StatRow
              label="失败"
              value={stats.videos.failed_videos}
              color="red"
            />
          </div>
        </div>

        {/* Queue Details */}
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-4 font-semibold flex items-center gap-2">
            <span>⚙️</span> 队列状态
          </h3>
          <div className="space-y-3">
            <StatRow label="等待中" value={stats.queue.waiting} color="gray" />
            <StatRow
              label="处理中"
              value={stats.queue.active}
              color="yellow"
            />
            <StatRow
              label="已完成"
              value={stats.queue.completed}
              color="green"
            />
            <StatRow label="失败" value={stats.queue.failed} color="red" />
          </div>
        </div>
      </div>

      {/* Credit Stats */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold">💰 积分统计（最近30天）</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-sm text-green-600 font-medium">充值总额</p>
            <p className="text-2xl font-bold text-green-700">
              {stats.credits.total_purchases || 0}
            </p>
          </div>
          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-sm text-red-600 font-medium">消费总额</p>
            <p className="text-2xl font-bold text-red-700">
              {Math.abs(stats.credits.total_consumption || 0)}
            </p>
          </div>
          <div className="rounded-lg bg-yellow-50 p-4">
            <p className="text-sm text-yellow-600 font-medium">退款总额</p>
            <p className="text-2xl font-bold text-yellow-700">
              {stats.credits.total_refunds || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Storage */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="mb-2 font-semibold">📦 存储使用</h3>
        <p className="text-2xl font-bold">
          {formatBytes(Number(stats.videos.total_storage) || 0)}
        </p>
      </div>
    </div>
  )
}

function StatsCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string
  value: number | string
  icon: string
  trend: string
}) {
  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{trend}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  )
}

function StatRow({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: "blue" | "green" | "yellow" | "red" | "gray"
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
    gray: "bg-gray-100 text-gray-700",
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span
        className={`rounded-full px-3 py-1 text-sm font-medium ${colorClasses[color]}`}
      >
        {value}
      </span>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
}
