# Vercel 环境变量配置指南

## 📋 需要配置的环境变量

请在 Vercel 控制台添加以下环境变量：

### 1. Supabase 配置（必需）

```bash
# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://ycrrmxfmpqptzjuseczs.supabase.co

# Anon Public Key (公开密钥，用于客户端)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljcnJteGZtcHFwdHpqdXNlY3pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NjE1MDMsImV4cCI6MjA3NjUzNzUwM30.Eldc72gyNFhv-L2GxRgspG1eaeN7Sv707-UHheCUHes

# Service Role Key (服务端密钥，保密！)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljcnJteGZtcHFwdHpqdXNlY3pzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk2MTUwMywiZXhwIjoyMDc2NTM3NTAzfQ.xq60ZDoQa3m4Sx8UbFeNTnpX68s2IcM5UCKxgFYLES0
```

### 2. JWT 配置（必需）

```bash
# JWT 密钥 (已生成)
JWT_SECRET=JsVcA+itwFr90IBpWp7uUvDO4mZasPHHsnjSvRy9o2Y=

# JWT 过期时间
JWT_EXPIRES_IN=7d
```

### 3. 应用配置（必需）

```bash
# 环境
NODE_ENV=production

# 禁用认证绕过（生产环境必须为 false）
BYPASS_AUTH=false
```

### 4. OpenAI 配置（可选 - 视频生成功能需要）

```bash
# OpenAI API Key (需要你自己的密钥)
OPENAI_API_KEY=sk-your-openai-api-key-here
```

---

## 🔧 配置方法

### 方法 1：Vercel 网页控制台（推荐）

1. 访问 https://vercel.com/dashboard
2. 选择项目 `sora2-web-two`
3. 进入 **Settings** → **Environment Variables**
4. 点击 **Add New**
5. 逐个添加上面的环境变量：
   - **Key**: 变量名（如 `NEXT_PUBLIC_SUPABASE_URL`）
   - **Value**: 对应的值
   - **Environment**: 选择 **Production** (和 Preview 如果需要)
6. 点击 **Save**

### 方法 2：使用 Vercel CLI（需要先安装）

```bash
# 安装 Vercel CLI（如果还没有）
npm install -g vercel

# 登录
vercel login

# 运行配置脚本
cd /Users/jascen/Development/00_Pay_Project/sora2-web
chmod +x setup-vercel-env.sh
./setup-vercel-env.sh
```

### 方法 3：手动使用 Vercel CLI

```bash
# 登录到 Vercel
vercel login

# 进入项目目录
cd /Users/jascen/Development/00_Pay_Project/sora2-web

# 添加环境变量
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# 粘贴: https://ycrrmxfmpqptzjuseczs.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# 粘贴: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# 粘贴: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

vercel env add JWT_SECRET production
# 粘贴: JsVcA+itwFr90IBpWp7uUvDO4mZasPHHsnjSvRy9o2Y=

vercel env add JWT_EXPIRES_IN production
# 粘贴: 7d

vercel env add NODE_ENV production
# 粘贴: production

vercel env add BYPASS_AUTH production
# 粘贴: false
```

---

## 🚀 配置完成后

1. **触发重新部署**
   - Vercel 会自动检测到 GitHub 推送并部署
   - 或者手动触发：Vercel 控制台 → Deployments → Redeploy

2. **等待部署完成**（约 1-2 分钟）

3. **测试功能**
   - 访问 https://sora2-web-two.vercel.app
   - 尝试注册新用户
   - 测试登录功能

---

## ✅ 验证清单

配置完成后，检查以下内容：

- [ ] 所有环境变量已添加到 Vercel
- [ ] 部署成功（绿色勾号）
- [ ] 网站可以访问
- [ ] 注册功能正常
- [ ] 登录功能正常
- [ ] 数据保存到 Supabase

---

## 🐛 常见问题

### 问题 1：部署失败
- 检查环境变量是否都已配置
- 确保 `NODE_ENV=production`

### 问题 2：注册/登录失败
- 检查 Supabase 密钥是否正确
- 确认 Supabase 数据库表已创建（运行 supabase-setup.sql）

### 问题 3："Database service unavailable"
- 检查 `SUPABASE_SERVICE_ROLE_KEY` 是否已配置
- 确认 Supabase 项目正常运行

---

## 📞 获取帮助

如果遇到问题：
1. 检查 Vercel 部署日志：Deployments → 点击部署 → View Function Logs
2. 检查 Supabase 日志：Supabase 控制台 → Logs
3. 查看浏览器控制台错误信息

---

**配置时间预计：5-10 分钟**

配置完成后网站将具备完整的用户认证功能！🎉
