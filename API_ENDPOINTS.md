# Sora2 API 端点文档

本文档描述了 Sora2 项目新实现的核心 API 端点。

## 实现的端点列表

### 1. 用户注册 - `/api/auth/register`
### 2. 用户登出 - `/api/auth/logout`
### 3. 视频列表 - `/api/videos/list`
### 4. 积分查询 - `/api/credits/balance`

---

## 详细说明

### 1. 用户注册

**端点**: `POST /api/auth/register`

**功能**: 注册新用户账号

**请求头**:
```
Content-Type: application/json
```

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "用户昵称"
}
```

**字段验证**:
- `email`: 必填,有效的邮箱格式
- `password`: 必填,6-100个字符,必须包含字母和数字
- `nickname`: 必填,2-50个字符

**成功响应** (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "nickname": "用户昵称",
      "credits": 100,
      "role": "user"
    }
  },
  "message": "注册成功"
}
```

**错误响应**:
- `400`: 请求数据验证失败
- `429`: 请求过于频繁 (15分钟内最多5次注册尝试)
- `500`: 服务器内部错误
- `503`: 服务暂时不可用

**特性**:
- IP 级别的速率限制 (15分钟窗口,最多5次请求)
- Zod 数据验证
- 密码强度检查
- 自动转发 Set-Cookie 头实现会话管理

---

### 2. 用户登出

**端点**: `POST /api/auth/logout` 或 `GET /api/auth/logout`

**功能**: 用户退出登录,清除会话

**请求头**:
```
Content-Type: application/json
Cookie: token=xxx; refreshToken=xxx
```

**请求体**: 无

**成功响应** (200):
```json
{
  "success": true,
  "data": null,
  "message": "登出成功"
}
```

**响应头**:
```
Set-Cookie: token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax
Set-Cookie: refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax
```

**错误响应**:
- `500`: 服务器内部错误
- `503`: 服务暂时不可用

**特性**:
- 支持 GET 和 POST 方法
- 自动清除 httpOnly cookies
- 即使后端失败也会清除客户端 cookies
- 安全的会话清理

---

### 3. 视频列表

**端点**: `GET /api/videos/list`

**功能**: 获取用户的视频列表,支持分页和过滤

**请求头**:
```
Content-Type: application/json
Cookie: token=xxx
```

**查询参数**:
```
?page=1&limit=20&status=completed&sortBy=createdAt&order=desc
```

