# Sora2 API 文档

## 概述

Sora2 是一个基于 AI 的视频生成平台 API。本文档描述了所有可用的 API 端点、认证方式、请求/响应格式以及使用示例。

## 基础信息

- **Base URL (开发环境)**: `http://localhost:3001`
- **Base URL (生产环境)**: `https://api.sora2.com`
- **API 版本**: v1.0.0
- **协议**: HTTPS (生产环境), HTTP (开发环境)
- **数据格式**: JSON

## 在线文档

启动服务后，可以通过以下地址访问交互式 API 文档：

- **Swagger UI**: [http://localhost:3001/api-docs](http://localhost:3001/api-docs)
- **OpenAPI JSON**: [http://localhost:3001/api-docs.json](http://localhost:3001/api-docs.json)

## 认证方式

### JWT Bearer Token

大多数 API 端点需要使用 JWT Token 进行认证。

#### 获取 Token

通过 `/api/auth/login` 或 `/api/auth/register` 接口获取访问令牌。

#### 使用 Token

在请求头中添加：

```
Authorization: Bearer <access_token>
```

#### Token 类型

- **Access Token**: 短期令牌(15分钟)，用于 API 访问
- **Refresh Token**: 长期令牌(7天)，用于刷新 Access Token，存储在 HttpOnly Cookie 中

### Cookie 认证

Refresh Token 存储在 HttpOnly Cookie 中，用于 `/api/auth/refresh-token` 端点。

## API 端点分类

### 1. 认证相关 (Auth)

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | 否 |
| POST | `/api/auth/login` | 用户登录 | 否 |
| POST | `/api/auth/logout` | 用户登出 | 是 |
| POST | `/api/auth/refresh-token` | 刷新访问令牌 | Cookie |
| POST | `/api/auth/forgot-password` | 忘记密码 | 否 |
| POST | `/api/auth/reset-password` | 重置密码 | 否 |

### 2. 用户管理 (User)

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/users/profile` | 获取用户资料 | 是 |
| PUT | `/api/users/profile` | 更新用户资料 | 是 |
| PUT | `/api/users/password` | 修改密码 | 是 |
| POST | `/api/users/avatar` | 上传头像 | 是 |

### 3. 视频管理 (Video)

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/videos/generate` | 生成视频 | 是 |
| POST | `/api/videos/generate-stream` | 生成视频(SSE流式) | 是 |
| GET | `/api/videos` | 获取视频列表 | 是 |
| GET | `/api/videos/:id` | 获取视频详情 | 是 |
| GET | `/api/videos/:id/status` | 获取视频状态 | 是 |
| DELETE | `/api/videos/:id` | 删除视频 | 是 |
| POST | `/api/videos/:id/regenerate` | 重新生成视频 | 是 |
| POST | `/api/videos/:id/cancel` | 取消视频生成 | 是 |
| GET | `/api/videos/:id/download` | 下载视频 | 是 |
| POST | `/api/videos/:id/share` | 分享视频 | 是 |

### 4. 积分管理 (Credit)

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/credits/balance` | 获取积分余额 | 是 |
| GET | `/api/credits/transactions` | 获取交易记录 | 是 |
| POST | `/api/credits/recharge` | 积分充值 | 是 |

### 5. 订单管理 (Order)

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/orders/create` | 创建订单 | 是 |
| GET | `/api/orders` | 获取订单列表 | 是 |
| GET | `/api/orders/:id` | 获取订单详情 | 是 |
| POST | `/api/orders/:id/pay` | 支付订单 | 是 |

## 快速开始

### 1. 用户注册

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "username": "johndoe"
  }'
```

**响应示例**:
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "username": "johndoe",
    "role": "USER",
    "createdAt": "2025-10-20T00:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. 用户登录

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 3. 生成视频

```bash
curl -X POST http://localhost:3001/api/videos/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "prompt": "一只可爱的小猫在草地上玩耍",
    "duration": 5,
    "aspectRatio": "16:9"
  }'
```

**响应示例**:
```json
{
  "id": "456e7890-e89b-12d3-a456-426614174001",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "prompt": "一只可爱的小猫在草地上玩耍",
  "status": "PENDING",
  "duration": 5,
  "createdAt": "2025-10-20T00:00:00.000Z"
}
```

### 4. 查询视频状态

```bash
curl -X GET http://localhost:3001/api/videos/:id/status \
  -H "Authorization: Bearer <access_token>"
