/**
 * API Key Pool Management Service
 * Manages multiple API keys with automatic rotation and quota monitoring
 */

interface ApiKeyInfo {
  key: string
  isAvailable: boolean
  failureCount: number
  lastFailureTime: number | null
  lastSuccessTime: number | null
}

export class ApiKeyPoolService {
  private keyPool: ApiKeyInfo[] = []
  private currentKeyIndex: number = 0
  private readonly MAX_FAILURES = 3 // Mark key as unavailable after 3 consecutive failures
  private readonly COOLDOWN_PERIOD = 5 * 60 * 1000 // 5 minutes cooldown for failed keys

  constructor(apiKeys: string[]) {
    this.keyPool = apiKeys.map(key => ({
      key,
      isAvailable: true,
      failureCount: 0,
      lastFailureTime: null,
      lastSuccessTime: null
    }))

    console.log(`🔑 API Key Pool initialized with ${this.keyPool.length} keys`)
  }

  /**
   * Get the next available API key
   */
  getNextKey(): string | null {
    // Reset keys that have passed the cooldown period
    this.resetCooledDownKeys()

    // Try to find an available key starting from current index
    const totalKeys = this.keyPool.length

    for (let i = 0; i < totalKeys; i++) {
      const index = (this.currentKeyIndex + i) % totalKeys
      const keyInfo = this.keyPool[index]

      if (keyInfo.isAvailable) {
        this.currentKeyIndex = index
        console.log(`🔑 Using API key ${index + 1}/${totalKeys} (${this.maskKey(keyInfo.key)})`)
        return keyInfo.key
      }
    }

    console.error('❌ No available API keys in the pool!')
    return null
  }

  /**
   * Mark current key as successful
   */
  markSuccess(): void {
    const keyInfo = this.keyPool[this.currentKeyIndex]
    keyInfo.failureCount = 0
    keyInfo.lastSuccessTime = Date.now()
    keyInfo.isAvailable = true

    console.log(`✅ API key ${this.currentKeyIndex + 1} marked as successful`)
  }

  /**
   * Mark current key as failed and rotate to next key
   */
  markFailure(error: any): void {
    const keyInfo = this.keyPool[this.currentKeyIndex]
    keyInfo.failureCount++
    keyInfo.lastFailureTime = Date.now()

    const errorMessage = error?.response?.data?.error?.message || error?.message || 'Unknown error'
    const isQuotaError = errorMessage.includes('额度') || errorMessage.includes('quota') || errorMessage.includes('Quota')

    console.warn(`⚠️  API key ${this.currentKeyIndex + 1} failed (${keyInfo.failureCount}/${this.MAX_FAILURES}): ${errorMessage}`)

    // If it's a quota error or max failures reached, mark as unavailable
    if (isQuotaError || keyInfo.failureCount >= this.MAX_FAILURES) {
      keyInfo.isAvailable = false
      console.error(`🚫 API key ${this.currentKeyIndex + 1} marked as unavailable (${isQuotaError ? 'quota exhausted' : 'max failures'})`)
    }

    // Rotate to next key
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keyPool.length
  }

  /**
   * Reset keys that have passed the cooldown period
   */
  private resetCooledDownKeys(): void {
    const now = Date.now()

    this.keyPool.forEach((keyInfo, index) => {
      if (!keyInfo.isAvailable && keyInfo.lastFailureTime) {
        const timeSinceFailure = now - keyInfo.lastFailureTime

        if (timeSinceFailure >= this.COOLDOWN_PERIOD) {
          keyInfo.isAvailable = true
          keyInfo.failureCount = 0
          console.log(`🔄 API key ${index + 1} reset after cooldown period`)
        }
      }
    })
  }

  /**
   * Get current pool status
   */
  getPoolStatus(): {
    total: number
    available: number
    unavailable: number
    keys: Array<{
      index: number
      key: string
      isAvailable: boolean
      failureCount: number
    }>
  } {
    const available = this.keyPool.filter(k => k.isAvailable).length

    return {
      total: this.keyPool.length,
      available,
      unavailable: this.keyPool.length - available,
      keys: this.keyPool.map((k, i) => ({
        index: i + 1,
        key: this.maskKey(k.key),
        isAvailable: k.isAvailable,
        failureCount: k.failureCount
      }))
    }
  }

  /**
   * Mask API key for logging
   */
  private maskKey(key: string): string {
    if (key.length <= 15) return '***'
    return `${key.substring(0, 10)}...${key.substring(key.length - 6)}`
  }

  /**
   * Check if any keys are available
   */
  hasAvailableKeys(): boolean {
    this.resetCooledDownKeys()
    return this.keyPool.some(k => k.isAvailable)
  }
}

// Singleton instance
let apiKeyPoolInstance: ApiKeyPoolService | null = null

/**
 * Initialize the API key pool
 */
export function initApiKeyPool(apiKeys: string[]): ApiKeyPoolService {
  if (!apiKeyPoolInstance) {
    apiKeyPoolInstance = new ApiKeyPoolService(apiKeys)
  }
  return apiKeyPoolInstance
}

/**
 * Get the API key pool instance
 */
export function getApiKeyPool(): ApiKeyPoolService | null {
  return apiKeyPoolInstance
}
