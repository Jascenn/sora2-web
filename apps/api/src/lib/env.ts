interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test'
  PORT: number
  DATABASE_URL: string
  JWT_SECRET: string
  JWT_EXPIRES_IN: string
  FRONTEND_URL: string
  BACKEND_URL: string
  OPENAI_API_KEY: string
  OPENAI_API_BASE_URL: string
  OPENAI_ORG_ID?: string
  STORAGE_PROVIDER: string
  AWS_ACCESS_KEY_ID?: string
  AWS_SECRET_ACCESS_KEY?: string
  AWS_REGION?: string
  AWS_S3_BUCKET?: string
  REDIS_URL?: string
  ENABLE_CONTENT_MODERATION?: boolean
}

interface EnvVariable {
  key: keyof EnvConfig
  description: string
  required: boolean
  type: 'string' | 'number' | 'boolean'
}

const envVariables: EnvVariable[] = [
  // App Config
  { key: 'NODE_ENV', description: 'Node environment (development, production, test)', required: true, type: 'string' },
  { key: 'PORT', description: 'Server port number', required: true, type: 'number' },
  { key: 'FRONTEND_URL', description: 'Frontend application URL for CORS', required: true, type: 'string' },
  { key: 'BACKEND_URL', description: 'Backend API URL', required: true, type: 'string' },

  // Database
  { key: 'DATABASE_URL', description: 'PostgreSQL connection string', required: true, type: 'string' },

  // JWT
  { key: 'JWT_SECRET', description: 'Secret key for JWT tokens', required: true, type: 'string' },
  { key: 'JWT_EXPIRES_IN', description: 'JWT token expiration time (e.g., 7d, 24h)', required: true, type: 'string' },

  // OpenAI
  { key: 'OPENAI_API_KEY', description: 'OpenAI API key for Sora video generation', required: true, type: 'string' },
  { key: 'OPENAI_API_BASE_URL', description: 'OpenAI API base URL', required: true, type: 'string' },
  { key: 'OPENAI_ORG_ID', description: 'OpenAI organization ID (optional)', required: false, type: 'string' },

  // Storage
  { key: 'STORAGE_PROVIDER', description: 'Storage provider (s3, oss, etc.)', required: true, type: 'string' },
  { key: 'AWS_ACCESS_KEY_ID', description: 'AWS access key ID for S3 storage (optional)', required: false, type: 'string' },
  { key: 'AWS_SECRET_ACCESS_KEY', description: 'AWS secret access key for S3 storage (optional)', required: false, type: 'string' },
  { key: 'AWS_REGION', description: 'AWS region for S3 storage (optional)', required: false, type: 'string' },
  { key: 'AWS_S3_BUCKET', description: 'AWS S3 bucket name for storage (optional)', required: false, type: 'string' },

  // Redis
  { key: 'REDIS_URL', description: 'Redis connection URL for queue management (optional)', required: false, type: 'string' },

  // Content Moderation
  { key: 'ENABLE_CONTENT_MODERATION', description: 'Enable content moderation (optional)', required: false, type: 'boolean' },
]

function parseValue(value: string | undefined, type: 'string' | 'number' | 'boolean', key: string): string | number | boolean | undefined {
  if (value === undefined || value === '') {
    return undefined
  }

  switch (type) {
    case 'number': {
      const parsed = parseInt(value, 10)
      if (isNaN(parsed)) {
        throw new Error(`Environment variable ${key} must be a valid number, got: ${value}`)
      }
      return parsed
    }
    case 'boolean': {
      if (value === 'true' || value === '1') return true
      if (value === 'false' || value === '0') return false
      throw new Error(`Environment variable ${key} must be a boolean (true/false), got: ${value}`)
    }
    case 'string':
    default:
      return value
  }
}

export function validateEnv(): EnvConfig {
  const errors: string[] = []
  const warnings: string[] = []
  const config: Partial<EnvConfig> = {}

  // Validate NODE_ENV
  const nodeEnv = process.env.NODE_ENV
  if (!nodeEnv || !['development', 'production', 'test'].includes(nodeEnv)) {
    errors.push('- NODE_ENV: Node environment (must be development, production, or test)')
  } else {
    config.NODE_ENV = nodeEnv as 'development' | 'production' | 'test'
  }

  // Validate all other variables
  for (const variable of envVariables) {
    if (variable.key === 'NODE_ENV') continue // Already handled

    const value = process.env[variable.key]

    try {
      const parsed = parseValue(value, variable.type, variable.key)

      if (parsed === undefined) {
        if (variable.required) {
          errors.push(`- ${variable.key}: ${variable.description}`)
        } else {
          // Optional variable not set
          if (variable.key === 'REDIS_URL') {
            warnings.push(`- ${variable.key}: Not configured, queue functionality will be limited`)
          }
        }
      } else {
        // Check for demo/placeholder values
        if (variable.key === 'JWT_SECRET' && typeof parsed === 'string' && parsed.includes('dev-secret')) {
          warnings.push(`- ${variable.key}: Using development secret. Please change for production!`)
        }
        if (variable.key === 'AWS_ACCESS_KEY_ID' && parsed === 'demo-access-key') {
          warnings.push(`- ${variable.key}: Using demo value. S3 storage will not work.`)
        }

        config[variable.key] = parsed as any
      }
    } catch (error) {
      errors.push(`- ${variable.key}: ${error instanceof Error ? error.message : 'Invalid value'}`)
    }
  }

  // Report errors
  if (errors.length > 0) {
    console.error('\n' + '='.repeat(60))
    console.error('❌ Environment Configuration Error')
    console.error('='.repeat(60))
    console.error('\nMissing or invalid required environment variables:\n')
    console.error(errors.join('\n'))
    console.error('\n' + '-'.repeat(60))
    console.error('Please create a .env file based on .env.example')
    console.error('='.repeat(60) + '\n')
    process.exit(1)
  }

  // Report warnings
  if (warnings.length > 0 && config.NODE_ENV !== 'test') {
    console.warn('\n' + '='.repeat(60))
    console.warn('⚠️  Environment Configuration Warnings')
    console.warn('='.repeat(60))
    console.warn('\nPlease review the following:\n')
    console.warn(warnings.join('\n'))
    console.warn('\n' + '='.repeat(60) + '\n')
  }

  return config as EnvConfig
}

// Validate and export typed environment configuration
export const env = validateEnv()
