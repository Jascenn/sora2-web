import { api } from "./api"

export interface VideoConfig {
  duration: number
  resolution: string
  aspectRatio: string
  style?: string
  fps: number
}

export interface GenerateVideoData {
  prompt: string
  negativePrompt?: string
  config: VideoConfig
}

export const videoApi = {
  async generate(data: GenerateVideoData) {
    const response = await api.post("/videos/generate", data)
    return response.data.data || response.data
  },

  async list(params?: { page?: number; limit?: number; status?: string }) {
    const response = await api.get("/videos", { params })
    return response.data.data || response.data
  },

  async getById(id: string) {
    const response = await api.get(`/videos/${id}`)
    return response.data.data || response.data
  },

  async getStatus(id: string) {
    const response = await api.get(`/videos/${id}/status`)
    return response.data.data || response.data
  },

  async delete(id: string) {
    const response = await api.delete(`/videos/${id}`)
    return response.data.data || response.data
  },

  async regenerate(id: string) {
    const response = await api.post(`/videos/${id}/regenerate`)
    return response.data.data || response.data
  },
}

export const creditApi = {
  async getBalance() {
    const response = await api.get("/credits/balance")
    return response.data.data || response.data
  },

  async getTransactions(params?: { page?: number; limit?: number }) {
    const response = await api.get("/credits/transactions", { params })
    return response.data.data || response.data
  },
}
