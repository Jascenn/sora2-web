# Git 命令速查表 📚

> 一页纸掌握常用Git命令，收藏备用！

## 🚀 最常用命令（新手必会）

### 日常开发流程
```bash
# 开始新功能
git checkout develop           # 切换到开发分支
git pull origin develop        # 拉取最新代码
git checkout -b feature/新功能   # 创建新功能分支

# 写代码后保存
git add .                      # 添加所有改动
git commit -m "feat: 说明"      # 提交改动
git push origin 分支名          # 推送到GitHub
```

## 📋 命令分类

### 1️⃣ 基础操作
| 命令 | 作用 | 示例 |
|------|------|------|
| `git init` | 初始化仓库 | `git init` |
| `git clone` | 克隆仓库 | `git clone https://github.com/用户/项目.git` |
| `git status` | 查看状态 | `git status` |
| `git log` | 查看历史 | `git log --oneline -10` |

### 2️⃣ 分支操作
| 命令 | 作用 | 示例 |
|------|------|------|
| `git branch` | 查看本地分支 | `git branch` |
| `git branch -a` | 查看所有分支 | `git branch -a` |
| `git checkout 分支` | 切换分支 | `git checkout develop` |
| `git checkout -b 新分支` | 创建并切换 | `git checkout -b feature/login` |
| `git branch -d 分支` | 删除分支 | `git branch -d feature/login` |

### 3️⃣ 保存与同步
| 命令 | 作用 | 示例 |
|------|------|------|
| `git add 文件` | 添加文件 | `git add index.html` |
| `git add .` | 添加所有文件 | `git add .` |
| `git commit -m "说明"` | 提交 | `git commit -m "fix: 修复bug"` |
| `git push` | 推送 | `git push origin main` |
| `git pull` | 拉取 | `git pull origin develop` |

### 4️⃣ 查看与比较
| 命令 | 作用 | 示例 |
|------|------|------|
| `git diff` | 查看未暂存的改动 | `git diff` |
| `git diff --staged` | 查看已暂存的改动 | `git diff --staged` |
| `git log --oneline` | 简洁查看历史 | `git log --oneline -5` |
| `git show` | 查看某次提交 | `git show abc123` |

## 🔧 高级命令（进阶使用）

### 撤销操作
```bash
# 撤销工作区的修改（未add）
git checkout -- 文件名

# 撤销暂存区的修改（已add未commit）
git reset HEAD 文件名

# 撤销最近一次提交（保留修改）
git reset --soft HEAD~1

# 完全撤销最近一次提交（危险！）
git reset --hard HEAD~1
```

### 合并与变基
```bash
# 合并分支
git merge feature/新功能

# 变基（整理历史）
git rebase develop

# 暂存当前工作
git stash
git stash pop
```

## 📝 提交信息规范

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 添加用户登录` |
| `fix` | 修复bug | `fix: 修复登录失败问题` |
| `docs` | 文档 | `docs: 更新README` |
| `style` | 格式 | `style: 调整代码格式` |
| `refactor` | 重构 | `refactor: 重构用户模块` |
| `test` | 测试 | `test: 添加单元测试` |
| `chore` | 其他 | `chore: 更新依赖` |

## 🚨 紧急情况处理

### 冲突解决
```bash
# 1. 拉取代码时出现冲突
git pull origin develop

# 2. 手动解决冲突（编辑文件）
# 删除冲突标记，保留正确内容

# 3. 标记已解决
git add .
git commit -m "解决冲突"
```

### 推送被拒绝
```bash
# 错误：! [rejected] ...
# 解决：先拉取再推送
git pull origin develop
git push origin develop
```

### 找回丢失的提交
```bash
# 查看所有操作记录
git reflog

# 恢复丢失的提交
git checkout abc123  # abc123是commit的hash
```

## 🎯 工作流模板

### 功能开发流程
```bash
# 1. 开始
git checkout develop
git pull origin develop
git checkout -b feature/功能名

# 2. 开发（反复执行）
git add .
git commit -m "feat: 实现部分功能"
git push origin feature/功能名

# 3. 完成
git checkout develop
git pull origin develop
git merge feature/功能名
git push origin develop
git branch -d feature/功能名
```

### 紧急修复流程
```bash
# 1. 基于main创建修复分支
git checkout main
git pull origin main
git checkout -b hotfix/修复说明

# 2. 修复并提交
git add .
git commit -m "fix: 紧急修复xxx"
git push origin hotfix/修复说明

# 3. 合并到main和develop
# （在GitHub上创建PR）
```

## 💡 实用技巧

### 查看命令别名
```bash
# 查看所有别名
git config --global --get-regexp alias

# 常用别名设置
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.cm commit
```

### 配置用户信息
```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

### 忽略文件
```bash
# 创建 .gitignore 文件
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore
echo "*.log" >> .gitignore
```

## 📱 推荐工具

- **GUI客户端**：
  - GitHub Desktop（免费）
  - GitKraken（免费版）
  - SourceTree（免费）
  - VS Code Git（内置）

- **在线学习**：
  - [Learn Git Branching](https://learngitbranching.js.org/)
  - [GitHub Skills](https://skills.github.com/)

## 🆘 求助命令

```bash
# 查看帮助
git help 命令名
git 命令名 --help

# 查看某命令的详细说明
git help checkout
git checkout --help
```

---

> 💡 **提示**：刚开始不用记住所有命令，常用的几个用多了自然就记住了。遇到问题多用 `git status` 和 `git log` 查看状态！

**最后更新**：2025年10月21日
**版本**：v1.0