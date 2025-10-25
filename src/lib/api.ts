import axios from "axios"

// Development bypass mode - matches backend setting
const BYPASS_AUTH = process.env.NODE_ENV === 'development'

// Use Next.js API route as proxy in development to avoid proxy issues
const API_URL = typeof window !== 'undefined'
  ? '/api/proxy'  // Client-side: use Next.js API route
  : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3101") + '/api'  // Server-side: direct connection

if (BYPASS_AUTH && typeof window !== 'undefined') {
  console.log('🔓 Development Mode: Authentication bypass enabled')
  console.log('   You are automatically logged in as admin')
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Enable sending cookies with CORS requests
  // This is critical for httpOnly cookie authentication
  withCredentials: true,
})

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // In development bypass mode, don't redirect on 401
    // This allows the app to work even if auth is not fully configured
    if (error.response?.status === 401 && !BYPASS_AUTH) {
      // Handle unauthorized access
      // Clear user data (token is automatically cleared by backend)
      if (typeof window !== "undefined") {
        localStorage.removeItem("user")
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)