```

**响应示例**:
```json
{
  "id": "456e7890-e89b-12d3-a456-426614174001",
  "status": "PROCESSING",
  "progress": 45,
  "estimatedTimeRemaining": 30
}
```

## 错误处理

### HTTP 状态码

| 状态码 | 描述 |
|--------|------|
| 200 | 请求成功 |
| 201 | 资源创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 - 需要登录 |
| 403 | 禁止访问 - 权限不足 |
| 404 | 资源未找到 |
| 429 | 请求频率超限 |
| 500 | 服务器内部错误 |

### 错误响应格式

```json
{
  "error": "Validation Error",
  "message": "请求参数不正确",
  "statusCode": 400
}
```

## 频率限制

为了保护服务器资源，API 实施了以下频率限制：

| 端点类型 | 限制 | 时间窗口 |
|---------|------|---------|
| 通用 API | 100 请求 | 15 分钟 |
| 登录 | 100 请求 | 15 分钟 |
| 注册 | 3 请求 | 1 小时 |
| 视频生成 | 10 请求 | 1 小时 |

### 频率限制响应头

- `X-RateLimit-Limit`: 限制次数
- `X-RateLimit-Remaining`: 剩余次数
- `X-RateLimit-Reset`: 重置时间戳

## 数据模型

### User (用户)

```typescript
{
  id: string            // UUID
  email: string         // 邮箱
  username: string      // 用户名
  avatarUrl?: string    // 头像 URL
  role: 'USER' | 'ADMIN' // 角色
  createdAt: string     // ISO 8601 日期时间
  updatedAt: string     // ISO 8601 日期时间
}
```

### Video (视频)

```typescript
{
  id: string                    // UUID
  userId: string                // 用户 ID
  prompt: string                // 生成提示词
  status: VideoStatus           // 视频状态
  videoUrl?: string             // 视频 URL
  thumbnailUrl?: string         // 缩略图 URL
  duration?: number             // 时长(秒)
  createdAt: string             // ISO 8601 日期时间
  updatedAt: string             // ISO 8601 日期时间
}

enum VideoStatus {
  PENDING = 'PENDING'         // 等待中
  PROCESSING = 'PROCESSING'   // 生成中
  COMPLETED = 'COMPLETED'     // 已完成
  FAILED = 'FAILED'           // 失败
  CANCELLED = 'CANCELLED'     // 已取消
}
```

### Credit (积分)

```typescript
{
  id: string                    // UUID
  userId: string                // 用户 ID
  amount: number                // 积分数量
  balance: number               // 当前余额
  type: CreditType              // 交易类型
  description: string           // 描述
  createdAt: string             // ISO 8601 日期时间
}

enum CreditType {
  RECHARGE = 'RECHARGE'   // 充值
  CONSUME = 'CONSUME'     // 消费
  REFUND = 'REFUND'       // 退款
  REWARD = 'REWARD'       // 奖励
}
```

### Order (订单)

```typescript
{
  id: string                    // UUID
  userId: string                // 用户 ID
  amount: number                // 订单金额
  credits: number               // 购买积分数
  status: OrderStatus           // 订单状态
  paymentMethod: PaymentMethod  // 支付方式
  createdAt: string             // ISO 8601 日期时间
  paidAt?: string               // 支付时间
}

enum OrderStatus {
  PENDING = 'PENDING'       // 待支付
  PAID = 'PAID'             // 已支付
  FAILED = 'FAILED'         // 失败
  CANCELLED = 'CANCELLED'   // 已取消
  REFUNDED = 'REFUNDED'     // 已退款
}

enum PaymentMethod {
  ALIPAY = 'ALIPAY'     // 支付宝
  WECHAT = 'WECHAT'     // 微信支付
  STRIPE = 'STRIPE'     // Stripe
}
```

## 环境变量配置

在使用 API 之前，需要配置以下环境变量：

```env
# 服务器配置
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/sora2

# JWT 配置
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379

# 文件存储配置
UPLOAD_DIR=./uploads
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## WebSocket 支持

API 支持通过 Server-Sent Events (SSE) 实时推送视频生成状态：

```bash
curl -X POST http://localhost:3001/api/videos/generate-stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "prompt": "一只可爱的小猫在草地上玩耍"
  }'
```

服务器将通过 SSE 持续推送状态更新。

## 最佳实践

### 1. Token 管理

- 将 Access Token 存储在内存中（不要存储在 localStorage）
- 定期使用 Refresh Token 更新 Access Token
- 在 Token 过期前预先刷新

### 2. 错误处理

- 始终检查响应状态码
- 实现适当的错误重试逻辑
- 记录详细的错误信息用于调试

### 3. 性能优化

- 使用分页查询大量数据
- 实现请求缓存机制
- 避免频繁调用相同接口

### 4. 安全建议

- 使用 HTTPS 传输敏感数据
- 不要在客户端硬编码敏感信息
- 定期轮换 API 密钥和 Token

## 开发工具

### Postman Collection

我们提供了 Postman Collection 用于快速测试 API：

1. 访问 `/api-docs.json` 获取 OpenAPI 规范
2. 在 Postman 中导入 OpenAPI 文档
3. 配置环境变量并开始测试

### SDK 支持

目前我们提供以下语言的 SDK：

- JavaScript/TypeScript (计划中)
- Python (计划中)
- Go (计划中)

## 更新日志

### v1.0.0 (2025-10-20)

- 初始版本发布
- 实现用户认证系统
- 实现视频生成功能
- 实现积分和订单管理
- 添加 Swagger 文档支持

## 支持与反馈

如有问题或建议，请通过以下方式联系我们：

- **邮箱**: support@sora2.com
- **GitHub Issues**: [https://github.com/sora2/api/issues](https://github.com/sora2/api/issues)
- **文档**: [https://docs.sora2.com](https://docs.sora2.com)

## 许可证

MIT License - 详见 LICENSE 文件
