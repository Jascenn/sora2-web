export interface User {
  id: string
  email: string
  nickname: string
  avatarUrl?: string
  credits: number
  role: "user" | "admin"
  status: "active" | "banned"
  createdAt: string
  updatedAt: string
}

export interface Video {
  id: string
  userId: string
  prompt: string
  negativePrompt?: string
  duration: number
  resolution: "720p" | "1080p" | "4K"
  aspectRatio: string
  style?: string
  fps: number
  status: "pending" | "processing" | "completed" | "failed"
  fileUrl?: string
  thumbnailUrl?: string
  fileSize?: number
  costCredits: number
  openaiTaskId?: string
  errorMessage?: string
  createdAt: string
  completedAt?: string
}

export interface CreditTransaction {
  id: string
  userId: string
  type: "recharge" | "consume" | "gift" | "refund"
  amount: number
  balanceAfter: number
  relatedId?: string
  description: string
  createdAt: string
}

export interface Order {
  id: string
  userId: string
  orderNo: string
  amount: number
  credits: number
  paymentMethod: "wechat" | "alipay" | "stripe" | "paypal"
  status: "pending" | "paid" | "failed" | "refunded"
  paidAt?: string
  createdAt: string
}

export interface Template {
  id: string
  userId?: string
  name: string
  description: string
  prompt: string
  config: VideoGenerationConfig
  thumbnailUrl?: string
  isPublic: boolean
  usageCount: number
  createdAt: string
}

export interface VideoGenerationConfig {
  duration: number
  resolution: "720p" | "1080p" | "4K"
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:3"
  style?: string
  fps: 24 | 30 | 60
  movement?: "static" | "push" | "pull" | "orbit" | "tilt"
}
