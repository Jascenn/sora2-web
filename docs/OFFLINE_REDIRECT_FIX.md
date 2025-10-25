# 解决离线页面自动重定向问题

## 问题描述
访问 http://localhost:3200 时自动跳转到 `/offline` 页面，即使网络连接正常。

## 原因分析
1. **Service Worker 缓存问题** - 开发环境中可能残留了生产环境的 Service Worker
2. **浏览器缓存** - 旧的离线缓存仍然存在
3. **网络状态检测误判** - 浏览器可能错误地判断网络状态

## 解决方案

### 方案一：使用修复后的离线页面（推荐）

我已经更新了离线页面，添加了自动检测和修复功能：

1. **自动检测** - 页面会自动检测真实的网络连接状态
2. **自动重定向** - 如果检测到网络正常，会自动返回首页
3. **手动修复** - 提供了"修复缓存问题"按钮来清除 Service Worker 和缓存

### 方案二：手动清除缓存

1. **打开浏览器开发者工具** (F12)
2. **Application 标签页** → Service Workers
   - 点击 "Unregister" 注销所有 Service Workers
3. **Application 标签页** → Storage
   - 点击 "Clear storage" 清除所有数据
4. **Network 标签页**
   - 取消勾选 "Offline" 选项（如果勾选了）
5. **刷新页面**

### 方案三：使用诊断工具

我创建了一个网络状态诊断页面：

1. 访问 `http://localhost:3200/debug-network.html`
2. 查看网络状态信息
3. 使用修复按钮清除缓存和 Service Workers

### 方案四：无痕模式

打开浏览器的无痕/隐私模式访问：
- Chrome: Ctrl+Shift+N (Windows) 或 Cmd+Shift+N (Mac)
- Firefox: Ctrl+Shift+P (Windows) 或 Cmd+Shift+P (Mac)

## 临时禁用 PWA 功能

如果问题持续，可以临时禁用 PWA 功能：

### 方法 1：修改 layout.tsx
```typescript
// 注释掉 Service Worker 注册
// import { registerServiceWorker } from '@/lib/register-sw'
// registerServiceWorker() // 注释这一行
```

### 方法 2：删除或重命名 Service Worker 文件
```bash
mv public/sw.js public/sw.js.disabled
```

## 永久解决方案

确保 Service Worker 只在生产环境注册：

1. **检查环境变量**
   ```typescript
   // src/lib/register-sw.ts
   if (process.env.NODE_ENV !== 'production') {
     return // 不在开发环境注册
   }
   ```

2. **开发环境禁用缓存**
   ```typescript
   // next.config.js
   if (dev) {
     config.cache = false
   }
   ```

## 常见问题

### Q: 为什么会在开发环境出现离线问题？
A: 可能是因为：
- 之前访问过生产版本，Service Worker 被缓存
- 浏览器开发者工具的 "Offline" 选项被意外勾选
- 本地网络代理或防火墙设置

### Q: 清除缓存后问题还是存在？
A: 尝试：
1. 完全关闭浏览器后重新打开
2. 使用不同的浏览器测试
3. 检查系统网络设置
4. 重启开发服务器

### Q: 如何完全禁用离线功能？
A: 在 `src/app/layout.tsx` 中注释掉 Service Worker 注册代码

## 预防措施

1. **开发环境提示**
   ```typescript
   // 在开发环境显示提示
   if (process.env.NODE_ENV === 'development') {
     console.warn('Development Mode: PWA features are disabled')
   }
   ```

2. **版本控制**
   - 确保 `.env` 文件不被提交
   - 定期清理开发环境的缓存

3. **自动化清理**
   - 在开发脚本中添加缓存清理命令
   - 使用 npm scripts 管理缓存

## 联系支持

如果以上方案都无法解决问题，请：
1. 查看浏览器控制台错误信息
2. 记录具体的错误步骤
3. 截图保存错误信息
4. 联系开发团队协助

---

**更新时间**: 2025-10-21
**版本**: 1.0.0