**参数说明**:
- `page`: 页码,默认 1
- `limit`: 每页数量,1-100,默认 20
- `status`: 视频状态 (pending/processing/completed/failed/all),可选
- `sortBy`: 排序字段 (createdAt/updatedAt),默认 createdAt
- `order`: 排序方向 (asc/desc),默认 desc

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "videos": [
      {
        "id": "video-id",
        "prompt": "视频描述",
        "status": "completed",
        "url": "https://example.com/video.mp4",
        "thumbnailUrl": "https://example.com/thumb.jpg",
        "duration": 10,
        "aspectRatio": "16:9",
        "createdAt": "2025-01-20T10:00:00Z",
        "updatedAt": "2025-01-20T10:05:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  },
  "message": "获取成功"
}
```

**错误响应**:
- `400`: 请求参数验证失败
- `401`: 未登录或登录已过期
- `500`: 服务器内部错误
- `503`: 服务暂时不可用

**特性**:
- 查询参数验证 (Zod)
- 分页支持
- 状态过滤
- 灵活的排序选项
- 认证保护

**额外功能**: 还支持 POST 方法用于复杂搜索

**POST 端点**: `POST /api/videos/list`

**请求体**:
```json
{
  "page": 1,
  "limit": 20,
  "filters": {
    "status": "completed",
    "dateRange": {
      "start": "2025-01-01",
      "end": "2025-01-31"
    }
  }
}
```

---

### 4. 积分查询

**端点**: `GET /api/credits/balance`

**功能**: 查询当前用户的积分余额

**请求头**:
```
Content-Type: application/json
Cookie: token=xxx
```

**查询参数**: 无

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "balance": 1500,
    "currency": "credits",
    "userId": "user-id"
  },
  "message": "获取成功"
}
```

**错误响应**:
- `401`: 未登录或登录已过期
- `500`: 服务器内部错误
- `503`: 服务暂时不可用

**特性**:
- 认证保护 (需要登录)
- Cookie 检查
- 标准化响应格式

---

## 通用特性

### 1. 统一的响应格式

所有 API 端点遵循统一的响应格式:

**成功响应**:
```json
{
  "success": true,
  "data": { /* 响应数据 */ },
  "message": "操作描述"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "错误描述",
  "details": [] // 可选,详细错误信息
}
```

### 2. HTTP 状态码

- `200`: 成功 (GET/POST/PUT)
- `201`: 创建成功 (POST)
- `400`: 请求参数错误
- `401`: 未授权/未登录
- `403`: 禁止访问
- `404`: 资源不存在
- `429`: 请求过于频繁
- `500`: 服务器内部错误
- `503`: 服务不可用

### 3. 安全特性

- **速率限制**: 注册接口有 IP 级别的速率限制
- **数据验证**: 使用 Zod 进行请求数据验证
- **认证保护**: 敏感接口需要 Cookie 认证
- **httpOnly Cookies**: 使用 httpOnly cookies 存储认证令牌
- **错误处理**: 统一的错误处理和友好的错误消息

### 4. Cookie 认证

认证使用 httpOnly cookies:
- `token`: 访问令牌
- `refreshToken`: 刷新令牌

浏览器自动发送 cookies,无需手动处理。

### 5. 代理模式

所有 API 请求通过 Next.js API 路由代理到后端:
- 客户端: `/api/auth/register` → Next.js API Route
- 服务端: Next.js → `${API_URL}/api/auth/register`

这种模式的优点:
- 避免 CORS 问题
- 统一的错误处理
- 可以添加中间件 (日志、监控等)
- 保护后端 API 地址

---

## 使用示例

### JavaScript/TypeScript

#### 1. 注册用户
```typescript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securePassword123',
    nickname: '新用户',
  }),
})

const data = await response.json()
if (data.success) {
  console.log('注册成功:', data.data.user)
}
```

#### 2. 用户登出
```typescript
const response = await fetch('/api/auth/logout', {
  method: 'POST',
  credentials: 'include', // 重要:包含 cookies
})

const data = await response.json()
if (data.success) {
  console.log('登出成功')
  // 重定向到登录页
  window.location.href = '/login'
}
```

#### 3. 获取视频列表
```typescript
const response = await fetch('/api/videos/list?page=1&limit=20&status=completed', {
  method: 'GET',
  credentials: 'include', // 重要:包含 cookies
})

const data = await response.json()
if (data.success) {
  console.log('视频列表:', data.data.videos)
  console.log('分页信息:', data.data.pagination)
}
```

#### 4. 查询积分余额
```typescript
const response = await fetch('/api/credits/balance', {
  method: 'GET',
  credentials: 'include', // 重要:包含 cookies
})

const data = await response.json()
if (data.success) {
  console.log('当前积分:', data.data.balance)
}
```

### 使用 Axios (推荐)

项目已配置 Axios 实例 (`/src/lib/api.ts`),自动处理 cookies:

```typescript
import { api } from '@/lib/api'

// 注册
const registerResponse = await api.post('/auth/register', {
  email: 'user@example.com',
  password: 'securePassword123',
  nickname: '新用户',
})

// 登出
await api.post('/auth/logout')

// 获取视频列表
const videosResponse = await api.get('/videos/list', {
  params: {
    page: 1,
    limit: 20,
    status: 'completed',
  },
})

// 查询积分
const creditsResponse = await api.get('/credits/balance')
```

### React Hook 示例

```typescript
import { useState, useEffect } from 'react'

function useCredits() {
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBalance() {
      try {
        const response = await fetch('/api/credits/balance', {
          credentials: 'include',
        })
        const data = await response.json()
        if (data.success) {
          setBalance(data.data.balance)
        }
      } catch (error) {
        console.error('获取积分失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBalance()
  }, [])

  return { balance, loading }
}

// 使用
function UserDashboard() {
  const { balance, loading } = useCredits()

  return (
    <div>
      {loading ? '加载中...' : `当前积分: ${balance}`}
    </div>
  )
}
```

---

## 环境变量配置

需要在 `.env` 或 `.env.local` 文件中配置:

```bash
# 后端 API 地址
API_URL=http://localhost:3101
# 或
NEXT_PUBLIC_API_URL=http://localhost:3101

# 允许的来源 (可选,用于 CORS)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3200
```

---

## 测试建议

### 1. 使用 curl 测试

```bash
# 注册
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","nickname":"测试用户"}'

# 登出 (需要先登录获取 cookie)
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cookie: token=xxx" \
  -c cookies.txt

# 获取视频列表
curl http://localhost:3000/api/videos/list?page=1&limit=10 \
  -H "Cookie: token=xxx"

# 查询积分
curl http://localhost:3000/api/credits/balance \
  -H "Cookie: token=xxx"
```

### 2. 使用 Postman

1. 创建新的 Collection
2. 设置 Base URL: `http://localhost:3000`
3. 启用 Cookie 管理
4. 添加请求:
   - POST /api/auth/register
   - POST /api/auth/logout
   - GET /api/videos/list
   - GET /api/credits/balance

---

## 故障排查

### 1. CORS 错误
确保使用相对路径或通过 Next.js 代理访问 API:
```typescript
// ✅ 正确
fetch('/api/auth/register')

// ❌ 错误 (会导致 CORS 错误)
fetch('http://localhost:3101/api/auth/register')
```

### 2. 401 未授权错误
确保请求包含 credentials:
```typescript
fetch('/api/videos/list', {
  credentials: 'include' // 重要!
})
```

### 3. 速率限制
如果看到 429 错误,等待 15 分钟或重启开发服务器清除内存中的速率限制记录。

### 4. 后端连接失败
检查环境变量 `API_URL` 或 `NEXT_PUBLIC_API_URL` 是否正确配置。

---

## 下一步扩展

建议添加的端点:
1. `/api/auth/login` - 用户登录
2. `/api/auth/refresh` - 刷新令牌
3. `/api/users/profile` - 用户资料
4. `/api/videos/:id` - 获取单个视频
5. `/api/credits/transactions` - 积分交易记录
6. `/api/orders/create` - 创建订单
7. `/api/admin/*` - 管理员接口

---

## 创建的文件列表

1. `/src/app/api/auth/register/route.ts` - 用户注册端点
2. `/src/app/api/auth/logout/route.ts` - 用户登出端点
3. `/src/app/api/videos/list/route.ts` - 视频列表端点
4. `/src/app/api/credits/balance/route.ts` - 积分查询端点
5. `/API_ENDPOINTS.md` - API 文档 (本文件)

---

**最后更新**: 2025-01-20
**版本**: 1.0.0
