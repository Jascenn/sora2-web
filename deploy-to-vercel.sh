#!/bin/bash

# Sora2 快速部署到 Vercel
# 使用方法: ./deploy-to-vercel.sh

set -e

echo "🚀 Sora2 项目部署到 Vercel"
echo "================================"
echo ""

# 检查 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安装"
    echo "请运行: npm install -g vercel"
    exit 1
fi

echo "✅ Vercel CLI 已安装 ($(vercel --version))"
echo ""

# 检查 Git 状态
if [[ -n $(git status --porcelain) ]]; then
    echo "⚠️  有未提交的更改"
    echo "建议先提交所有更改，然后再部署"
    read -p "继续部署？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ Git 状态正常"
echo ""

# 显示部署信息
echo "📦 部署信息:"
echo "  - 项目: Sora2 AI 视频生成平台"
echo "  - 框架: Next.js 14"
echo "  - Git: $(git branch --show-current) ($(git rev-parse --short HEAD))"
echo ""

# 询问部署类型
echo "🎯 选择部署类型:"
echo "  1) 部署到预览环境 (推荐先测试)"
echo "  2) 部署到生产环境"
echo ""
read -p "请选择 (1 或 2): " deploy_type

if [ "$deploy_type" == "2" ]; then
    echo ""
    echo "🔴 即将部署到生产环境"
    read -p "确认部署到生产环境？(yes/no) " -r
    if [[ ! $REPLY =~ ^yes$ ]]; then
        echo "取消部署"
        exit 1
    fi

    echo ""
    echo "🚀 开始部署到生产环境..."
    vercel --prod
else
    echo ""
    echo "🚀 开始部署到预览环境..."
    vercel
fi

echo ""
echo "✅ 部署命令已执行"
echo ""
echo "📝 后续步骤:"
echo "  1. 访问 Vercel 给出的 URL 查看部署状态"
echo "  2. 在 Vercel Dashboard 配置环境变量"
echo "  3. 测试部署的应用功能"
echo "  4. 如果一切正常，可以配置自定义域名"
echo ""
echo "📚 更多信息请查看: DEPLOYMENT_GUIDE.md"
echo ""
