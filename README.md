# Sora2 AI 视频生成平台

基于 Next.js 14 的现代化 AI 视频生成平台，提供智能视频创作服务。

## ✨ 功能特性

- 🎥 AI 视频生成
- 🎨 智能视频编辑
- 📱 响应式设计
- 🔐 用户认证系统
- 📊 实时进度追踪
- 🎬 多格式导出

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 环境配置

复制环境变量模板：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件：

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3200](http://localhost:3200) 查看应用。

## 📱 可用脚本

```bash
# 开发服务器
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint

# 运行测试
npm test

# 测试覆盖率
npm run test:coverage

# 监视模式测试
npm run test:watch

# CI 模式测试
npm run test:ci

# 分析构建包大小
npm run build:analyze

# 清理构建缓存
npm run clean
```

## 🏗️ 项目结构

```
sora2-web/
├── src/
│   ├── app/                 # App Router 页面
│   ├── components/          # 可复用组件
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具库和配置
│   ├── types/              # TypeScript 类型定义
│   └── styles/             # 全局样式
├── public/                 # 静态资源
├── __tests__/              # 测试文件
├── .github/               # GitHub 配置
│   ├── workflows/         # GitHub Actions
│   └── ISSUE_TEMPLATE/    # Issue 模板
└── docs/                  # 项目文档
```

## 🎨 技术栈

### 前端框架
- **Next.js 14** - React 全栈框架
- **TypeScript** - 类型安全的 JavaScript
- **Tailwind CSS** - 实用优先的 CSS 框架

### 状态管理
- **Zustand** - 轻量级状态管理
- **React Query (TanStack Query)** - 服务器状态管理

### 表单处理
- **React Hook Form** - 高性能表单库
- **Zod** - TypeScript 优先的模式验证

### UI 组件
- **Lucide React** - 美观的图标库
- **Framer Motion** - 动画库
- **Sonner** - Toast 通知

### 开发工具
- **ESLint** - 代码检查
- **Jest** - 单元测试
- **Testing Library** - React 测试工具

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 监视模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 测试覆盖率目标

- 整体覆盖率: > 80%
- 函数覆盖率: > 85%
- 分支覆盖率: > 75%

## 📏 代码规范

### 提交信息

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
feat: 添加新功能
fix: 修复问题
docs: 更新文档
style: 代码格式化
refactor: 代码重构
test: 添加测试
chore: 构建工具变动
```

### 代码检查

```bash
# ESLint 检查
npm run lint

# TypeScript 类型检查
npx tsc --noEmit
```

## 🚀 部署

### Vercel 部署

1. 连接 GitHub 仓库到 Vercel
2. 设置环境变量
3. 自动部署

### Docker 部署

```bash
# 构建镜像
docker build -t sora2-web .

# 运行容器
docker run -p 3000:3000 sora2-web
```

### 手动部署

```bash
# 构建项目
npm run build

# 启动生产服务器
npm run start
```

## 📈 性能优化

### 代码分割
- 自动路由分割
- 动态导入组件
- 懒加载图片

### 构建优化
- Next.js 自动优化
- Bundle 分析
- Tree shaking

### 缓存策略
- 静态资源缓存
- API 响应缓存
- 浏览器缓存

## 🔧 开发指南

### 添加新页面

```typescript
// src/app/new-page/page.tsx
export default function NewPage() {
  return <div>New Page</div>
}
```

### 创建组件

```typescript
// src/components/NewComponent.tsx
interface NewComponentProps {
  title: string
}

export function NewComponent({ title }: NewComponentProps) {
  return <h1>{title}</h1>
}
```

### API 调用

```typescript
// 使用 React Query
import { useQuery } from '@tanstack/react-query'

function useUserData() {
  return useQuery({
    queryKey: ['userData'],
    queryFn: () => fetch('/api/user').then(res => res.json())
  })
}
```

## 🐛 调试

### 开发工具
- React Developer Tools
- Next.js DevTools
- Redux DevTools (如使用)

### 日志
```typescript
console.log('开发日志')
console.warn('警告信息')
console.error('错误信息')
```

## 📞 支持

- 📖 [文档](./docs/)
- 🐛 [报告问题](https://github.com/Jascenn/sora2-web/issues)
- 💡 [功能请求](https://github.com/Jascenn/sora2-web/issues)
- 🤝 [贡献指南](./CONTRIBUTING.md)

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

Made with ❤️ by [Sora2 Team]