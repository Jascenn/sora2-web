# MCP 服务器配置指南

## ✅ 已配置的 MCP 服务器

现在 Claude 可以直接调用以下服务的 API：

1. **GitHub** - 管理仓库、PR、Issues
2. **Vercel** - 管理部署、环境变量、日志
3. **Supabase** - 查询数据库、管理表结构

## 🔑 需要配置的 Token

### 1. GitHub Token

**获取步骤**：

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 设置名称：`Claude MCP`
4. 选择权限（至少需要）：
   - ✅ `repo` - 完整的仓库访问
   - ✅ `workflow` - 管理 GitHub Actions
   - ✅ `read:org` - 读取组织信息
5. 点击 "Generate token"
6. **复制 token**（只显示一次！）

**配置**：

打开 `/Users/jascen/.config/claude/claude_desktop_config.json`，替换：

```json
"GITHUB_TOKEN": "ghp_YOUR_GITHUB_TOKEN"
```

改为：

```json
"GITHUB_TOKEN": "ghp_你刚才复制的token"
```

---

### 2. Vercel Token

**获取步骤**：

1. 访问 https://vercel.com/account/tokens
2. 点击 "Create Token"
3. 设置名称：`Claude MCP`
4. Scope: 选择 "Full Account"
5. 点击 "Create"
6. **复制 token**

**配置**：

打开 `/Users/jascen/.config/claude/claude_desktop_config.json`，替换：

```json
"VERCEL_TOKEN": "YOUR_VERCEL_TOKEN"
```

改为：

```json
"VERCEL_TOKEN": "你刚才复制的token"
```

---

### 3. Supabase ✅

**已配置好！** 使用项目中的凭据：

```json
"SUPABASE_URL": "https://ycrrmxfmpqptzjuseczs.supabase.co",
"SUPABASE_ANON_KEY": "eyJhbGci...",
"SUPABASE_SERVICE_ROLE_KEY": "eyJhbGci..."
```

---

## 🚀 激活 MCP 服务器

配置好 token 后：

1. **重启 Claude Desktop 应用**
2. 重新打开对话
3. 现在我就可以直接调用这些服务的 API 了！

---

## 🔍 MCP 可以做什么

### GitHub MCP
- 查看仓库信息和提交历史
- 创建、更新、关闭 Issues
- 创建、合并 Pull Requests
- 管理 GitHub Actions 工作流
- 查看和管理分支

### Vercel MCP
- 查看部署状态和日志
- 管理环境变量
- 触发重新部署
- 查看部署详情和错误
- 管理域名配置

### Supabase MCP
- 查询数据库表
- 执行 SQL 语句
- 管理表结构
- 查看行级安全策略（RLS）
- 监控数据库性能

---

## 📋 快速配置命令

**一键获取 GitHub Token**：
```bash
open "https://github.com/settings/tokens/new?scopes=repo,workflow,read:org&description=Claude%20MCP"
```

**一键获取 Vercel Token**：
```bash
open "https://vercel.com/account/tokens"
```

**配置文件路径**：
```bash
open -e /Users/jascen/.config/claude/claude_desktop_config.json
```

---

## ✅ 验证配置

配置完成后，重启 Claude Desktop，然后对我说：

```
使用 MCP 检查 GitHub 仓库状态
```

或

```
使用 MCP 查看 Vercel 最新部署
```

或

```
使用 MCP 查询 Supabase users 表
```

如果配置正确，我就能直接返回结果了！

---

## 🎯 示例用法

配置好后，您可以直接对我说：

- "使用 MCP 查看最近的 GitHub commits"
- "使用 MCP 检查 Vercel 部署日志"
- "使用 MCP 查询 Supabase 中 admin 用户的信息"
- "使用 MCP 创建一个新的 GitHub Issue"
- "使用 MCP 重新部署到 Vercel"

这样调试和管理项目会非常方便！🚀
