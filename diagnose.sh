#!/bin/bash

echo "🔍 Sora2-Web 诊断脚本"
echo "====================="

cd /Users/jascen/Development/00_Pay_Project/sora2-web

echo -e "\n1️⃣ 检查 Node.js 版本："
node --version
npm --version

echo -e "\n2️⃣ 检查项目结构："
echo "✓ package.json 存在: $([ -f package.json ] && echo '是' || echo '否')"
echo "✓ node_modules 存在: $([ -d node_modules ] && echo '是' || echo '否')"
echo "✓ .next 目录存在: $([ -d .next ] && echo '是' || echo '否')"

echo -e "\n3️⃣ 检查关键文件："
for file in "next.config.js" "tsconfig.json" "tailwind.config.ts"; do
    if [ -f "$file" ]; then
        echo "✓ $file 存在"
    else
        echo "❌ $file 缺失"
    fi
done

echo -e "\n4️⃣ 检查端口占用："
for port in 3000 3001 3200; do
    if lsof -i :$port >/dev/null 2>&1; then
        echo "⚠️  端口 $port 被占用"
        lsof -i :$port | grep LISTEN
    else
        echo "✓ 端口 $port 可用"
    fi
done

echo -e "\n5️⃣ 检查环境变量："
if [ -f .env ]; then
    echo "✓ .env 文件存在"
    echo "  NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-未设置}"
else
    echo "❌ .env 文件不存在"
fi

echo -e "\n6️⃣ 检查依赖完整性："
echo "安装的包数量: $(ls node_modules 2>/dev/null | wc -l)"
echo "package-lock.json 存在: $([ -f package-lock.json ] && echo '是' || echo '否')"

echo -e "\n7️⃣ 尝试运行 Next.js 检查："
echo "运行 npx next info..."
npx next info 2>/dev/null || echo "❌ 无法运行 next info"

echo -e "\n8️⃣ 尝试编译检查："
echo "运行 npx next build --dry-run..."
timeout 30s npx next build --dry-run 2>&1 | head -20 || echo "❌ 编译检查超时或失败"

echo -e "\n9️⃣ 检查最近错误："
if [ -f .next/trace ]; then
    echo "发现 trace 文件"
fi

echo -e "\n📋 诊断完成！"
echo "====================="

echo -e "\n💡 建议的解决方案："
echo "1. 如果有编译错误，请查看上面的错误信息"
echo "2. 尝试重新安装依赖: rm -rf node_modules && npm install"
echo "3. 清理缓存: rm -rf .next && npm run dev"
echo "4. 使用不同的端口: npm run dev -- -p 3001"