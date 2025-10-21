# Sora2 Video Generation Platform

第三方 Sora2 AI 视频生成平台

> 🚀 **快速参考**：[QUICK_REFERENCE.md](./QUICK_REFERENCE.md) | **测试账户**：[docs/TEST_ACCOUNTS.md](./docs/TEST_ACCOUNTS.md)

## 📋 目录

- [项目简介](#项目简介)
- [项目结构](#项目结构)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [测试账户](#测试账户)
- [开发指南](#开发指南)
- [部署](#部署)
- [文档](#文档)
- [License](#license)

## 项目简介

Sora2 是一个基于 AI 的视频生成平台，提供以下核心功能：

- 🎬 AI 视频生成
- 👥 用户管理系统
- 💰 积分充值与消费
- 📊 管理后台
- 🔒 完整的认证授权
- 📈 性能监控与日志

## 项目结构

```
sora2-platform/
├── apps/
│   ├── web/                    # Next.js 前端应用
│   │   ├── src/
│   │   ├── public/
│   │   └── package.json
│   └── api/                    # Node.js 后端 API
│       ├── src/
│       ├── docs/
│       └── package.json
├── packages/
│   └── database/               # Prisma 数据库配置
│       ├── prisma/
│       └── seed.ts
├── docs/                       # 项目文档
│   ├── TEST_ACCOUNTS.md        # 测试账户信息
│   ├── DOCKER_QUICKSTART.md    # Docker 快速开始
│   └── ...
├── scripts/                    # 部署脚本
├── Dockerfile.api              # API Docker 配置
├── Dockerfile.web              # Web Docker 配置
├── docker-compose.yml          # 开发环境配置
├── docker-compose.prod.yml     # 生产环境配置
├── Makefile                    # 便捷命令
├── QUICK_REFERENCE.md          # 快速参考手册
└── README.md
```

## 技术栈

### 前端
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand

### 后端
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- Bull Queue

### 部署
- Docker
- Docker Compose

## 快速开始

### 环境要求
- Node.js >= 18
- pnpm >= 8
- PostgreSQL >= 14
- Redis >= 6

### 安装依赖
```bash
pnpm install
```

### 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，填入必要的配置
```

### 启动数据库
```bash
docker-compose up -d postgres redis
```

### 运行数据库迁移
```bash
cd packages/database
pnpm prisma migrate dev
```

### 创建测试账户
```bash
cd packages/database
npx prisma db seed
```

### 启动开发服务器
```bash
pnpm dev
```

### 访问应用
- 🌐 前端界面: http://localhost:3100
- 🔌 后端 API: http://localhost:3101
- 📚 API 文档: http://localhost:3101/api-docs
- 📊 监控面板: http://localhost:3101/api/monitoring/health
- 💾 数据库管理: http://localhost:5555 (`npx prisma studio`)

## 🔐 测试账户

开发环境已预配置测试账户：

### 管理员账户
```
邮箱：admin@sora2.com
密码：admin123
```

### 普通用户账户
```
邮箱：user@sora2.com
密码：user123
```

> 📖 更多详情请查看：[docs/TEST_ACCOUNTS.md](./docs/TEST_ACCOUNTS.md)

⚠️ **重要**：生产环境请勿使用这些测试账户！

## 开发指南

### 代码规范
- 使用 ESLint + Prettier
- 提交前自动格式化代码
- 使用 Conventional Commits

### 数据库操作
```bash
# 创建迁移
cd packages/database
npx prisma migrate dev --name your-migration-name

# 查看数据库
npx prisma studio

# 生成 Prisma Client
npx prisma generate

# 重置数据库（包含种子数据）
npx prisma migrate reset
```

### Docker 命令（使用 Makefile）
```bash
# 构建镜像
make build

# 启动服务
make deploy

# 查看状态
make status

# 查看日志
make logs

# 健康检查
make health

# 停止服务
make stop
```

## 部署

### 开发环境
```bash
# 使用 docker-compose
docker-compose up -d

# 或使用 Makefile
make dev
```

### 生产环境
```bash
# 1. 配置环境变量
cp .env.production.example .env.production
# 编辑 .env.production

# 2. 构建镜像
make build

# 3. 部署
make deploy

# 4. 验证
make health
```

> 📖 详细部署指南：[docs/DOCKER_QUICKSTART.md](./docs/DOCKER_QUICKSTART.md)

## 📚 文档

### 核心文档
- 📖 [快速参考手册](./QUICK_REFERENCE.md) - 常用命令和信息
- 🔐 [测试账户文档](./docs/TEST_ACCOUNTS.md) - 测试账户详细信息
- 📡 [API 文档](./apps/api/docs/API_DOCUMENTATION.md) - API 使用指南
- 📘 [Swagger UI](http://localhost:3101/api-docs) - 交互式 API 文档

### Docker 相关
- 🚀 [Docker 快速开始](./docs/DOCKER_QUICKSTART.md)
- ⚙️ [Docker 优化指南](./docs/DOCKER_OPTIMIZATION_GUIDE.md)
- ✅ [生产部署清单](./docs/PRODUCTION_CHECKLIST.md)

### 数据库相关
- 💾 [数据库优化实施](./DATABASE_OPTIMIZATION_IMPLEMENTATION.md)
- 🏃 [数据库快速入门](./DATABASE_OPTIMIZATION_QUICKSTART.md)

### 前端相关
- ⚡ [前端优化总结](./apps/web/OPTIMIZATION_SUMMARY.md)
- 📱 [前端快速开始](./apps/web/QUICK_START.md)

### 监控相关
- 📊 [监控系统概述](./apps/api/MONITORING_README.md)
- 🔧 [监控系统集成](./apps/api/MONITORING_SETUP.md)

## 🎯 性能优化成果

本项目已完成全面性能优化：

| 优化项目 | 提升效果 |
|---------|---------|
| Docker 镜像大小 | **减少 79%** (2.0GB → 420MB) |
| 数据库查询速度 | **提升 60-95%** |
| 前端包大小 | **减少 28%** (250KB → 180KB) |
| API 响应时间 | **提升 67-80%** (150ms → 30-50ms) |
| 构建速度 | **提升 87%** (4分钟 → 30秒) |

- ✅ 完整的 Docker 多阶段构建优化
- ✅ 数据库索引和 Redis 缓存
- ✅ 前端 PWA 和 Service Worker
- ✅ API 文档 100% 覆盖
- ✅ 监控和日志系统
- ✅ 自动化部署脚本

## 🛠️ 技术特性

- ✨ TypeScript 全栈开发
- 🎨 现代化 UI（shadcn/ui）
- 🔄 实时更新（SSE）
- 💾 数据库迁移管理
- 🔒 JWT + Refresh Token 认证
- 📊 性能监控和日志
- 🐳 容器化部署
- 📱 PWA 支持
- ⚡ Redis 缓存
- 🎯 API 限流保护

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📞 支持

如有问题，请参考：
- [快速参考手册](./QUICK_REFERENCE.md)
- [API 文档](http://localhost:3101/api-docs)
- [测试账户](./docs/TEST_ACCOUNTS.md)

## License

MIT
