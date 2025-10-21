# 第三方 Sora2 视频生成平台 - 产品需求文档 (PRD)

## 1. 产品概述

### 1.1 产品定位
基于 OpenAI Sora API 的第三方视频生成 SaaS 平台，为用户提供简单易用的 AI 视频创作服务。

### 1.2 目标用户
- 内容创作者（自媒体、短视频创作者）
- 营销人员（广告、宣传视频制作）
- 产品经理/设计师（产品演示视频）
- 教育工作者（教学视频制作）
- 个人用户（创意视频制作）

### 1.3 核心价值
- 降低视频制作门槛，无需专业技能
- 快速生成高质量 AI 视频
- 按需付费，成本可控
- 简单易用的用户界面

## 2. 功能需求

### 2.1 核心功能

#### 2.1.1 用户认证系统
- 用户注册/登录（邮箱、手机号）
- 第三方登录（Google、GitHub、微信）
- 密码找回功能
- 账户信息管理

#### 2.1.2 视频生成功能
**输入方式：**
- 文本描述输入（Text-to-Video）
  - 提示词输入框（支持多语言）
  - 提示词长度限制：10-500 字符
  - 提示词模板库（预设场景）

**生成参数配置：**
- 视频时长选择：5s / 10s / 20s / 30s
- 视频分辨率：720p / 1080p / 4K
- 视频风格：写实、动画、油画、水彩等
- 宽高比：16:9 / 9:16 / 1:1 / 4:3
- 镜头运动：静态、推进、拉远、环绕、俯仰
- 帧率：24fps / 30fps / 60fps

**生成流程：**
1. 用户输入提示词
2. 选择生成参数
3. 预估消耗积分/费用
4. 提交生成任务
5. 实时显示生成进度
6. 生成完成后预览

#### 2.1.3 视频管理
- 视频列表展示
  - 缩略图预览
  - 生成时间
  - 提示词信息
  - 视频参数
  - 状态（生成中/已完成/失败）

- 视频操作
  - 在线预览播放
  - 下载到本地（多种格式：MP4、MOV、WebM）
  - 重新生成（使用相同参数）
  - 删除视频
  - 分享链接（公开/私密）
  - 收藏/标签管理

#### 2.1.4 历史记录
- 生成历史列表
- 按时间/状态筛选
- 提示词搜索
- 批量操作（删除、下载）

### 2.2 增值功能

#### 2.2.1 提示词优化
- AI 提示词增强（自动优化用户输入）
- 提示词翻译（中文转英文）
- 提示词建议（实时推荐关键词）
- 反向提示词（negative prompt）

#### 2.2.2 模板市场
- 预设场景模板
  - 产品展示
  - 自然风景
  - 人物肖像
  - 抽象艺术
  - 商业广告
- 用户可保存自定义模板
- 社区模板分享

#### 2.2.3 视频编辑（轻量级）
- 简单裁剪
- 添加文字水印
- 背景音乐添加
- 视频拼接（多段视频合成）

#### 2.2.4 批量生成
- 批量上传提示词（CSV/TXT）
- 批量生成任务管理
- 批量下载

### 2.3 计费系统

#### 2.3.1 积分系统
- 新用户注册赠送积分
- 积分购买套餐
  - 基础包：100 积分 / ¥9.9
  - 标准包：500 积分 / ¥39.9
  - 专业包：1000 积分 / ¥69.9
  - 企业包：5000 积分 / ¥299.9

#### 2.3.2 消耗规则
视频时长和分辨率对应的积分消耗：
- 720p/5s: 10 积分
- 720p/10s: 20 积分
- 1080p/5s: 20 积分
- 1080p/10s: 40 积分
- 1080p/20s: 80 积分
- 4K/10s: 100 积分

#### 2.3.3 订阅制（可选）
- 月度会员：¥99/月（含 1000 积分 + 优先生成）
- 年度会员：¥999/年（含 15000 积分 + 优先生成 + 专属客服）

