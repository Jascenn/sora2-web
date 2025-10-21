import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sora2.com' },
    update: {},
    create: {
      email: 'admin@sora2.com',
      passwordHash: adminPassword,
      nickname: 'Admin',
      role: 'admin',
      credits: 10000,
    },
  })

  console.log('✅ Admin user created:', admin.email)

  // Create test user
  const userPassword = await bcrypt.hash('user123', 10)
  const user = await prisma.user.upsert({
    where: { email: 'user@sora2.com' },
    update: {},
    create: {
      email: 'user@sora2.com',
      passwordHash: userPassword,
      nickname: 'Test User',
      credits: 500,
    },
  })

  console.log('✅ Test user created:', user.email)

  // Create sample templates
  const templates = [
    {
      name: '产品展示',
      description: '专业的产品展示视频模板',
      prompt: 'A sleek product showcase with smooth camera movements, professional lighting, and modern aesthetics',
      config: {
        duration: 10,
        resolution: '1080p',
        aspectRatio: '16:9',
        fps: 30,
        style: 'realistic',
      },
      isPublic: true,
    },
    {
      name: '自然风景',
      description: '美丽的自然风景视频模板',
      prompt: 'Beautiful natural landscape with cinematic camera movements, golden hour lighting, serene atmosphere',
      config: {
        duration: 20,
        resolution: '4K',
        aspectRatio: '16:9',
        fps: 60,
        style: 'cinematic',
      },
      isPublic: true,
    },
    {
      name: '抽象艺术',
      description: '创意抽象艺术视频模板',
      prompt: 'Abstract artistic visuals with flowing colors, dynamic patterns, and mesmerizing transitions',
      config: {
        duration: 15,
        resolution: '1080p',
        aspectRatio: '1:1',
        fps: 30,
        style: 'abstract',
      },
      isPublic: true,
    },
  ]

  for (const template of templates) {
    await prisma.template.create({
      data: template,
    })
  }

  console.log('✅ Sample templates created')

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
