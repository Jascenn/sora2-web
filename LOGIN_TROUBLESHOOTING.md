# 登录问题诊断指南

## 🚨 当前问题

您遇到了两个问题：

1. **无法登录** - "依旧是无法登录"
2. **数据库 SQL 错误** - `column "deleted_at" does not exist`

## 🔧 解决方案

### 步骤 1: 更新数据库结构（解决 SQL 错误）

之前的 `supabase-schema-optimized.sql` 是为全新数据库设计的。您的数据库已经有数据，需要使用**增量更新脚本**。

1. **打开 Supabase SQL Editor**:
   - 访问: https://supabase.com/dashboard/project/ycrrmxfmpqptzjuseczs/sql

2. **执行增量更新脚本**:
   - 复制 `supabase-incremental-update.sql` 的全部内容
   - 粘贴到 SQL Editor
   - 点击 "Run" 执行

3. **验证更新成功**:
   ```sql
   -- 检查新字段是否添加成功
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'users'
   ORDER BY ordinal_position;
   ```

   应该能看到新字段：`email_verified`, `video_count`, `deleted_at` 等

### 步骤 2: 使用诊断工具查找登录问题

我已经创建了一个专门的诊断页面来帮您找到登录问题的根本原因。

#### 本地测试（推荐）

1. **启动开发服务器**:
   ```bash
   cd /Users/jascen/Development/00_Pay_Project/sora2-web
   npm run dev
   ```

2. **访问诊断页面**:
   ```
   http://localhost:3000/test-login
   ```

3. **运行诊断测试**:
   - 点击 "检查 Supabase" - 验证数据库连接
   - 点击 "测试登录" - 使用 admin@sora2.com / admin123
   - 查看详细的错误信息

4. **查看浏览器控制台**:
   - 按 F12 打开开发者工具
   - 切换到 Console 标签
   - 查看详细的日志输出

#### Vercel 生产环境测试

1. **部署最新代码**:
   ```bash
   git push origin main
   ```

2. **等待部署完成**（约1-2分钟）

3. **访问诊断页面**:
   ```
   https://sora2-web-two.vercel.app/test-login
   ```

4. **运行相同的诊断测试**

### 步骤 3: 常见登录问题及解决方案

根据诊断结果，常见问题有：

#### 问题 A: 密码哈希不匹配

**症状**: 提示 "邮箱或密码错误"

**解决**:
```sql
-- 在 Supabase SQL Editor 重新设置密码哈希
UPDATE users
SET password_hash = '$2b$10$DmpaKUmWO66QNMd3tBXhWude9psNOxxtq2NoEn9u6qq/kOrlxzQm.'
WHERE email = 'admin@sora2.com';

UPDATE users
SET password_hash = '$2b$10$jg68OCedRknRFhrMeGUbKeIuMNIhuUaLafF9I8dtnB.Hun/3EcK.G'
WHERE email = 'user@sora2.com';
```

密码：
- admin@sora2.com → `admin123`
- user@sora2.com → `user123`

#### 问题 B: 用户状态不是 'active'

**症状**: 提示 "账号已被禁用"

**解决**:
```sql
-- 检查用户状态
SELECT email, status FROM users;

-- 如果 status 字段还是 VARCHAR 类型，更新为 'active'
UPDATE users SET status = 'active' WHERE email = 'admin@sora2.com';
UPDATE users SET status = 'active' WHERE email = 'user@sora2.com';
```

#### 问题 C: Vercel 环境变量未设置

**症状**: 诊断页面显示 "Supabase admin client not configured"

**解决**:
```bash
cd /Users/jascen/Development/00_Pay_Project/sora2-web

# 检查环境变量
vercel env ls

# 如果缺少变量，重新添加
./add-vercel-env.sh
```

或手动添加：
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# 输入: https://ycrrmxfmpqptzjuseczs.supabase.co

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# 输入: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljcnJteGZtcHFwdHpqdXNlY3pzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTczMDkxMywiZXhwIjoyMDQ1MzA2OTEzfQ.gx_DXo1kznGsNFqT67P3v4_3FiNr28GWKiGt04tA_9Y

vercel env add JWT_SECRET production
# 输入: JsVcA+itwFr90IBpWp7uUvDO4mZasPHHsnjSvRy9o2Y=
```

添加后重新部署：
```bash
vercel --prod
```

#### 问题 D: CORS 或 Cookie 问题

**症状**: 登录成功但 Cookie 未设置

**检查**:
1. 打开浏览器开发者工具
2. Network 标签 → 找到 login 请求
3. 查看 Response Headers 是否有 `Set-Cookie`
4. 查看 Application → Cookies 是否有 `token`

**解决**:
- 确保在生产环境使用 HTTPS
- 检查 `sameSite: 'lax'` 设置

### 步骤 4: 查看详细日志

在 Vercel 上查看实时日志：

1. 访问: https://vercel.com/jascens-projects/sora2-web-two
2. 点击 "Functions" 标签
3. 找到 `/api/auth/login` 函数
4. 查看错误日志

## 📊 诊断检查表

请按顺序完成以下检查：

- [ ] 1. 执行 `supabase-incremental-update.sql` 更新数据库
- [ ] 2. 验证新字段已添加（`deleted_at`, `email_verified` 等）
- [ ] 3. 访问 `/test-login` 页面
- [ ] 4. 点击 "检查 Supabase" 确认连接正常
- [ ] 5. 点击 "测试登录" 查看详细错误
- [ ] 6. 检查浏览器控制台日志
- [ ] 7. 根据错误类型应用相应解决方案
- [ ] 8. 重新测试登录

## 🔍 快速诊断命令

在 Supabase SQL Editor 运行以下查询来快速诊断：

```sql
-- 1. 检查用户是否存在
SELECT
    id,
    email,
    role,
    status,
    credits,
    LEFT(password_hash, 20) as password_hash_preview,
    created_at
FROM users
WHERE email IN ('admin@sora2.com', 'user@sora2.com');

-- 2. 检查表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 3. 检查 ENUM 类型
SELECT
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN ('user_role', 'user_status', 'video_status')
ORDER BY t.typname, e.enumsortorder;

-- 4. 检查索引
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'users';
```

## 📞 获取帮助

如果以上步骤都无法解决问题，请提供：

1. **诊断页面截图** - `/test-login` 页面的完整输出
2. **浏览器控制台日志** - F12 → Console 的内容
3. **Vercel 函数日志** - Functions 标签下的错误日志
4. **SQL 查询结果** - 上面"快速诊断命令"的输出

这些信息将帮助快速定位问题！

---

**提示**: 先在本地测试（localhost:3000），确认本地可以登录后，再部署到 Vercel。这样可以隔离是代码问题还是环境配置问题。
