#!/bin/bash

# 分支保护规则设置脚本
# 使用 GitHub CLI 设置分支保护规则

echo "🔧 设置分支保护规则..."

# 检查是否安装了 GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI 未安装，请先安装 gh CLI"
    echo "安装指南: https://cli.github.com/manual/installation"
    exit 1
fi

# 检查是否已登录
if ! gh auth status &> /dev/null; then
    echo "❌ 未登录 GitHub CLI，请先执行: gh auth login"
    exit 1
fi

# 获取仓库名称
REPO=$(gh repo view --json nameWithOwner | jq -r '.nameWithOwner')
echo "📁 当前仓库: $REPO"

# 设置 main 分支保护规则
echo "🛡️ 设置 main 分支保护规则..."

gh api \
  --method PUT \
  repos/$REPO/branches/main/protection \
  --field required_status_checks='{"strict":true,"contexts":["ci-and-test","build","type-check","security-audit"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":false}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false

echo "✅ main 分支保护规则设置完成"

# 创建 develop 分支（如果不存在）
echo "🌿 创建 develop 分支..."
git checkout -b develop 2>/dev/null || git checkout develop
git push -u origin develop 2>/dev/null || echo "develop 分支已存在"

# 设置 develop 分支保护规则
echo "🛡️ 设置 develop 分支保护规则..."

gh api \
  --method PUT \
  repos/$REPO/branches/develop/protection \
  --field required_status_checks='{"strict":false,"contexts":["ci-and-test"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":false,"require_code_owner_reviews":false}' \
  --field restrictions=null \
  --field allow_force_pushes=true \
  --field allow_deletions=false

echo "✅ develop 分支保护规则设置完成"

echo ""
echo "🎉 分支保护规则设置完成！"
echo ""
echo "📋 设置摘要:"
echo "- main 分支: 需要审批、所有状态检查通过、禁止强制推送和删除"
echo "- develop 分支: 需要审批、基础状态检查通过、允许强制推送"
echo ""
echo "📖 下一步:"
echo "1. 切换到 develop 分支进行开发"
echo "2. 创建功能分支: git checkout -b feature/your-feature"
echo "3. 提交代码并创建 PR 到 develop 分支"
echo "4. 合并到 develop 后，再创建 PR 到 main 分支"