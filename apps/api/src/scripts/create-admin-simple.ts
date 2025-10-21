import { db } from '../lib/db'
import bcrypt from 'bcryptjs'

async function createAdmin() {
  console.log('🔧 Creating admin account...\n')

  const email = 'admin@sora2.com'
  const password = 'admin123'
  const nickname = 'Admin'

  try {
    // Check if user already exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email])
    if (existingUser.rows.length > 0) {
      console.log('⚠️  Admin account already exists with this email')
      const admin = existingUser.rows[0]

      // Update role to admin if not already
      await db.query('UPDATE users SET role = $1 WHERE id = $2', ['admin', admin.id])
      console.log('✅ Updated existing user to admin role')
      process.exit(0)
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create admin user
    const result = await db.query(
      `INSERT INTO users (email, password_hash, nickname, role, credits, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, email, nickname, role`,
      [email, passwordHash, nickname, 'admin', 100, 'active']
    )

    const admin = result.rows[0]

    console.log('✅ Admin account created successfully!\n')
    console.log('📋 Login Details:')
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log(`   Role: ${admin.role}`)
    console.log(`   Credits: 100\n`)
    console.log('⚠️  Please change the password after first login!')

    process.exit(0)
  } catch (error: any) {
    console.error('❌ Error creating admin:', error.message)
    process.exit(1)
  }
}

createAdmin()
