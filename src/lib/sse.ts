import { fetchEventSource } from '@microsoft/fetch-event-source'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface SSEEvent {
  event: 'start' | 'progress' | 'complete' | 'error'
  data: any
}

export interface SSECallbacks {
  onStart?: (data: any) => void
  onProgress?: (data: { message: string; percent: number }) => void
  onComplete?: (data: any) => void
  onError?: (error: { message: string; code?: number }) => void
  onClose?: () => void
}

/**
 * Generate video with Server-Sent Events for real-time progress
 */
export async function generateVideoWithSSE(
  prompt: string,
  config: {
    duration: number
    resolution: string
    aspectRatio: string
    style?: string
    fps: number
    model?: string
  },
  negativePrompt: string | undefined,
  callbacks: SSECallbacks,
  signal?: AbortSignal
): Promise<void> {
  const ctrl = new AbortController()

  // If external signal is provided, listen to it
  if (signal) {
    signal.addEventListener('abort', () => ctrl.abort())
  }

  await fetchEventSource(`${API_URL}/videos/generate-stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      negativePrompt,
      config,
    }),
    credentials: 'include', // Send cookies for authentication
    signal: ctrl.signal,

    async onopen(response) {
      if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
        // Connection established
        return
      }

      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        // Client error - don't retry
        const error = await response.json().catch(() => ({ message: 'Request failed' }))
        callbacks.onError?.({ message: error.message || 'Request failed', code: response.status })
        throw new Error(error.message || 'Request failed')
      } else {
        // Server error or rate limit - will retry
        throw new Error(`Server error: ${response.status}`)
      }
    },

    onmessage(msg) {
      if (!msg.event || !msg.data) return

      try {
        const data = JSON.parse(msg.data)

        switch (msg.event) {
          case 'start':
            callbacks.onStart?.(data)
            break
          case 'progress':
            callbacks.onProgress?.(data)
            break
          case 'complete':
            callbacks.onComplete?.(data)
            break
          case 'error':
            callbacks.onError?.(data)
            break
        }
      } catch (error) {
        console.error('Failed to parse SSE message:', error)
      }
    },

    onerror(err) {
      console.error('SSE error:', err)
      // Don't throw - let the library handle retries
      // Only call onError for fatal errors
      if (err instanceof Error && err.message.includes('Request failed')) {
        throw err // Stop retrying on client errors
      }
    },

    onclose() {
      callbacks.onClose?.()
    },

    // Retry configuration
    openWhenHidden: true, // Keep connection open when tab is hidden
  })
}
