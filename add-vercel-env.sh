#!/bin/bash

# Vercel 环境变量自动配置
# 注意：每个命令会要求你按 Enter 确认

echo "🔧 开始配置 Vercel 环境变量..."
echo ""

# Supabase URL
echo "📝 添加 NEXT_PUBLIC_SUPABASE_URL..."
echo "https://ycrrmxfmpqptzjuseczs.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production

echo ""
echo "📝 添加 NEXT_PUBLIC_SUPABASE_ANON_KEY..."
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljcnJteGZtcHFwdHpqdXNlY3pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NjE1MDMsImV4cCI6MjA3NjUzNzUwM30.Eldc72gyNFhv-L2GxRgspG1eaeN7Sv707-UHheCUHes" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

echo ""
echo "📝 添加 SUPABASE_SERVICE_ROLE_KEY..."
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljcnJteGZtcHFwdHpqdXNlY3pzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk2MTUwMywiZXhwIjoyMDc2NTM3NTAzfQ.xq60ZDoQa3m4Sx8UbFeNTnpX68s2IcM5UCKxgFYLES0" | vercel env add SUPABASE_SERVICE_ROLE_KEY production

echo ""
echo "📝 添加 JWT_SECRET..."
echo "JsVcA+itwFr90IBpWp7uUvDO4mZasPHHsnjSvRy9o2Y=" | vercel env add JWT_SECRET production

echo ""
echo "📝 添加 JWT_EXPIRES_IN..."
echo "7d" | vercel env add JWT_EXPIRES_IN production

echo ""
echo "📝 添加 NODE_ENV..."
echo "production" | vercel env add NODE_ENV production

echo ""
echo "📝 添加 BYPASS_AUTH..."
echo "false" | vercel env add BYPASS_AUTH production

echo ""
echo "✅ 完成！所有环境变量已添加到 Vercel"
echo ""
echo "🚀 下一步："
echo "1. 访问 https://vercel.com/dashboard"
echo "2. 选择你的项目 → Deployments → Redeploy"
echo ""
