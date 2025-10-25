#!/bin/bash

# =============================================================================
# Vercel 环境变量配置脚本
# =============================================================================
# 使用方法:
# 1. 先在下面填入你的实际值
# 2. chmod +x setup-vercel-env.sh
# 3. ./setup-vercel-env.sh
# =============================================================================

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}Sora2 Vercel 环境变量配置${NC}"
echo -e "${GREEN}==============================================================================${NC}"

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}错误: 未安装 Vercel CLI${NC}"
    echo -e "${YELLOW}请先安装: npm install -g vercel${NC}"
    exit 1
fi

# 检查是否已登录
echo -e "${YELLOW}检查 Vercel 登录状态...${NC}"
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}请先登录 Vercel${NC}"
    vercel login
fi

echo ""
echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}请填写以下信息 (从 Supabase 控制台获取)${NC}"
echo -e "${GREEN}==============================================================================${NC}"

# 提示用户输入
read -p "Supabase Project URL (https://xxxxx.supabase.co): " SUPABASE_URL
read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
read -p "Supabase Service Role Key: " SUPABASE_SERVICE_KEY
read -p "OpenAI API Key (sk-...): " OPENAI_KEY

# 生成 JWT Secret
echo -e "${YELLOW}正在生成 JWT Secret...${NC}"
JWT_SECRET=$(openssl rand -base64 32)
echo -e "${GREEN}JWT Secret 已生成${NC}"

echo ""
echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}开始设置 Vercel 环境变量...${NC}"
echo -e "${GREEN}==============================================================================${NC}"

# 设置环境变量
echo -e "${YELLOW}设置 NEXT_PUBLIC_SUPABASE_URL...${NC}"
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<EOF
$SUPABASE_URL
EOF

echo -e "${YELLOW}设置 NEXT_PUBLIC_SUPABASE_ANON_KEY...${NC}"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<EOF
$SUPABASE_ANON_KEY
EOF

echo -e "${YELLOW}设置 SUPABASE_SERVICE_ROLE_KEY...${NC}"
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<EOF
$SUPABASE_SERVICE_KEY
EOF

echo -e "${YELLOW}设置 OPENAI_API_KEY...${NC}"
vercel env add OPENAI_API_KEY production <<EOF
$OPENAI_KEY
EOF

echo -e "${YELLOW}设置 JWT_SECRET...${NC}"
vercel env add JWT_SECRET production <<EOF
$JWT_SECRET
EOF

echo -e "${YELLOW}设置 NODE_ENV...${NC}"
vercel env add NODE_ENV production <<EOF
production
EOF

echo -e "${YELLOW}设置 BYPASS_AUTH...${NC}"
vercel env add BYPASS_AUTH production <<EOF
false
EOF

echo -e "${YELLOW}设置 NEXT_PUBLIC_API_URL...${NC}"
vercel env add NEXT_PUBLIC_API_URL production <<EOF
/api
EOF

echo ""
echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}✅ 环境变量设置完成!${NC}"
echo -e "${GREEN}==============================================================================${NC}"

echo ""
echo -e "${YELLOW}下一步:${NC}"
echo -e "1. 运行: ${GREEN}git push origin main${NC} (触发自动部署)"
echo -e "2. 或者: ${GREEN}vercel --prod${NC} (手动部署)"
echo ""
echo -e "${YELLOW}保存这些密钥到安全的地方!${NC}"
echo "JWT_SECRET: $JWT_SECRET"
echo ""
