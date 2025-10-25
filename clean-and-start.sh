#!/bin/bash

echo "🧹 清理 Sora2-Web 开发环境..."

# 停止所有相关进程
echo "停止所有开发服务器..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
lsof -ti:3200 | xargs kill -9 2>/dev/null || true

# 清理 Next.js 缓存
echo "清理 Next.js 缓存..."
rm -rf .next
rm -rf node_modules/.cache

# 清理浏览器相关的构建文件
echo "清理构建缓存..."
npm run clean 2>/dev/null || rm -rf .next

# 重新安装依赖（如果需要）
# npm install

echo ""
echo "✅ 清理完成！"
echo ""
echo "📌 提示：如果浏览器仍然跳转到离线页面，请："
echo "   1. 打开浏览器开发者工具 (F12)"
echo "   2. 进入 Application 标签页"
echo "   3. 找到 Service Workers，点击 Unregister"
echo "   4. 进入 Storage，点击 Clear storage"
echo "   5. 或者使用无痕模式访问"
echo ""

# 启动开发服务器
echo "🚀 启动开发服务器..."
cd "$(dirname "$0")"
npm run dev