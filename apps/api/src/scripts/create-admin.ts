import { db } from '../lib/db'
import bcrypt from 'bcryptjs'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function createAdmin() {
  console.log('🔧 Create Admin Account\n')

  try {
    // Get admin details
    const email = await question('Email: ')
    const password = await question('Password: ')
    const nickname = await question('Nickname (default: Admin): ')

    if (!email || !password) {
      console.error('❌ Email and password are required')
      rl.close()
      process.exit(1)
    }

    // Check if user already exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email])
    if (existingUser.rows.length > 0) {
      console.error('❌ User with this email already exists')
      rl.close()
      process.exit(1)
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create admin user
    const result = await db.query(
      `INSERT INTO users (email, password_hash, nickname, role, credits, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, email, nickname, role`,
      [email, passwordHash, nickname || 'Admin', 'admin', 100, 'active']
    )

    const admin = result.rows[0]

    console.log('\n✅ Admin account created successfully!')
    console.log('📋 Details:')
    console.log(`   ID: ${admin.id}`)
    console.log(`   Email: ${admin.email}`)
    console.log(`   Nickname: ${admin.nickname}`)
    console.log(`   Role: ${admin.role}`)
    console.log(`   Credits: 100`)

    rl.close()
    process.exit(0)
  } catch (error: any) {
    console.error('❌ Error creating admin:', error.message)
    rl.close()
    process.exit(1)
  }
}

createAdmin()