#### 2.3.4 支付方式
- 微信支付
- 支付宝
- 信用卡支付（Stripe）
- PayPal（海外用户）

### 2.4 用户中心

#### 2.4.1 账户信息
- 个人资料编辑
- 头像上传
- 邮箱/手机绑定

#### 2.4.2 积分管理
- 当前积分余额
- 积分消耗明细
- 充值记录
- 过期提醒

#### 2.4.3 订单管理
- 充值订单列表
- 订单状态查询
- 发票申请

#### 2.4.4 API Key 管理
- 查看个人 API 配额
- API 使用统计
- API 文档

### 2.5 管理后台

#### 2.5.1 用户管理
- 用户列表
- 用户详情
- 用户状态管理（正常/封禁）
- 用户行为分析

#### 2.5.2 订单管理
- 订单列表
- 订单统计
- 退款管理

#### 2.5.3 内容审核
- 待审核提示词列表
- 违规内容标记
- 自动审核规则配置

#### 2.5.4 系统配置
- OpenAI API Key 配置
- 积分价格配置
- 系统参数配置
- 公告管理

#### 2.5.5 数据统计
- 用户增长趋势
- 视频生成量统计
- 收入统计
- API 调用统计

## 3. 非功能需求

### 3.1 性能要求
- 页面加载时间 < 2s
- API 响应时间 < 500ms（不含视频生成）
- 支持 1000+ 并发用户
- 视频生成队列管理（异步处理）

### 3.2 安全要求
- HTTPS 加密传输
- 密码加密存储（bcrypt）
- API Key 加密存储
- SQL 注入防护
- XSS 攻击防护
- CSRF 防护
- 限流防刷（Rate Limiting）
- 内容审核（敏感词过滤）

### 3.3 可用性要求
- 系统可用性 > 99.5%
- 自动故障恢复
- 数据自动备份（每日）
- 错误日志记录

### 3.4 兼容性要求
- 支持主流浏览器（Chrome、Firefox、Safari、Edge）
- 响应式设计（PC、平板、手机）
- iOS/Android 移动端适配

### 3.5 可扩展性
- 微服务架构
- 水平扩展能力
- CDN 加速（视频存储）
- 消息队列（任务处理）

## 4. 技术架构建议

### 4.1 前端技术栈
- **框架**: React 18+ / Next.js 14+
- **状态管理**: Zustand / Redux Toolkit
- **UI 组件**: Ant Design / shadcn/ui / Tailwind CSS
- **视频播放**: Video.js / Plyr
- **HTTP 客户端**: Axios / TanStack Query
- **表单验证**: React Hook Form + Zod
- **动画**: Framer Motion

### 4.2 后端技术栈
- **语言**: Node.js (TypeScript) / Python (FastAPI)
- **框架**:
  - Node.js: Express / Nest.js / Hono
  - Python: FastAPI / Django
- **数据库**:
  - PostgreSQL（用户、订单、视频记录）
  - Redis（缓存、队列）
- **对象存储**: AWS S3 / 阿里云 OSS / 七牛云
- **消息队列**: Bull (Redis) / RabbitMQ
- **任务调度**: node-cron / Celery

### 4.3 OpenAI Sora API 集成
```
核心集成点：
1. 视频生成请求
   POST /v1/video/generations

2. 任务状态查询
   GET /v1/video/generations/{id}

3. 视频下载
   GET /v1/video/generations/{id}/download
```

### 4.4 部署架构
- **容器化**: Docker + Docker Compose
- **编排**: Kubernetes（生产环境）
- **CI/CD**: GitHub Actions / GitLab CI
- **云服务商**:
  - AWS (EC2, S3, RDS, CloudFront)
  - 阿里云 (ECS, OSS, RDS, CDN)
  - Vercel (前端部署)
