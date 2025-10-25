# Sora2 API 快速开始指南

> 快速上手新实现的 API 端点

## 5分钟快速开始

### 1. 安装依赖 (如果还没有)

```bash
npm install
# 或
pnpm install
```

### 2. 配置环境变量

创建 `.env.local` 文件:

```bash
# 后端 API 地址
NEXT_PUBLIC_API_URL=http://localhost:3101

# 或使用服务端专用变量 (更安全)
API_URL=http://localhost:3101
```

### 3. 启动开发服务器

```bash
npm run dev
# 访问 http://localhost:3000
```

### 4. 测试 API 端点

#### 方法 1: 在浏览器控制台

```javascript
// 1. 注册用户
fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'test123',
    nickname: '测试用户'
  })
})
.then(res => res.json())
.then(data => console.log(data))

// 2. 查询积分
fetch('/api/credits/balance', { credentials: 'include' })
.then(res => res.json())
.then(data => console.log(data))

// 3. 获取视频列表
fetch('/api/videos/list?page=1&limit=10', { credentials: 'include' })
.then(res => res.json())
.then(data => console.log(data))

// 4. 登出
fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
.then(res => res.json())
.then(data => console.log(data))
```

#### 方法 2: 使用 curl

```bash
# 1. 注册
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","nickname":"测试"}' \
  -c cookies.txt

# 2. 查询积分
curl http://localhost:3000/api/credits/balance -b cookies.txt

# 3. 获取视频列表
curl "http://localhost:3000/api/videos/list?page=1&limit=10" -b cookies.txt

# 4. 登出
curl -X POST http://localhost:3000/api/auth/logout -b cookies.txt
```

---

## React 组件示例

### 注册表单组件

```typescript
'use client'

import { useState } from 'react'
import { api } from '@/lib/api'

export function RegisterForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nickname: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/auth/register', formData)
      if (response.data.success) {
        // 注册成功,跳转到首页
        window.location.href = '/dashboard'
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="邮箱"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
      />
      <input
        type="password"
        placeholder="密码"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
        required
      />
      <input
        type="text"
        placeholder="昵称"
        value={formData.nickname}
        onChange={(e) => setFormData({...formData, nickname: e.target.value})}
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? '注册中...' : '注册'}
      </button>
    </form>
  )
}
```

### 积分显示组件

```typescript
'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export function CreditsDisplay() {
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBalance() {
      try {
        const response = await api.get('/credits/balance')
        if (response.data.success) {
          setBalance(response.data.data.balance)
        }
      } catch (error) {
        console.error('获取积分失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBalance()
  }, [])

  if (loading) return <div>加载中...</div>

  return (
    <div className="credits-display">
      <span>积分: {balance}</span>
    </div>
  )
}
```

### 视频列表组件

```typescript
'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Video {
  id: string
  prompt: string
  status: string
  url?: string
  thumbnailUrl?: string
  createdAt: string
}

export function VideoList() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    async function fetchVideos() {
      try {
        setLoading(true)
        const response = await api.get('/videos/list', {
          params: {
            page,
            limit: 20,
            status: 'all',
            sortBy: 'createdAt',
            order: 'desc'
          }
        })

        if (response.data.success) {
          setVideos(response.data.data.videos)
          setTotalPages(response.data.data.pagination.totalPages)
        }
      } catch (error) {
        console.error('获取视频列表失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [page])

  if (loading) return <div>加载中...</div>

  return (
    <div>
      <div className="video-grid">
        {videos.map((video) => (
          <div key={video.id} className="video-card">
            {video.thumbnailUrl && (
              <img src={video.thumbnailUrl} alt={video.prompt} />
            )}
            <h3>{video.prompt}</h3>
            <p>状态: {video.status}</p>
            <p>创建时间: {new Date(video.createdAt).toLocaleString()}</p>
            {video.url && (
              <a href={video.url} target="_blank">观看视频</a>
            )}
          </div>
        ))}
      </div>

      {/* 分页 */}
      <div className="pagination">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          上一页
        </button>
        <span>第 {page} / {totalPages} 页</span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          下一页
        </button>
      </div>
    </div>
  )
}
```

### 登出按钮组件

