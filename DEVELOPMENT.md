# Sora2 开发环境文档

## 📋 开发环境配置

### 前端服务
- **地址**: http://127.0.0.1:3000
- **框架**: Next.js 14.2.33
- **状态**: ✅ 运行中

### 后端服务
- **地址**: http://127.0.0.1:3101
- **类型**: Mock API Server
- **状态**: ✅ 运行中

### 启动命令

#### 1. 启动 Mock API 服务器
```bash
cd /Users/jascen/Development/00_Pay_Project/sora2-web
node mock-auth.js
```

#### 2. 启动 Next.js 开发服务器
```bash
cd /Users/jascen/Development/00_Pay_Project/sora2-web
npm run dev
# 或者
npx next dev --port 3000 --hostname 127.0.0.1
```

## 🔧 免登录模式

### 启用状态
- ✅ 免登录模式已启用
- ✅ 所有页面可直接访问
- ✅ 默认登录为管理员账户

### 默认用户信息
```javascript
{
  id: 'admin-001',
  email: 'admin@sora2.com',
  nickname: 'Administrator',
  credits: 999999,
  role: 'admin',
  avatarUrl: null
}
```

### 修改的文件
1. **`src/store/auth.store.ts`** - 设置默认登录状态
2. **`src/components/auth-provider.tsx`** - 跳过认证检查
3. **`src/app/admin/layout.tsx`** - 跳过管理员权限验证

## 📁 网站页面结构

### 用户端页面
| 页面路径 | 功能描述 | 状态 |
|---------|---------|------|
| `/` | 首页 | ✅ 可访问 |
| `/login` | 登录页面 | ✅ 可访问 |
| `/register` | 注册页面 | ✅ 可访问 |
| `/generate` | 视频生成页面 | ✅ 可访问 |
| `/simple-generate` | 简单生成页面 | ✅ 可访问 |
| `/lion-generate` | Lion生成页面 | ✅ 可访问 |
| `/gallery` | 作品画廊 | ✅ 可访问 |
| `/profile` | 个人资料 | ✅ 可访问 |
| `/offline` | 离线页面 | ✅ 可访问 |
| `/privacy` | 隐私政策 | ✅ 可访问 |
| `/terms` | 服务条款 | ✅ 可访问 |
| `/forgot-password` | 忘记密码 | ✅ 可访问 |

### 管理后台页面
| 页面路径 | 功能描述 | 状态 |
|---------|---------|------|
| `/admin` | 管理后台主页 | ✅ 可访问 |
| `/admin/users` | 用户管理 | ✅ 可访问 |
| `/admin/videos` | 视频管理 | ✅ 可访问 |
| `/admin/finance` | 财务管理 | ✅ 可访问 |
| `/admin/config` | 系统配置 | ✅ 可访问 |
| `/admin/system` | 系统监控 | ✅ 可访问 |

### 缺失页面
- `/history` - 历史记录页面（待实现）
- `/admin/dashboard` - 仪表盘（与主页面重复）
- `/admin/settings` - 系统设置（与config重复）
- `/admin/monitor` - 监控页面（与system重复）

## 🔌 API 端点状态

### 已实现的端点 (Mock API)
| 端点 | 方法 | 功能 | 状态 |
|-----|-----|-----|------|
| `/api/auth/login` | POST | 用户登录 | ✅ 正常 |
| `/api/users/profile` | GET | 获取用户信息 | ✅ 正常 |

### 缺失的端点
- `/api/auth/register` - 用户注册
- `/api/auth/logout` - 用户登出
- `/api/videos/create` - 创建视频
- `/api/videos/list` - 视频列表
- `/api/users/create` - 创建用户
- `/api/credits/balance` - 积分查询
- `/api/generate` - 视频生成

### 代理API问题
- **`/api/proxy/[...path]`** - 存在连接错误，需要修复

## 🧪 测试账号

### 开发模式（免登录）
- **用户**: admin@sora2.com
- **密码**: admin123
- **角色**: 管理员
- **积分**: 999999

### 正常用户账号
| 邮箱 | 密码 | 角色 | 积分 |
|-----|-----|-----|------|
| admin@sora2.com | admin123 | 管理员 | 999999 |
| user@sora2.com | admin123 | 普通用户 | 100 |
| test@sora2.com | 任意密码 | 测试用户 | 50 |

## 🐛 发现的问题

### 高优先级问题
1. **代理API连接错误** - 频繁出现 `ECONNREFUSED` 错误
2. **免登录模式不完善** - 某些组件仍在尝试调用API

### 中优先级问题
1. **页面路径不一致** - 建议统一命名规范
2. **认证检查冲突** - 前端免登录与后端要求不匹配

### 低优先级问题
1. **页面标题优化** - 某些页面需要SEO优化
2. **响应数据结构** - 需要统一API返回格式

## 🔧 开发建议

### 立即修复
1. **修复代理连接问题**
   - 检查 `/src/app/api/proxy/[...path]/route.ts`
   - 优化错误处理机制
   - 添加重试逻辑

2. **完善免登录模式**
   - 修改所有API客户端，开发模式下跳过认证
   - 添加开发环境标识

3. **实现缺失的API端点**
   - 注册接口
   - 视频管理接口
   - 积分系统接口

### 中期优化
1. **统一页面路径**
   - 建立URL命名规范文档
   - 迁移现有页面到标准路径

2. **完善错误处理**
   - 全局错误边界
   - API错误统一处理
   - 用户友好的错误提示

3. **性能优化**
   - 图片懒加载
   - 代码分割
   - 缓存策略

### 长期规划
1. **单元测试覆盖**
   - 组件测试
   - API测试
   - 集成测试

2. **监控系统**
   - 错误监控
   - 性能监控
   - 用户行为分析

## 🚀 部署准备

### 环境变量
```env
NEXT_PUBLIC_API_URL=http://localhost:3101
NODE_ENV=development
```

### 构建命令
```bash
# 生产构建
npm run build

# 启动生产服务
npm start
```

### 部署注意事项
1. 免登录模式在生产环境会被禁用
2. 环境变量需要根据部署环境调整
3. 静态资源需要配置CDN
4. 数据库连接需要配置生产环境参数

---

## 📞 联系信息

如有开发问题，请查看：
1. 控制台日志
2. 网络面板 (F12)
3. Next.js 开发服务器输出
4. Mock API 服务器日志

**文档更新时间**: 2025-10-21
**项目版本**: Development Preview