- **监控**: Prometheus + Grafana / Sentry
- **日志**: ELK Stack / Loki

## 5. 数据模型设计

### 5.1 核心数据表

#### users（用户表）
```sql
- id: UUID (主键)
- email: string (唯一)
- phone: string
- password_hash: string
- nickname: string
- avatar_url: string
- credits: integer (积分余额)
- role: enum (user/admin)
- status: enum (active/banned)
- created_at: timestamp
- updated_at: timestamp
```

#### videos（视频表）
```sql
- id: UUID (主键)
- user_id: UUID (外键)
- prompt: text (提示词)
- negative_prompt: text
- duration: integer (秒)
- resolution: string (720p/1080p/4K)
- aspect_ratio: string
- style: string
- fps: integer
- status: enum (pending/processing/completed/failed)
- file_url: string (视频地址)
- thumbnail_url: string
- file_size: bigint (字节)
- cost_credits: integer (消耗积分)
- openai_task_id: string
- error_message: text
- created_at: timestamp
- completed_at: timestamp
```

#### credit_transactions（积分交易表）
```sql
- id: UUID (主键)
- user_id: UUID (外键)
- type: enum (recharge/consume/gift/refund)
- amount: integer (正数为增加，负数为消耗)
- balance_after: integer (交易后余额)
- related_id: UUID (关联订单或视频ID)
- description: string
- created_at: timestamp
```

#### orders（订单表）
```sql
- id: UUID (主键)
- user_id: UUID (外键)
- order_no: string (订单号)
- amount: decimal (支付金额)
- credits: integer (购买积分)
- payment_method: enum (wechat/alipay/stripe/paypal)
- status: enum (pending/paid/failed/refunded)
- paid_at: timestamp
- created_at: timestamp
```

#### templates（模板表）
```sql
- id: UUID (主键)
- user_id: UUID (创建者，NULL表示官方模板)
- name: string
- description: text
- prompt: text
- config: jsonb (生成参数)
- thumbnail_url: string
- is_public: boolean
- usage_count: integer
- created_at: timestamp
```

## 6. API 设计

### 6.1 用户认证
```
POST   /api/auth/register        注册
POST   /api/auth/login           登录
POST   /api/auth/logout          登出
POST   /api/auth/refresh-token   刷新 Token
POST   /api/auth/forgot-password 忘记密码
POST   /api/auth/reset-password  重置密码
```

### 6.2 视频生成
```
POST   /api/videos/generate      创建视频生成任务
GET    /api/videos               获取视频列表
GET    /api/videos/:id           获取视频详情
GET    /api/videos/:id/status    查询生成状态
DELETE /api/videos/:id           删除视频
POST   /api/videos/:id/regenerate 重新生成
GET    /api/videos/:id/download  下载视频
POST   /api/videos/:id/share     生成分享链接
```

### 6.3 积分管理
```
GET    /api/credits/balance      查询积分余额
GET    /api/credits/transactions 积分明细
POST   /api/credits/recharge     充值积分
```

### 6.4 订单管理
```
POST   /api/orders/create        创建订单
GET    /api/orders               订单列表
GET    /api/orders/:id           订单详情
POST   /api/orders/:id/pay       支付订单
```

### 6.5 模板管理
```
GET    /api/templates            模板列表
GET    /api/templates/:id        模板详情
POST   /api/templates            创建模板
PUT    /api/templates/:id        更新模板
DELETE /api/templates/:id        删除模板
```

### 6.6 用户中心
```
GET    /api/user/profile         获取用户信息
PUT    /api/user/profile         更新用户信息
POST   /api/user/avatar          上传头像
```

## 7. 业务流程

