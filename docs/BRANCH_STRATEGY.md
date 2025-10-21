# Git 分支管理策略

本文档定义了 Sora2 项目的 Git 分支管理规范。

## 分支模型

我们采用 **Git Flow** 的简化版本，包含以下主要分支：

### 主要分支

- **main**: 生产环境分支
  - 只包含稳定的发布版本
  - 每次合并都是可发布的版本
  - 受保护，需要 Pull Request 才能合并
  - 标签（tag）只在此分支创建

- **develop**: 开发主分支
  - 功能开发的主分支
  - 所有功能从此分支检出
  - 功能开发完成后合并回此分支
  - 项目的默认分支

### 辅助分支

- **feature/***: 功能开发分支
  - 从 develop 分支创建
  - 格式：`feature/功能名称` 或 `feature/JIRA-编号-功能描述`
  - 完成后合并回 develop 分支
  - 示例：`feature/user-authentication`、`feature/PROJ-101-video-upload`

- **hotfix/***: 紧急修复分支
  - 从 main 分支创建
  - 格式：`hotfix/问题描述`
  - 修复完成后合并到 main 和 develop
  - 示例：`hotfix/login-bug-fix`

- **release/***: 发布准备分支
  - 从 develop 分支创建
  - 格式：`release/版本号`
  - 用于发布前的最后准备和测试
  - 完成后合并到 main 和 develop
  - 示例：`release/v1.0.0`

## 工作流程

### 功能开发流程

```bash
# 1. 从 develop 创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# 2. 开发功能
# ... 进行开发 ...

# 3. 提交代码
git add .
git commit -m "feat: 添加新功能描述"

# 4. 推送分支
git push origin feature/your-feature-name

# 5. 创建 Pull Request 到 develop 分支
# 6. 代码审查通过后合并
# 7. 删除功能分支
git checkout develop
git branch -d feature/your-feature-name
```

### 紧急修复流程

```bash
# 1. 从 main 创建修复分支
git checkout main
git pull origin main
git checkout -b hotfix/fix-description

# 2. 修复问题
# ... 修复代码 ...

# 3. 提交并推送
git add .
git commit -m "fix: 修复紧急问题"
git push origin hotfix/fix-description

# 4. 合并到 main（使用 fast-forward）
git checkout main
git merge --no-ff hotfix/fix-description
git tag v1.0.1  # 创建版本标签

# 5. 合并到 develop
git checkout develop
git merge --no-ff hotfix/fix-description

# 6. 推送所有更改
git push origin main develop --tags

# 7. 删除修复分支
git branch -d hotfix/fix-description
```

### 发布流程

```bash
# 1. 从 develop 创建发布分支
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0

# 2. 完成最后的准备
# - 更新版本号
# - 更新 CHANGELOG
# - 最终测试

# 3. 提交更改
git add .
git commit -m "chore: 准备 v1.0.0 发布"

# 4. 合并到 main
git checkout main
git merge --no-ff release/v1.0.0
git tag v1.0.0

# 5. 合并回 develop
git checkout develop
git merge --no-ff release/v1.0.0

# 6. 推送所有更改
git push origin main develop --tags

# 7. 删除发布分支
git branch -d release/v1.0.0
```

## 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 类型（type）

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动
- `ci`: CI/CD 相关
- `build`: 构建系统或依赖变更

### 示例

```bash
feat(auth): 添加用户登录功能
fix(api): 修复视频生成接口超时问题
docs(readme): 更新安装说明
refactor(database): 优化查询性能
```

## 分支保护规则

### main 分支

- 🔒 禁止直接推送
- ✅ 必须通过 Pull Request
- ✅ 需要 1 个或以上审查者批准
- ✅ 必须通过 CI 检查
- ✅ 需要 up-to-date 分支

### develop 分支

- 🔒 禁止直接推送
- ✅ 必须通过 Pull Request
- ✅ 推荐 1 个审查者
- ✅ 必须通过 CI 检查

## 版本标签

版本号遵循 [Semantic Versioning](https://semver.org/)：

- `MAJOR.MINOR.PATCH`
- 例如：`v1.0.0`, `v1.1.0`, `v1.1.1`

创建标签：

```bash
# 轻量标签
git tag v1.0.0

# 附注标签（推荐）
git tag -a v1.0.0 -m "Release version 1.0.0"

# 推送标签
git push origin v1.0.0
git push origin --tags  # 推送所有标签
```

## 最佳实践

1. **频繁提交**：小步快跑，频繁提交
2. **清晰描述**：提交信息要清晰描述改动
3. **及时同步**：定期拉取远程更新，避免冲突
4. **保持整洁**：合并后及时删除已完成的分支
5. **代码审查**：所有更改都需要经过代码审查
6. **测试先行**：确保测试通过后再合并

## 分支命名规范

- 使用小写字母
- 用连字符 `-` 分隔单词
- 使用英文，避免中文
- 名称要简洁明了

好的示例：
- `feature/user-login`
- `feature/video-upload-progress`
- `hotfix/memory-leak`
- `release/v1.2.0`

不好的示例：
- `feature/用户登录`
- `Feature/UserLogin`
- `feature-some-long-unnecessary-description`
- `test-branch`

## GitHub Flow 配置

建议在 GitHub 仓库设置中配置：

1. 默认分支设置为 `develop`
2. 分支保护规则：
   - `main`: 需要 PR + 审查 + CI
   - `develop`: 需要 PR + CI
3. 自动删除已合并的分支
4. Pull Request 模板
5. Issue 模板

## 常见问题

### Q: 如何处理冲突？
A:
```bash
git fetch origin
git rebase origin/develop  # 或 merge
# 解决冲突
git add .
git rebase --continue  # 或 git commit
git push origin feature-branch
```

### Q: 能否直接推送到 main？
A: 不能，main 分支受保护，必须通过 PR 合并。

### Q: 功能开发未完成如何保存？
A:
```bash
git add .
git commit -m "WIP: work in progress"
git push origin feature-branch  # 推送到自己的功能分支
```

### Q: 如何撤销最近的提交？
A:
```bash
# 撤销但保留更改
git reset --soft HEAD~1

# 完全撤销（谨慎使用）
git reset --hard HEAD~1
```

## 相关工具

- **GitHub Desktop**: GUI Git 客户端
- **GitKraken**: 高级 Git 客户端
- **SourceTree**: 免费的 Git GUI
- **VS Code Git**: 集成在 VS Code 中
- **GitLens**: VS Code Git 扩展

---

**注意**：遵守这些规范有助于团队协作和项目维护。如有疑问，请联系项目负责人。