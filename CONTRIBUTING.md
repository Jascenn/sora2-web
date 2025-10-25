# 贡献指南

感谢您对 Sora2 AI 视频生成平台的关注！我们欢迎所有形式的贡献，包括但不限于代码、文档、测试和反馈。

## 🚀 快速开始

### 前置要求

- Node.js 18+
- npm 或 yarn
- Git

### 本地开发设置

1. **Fork 仓库**
   ```bash
   # 在 GitHub 上 fork 仓库
   # 然后克隆你的 fork
   git clone https://github.com/YOUR_USERNAME/sora2-web.git
   cd sora2-web
   ```

2. **设置上游仓库**
   ```bash
   git remote add upstream https://github.com/Jascenn/sora2-web.git
   ```

3. **安装依赖**
   ```bash
   npm install
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. **运行测试**
   ```bash
   npm test
   ```

## 🌿 分支策略

我们使用 Git Flow 工作流程：

### 主要分支

- **`main`**: 生产就绪的代码
- **`develop`**: 开发主分支（准备创建）

### 辅助分支

- **`feature/*`**: 新功能开发
- **`bugfix/*`**: 问题修复
- **`hotfix/*`**: 紧急修复
- **`release/*`**: 发布准备

### 分支命名规范

```bash
feature/用户认证系统
feature/video-generation-api
bugfix/修复视频上传问题
hotfix/安全漏洞修复
release/v1.2.0
```

## 📝 开发流程

### 1. 创建功能分支

```bash
# 确保本地 develop 分支是最新的
git checkout develop
git pull upstream develop

# 创建新的功能分支
git checkout -b feature/你的功能名称
```

### 2. 开发和提交

#### 提交信息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
# 格式
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

#### 提交类型

- `feat`: 新功能
- `fix`: 问题修复
- `docs`: 文档更新
- `style`: 代码格式化（不影响功能）
- `refactor`: 代码重构
- `test`: 添加或修改测试
- `chore`: 构建过程或辅助工具的变动

#### 示例

```bash
git commit -m "feat(auth): 添加用户登录功能"
git commit -m "fix(video): 修复视频播放器兼容性问题"
git commit -m "docs(api): 更新 API 文档"
```

### 3. 保持分支同步

```bash
# 定期同步上游仓库
git checkout develop
git pull upstream develop

# 将 develop 分支的变更合并到你的功能分支
git checkout feature/你的功能名称
git merge develop
```

### 4. 创建 Pull Request

1. **推送分支到你的 fork**
   ```bash
   git push origin feature/你的功能名称
   ```

2. **创建 Pull Request**
   - 在 GitHub 上打开你的 fork
   - 点击 "New Pull Request"
   - 选择正确的分支
   - 填写 PR 模板
   - 提交 PR

### 5. 代码审查

所有 PR 都需要通过代码审查：

- 至少一人审查
- 所有检查必须通过
- 解决所有审查意见
- 保持更新状态

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 监视模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# CI 模式
npm run test:ci
```

### 测试文件位置

- 单元测试: `__tests__/` 或 `*.test.ts`
- 集成测试: `__tests__/integration/`
- E2E 测试: `__tests__/e2e/`

### 编写测试

```typescript
// 示例测试文件
import { render, screen } from '@testing-library/react'
import { MyComponent } from '../MyComponent'

describe('MyComponent', () => {
  it('应该正确渲染', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })
})
```

## 📋 代码规范

### TypeScript/JavaScript

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码

### React 组件

- 使用函数组件和 Hooks
- 组件名使用 PascalCase
- Props 接口使用 `ComponentNameProps` 格式

### CSS/Tailwind

- 使用 Tailwind CSS
- 遵循响应式设计原则
- 使用语义化的类名

### 文件命名

- 组件: `PascalCase.tsx`
- 工具函数: `camelCase.ts`
- 常量: `UPPER_CASE.ts`
- 类型定义: `types.ts`

## 🔍 代码检查

提交前请确保：

```bash
# 代码检查
npm run lint

# 类型检查
npx tsc --noEmit

# 运行测试
npm test

# 构建检查
npm run build
```

## 🐛 报告问题

### Bug 报告

使用 [Bug 报告模板](.github/ISSUE_TEMPLATE/bug_report.md) 创建 issue：

1. 提供清晰的复现步骤
2. 包含环境信息
3. 添加截图（如适用）
4. 搜索避免重复

### 功能请求

使用 [功能请求模板](.github/ISSUE_TEMPLATE/feature_request.md)：

1. 描述功能需求
2. 解释使用场景
3. 提供设计建议

## 📚 文档

### 文档类型

- README.md: 项目概述和快速开始
- API 文档: 接口说明
- 组件文档: 组件使用说明
- 部署文档: 部署和配置说明

### 文档编写

- 使用 Markdown
- 包含代码示例
- 添加截图和图表
- 保持内容更新

## 🚀 部署

### 构建命令

```bash
# 开发构建
npm run build

# 生产构建
npm run build:prod

# 分析构建大小
npm run build:analyze
```

### 环境变量

在 `.env.local` 中设置本地环境变量：

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

## 📞 联系方式

- 项目维护者: [GitHub Username]
- 邮箱: [email]
- 问题讨论: [GitHub Discussions]

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

---

感谢您的贡献！🎉