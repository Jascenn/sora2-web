export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export const success = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  data,
  message
})

export const error = (message: string, error?: any): ApiResponse => ({
  success: false,
  error: message
})
