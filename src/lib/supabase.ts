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
 * Database types - generated from Supabase
 */
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          phone: string | null
          password_hash: string
          nickname: string
          avatar_url: string | null
          credits: number
          role: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          phone?: string | null
          password_hash: string
          nickname: string
          avatar_url?: string | null
          credits?: number
          role?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          phone?: string | null
          password_hash?: string
          nickname?: string
          avatar_url?: string | null
          credits?: number
          role?: string
          status?: string
          created_at?: string
          updated_at?: string
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
          status: string
          file_url: string | null
          thumbnail_url: string | null
          file_size: number | null
          cost_credits: number
          openai_task_id: string | null
          error_message: string | null
          created_at: string
          completed_at: string | null
          updated_at: string
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
          status?: string
          file_url?: string | null
          thumbnail_url?: string | null
          file_size?: number | null
          cost_credits: number
          openai_task_id?: string | null
          error_message?: string | null
          created_at?: string
          completed_at?: string | null
          updated_at?: string
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
          status?: string
          file_url?: string | null
          thumbnail_url?: string | null
          file_size?: number | null
          cost_credits?: number
          openai_task_id?: string | null
          error_message?: string | null
          created_at?: string
          completed_at?: string | null
          updated_at?: string
        }
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          type: string
          amount: number
          balance_after: number
          related_id: string | null
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          amount: number
          balance_after: number
          related_id?: string | null
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          amount?: number
          balance_after?: number
          related_id?: string | null
          description?: string
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
          payment_method: string
          status: string
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_no: string
          amount: number
          credits: number
          payment_method: string
          status?: string
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          order_no?: string
          amount?: number
          credits?: number
          payment_method?: string
          status?: string
          paid_at?: string | null
          created_at?: string
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
