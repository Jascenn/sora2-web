# Sora2 Video Generation Platform

第三方 Sora2 AI 视频生成平台

## 📋 目录

- [项目简介](#项目简介)
- [项目结构](#项目结构)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [开发指南](#开发指南)
- [部署](#部署)
- [归档文档](#归档文档)
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
│       └── package.json
├── packages/
│   └── database/               # Prisma 数据库配置
│       ├── prisma/
│       └── seed.ts
├── config/                     # 配置文件
│   └── nginx/
├── migrations/                 # 数据库迁移文件
├── docker-compose.yml          # Docker 编排文件
├── Makefile                    # 构建脚本
└── README.md                   # 项目说明文档
```

## 技术栈

### 前端
- **框架**: Next.js 14+ (App Router)
- **UI**: Tailwind CSS + Shadcn/ui
- **状态管理**: Zustand
- **数据获取**: React Query (TanStack Query)
- **类型检查**: TypeScript

### 后端
- **运行时**: Node.js 18+
- **框架**: Express.js
- **语言**: TypeScript
- **API**: RESTful API + Swagger 文档
- **认证**: JWT + Refresh Token

### 数据库
- **主数据库**: PostgreSQL 14+
- **ORM**: Prisma
- **连接池**: PgBouncer

### 基础设施
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx
- **文件存储**: 本地存储 / 云存储
- **监控**: 自定义监控系统

## 快速开始

### 使用 Docker Compose（推荐）

```bash
# 克隆项目
git clone https://github.com/Jascenn/sora2-web.git
cd sora2-web

# 启动所有服务
make dev

# 或者使用 docker-compose
docker-compose up -d
```

### 手动安装

1. **安装依赖**
```bash
# 安装根目录依赖
pnpm install

# 安装各应用依赖
pnpm install:all
```

2. **配置环境变量**
```bash
# 复制环境变量模板
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 编辑环境变量
vim .env
```

3. **初始化数据库**
```bash
# 运行数据库迁移
make migrate

# 填充种子数据
make seed
```

4. **启动开发服务器**
```bash
# 启动 API 服务
make dev-api

# 启动 Web 服务（新终端）
make dev-web
```

### 访问应用

- **前端应用**: http://localhost:3000
- **API 服务**: http://localhost:3001
- **API 文档**: http://localhost:3001/api-docs

## 开发指南

### 常用命令

```bash
# 查看所有可用命令
make help

# 数据库操作
make migrate      # 运行迁移
make seed         # 填充种子数据
make db-reset     # 重置数据库
make db-shell     # 进入数据库 shell

# 开发环境
make dev          # 启动所有服务
make dev-api      # 仅启动 API
make dev-web      # 仅启动 Web
make build        # 构建所有应用
make test         # 运行测试

# 生产环境
make prod         # 启动生产环境
make logs         # 查看日志
make clean        # 清理资源
```

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 和 Prettier 规范
- 提交前运行 `make lint` 检查代码

## 部署

### 生产环境部署

1. **配置生产环境变量**
2. **使用 Docker Compose 部署**
```bash
# 构建并启动生产环境
make prod

# 或使用 docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

3. **配置 Nginx 反向代理**（可选）

### 环境变量说明

主要环境变量：

- `DATABASE_URL`: PostgreSQL 数据库连接
- `JWT_SECRET`: JWT 密钥
- `REFRESH_TOKEN_SECRET`: 刷新令牌密钥
- `SORA_API_KEY`: Sora API 密钥
- `NEXT_PUBLIC_API_URL`: 前端 API 地址

## 文档

### 📖 新手入门
- 🌱 [Git分支管理小白指南](./docs/GIT_FOR_BEGINNERS.md) - 零基础学Git分支管理
- 🌳 [分支管理策略](./docs/BRANCH_STRATEGY.md) - 详细的分支使用规范

### 📋 项目文档
- 📖 [详细设置指南](./SETUP.md) - 完整的项目设置说明
- 📋 [产品需求文档](./docs/PRD.md) - 项目需求和功能说明
- ⚙️ [环境变量配置](./.env.example) - 环境变量模板
- 🐳 [Docker 配置](./docker-compose.yml) - Docker 编排配置

### API 文档

- 📡 API 接口文档: http://localhost:3001/api-docs（启动服务后访问）

## 开发环境归档

以下开发相关文件已归档（不影响正常使用）：
- 测试文件和测试配置
- 开发脚本
- 临时报告文档

## License

MIT License - 详见 [LICENSE](./LICENSE) 文件