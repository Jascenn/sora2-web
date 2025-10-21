import { api } from "./api"

export interface SystemStats {
  users: {
    total_users: number
    active_users: number
    banned_users: number
    total_credits: number
  }
  videos: {
    total_videos: number
    completed_videos: number
    processing_videos: number
    failed_videos: number
    pending_videos: number
    total_storage: number
  }
  credits: {
    total_purchases: number
    total_consumption: number
    total_refunds: number
  }
  orders: {
    total_orders: number
    paid_orders: number
    total_revenue: number
  }
  queue: {
    waiting: number
    active: number
    completed: number
    failed: number
  }
}

export interface AdminUser {
  id: string
  email: string
  nickname: string
  avatarUrl?: string
  credits: number
  role: string
  status: string
  createdAt: string
}

export interface AdminVideo {
  id: string
  prompt: string
  duration: number
  resolution: string
  aspectRatio: string
  status: string
  fileUrl?: string
  thumbnailUrl?: string
  costCredits: number
  createdAt: string
  completedAt?: string
  errorMessage?: string
  userEmail: string
  userName: string
}

export interface CreditTransaction {
  id: string
  type: string
  amount: number
  balanceAfter: number
  description: string
  createdAt: string
  userEmail: string
  userName: string
}

export const adminApi = {
  // Get system statistics
  async getStats(): Promise<SystemStats> {
    const response = await api.get("/admin/stats")
    return response.data.data || response.data
  },

  // Get all users
  async getUsers(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
  }) {
    const response = await api.get("/admin/users", { params })
    return response.data.data || response.data
  },

  // Update user credits
  async updateUserCredits(userId: string, credits: number, reason: string) {
    const response = await api.put(`/admin/users/${userId}/credits`, {
      credits,
      reason,
    })
    return response.data.data || response.data
  },

  // Update user status (ban/unban)
  async updateUserStatus(userId: string, status: "active" | "banned") {
    const response = await api.put(`/admin/users/${userId}/status`, { status })
    return response.data.data || response.data
  },

  // Get all videos
  async getVideos(params?: { page?: number; limit?: number; status?: string }) {
    const response = await api.get("/admin/videos", { params })
    return response.data.data || response.data
  },

  // Delete video
  async deleteVideo(videoId: string) {
    const response = await api.delete(`/admin/videos/${videoId}`)
    return response.data.data || response.data
  },

  // Get credit transactions
  async getTransactions(params?: {
    page?: number
    limit?: number
    type?: string
    userId?: string
  }) {
    const response = await api.get("/admin/transactions", { params })
    return response.data.data || response.data
  },

  // Get queue stats
  async getQueueStats() {
    const response = await api.get("/admin/queue/stats")
    return response.data.data || response.data
  },

  // Get system configurations
  async getConfigs(category?: string) {
    const response = await api.get("/admin/configs", {
      params: category ? { category } : undefined,
    })
    return response.data.data || response.data
  },

  // Update single configuration
  async updateConfig(key: string, value: string) {
    const response = await api.put(`/admin/configs/${key}`, { value })
    return response.data.data || response.data
  },

  // Update multiple configurations
  async updateConfigs(configs: Record<string, string>) {
    const response = await api.put("/admin/configs", { configs })
    return response.data.data || response.data
  },
}
