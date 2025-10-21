import { db } from '../lib/db'

async function createSystemConfigTable() {
  try {
    console.log('📦 Creating system_config table...')

    // Create table
    await db.query(`
      CREATE TABLE IF NOT EXISTS system_config (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        value_type VARCHAR(20) DEFAULT 'string',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    console.log('✅ Table created')

    // Create indexes
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key)
    `)
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_system_config_category ON system_config(category)
    `)

    console.log('✅ Indexes created')

    // Insert default configuration
    const configs = [
      {
        key: 'openai_api_key',
        value: 'sk-MSrKrtbNem9oji876wVy799LuM7DiCmNkzSHbtlBqE8zyk4u',
        description: 'OpenAI API Key',
        category: 'api',
        value_type: 'string',
      },
      {
        key: 'openai_api_base',
        value: 'https://api.sora2.com',
        description: 'OpenAI API Base URL',
        category: 'api',
        value_type: 'string',
      },
      {
        key: 'default_model',
        value: 'sora-2',
        description: 'Default Sora Model',
        category: 'model',
        value_type: 'string',
      },
      {
        key: 'model_sora2_credits',
        value: '3',
        description: 'Sora 2 标准版积分消耗 (积分/10秒)',
        category: 'pricing',
        value_type: 'number',
      },
      {
        key: 'model_sora2_hd_credits',
        value: '4',
        description: 'Sora 2 HD 积分消耗 (积分/10秒)',
        category: 'pricing',
        value_type: 'number',
      },
      {
        key: 'model_sora2_pro_credits',
        value: '5',
        description: 'Sora 2 Pro 积分消耗 (积分/10秒)',
        category: 'pricing',
        value_type: 'number',
      },
      {
        key: 'max_video_duration',
        value: '20',
        description: '最大视频时长 (秒)',
        category: 'limits',
        value_type: 'number',
      },
      {
        key: 'max_prompt_length',
        value: '500',
        description: '最大提示词长度',
        category: 'limits',
        value_type: 'number',
      },
      {
        key: 'queue_concurrency',
        value: '3',
        description: '队列并发数',
        category: 'queue',
        value_type: 'number',
      },
      {
        key: 'queue_max_retries',
        value: '2',
        description: '队列最大重试次数',
        category: 'queue',
        value_type: 'number',
      },
    ]

    for (const config of configs) {
      await db.query(
        `INSERT INTO system_config (key, value, description, category, value_type)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (key) DO NOTHING`,
        [config.key, config.value, config.description, config.category, config.value_type]
      )
    }

    console.log('✅ Default configurations inserted')

    // Verify
    const result = await db.query('SELECT COUNT(*) as count FROM system_config')
    console.log(`✅ Total configurations: ${result.rows[0].count}`)

    process.exit(0)
  } catch (error: any) {
    console.error('❌ Error creating system_config table:', error.message)
    process.exit(1)
  }
}

createSystemConfigTable()
