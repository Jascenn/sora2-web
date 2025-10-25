/**
 * Supabase Client Configuration
 *
 * Provides both client-side and server-side Supabase clients
 */

import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Client-side Supabase client (browser)
 * Use this in React components and client-side code
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

/**
 * Server-side Supabase client with service role
 * Use this for admin operations and server-side API routes
 * Has full database access, bypassing Row Level Security
 */
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null

/**
 * Get Supabase client for Server Components
 * Use this in React Server Components
 */
export async function getSupabaseServer() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  })
}

/**
 * Get Supabase client for Client Components
 * Use this in React Client Components ('use client')
 */
export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Database types - optimized schema
 */

// Enum types
export type UserRole = 'user' | 'admin' | 'moderator'
export type UserStatus = 'active' | 'inactive' | 'banned' | 'pending_verification'
export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type TransactionType =
  | 'signup_bonus'
  | 'purchase'
  | 'video_generation'
  | 'refund'
  | 'admin_grant'
  | 'admin_deduct'
  | 'referral_bonus'
export type PaymentMethod = 'alipay' | 'wechat' | 'stripe' | 'paypal' | 'balance'
export type OrderStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'cancelled'

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          email_verified: boolean
          phone: string | null
          phone_verified: boolean
          password_hash: string
          nickname: string
          avatar_url: string | null
          bio: string | null
          credits: number
          role: UserRole
          status: UserStatus
          video_count: number
          total_spent_credits: number
          last_login_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          email: string
          email_verified?: boolean
          phone?: string | null
          phone_verified?: boolean
          password_hash: string
          nickname: string
          avatar_url?: string | null
          bio?: string | null
          credits?: number
          role?: UserRole
          status?: UserStatus
          video_count?: number
          total_spent_credits?: number
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          email_verified?: boolean
          phone?: string | null
          phone_verified?: boolean
          password_hash?: string
          nickname?: string
          avatar_url?: string | null
          bio?: string | null
          credits?: number
          role?: UserRole
          status?: UserStatus
          video_count?: number
          total_spent_credits?: number
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      videos: {
        Row: {
          id: string
          user_id: string
          prompt: string
          negative_prompt: string | null
          duration: number
          resolution: string
          aspect_ratio: string
          style: string | null
          fps: number
          status: VideoStatus
          file_url: string | null
          thumbnail_url: string | null
          file_size: number | null
          cost_credits: number
          openai_task_id: string | null
          error_message: string | null
          error_code: string | null
          metadata: Record<string, any>
          started_at: string | null
          completed_at: string | null
          failed_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          prompt: string
          negative_prompt?: string | null
          duration: number
          resolution: string
          aspect_ratio: string
          style?: string | null
          fps: number
          status?: VideoStatus
          file_url?: string | null
          thumbnail_url?: string | null
          file_size?: number | null
          cost_credits: number
          openai_task_id?: string | null
          error_message?: string | null
          error_code?: string | null
          metadata?: Record<string, any>
          started_at?: string | null
          completed_at?: string | null
          failed_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          prompt?: string
          negative_prompt?: string | null
          duration?: number
          resolution?: string
          aspect_ratio?: string
          style?: string | null
          fps?: number
          status?: VideoStatus
          file_url?: string | null
          thumbnail_url?: string | null
          file_size?: number | null
          cost_credits?: number
          openai_task_id?: string | null
          error_message?: string | null
          error_code?: string | null
          metadata?: Record<string, any>
          started_at?: string | null
          completed_at?: string | null
          failed_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          type: TransactionType
          amount: number
          balance_before: number
          balance_after: number
          related_id: string | null
          related_type: string | null
          description: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: TransactionType
          amount: number
          balance_before: number
          balance_after: number
          related_id?: string | null
          related_type?: string | null
          description: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: TransactionType
          amount?: number
          balance_before?: number
          balance_after?: number
          related_id?: string | null
          related_type?: string | null
          description?: string
          notes?: string | null
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          order_no: string
          amount: number
          credits: number
          payment_method: PaymentMethod
          payment_transaction_id: string | null
          payment_details: Record<string, any>
          status: OrderStatus
          discount_amount: number
          discount_code: string | null
          paid_at: string | null
          refunded_at: string | null
          cancelled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_no: string
          amount: number
          credits: number
          payment_method: PaymentMethod
          payment_transaction_id?: string | null
          payment_details?: Record<string, any>
          status?: OrderStatus
          discount_amount?: number
          discount_code?: string | null
          paid_at?: string | null
          refunded_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          order_no?: string
          amount?: number
          credits?: number
          payment_method?: PaymentMethod
          payment_transaction_id?: string | null
          payment_details?: Record<string, any>
          status?: OrderStatus
          discount_amount?: number
          discount_code?: string | null
          paid_at?: string | null
          refunded_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