```typescript
'use client'

import { useState } from 'react'
import { api } from '@/lib/api'

export function LogoutButton() {
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await api.post('/auth/logout')
      // 登出成功,跳转到登录页
      window.location.href = '/login'
    } catch (error) {
      console.error('登出失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleLogout} disabled={loading}>
      {loading ? '登出中...' : '登出'}
    </button>
  )
}
```

---

## 自定义 Hooks

### useAuth Hook

```typescript
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'

export function useAuth() {
  const { user, setUser, logout } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 尝试从 cookie 恢复用户信息
    async function checkAuth() {
      try {
        const response = await api.get('/users/profile')
        if (response.data.success) {
          setUser(response.data.data.user)
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!user) {
      checkAuth()
    } else {
      setLoading(false)
    }
  }, [user, setUser])

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout: async () => {
      await api.post('/auth/logout')
      logout()
      window.location.href = '/login'
    }
  }
}
```

### useCredits Hook

```typescript
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

export function useCredits() {
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/credits/balance')
      if (response.data.success) {
        setBalance(response.data.data.balance)
        setError(null)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '获取积分失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  return {
    balance,
    loading,
    error,
    refresh: fetchBalance
  }
}
```

### useVideos Hook

```typescript
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

interface UseVideosOptions {
  page?: number
  limit?: number
  status?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useVideos(options: UseVideosOptions = {}) {
  const {
    page = 1,
    limit = 20,
    status = 'all',
    autoRefresh = false,
    refreshInterval = 5000
  } = options

  const [videos, setVideos] = useState<any[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/videos/list', {
        params: {
          page,
          limit,
          status: status === 'all' ? undefined : status,
          sortBy: 'createdAt',
          order: 'desc'
        }
      })

      if (response.data.success) {
        setVideos(response.data.data.videos)
        setPagination(response.data.data.pagination)
        setError(null)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '获取视频列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, limit, status])

  useEffect(() => {
    fetchVideos()

    // 自动刷新
    if (autoRefresh) {
      const interval = setInterval(fetchVideos, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchVideos, autoRefresh, refreshInterval])

  return {
    videos,
    pagination,
    loading,
    error,
    refresh: fetchVideos
  }
}
```

---

## 常见问题 FAQ

### Q1: 如何在组件中使用这些 API?

**A**: 使用项目已配置的 `api` 实例:

```typescript
import { api } from '@/lib/api'

// GET 请求
const response = await api.get('/videos/list')

// POST 请求
const response = await api.post('/auth/register', data)
```

### Q2: 如何处理认证?

**A**: 认证通过 httpOnly cookies 自动处理,无需手动管理 token。只需确保请求包含 `credentials`:

```typescript
// 使用 fetch
fetch('/api/videos/list', { credentials: 'include' })

// 使用 api 实例 (已配置 withCredentials: true)
api.get('/videos/list')
```

### Q3: 如何处理错误?

**A**: 使用 try-catch:

```typescript
try {
  const response = await api.get('/videos/list')
  // 处理成功响应
} catch (error: any) {
  // 处理错误
  const errorMessage = error.response?.data?.error || '请求失败'
  console.error(errorMessage)
}
```

### Q4: 如何实现分页?

**A**: 使用查询参数:

```typescript
const [page, setPage] = useState(1)

const fetchVideos = async () => {
  const response = await api.get('/videos/list', {
    params: { page, limit: 20 }
  })
  // 处理响应
}
```

### Q5: 如何过滤视频状态?

**A**: 使用 status 参数:

```typescript
// 只获取已完成的视频
const response = await api.get('/videos/list', {
  params: {
    status: 'completed',
    page: 1,
    limit: 20
  }
})
```

---

## 下一步

1. **阅读完整文档**: [API_ENDPOINTS.md](./API_ENDPOINTS.md)
2. **查看实现细节**: [API_IMPLEMENTATION_SUMMARY.md](./API_IMPLEMENTATION_SUMMARY.md)
3. **查看源码**: `src/app/api/` 目录
4. **测试 API**: 使用上面的示例代码
5. **集成到应用**: 在你的页面和组件中使用这些 API

---

## 需要帮助?

- 查看错误日志: 浏览器控制台或服务端终端
- 检查网络请求: 浏览器开发者工具 Network 标签
- 验证环境变量: 确保 `.env.local` 配置正确
- 确认后端运行: 检查后端 API 服务是否启动

---

**快速开始时间**: < 5 分钟
**学习曲线**: 低
**文档完整度**: ⭐⭐⭐⭐⭐
