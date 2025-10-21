import { db } from '../lib/db'

export interface SystemConfig {
  id: number
  key: string
  value: string
  description: string | null
  category: string
  value_type: string
  created_at: Date
  updated_at: Date
}

export class ConfigService {
  // Get all configurations
  async getAllConfigs(): Promise<SystemConfig[]> {
    const result = await db.query<SystemConfig>(
      'SELECT * FROM system_config ORDER BY category, key'
    )
    return result.rows
  }

  // Get configurations by category
  async getConfigsByCategory(category: string): Promise<SystemConfig[]> {
    const result = await db.query<SystemConfig>(
      'SELECT * FROM system_config WHERE category = $1 ORDER BY key',
      [category]
    )
    return result.rows
  }

  // Get single configuration by key
  async getConfig(key: string): Promise<string | null> {
    const result = await db.query<SystemConfig>(
      'SELECT value FROM system_config WHERE key = $1',
      [key]
    )
    return result.rows[0]?.value || null
  }

  // Get multiple configurations by keys
  async getConfigs(keys: string[]): Promise<Record<string, string>> {
    const result = await db.query<SystemConfig>(
      'SELECT key, value FROM system_config WHERE key = ANY($1)',
      [keys]
    )

    const configs: Record<string, string> = {}
    result.rows.forEach(row => {
      configs[row.key] = row.value
    })
    return configs
  }

  // Update configuration
  async updateConfig(key: string, value: string): Promise<void> {
    await db.query(
      'UPDATE system_config SET value = $1, updated_at = NOW() WHERE key = $2',
      [value, key]
    )
  }

  // Update multiple configurations
  async updateConfigs(configs: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(configs)) {
      await this.updateConfig(key, value)
    }
  }

  // Get all categories
  async getCategories(): Promise<string[]> {
    const result = await db.query<{ category: string }>(
      'SELECT DISTINCT category FROM system_config ORDER BY category'
    )
    return result.rows.map(row => row.category)
  }

  // Get OpenAI configuration
  async getOpenAIConfig(): Promise<{ apiKey: string; apiBase: string }> {
    const configs = await this.getConfigs(['openai_api_key_1', 'openai_api_key', 'openai_api_base'])
    return {
      apiKey: configs.openai_api_key_1 || configs.openai_api_key || '',
      apiBase: configs.openai_api_base || 'https://api.sora2.com',
    }
  }

  // Get all API keys for rotation
  async getApiKeys(): Promise<string[]> {
    const result = await db.query<SystemConfig>(
      `SELECT value FROM system_config
       WHERE key LIKE 'openai_api_key%'
       AND value IS NOT NULL
       AND value != ''
       ORDER BY key`
    )
    return result.rows.map(row => row.value).filter(Boolean)
  }

  // Get pricing configuration
  async getPricingConfig(): Promise<{
    sora2: number
    sora2_hd: number
    sora2_pro: number
  }> {
    const configs = await this.getConfigs([
      'model_sora2_credits',
      'model_sora2_hd_credits',
      'model_sora2_pro_credits',
    ])
    return {
      sora2: parseInt(configs.model_sora2_credits || '3'),
      sora2_hd: parseInt(configs.model_sora2_hd_credits || '4'),
      sora2_pro: parseInt(configs.model_sora2_pro_credits || '5'),
    }
  }

  // Get limits configuration
  async getLimitsConfig(): Promise<{
    maxVideoDuration: number
    maxPromptLength: number
  }> {
    const configs = await this.getConfigs(['max_video_duration', 'max_prompt_length'])
    return {
      maxVideoDuration: parseInt(configs.max_video_duration || '20'),
      maxPromptLength: parseInt(configs.max_prompt_length || '500'),
    }
  }
}

export const configService = new ConfigService()
