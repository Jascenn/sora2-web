# 🚀 Sora2 项目部署指南

**更新时间**: 2025-10-25
**版本**: 1.0.0

---

## 📋 部署概览

Sora2 项目采用**前后端分离架构**，需要分别部署：

1. **前端 (Next.js)** → Vercel（推荐）
2. **后端 API (Express)** → 云服务器/Docker（VPS、AWS、阿里云等）

---

## 🎯 方案一：Vercel 部署（推荐 - 最简单）

### 优势
- ✅ 零配置，自动构建和部署
- ✅ 全球 CDN 加速
- ✅ 自动 HTTPS 证书
- ✅ Git 集成，推送即部署
- ✅ 免费额度足够开发使用

### 前提条件
- [x] GitHub 仓库已准备（https://github.com/Jascenn/sora2-web）
- [x] Vercel CLI 已安装
- [ ] Vercel 账号（免费注册）

---

## 📦 步骤 1：准备部署配置

### 1.1 检查 Vercel 配置

已有配置文件 `apps/web/vercel.json`：
```json
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "installCommand": "pnpm install"
}
```

⚠️ **问题**: 配置使用 pnpm，但项目使用 npm

**修复**：需要更新为 npm 或安装 pnpm

### 1.2 环境变量配置

创建 Vercel 环境变量：

```bash
# 必需的环境变量
NEXT_PUBLIC_API_URL=https://api.yourdomain.com  # 后端 API 地址
NODE_ENV=production
BYPASS_AUTH=false  # 生产环境必须为 false
```

---

## 🚀 步骤 2：使用 Vercel CLI 部署

### 2.1 登录 Vercel

```bash
vercel login
```

### 2.2 初始化项目

```bash
# 在项目根目录执行
vercel
```

