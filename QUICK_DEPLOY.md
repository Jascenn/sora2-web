# ⚡ Sora2 快速部署指南

**更新时间**: 2025-10-25
**目标**: 5分钟内完成部署

---

## 🎯 最快部署方案（推荐）

使用 **Vercel Web 界面** + **GitHub 集成** = 零配置部署

---

## 🚀 步骤 1：访问 Vercel（30秒）

1. 打开浏览器访问：https://vercel.com/
2. 点击右上角 **"Sign Up"** 或 **"Login"**
3. 选择 **"Continue with GitHub"**
4. 授权 Vercel 访问你的 GitHub 账号

---

## 📦 步骤 2：导入项目（1分钟）

### 2.1 新建项目

在 Vercel Dashboard:
1. 点击 **"Add New..."** → **"Project"**
2. 选择 **"Import Git Repository"**

### 2.2 选择仓库

1. 在仓库列表中找到 **`Jascenn/sora2-web`**
2. 点击 **"Import"**

如果没看到仓库：
- 点击 **"Adjust GitHub App Permissions"**
- 授权 Vercel 访问该仓库

---

## ⚙️ 步骤 3：配置项目（2分钟）

### 3.1 基本设置

Vercel 会自动检测到 Next.js 项目，无需修改：

```
Framework Preset: Next.js ✓
Root Directory: ./ ✓
Build Command: npm run build ✓
Output Directory: .next ✓
Install Command: npm install ✓
```

### 3.2 环境变量（重要）

点击 **"Environment Variables"**，添加以下变量：

| 名称 | 值 | 环境 |
|------|-----|------|
| `NEXT_PUBLIC_API_URL` | `https://your-api.com/api` | Production |
| `NODE_ENV` | `production` | Production |
| `BYPASS_AUTH` | `false` | Production |

⚠️ **暂时可以跳过 API URL**，先部署前端

---

## 🎉 步骤 4：部署（1分钟）

### 4.1 点击 Deploy

点击页面底部的 **"Deploy"** 按钮

Vercel 会自动：
1. ✅ 克隆代码
2. ✅ 安装依赖 (`npm install`)
3. ✅ 构建项目 (`npm run build`)
4. ✅ 部署到全球 CDN
5. ✅ 生成 HTTPS URL

### 4.2 等待完成

- 进度条显示部署状态
- 通常 1-3 分钟完成
- 成功后会显示 ✅ **Ready**

---

## 🌐 步骤 5：访问网站（10秒）

### 5.1 获取 URL

部署成功后，Vercel 会给你：

**生产环境 URL**:
```
https://sora2-web-xxxxx.vercel.app
```

**预览 URL**:
```
https://sora2-web-git-main-xxxxx.vercel.app
```

### 5.2 测试网站

点击 URL，检查：
- [x] 网站能打开
- [x] 样式正确
- [x] 图片加载
- [x] 页面导航正常

---

## 🔧 可选：后续优化

### 自定义域名

1. Vercel Dashboard → 项目设置
2. **"Domains"** → **"Add"**
3. 输入你的域名 (如 `www.sora2.com`)
4. 按提示配置 DNS
5. 等待验证通过

### 后端 API（临时方案）

如果还没有后端服务器，可以：

**方案 A**：使用 Mock 数据
- 前端已有 Mock 功能
- 设置 `BYPASS_AUTH=true`（仅开发）

**方案 B**：部署到 Railway（最简单）
1. 访问 https://railway.app/
2. 连接 GitHub
3. 选择 `apps/api` 目录
4. 自动部署
5. 获取 API URL
6. 在 Vercel 更新 `NEXT_PUBLIC_API_URL`

---

## 🎓 使用命令行部署（高级）

如果你熟悉命令行：

### 一键部署

```bash
# 运行部署脚本
./deploy-to-vercel.sh
```

### 手动部署

```bash
# 1. 登录 Vercel
vercel login

# 2. 初始化项目
vercel

# 3. 部署到生产环境
vercel --prod
```

---

## ✅ 部署检查清单

### 部署前
- [x] 代码已推送到 GitHub
- [x] README 完整
- [x] 依赖正确安装
- [x] 本地构建成功 (`npm run build`)

### Vercel 配置
- [x] 项目已导入
- [x] 构建设置正确
- [ ] 环境变量已配置（可选）
- [ ] 自定义域名（可选）

### 功能测试
- [ ] 网站可访问
- [ ] 首页正常显示
- [ ] 路由导航正常
- [ ] 样式和图片正常
- [ ] 控制台无错误

---

## 🚨 常见问题快速解决

### Q: 部署失败 "Build Error"

```bash
# 本地测试构建
npm run build

# 如果成功，问题可能是：
# 1. 环境变量缺失 → 检查 Vercel 环境变量
# 2. Node 版本不对 → Vercel 默认 Node 18
# 3. 依赖问题 → 检查 package.json
```

### Q: 页面显示但样式错乱

```
原因: CSS 没有正确加载
解决:
1. 检查 tailwind.config.ts
2. 检查 global.css
3. 清除 Vercel 缓存重新部署
```

### Q: API 请求失败

```
原因: NEXT_PUBLIC_API_URL 未配置或错误
解决:
1. Vercel Dashboard → Settings → Environment Variables
2. 添加 NEXT_PUBLIC_API_URL
3. 重新部署
```

### Q: 部署成功但无法访问

```
解决:
1. 等待 1-2 分钟（DNS 传播）
2. 清除浏览器缓存
3. 尝试无痕模式
4. 检查 Vercel 部署日志
```

---

## 📊 部署后数据

部署成功后，你会得到：

### URLs
- **生产**: https://sora2-web.vercel.app
- **预览**: https://sora2-web-git-xxx.vercel.app
- **自定义**: https://your-domain.com (配置后)

### 性能指标
- **全球 CDN**: ✅
- **HTTPS**: ✅ 自动
- **HTTP/2**: ✅ 支持
- **Edge Functions**: ✅ 可用
- **Analytics**: ✅ 内置

### 自动化
- **Git 推送**: 自动部署
- **PR 预览**: 自动生成
- **回滚**: 一键恢复
- **监控**: 实时日志

---

## 🎯 总结

**最快路径**:
```
Vercel 注册 (30s)
→ 导入 GitHub (1m)
→ 配置设置 (2m)
→ 点击部署 (1m)
→ 完成！ ✅
```

**总耗时**: < 5 分钟

**结果**:
- ✅ 全球可访问的生产网站
- ✅ HTTPS 自动证书
- ✅ 自动 CI/CD
- ✅ 免费托管

---

## 📞 需要帮助？

- **Vercel 文档**: https://vercel.com/docs
- **完整指南**: 查看 `DEPLOYMENT_GUIDE.md`
- **项目文档**: 查看 `README.md`

---

**现在就开始部署吧！** 🚀

访问 https://vercel.com/ 开始！
