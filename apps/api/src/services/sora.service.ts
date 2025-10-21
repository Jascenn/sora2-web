import axios from 'axios'
import { configService } from './config.service'
import { getApiKeyPool, initApiKeyPool, ApiKeyPoolService } from './apiKeyPool.service'

interface VideoGenerationParams {
  prompt: string
  negativePrompt?: string
  duration: number
  resolution: string
  aspectRatio: string
  style?: string
  fps: number
}

interface SoraResponse {
  id: string
  taskId?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  videoUrl?: string
  thumbnailUrl?: string
  gifUrl?: string
  error?: string
}

export class SoraService {
  private apiKey: string
  private baseUrl: string
  private keyPool: ApiKeyPoolService | null = null
  private useKeyPool: boolean = false
  private readonly customKeyProvided: boolean // Flag to permanently mark if custom key was provided

  constructor(customApiKey?: string, customBaseUrl?: string) {
    this.apiKey = customApiKey || process.env.OPENAI_API_KEY || ''
    this.baseUrl = customBaseUrl || process.env.API_BASE_URL || process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1'

    // Set permanent flag if custom API key is provided
    this.customKeyProvided = !!customApiKey

    // If custom API key is provided, don't use key pool
    if (customApiKey) {
      this.useKeyPool = false
      console.log('🔑 Using custom API key, key pool disabled')
    }

    if (!this.apiKey) {
      console.warn('⚠️  OPENAI_API_KEY is not configured - video generation will not work')
    }

    console.log('🔧 Sora API Configuration:', {
      baseUrl: this.baseUrl,
      hasApiKey: !!this.apiKey,
      usingCustomKey: !!customApiKey
    })
  }

  /**
   * Load configuration from database
   */
  private async loadConfig() {
    // Skip loading config if using custom API key
    if (this.customKeyProvided) {
      console.log('⏭️  Skipping config load - using custom API key (permanent flag)')
      return
    }

    if (this.useKeyPool === false) {
      console.log('⏭️  Skipping config load - key pool disabled')
      return
    }

    try {
      const config = await configService.getOpenAIConfig()
      if (config.apiKey) {
        this.apiKey = config.apiKey
      }
      if (config.apiBase) {
        this.baseUrl = config.apiBase
      }

      // Initialize API key pool if multiple keys are available
      const apiKeys = await configService.getApiKeys()
      if (apiKeys && apiKeys.length > 0) {
        this.keyPool = initApiKeyPool(apiKeys)
        this.useKeyPool = true
        console.log(`🔑 API Key Pool enabled with ${apiKeys.length} keys`)
      } else {
        this.keyPool = getApiKeyPool()
        this.useKeyPool = this.keyPool !== null
      }
    } catch (error) {
      console.warn('⚠️  Failed to load config from database, using environment variables')
    }
  }