Vercel 会问你以下问题：
- Set up and deploy? **Yes**
- Which scope? 选择你的账号
- Link to existing project? **No**
- Project name? **sora2-web** (或自定义)
- In which directory is your code located? **./** (默认)

### 2.3 配置项目设置

Vercel CLI 会自动检测 Next.js 项目：
- Framework Preset: **Next.js**
- Build Command: `npm run build` (或 `pnpm build`)
- Output Directory: `.next`
- Install Command: `npm install` (或 `pnpm install`)

### 2.4 部署到生产环境

```bash
# 部署到预览环境
vercel

# 部署到生产环境
vercel --prod
```

---

## 🌐 步骤 3：Vercel Web 界面部署（更简单）

### 3.1 访问 Vercel Dashboard

1. 访问 https://vercel.com/
2. 登录你的账号
3. 点击 "Add New Project"

### 3.2 导入 Git 仓库

1. 选择 "Import Git Repository"
2. 选择 GitHub
3. 授权 Vercel 访问你的仓库
4. 选择 `Jascenn/sora2-web` 仓库

### 3.3 配置项目

**Framework Preset**: Next.js

**Root Directory**: `./` (或留空)

**Build and Output Settings**:
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

**Environment Variables**:
添加以下环境变量：
```
NEXT_PUBLIC_API_URL=https://your-api.com/api
NODE_ENV=production
BYPASS_AUTH=false
```

### 3.4 点击 Deploy

Vercel 会自动：
1. 克隆仓库
2. 安装依赖
3. 构建项目
4. 部署到全球 CDN

部署完成后，你会得到一个 URL：
- **生产环境**: `https://sora2-web.vercel.app`
- **预览环境**: `https://sora2-web-xxx.vercel.app`

---

## 🔧 步骤 4：配置自定义域名（可选）

### 4.1 在 Vercel Dashboard

1. 进入项目设置
2. 点击 "Domains"
3. 添加你的域名（如 `www.yourdomain.com`）

### 4.2 配置 DNS

在你的域名提供商（如阿里云、GoDaddy）配置 DNS：

**A 记录**:
```
Type: A
Name: @
Value: 76.76.21.21
```

**CNAME 记录**:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 4.3 等待生效

DNS 传播需要 5-48 小时，通常在 1 小时内完成。

---

## 🖥️ 步骤 5：部署后端 API（多种方案）

### 方案 A：使用 Mock 数据（临时方案）

前端已经有 `mock-auth.js`，可以临时使用：

```bash
# 本地运行 Mock API
node mock-auth.js
```

⚠️ **不推荐生产环境使用**

### 方案 B：Vercel Serverless Functions

将后端 API 改造为 Serverless Functions：

```
/api
  /auth
    /login.ts
    /register.ts
  /videos
    /list.ts
```

**优点**:
- 免费额度大
- 自动扩展
- 与前端在同一域名

**缺点**:
- 需要改造代码
- 冷启动延迟

### 方案 C：部署到云服务器（推荐）

#### C.1 选择云服务提供商

- **阿里云**: https://www.aliyun.com/
- **腾讯云**: https://cloud.tencent.com/
- **AWS**: https://aws.amazon.com/
- **DigitalOcean**: https://www.digitalocean.com/
- **Render**: https://render.com/ (简单，推荐新手)

#### C.2 使用 Docker 部署（推荐）

**准备 Dockerfile**:
```dockerfile
# apps/api/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

RUN npm run build

EXPOSE 3101

CMD ["npm", "start"]
```

**构建和运行**:
```bash
# 构建镜像
docker build -t sora2-api ./apps/api

# 运行容器
docker run -d \
  -p 3101:3101 \
  --env-file .env.production \
  --name sora2-api \
  sora2-api
```

#### C.3 使用 PM2 部署（传统方式）

```bash
# 安装 PM2
npm install -g pm2

# 启动 API
cd apps/api
pm2 start npm --name "sora2-api" -- start

# 设置开机自启
pm2 startup
pm2 save
```

### 方案 D：Railway（最简单的云部署）

1. 访问 https://railway.app/
2. 连接 GitHub 仓库
3. 选择 `apps/api` 目录
4. 添加环境变量
5. 自动部署

**优点**:
- 类似 Vercel 的体验
- 自动 HTTPS
- 内置数据库
- 免费 $5/月额度

---

## 🗄️ 步骤 6：配置数据库

### PostgreSQL 选项

#### 选项 A：Vercel Postgres（推荐）
- 访问 Vercel Dashboard
- Storage → Create Database
- 选择 Postgres
- 复制连接字符串到环境变量

#### 选项 B：Supabase（免费，推荐）
1. 访问 https://supabase.com/
2. 创建新项目
3. 获取数据库连接字符串
4. 配置环境变量

```env
DATABASE_URL=postgresql://user:pass@host:5432/db
```

#### 选项 C：自建 PostgreSQL
使用 Docker Compose:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: sora2user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: sora2db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Redis 选项

#### 选项 A：Upstash（推荐，免费）
1. 访问 https://upstash.com/
2. 创建 Redis 数据库
3. 复制 REST API URL

```env
REDIS_URL=redis://...
```

#### 选项 B：Redis Cloud
1. 访问 https://redis.com/
2. 创建免费账号
3. 创建数据库

---

## 🔐 步骤 7：安全配置

### 7.1 环境变量检查

**必须设置**:
```bash
# ⚠️ 生产环境禁用 Auth Bypass
BYPASS_AUTH=false

# 🔑 强密钥
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)

# 🗄️ 数据库
DATABASE_URL=postgresql://...

# ☁️ S3 存储
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...

# 🤖 Sora API
SORA_API_KEY=...
```

### 7.2 CORS 配置

在后端 API 中设置正确的 CORS：

```typescript
// apps/api/src/index.ts
app.use(cors({
  origin: [
    'https://sora2-web.vercel.app',
    'https://yourdomain.com'
  ],
  credentials: true
}))
```

### 7.3 环境变量管理

**Vercel**:
- Dashboard → Settings → Environment Variables
- 分别为 Production、Preview、Development 设置

**后端服务器**:
```bash
# 创建 .env.production
cp .env.production.example .env.production

# 编辑并填入真实值
nano .env.production

# 设置权限
chmod 600 .env.production
```

---

## ✅ 步骤 8：部署验证

### 8.1 前端检查

访问你的 Vercel URL，检查：

- [ ] 首页正常加载
- [ ] 样式正确显示
- [ ] 图片正常加载
- [ ] 路由导航正常
- [ ] 控制台无错误

### 8.2 API 检查

```bash
# 健康检查
curl https://your-api.com/api/health

# 登录测试
curl -X POST https://your-api.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 8.3 集成测试

- [ ] 用户可以注册
- [ ] 用户可以登录
- [ ] 可以查看积分余额
- [ ] 可以生成视频
- [ ] 可以查看视频列表

---

## 🔄 步骤 9：CI/CD 自动部署

### Vercel 自动部署

已配置 GitHub 集成：
- Push到 `main` → 自动部署到生产环境
- Push到其他分支 → 自动部署到预览环境
- PR 创建 → 自动生成预览 URL

### GitHub Actions（可选）

已有配置 `.github/workflows/ci-cd.yml`：
- 自动运行测试
- 自动构建
- 自动部署（需配置 secrets）

---

## 📊 步骤 10：监控和日志

### Vercel Analytics

在 Vercel Dashboard 启用：
- Web Vitals
- Traffic Analytics
- Function Logs

### 错误监控（推荐）

**Sentry**:
```bash
npm install @sentry/nextjs

# 配置 sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
})
```

### 日志管理

**后端 API**:
- 使用 Winston（已配置）
- 日志存储到 CloudWatch/Datadog
- 设置告警规则

---

## 🚨 常见问题

### Q1: 部署失败 "Build Error"

**检查**:
```bash
# 本地测试构建
npm run build

# 检查 Node.js 版本
node -v  # 应该是 18+
```

### Q2: API 连接失败 CORS Error

**解决**:
- 检查后端 CORS 配置
- 确认 `NEXT_PUBLIC_API_URL` 正确
- 检查 API 服务是否运行

### Q3: 环境变量不生效

**Vercel**:
- 重新部署（Deployments → Redeploy）
- 检查变量名拼写
- 确认在正确的环境中设置

### Q4: 数据库连接失败

**检查**:
- 数据库服务是否运行
- 连接字符串格式是否正确
- 防火墙是否允许连接
- IP 白名单是否包含部署服务器

---

## 📝 部署检查清单

### 部署前
- [ ] 代码已推送到 GitHub
- [ ] 环境变量已准备
- [ ] 数据库已创建
- [ ] API Key 已获取
- [ ] 本地构建成功

### Vercel 配置
- [ ] Vercel 项目已创建
- [ ] 环境变量已设置
- [ ] 构建配置正确
- [ ] 域名已配置（如需要）

### 后端部署
- [ ] 服务器已准备
- [ ] Docker/PM2 已配置
- [ ] 数据库已连接
- [ ] Redis 已配置
- [ ] S3 存储已配置

### 安全检查
- [ ] BYPASS_AUTH=false
- [ ] JWT 密钥已更换
- [ ] HTTPS 已启用
- [ ] CORS 正确配置
- [ ] .env 文件未提交

### 功能测试
- [ ] 前端可访问
- [ ] API 可访问
- [ ] 用户可注册
- [ ] 用户可登录
- [ ] 核心功能正常

---

## 🎯 推荐部署方案

### 方案 1：最简单（开发/演示）
```
前端: Vercel (免费)
后端: Railway (免费 $5/月)
数据库: Supabase (免费)
Redis: Upstash (免费)
存储: Vercel Blob (免费 1GB)
```
**成本**: $0-5/月

### 方案 2：生产就绪
```
前端: Vercel Pro ($20/月)
后端: AWS ECS/Fargate
数据库: AWS RDS PostgreSQL
Redis: AWS ElastiCache
存储: AWS S3
```
**成本**: $50-100/月

### 方案 3：中国大陆优化
```
前端: Vercel + Cloudflare
后端: 阿里云 ECS
数据库: 阿里云 RDS
Redis: 阿里云 Redis
存储: 阿里云 OSS
```
**成本**: ¥300-500/月

---

## 📞 获取帮助

- **Vercel 文档**: https://vercel.com/docs
- **Next.js 部署**: https://nextjs.org/docs/deployment
- **Railway 文档**: https://docs.railway.app/
- **Sora2 项目**: 查看 `README.md`

---

**部署成功后**，访问你的应用并享受！🎉

**生成时间**: 2025-10-25
**状态**: 准备就绪
