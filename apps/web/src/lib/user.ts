import { api } from "./api"

export interface User {
  id: string
  email: string
  nickname: string
  avatarUrl?: string
  credits: number
  role: string
  status: string
  createdAt: string
}

export interface CreditTransaction {
  id: string
  type: "consume" | "refund" | "recharge"
  amount: number
  balanceAfter: number
  relatedId?: string
  description: string
  createdAt: string
}

export const userApi = {
  async getProfile() {
    const response = await api.get("/users/profile")
    return response.data.data || response.data
  },

  async updateProfile(data: { nickname?: string; avatarUrl?: string }) {
    const response = await api.put("/users/profile", data)
    return response.data.data || response.data
  },

  async getCreditBalance() {
    const response = await api.get("/credits/balance")
    return response.data.data || response.data
  },

  async getCreditTransactions(params?: { page?: number; limit?: number }) {
    const response = await api.get("/credits/transactions", { params })
    return response.data.data || response.data
  },

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    const response = await api.put("/users/password", data)
    return response.data.data || response.data
  },
}