  /**
   * Generate video using Sora-2 via chat completions
   */
  async generateVideo(params: VideoGenerationParams): Promise<SoraResponse> {
    // Load latest configuration from database
    await this.loadConfig()

    // Extra safety: ensure custom key is never overridden by pool
    const shouldUseKeyPool = this.useKeyPool && this.keyPool && !this.customKeyProvided
    const maxRetries = shouldUseKeyPool ? this.keyPool!.getPoolStatus().total : 1
    let lastError: any = null

    console.log(`🎯 Generation strategy: ${this.customKeyProvided ? 'Custom API Key' : (shouldUseKeyPool ? 'Key Pool' : 'Single Key')}`)

    // Try with key rotation
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Get API key from pool or use default
        let currentApiKey = this.apiKey
        if (shouldUseKeyPool) {
          const poolKey = this.keyPool!.getNextKey()
          if (!poolKey) {
            throw new Error('No available API keys in the pool - all keys exhausted')
          }
          currentApiKey = poolKey
        }

        if (!currentApiKey) {
          throw new Error('OPENAI_API_KEY is not configured - Please add your API key to .env file')
        }

        const result = await this.makeApiRequest(params, currentApiKey)

        // Mark success if using key pool
        if (shouldUseKeyPool) {
          this.keyPool!.markSuccess()
        }

        return result
      } catch (error: any) {
        lastError = error

        // Mark failure if using key pool
        if (shouldUseKeyPool) {
          this.keyPool!.markFailure(error)

          // Check if we should retry
          if (attempt < maxRetries - 1 && this.keyPool!.hasAvailableKeys()) {
            console.log(`🔄 Retrying with next API key (attempt ${attempt + 2}/${maxRetries})`)
            continue
          }
        }

        // If not using pool or no more retries, throw error
        break
      }
    }

    // All retries failed
    const errorMessage = lastError?.response?.data?.error?.message || lastError?.message || 'API call failed'
    throw new Error(`Failed to generate video after ${maxRetries} attempts: ${errorMessage}`)
  }

  /**
   * Make API request to generate video
   */
  private async makeApiRequest(params: VideoGenerationParams, apiKey: string): Promise<SoraResponse> {
    let videoUrl: string | null = null
    let thumbnailUrl: string | null = null
    let responseId: string | null = null

    // Log which API key is being used (masked)
    console.log(`🔐 Making request with API key: ${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}`)

    // 构建视频生成提示词
    const videoPrompt = `Generate a video: ${params.prompt}
Duration: ${params.duration}s
Resolution: ${params.resolution}
Aspect Ratio: ${params.aspectRatio}
FPS: ${params.fps}
${params.negativePrompt ? `Negative: ${params.negativePrompt}` : ''}`

    const requestHeaders = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }

    console.log('📤 Sending Sora-2 video generation request:', {
      url: `${this.baseUrl}/chat/completions`,
      model: 'sora-2',
      prompt: params.prompt.substring(0, 50) + '...',
      authHeader: `Bearer ${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}`
    })

    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: 'sora-2',
        messages: [
          {
            role: 'user',
            content: videoPrompt
          }
        ],
        stream: false
      },
      {
        headers: requestHeaders,
        timeout: 300000 // 5 minutes timeout for video generation
      }
    )

    console.log('✅ Sora-2 Response:', JSON.stringify(response.data, null, 2))

    responseId = response.data.id || null

    // 从响应中提取视频 URL 和缩略图 URL
    const content = response.data.choices?.[0]?.message?.content || ''

    // 详细日志：显示完整的 content 内容
    console.log('📝 Full API Response Content:')
    console.log('=' .repeat(80))
    console.log(content)
    console.log('=' .repeat(80))

    // 提取任务 ID (格式: task_xxx)
    let taskId: string | null = null
    const taskIdMatch = content.match(/task_[a-z0-9]+/i)
    if (taskIdMatch) {
      taskId = taskIdMatch[0]
    }

    // Check for AsyncData format first: [原始数据](https://asyncdata.net/source/xxx)
    const sourceUrlMatch = /\[原始数据\]\((https?:\/\/asyncdata\.net\/source\/[^)]+)\)/.exec(content)
    const sourceUrl = sourceUrlMatch ? sourceUrlMatch[1] : null

    // If we have a sourceUrl, fetch the actual video data from AsyncData
    if (sourceUrl) {
      console.log('🔗 Found AsyncData source URL:', sourceUrl)
      console.log('📥 Fetching video details from AsyncData...')

      try {
        const detailResponse = await axios.get(sourceUrl, {
          timeout: 30000 // 30 seconds timeout for fetching details
        })

        console.log('✅ AsyncData Response:', JSON.stringify(detailResponse.data, null, 2))

        // Extract video information from AsyncData response
        const asyncData = detailResponse.data
        videoUrl = asyncData.url || asyncData.videoUrl || null
        thumbnailUrl = asyncData.thumbnail_url || asyncData.thumbnailUrl || null
        const gifUrl = asyncData.gif_url || asyncData.gifUrl || null

        console.log('📹 Extracted video URL from AsyncData:', videoUrl)
        console.log('🖼️  Extracted thumbnail URL from AsyncData:', thumbnailUrl)
        console.log('🎞️  Extracted GIF URL from AsyncData:', gifUrl)

        // If we successfully got the video URL, return the result
        if (videoUrl) {
          return {
            id: responseId || taskId || `sora-demo-${Date.now()}`,
            taskId: taskId || undefined,
            status: 'completed',
            videoUrl: videoUrl,
            thumbnailUrl: thumbnailUrl || `https://picsum.photos/seed/${Date.now()}/1280/720`,
            gifUrl: gifUrl || undefined,
          }
        }
      } catch (asyncError: any) {
        console.error('❌ Failed to fetch from AsyncData:', asyncError.message)
        // Continue to try extracting direct URLs as fallback
      }
    }

    // Fallback: Try to extract direct video URLs from the response
    // 1. Markdown链接格式: [text](url)
    let videoUrlMatch = content.match(/\[.*?\]\((https?:\/\/[^\s\)]+\.mp4[^\)]*)\)/i)
    videoUrl = videoUrlMatch ? videoUrlMatch[1] : null

    // 2. 直接URL格式
    if (!videoUrl) {
      videoUrlMatch = content.match(/https?:\/\/[^\s]+\.(mp4|mov|avi|webm)/i)
      videoUrl = videoUrlMatch ? videoUrlMatch[0] : null
    }

    // 提取缩略图 URL (webp/jpg/png格式)
    // 格式: ![thumbnail_url](thumbnail_url) 或直接URL
    let thumbnailUrlMatch = content.match(/!\[([^\]]*)\]\((https?:\/\/[^\s\)]+\.(webp|jpg|jpeg|png)[^\)]*)\)/i)
    thumbnailUrl = thumbnailUrlMatch ? thumbnailUrlMatch[2] : null

    // 如果没找到Markdown格式,尝试直接提取图片URL
    if (!thumbnailUrl) {
      thumbnailUrlMatch = content.match(/https?:\/\/[^\s]+\.(webp|jpg|jpeg|png)/i)
      thumbnailUrl = thumbnailUrlMatch ? thumbnailUrlMatch[0] : null
    }

    // 提取 GIF URL (gif格式)
    let gifUrl: string | null = null

    // 首先尝试 Markdown 图片格式
    let gifUrlMatch = content.match(/!\[([^\]]*)\]\((https?:\/\/[^\s\)]+\.gif[^\)]*)\)/i)
    if (gifUrlMatch) {
      gifUrl = gifUrlMatch[2]
    }

    // 然后尝试 Markdown 链接格式
    if (!gifUrl) {
      gifUrlMatch = content.match(/\[.*?\]\((https?:\/\/[^\s\)]+\.gif[^\)]*)\)/i)
      if (gifUrlMatch) {
        gifUrl = gifUrlMatch[1]
      }
    }

    // 最后尝试直接 URL 格式
    if (!gifUrl) {
      gifUrlMatch = content.match(/https?:\/\/[^\s\)]+\.gif/i)
      if (gifUrlMatch) {
        gifUrl = gifUrlMatch[0]
      }
    }

    console.log('📹 Extracted video URL:', videoUrl)
    console.log('🖼️  Extracted thumbnail URL:', thumbnailUrl)
    console.log('🎞️  Extracted GIF URL:', gifUrl)
    console.log('🆔 Extracted task ID:', taskId)

    // Validate that we got video URL
    if (!videoUrl) {
      throw new Error('No video URL returned from API - the API response may be in an unexpected format')
    }

    // If we got a video URL but no thumbnail, use a placeholder
    if (!thumbnailUrl) {
      thumbnailUrl = `https://picsum.photos/seed/${Date.now()}/1280/720`
    }

    return {
      id: responseId || `sora-demo-${Date.now()}`,
      taskId: taskId || undefined,
      status: 'completed',
      videoUrl: videoUrl || undefined,
      thumbnailUrl: thumbnailUrl || undefined,
      gifUrl: gifUrl || undefined,
    }
  }

  /**
   * Check video generation status
   */
  async getVideoStatus(taskId: string): Promise<SoraResponse> {
    try {
      console.log(`🔍 Checking video status: ${taskId}`)

      const response = await axios.get(
        `${this.baseUrl}/video/generations/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      )

      console.log('📊 Status Response:', JSON.stringify(response.data, null, 2))

      return {
        id: response.data.id,
        status: response.data.status,
        videoUrl: response.data.video_url || response.data.videoUrl,
        error: response.data.error,
      }
    } catch (error: any) {
      console.error('❌ Status Check Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      })
      throw new Error(`Failed to check video status: ${error.message}`)
    }
  }

  /**
   * Download video from URL
   */
  async downloadVideo(videoUrl: string): Promise<Buffer> {
    try {
      const response = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
      })

      return Buffer.from(response.data)
    } catch (error: any) {
      console.error('Download Error:', error.message)
      throw new Error(`Failed to download video: ${error.message}`)
    }
  }

  /**
   * Get video duration from URL using HTTP HEAD request
   */
  async getVideoDuration(videoUrl: string): Promise<number | null> {
    try {
      // Use ffprobe if available, otherwise return null
      const { exec } = await import('child_process')
      const { promisify } = await import('util')
      const execAsync = promisify(exec)

      // Create a temporary file path for the video
      const tempFile = `/tmp/temp_video_${Date.now()}.mp4`

      // Download video to temp file
      const videoBuffer = await this.downloadVideo(videoUrl)
      const fs = await import('fs')
      fs.writeFileSync(tempFile, videoBuffer)

      try {
        // Use ffprobe to get duration
        const { stdout } = await execAsync(
          `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempFile}"`
        )

        const duration = parseFloat(stdout.trim())

        // Clean up temp file
        fs.unlinkSync(tempFile)

        return isNaN(duration) ? null : Math.round(duration)
      } catch (error) {
        // Clean up temp file on error
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile)
        }
        throw error
      }
    } catch (error: any) {
      console.error('❌ Failed to get video duration:', error.message)
      return null // Return null if we can't get duration, don't fail the whole process
    }
  }

  /**
   * Calculate credit cost based on video parameters and model
   */
  async calculateCost(duration: number, model: string): Promise<number> {
    try {
      const pricing = await configService.getPricingConfig()

      // Map model to pricing
      let creditsPerTenSeconds: number
      if (model === 'sora-2') {
        creditsPerTenSeconds = pricing.sora2
      } else if (model === 'sora-2-hd') {
        creditsPerTenSeconds = pricing.sora2_hd
      } else if (model === 'sora-2-pro') {
        creditsPerTenSeconds = pricing.sora2_pro
      } else {
        // Default to sora-2 pricing
        creditsPerTenSeconds = pricing.sora2
      }

      // Calculate cost based on duration (per 10 seconds)
      const cost = Math.ceil((duration / 10) * creditsPerTenSeconds)

      console.log(`💰 Cost calculation: ${duration}s video with ${model} = ${cost} credits (${creditsPerTenSeconds} credits/10s)`)

      return cost
    } catch (error) {
      console.error('❌ Failed to get pricing config, using defaults')
      // Fallback to default pricing if config fails
      const defaultPricing: Record<string, number> = {
        'sora-2': 3,
        'sora-2-hd': 4,
        'sora-2-pro': 5,
      }
      const creditsPerTenSeconds = defaultPricing[model] || 3
      return Math.ceil((duration / 10) * creditsPerTenSeconds)
    }
  }
}
