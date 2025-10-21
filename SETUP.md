# Sora2 平台快速搭建指南

## 前置要求

- Node.js >= 18
- pnpm >= 8
- Docker & Docker Compose
- OpenAI API Key (with Sora access)
- AWS S3 账户（或阿里云 OSS）

## 第一步：克隆并安装依赖

```bash
cd /Users/jascen/Development/00_Pay_Project/sora2

# 安装 pnpm (如果未安装)
npm install -g pnpm

# 安装项目依赖
pnpm install
```

## 第二步：启动数据库

```bash
# 启动 PostgreSQL 和 Redis
docker-compose up -d

# 等待数据库启动（大约 10 秒）
sleep 10
```

## 第三步：配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入以下必要配置：
# - DATABASE_URL
# - OPENAI_API_KEY
# - JWT_SECRET (生成随机字符串)
# - AWS S3 配置 (或阿里云 OSS)
```

### 环境变量配置示例

```bash
# 数据库 (Docker Compose 默认配置)
DATABASE_URL="postgresql://sora2:sora2_dev_password@localhost:5432/sora2?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# OpenAI (必填)
OPENAI_API_KEY="sk-proj-your-api-key-here"

# JWT (生成随机字符串)
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRES_IN="7d"

# AWS S3 (必填)
STORAGE_PROVIDER="s3"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"

# 应用配置
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:3001"
```

## 第四步：初始化数据库

```bash
# 生成 Prisma Client
cd packages/database
pnpm prisma generate

# 运行数据库迁移
pnpm prisma migrate dev --name init

# 填充初始数据（管理员账户、模板等）
pnpm db:seed
```

### 默认账户信息

- **管理员账户**:
  - Email: `admin@sora2.com`
  - Password: `admin123`
  - 积分: 10000

- **测试用户**:
  - Email: `user@sora2.com`
  - Password: `user123`
  - 积分: 500

## 第五步：启动开发服务器

```bash
# 回到项目根目录
cd ../..

# 启动前后端开发服务器
pnpm dev
```

服务器启动后：
- 前端: http://localhost:3000
- 后端 API: http://localhost:3001
- 数据库管理: `pnpm --filter database db:studio` (http://localhost:5555)

## 验证安装

### 1. 检查后端健康状态

```bash
curl http://localhost:3001/health
```

应该返回：
```json
{
  "status": "ok",
  "timestamp": "2025-10-12T..."
}
```

### 2. 测试登录接口

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@sora2.com",
    "password": "user123"
  }'
```

### 3. 访问前端

打开浏览器访问 http://localhost:3000，应该看到首页。

## 常见问题

### 1. 数据库连接失败

```bash
# 检查 PostgreSQL 是否运行
docker ps | grep postgres

# 查看数据库日志
docker logs sora2-postgres

# 重启数据库
docker-compose restart postgres
```

### 2. Redis 连接失败

```bash
# 检查 Redis 是否运行
docker ps | grep redis

# 测试 Redis 连接
docker exec -it sora2-redis redis-cli ping
# 应该返回: PONG
```

### 3. Prisma Client 未生成

```bash
cd packages/database
pnpm prisma generate
```

### 4. 端口被占用

修改 `.env` 文件中的 `PORT` 变量，或者杀掉占用端口的进程：

```bash
# 查找占用 3001 端口的进程
lsof -i :3001

# 杀掉进程
kill -9 <PID>
```

## 开发工作流

### 修改数据库 Schema

```bash
cd packages/database

# 1. 修改 prisma/schema.prisma
# 2. 创建并应用迁移
pnpm prisma migrate dev --name your_migration_name

# 3. 生成新的 Prisma Client
pnpm prisma generate
```

### 查看数据库内容

```bash
cd packages/database
pnpm db:studio
```

访问 http://localhost:5555 查看和编辑数据。

### 查看队列任务

```bash
# 安装 Bull Board (可选)
pnpm add @bull-board/express

# 访问队列管理界面 (需要添加到 API 路由中)
# http://localhost:3001/admin/queues
```

## 生产环境部署

### 构建项目

```bash
# 构建前后端
pnpm build
```

### Docker 部署

```bash
# 构建并启动所有服务
docker-compose -f docker-compose.prod.yml up -d
```

### 环境变量检查清单

生产环境必须配置：
- [ ] `DATABASE_URL` (生产数据库)
- [ ] `REDIS_URL` (生产 Redis)
- [ ] `OPENAI_API_KEY`
- [ ] `JWT_SECRET` (强随机字符串)
- [ ] `AWS_*` 或 `ALIYUN_*` (存储配置)
- [ ] `NODE_ENV=production`
- [ ] 支付相关配置 (Stripe/Alipay/WeChat)

## 下一步

1. **配置支付系统**
   - 集成 Stripe / Alipay / WeChat Pay
   - 参考 PRD.md 中的支付流程

2. **实现内容审核**
   - 配置敏感词过滤
   - 集成 OpenAI Moderation API

3. **添加监控**
   - 集成 Sentry (错误追踪)
   - 配置 Prometheus + Grafana (性能监控)

4. **优化性能**
   - 配置 CDN
   - 添加 Redis 缓存
   - 数据库索引优化

## 技术支持

遇到问题？查看：
- 项目文档: `README.md`
- 产品需求: `PRD.md`
- API 文档: http://localhost:3001/api-docs (TODO)
- 数据库 Schema: `packages/database/prisma/schema.prisma`

---

**祝您开发顺利！** 🚀