### 7.1 视频生成流程
```
1. 用户输入提示词和参数
2. 前端计算预估积分消耗
3. 检查用户积分余额
4. 提交生成任务到后端
5. 后端创建视频记录（status: pending）
6. 扣除用户积分
7. 将任务加入队列
8. 后台 Worker 处理任务：
   a. 调用 OpenAI Sora API
   b. 轮询任务状态
   c. 下载生成的视频
   d. 上传到对象存储
   e. 生成缩略图
   f. 更新数据库记录（status: completed）
9. WebSocket/轮询通知前端
10. 用户查看/下载视频
```

### 7.2 充值流程
```
1. 用户选择积分套餐
2. 创建订单（status: pending）
3. 跳转到支付页面
4. 用户完成支付
5. 接收支付回调
6. 验证支付结果
7. 更新订单状态（status: paid）
8. 增加用户积分
9. 创建积分交易记录
10. 通知用户充值成功
```

### 7.3 内容审核流程
```
1. 用户提交提示词
2. 自动审核：
   a. 敏感词检测
   b. 违规内容识别
3. 如果通过，进入生成流程
4. 如果未通过，返回错误提示
5. 人工复审（可选）
```

## 8. 风险与挑战

### 8.1 技术风险
- **OpenAI API 稳定性**: 依赖第三方 API，可能出现限流、宕机
  - 解决方案：实现重试机制、降级方案、多 API Key 轮换

- **视频生成时间长**: 用户等待时间可能较长
  - 解决方案：异步处理、进度通知、预估时间提示

- **存储成本**: 大量视频文件存储成本高
  - 解决方案：CDN 加速、定期清理过期文件、压缩策略

### 8.2 业务风险
- **成本控制**: API 调用成本需要精确计算
  - 解决方案：详细的成本监控、合理的定价策略

- **内容合规**: 用户生成违规内容
  - 解决方案：提示词审核、内容监控、用户协议

- **恶意刷量**: 用户恶意消耗资源
  - 解决方案：限流策略、异常检测、风控系统

### 8.3 竞争风险
- **市场竞争**: 类似产品可能出现
  - 解决方案：差异化功能、优质用户体验、社区运营

## 9. 项目里程碑

### Phase 1: MVP (4-6 周)
- [ ] 用户认证系统
- [ ] 基础视频生成功能
- [ ] 积分充值系统
- [ ] 简单的视频管理
- [ ] OpenAI API 集成
- [ ] 基础支付集成

### Phase 2: 完善功能 (4-6 周)
- [ ] 提示词优化
- [ ] 模板市场
- [ ] 批量生成
- [ ] 管理后台
- [ ] 数据统计
- [ ] 优化性能

### Phase 3: 增值服务 (4-6 周)
- [ ] 视频编辑功能
- [ ] 订阅制会员
- [ ] 社区功能
- [ ] API 开放平台
- [ ] 移动端 App

## 10. 成功指标 (KPI)

### 10.1 用户指标
- 注册用户数
- 日活跃用户 (DAU)
- 月活跃用户 (MAU)
- 用户留存率（次日、7日、30日）
- 付费用户转化率

### 10.2 业务指标
- 视频生成量（日/月）
- 积分消耗量
- 充值金额（MRR、ARR）
- 客单价
- 用户生命周期价值 (LTV)

### 10.3 技术指标
- API 成功率
- 平均生成时长
- 系统可用性
- 错误率
- 响应时间

## 11. 附录

### 11.1 竞品分析
- OpenAI 官方（价格、功能对比）
- 国内类似平台
- 差异化优势

### 11.2 定价策略参考
基于 OpenAI API 成本 + 平台运营成本 + 合理利润

### 11.3 法律合规
- 用户服务协议
- 隐私政策
- 内容版权说明
- ICP 备案（国内）

### 11.4 运营推广
- 新用户注册赠送积分
- 邀请奖励机制
- 内容营销（案例展示）
- 社交媒体推广
- SEO 优化

---

**文档版本**: v1.0
**创建日期**: 2025-10-12
**更新日期**: 2025-10-12
**负责人**: [待填写]
**审核人**: [待填写]
