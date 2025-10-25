-- =============================================================================
-- Sora2 优化后的数据库 Schema - Supabase PostgreSQL
-- =============================================================================
-- 优化内容：
-- 1. 统一字段命名（全部使用下划线）
-- 2. 使用 ENUM 替代 VARCHAR（role, status 等）
-- 3. 使用 TIMESTAMPTZ 替代 TIMESTAMP（带时区）
-- 4. 添加完整性约束（CHECK, NOT NULL）
-- 5. 优化索引（部分索引、GIN 索引）
-- 6. 添加缺失字段
-- =============================================================================

-- =============================================================================
-- 第一部分：删除旧的枚举类型（如果存在）
-- =============================================================================

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS video_status CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;

-- =============================================================================
-- 第二部分：创建枚举类型
-- =============================================================================

-- 用户角色
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');

-- 用户状态
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'banned', 'pending_verification');

-- 视频状态
CREATE TYPE video_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

-- 交易类型
CREATE TYPE transaction_type AS ENUM (
    'signup_bonus',      -- 注册赠送
    'purchase',          -- 购买充值
    'video_generation',  -- 视频生成消费
    'refund',           -- 退款
    'admin_grant',      -- 管理员赠送
    'admin_deduct',     -- 管理员扣除
    'referral_bonus'    -- 推荐奖励
);

-- 支付方式
CREATE TYPE payment_method AS ENUM ('alipay', 'wechat', 'stripe', 'paypal', 'balance');

-- 订单状态
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled');

-- =============================================================================
-- 第三部分：创建优化后的表结构
-- =============================================================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
    -- 主键
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 认证信息
    email VARCHAR(100) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    phone VARCHAR(20) UNIQUE,
    phone_verified BOOLEAN DEFAULT false,
    password_hash VARCHAR(255) NOT NULL,

    -- 用户信息
    nickname VARCHAR(50) NOT NULL,
    avatar_url VARCHAR(500),
    bio TEXT,

    -- 积分和角色
    credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0),
    role user_role NOT NULL DEFAULT 'user',
    status user_status NOT NULL DEFAULT 'active',

    -- 统计信息
    video_count INTEGER NOT NULL DEFAULT 0 CHECK (video_count >= 0),
    total_spent_credits INTEGER NOT NULL DEFAULT 0 CHECK (total_spent_credits >= 0),

    -- 时间戳
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 软删除
    deleted_at TIMESTAMPTZ
);

-- 2. 视频表
CREATE TABLE IF NOT EXISTS videos (
    -- 主键和外键
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- 提示词
    prompt TEXT NOT NULL CHECK (length(prompt) >= 10 AND length(prompt) <= 2000),
    negative_prompt TEXT,

    -- 视频参数
    duration INTEGER NOT NULL CHECK (duration > 0 AND duration <= 60),
    resolution VARCHAR(20) NOT NULL CHECK (resolution IN ('720p', '1080p', '4K')),
    aspect_ratio VARCHAR(10) NOT NULL CHECK (aspect_ratio IN ('16:9', '9:16', '1:1', '4:3')),
    style VARCHAR(50),
    fps INTEGER NOT NULL CHECK (fps IN (24, 30, 60)),

    -- 状态和结果
    status video_status NOT NULL DEFAULT 'pending',
    file_url TEXT,
    thumbnail_url TEXT,
    file_size BIGINT CHECK (file_size >= 0),

    -- 成本和任务
    cost_credits INTEGER NOT NULL CHECK (cost_credits >= 0),
    openai_task_id VARCHAR(255),

    -- 错误信息
    error_message TEXT,
    error_code VARCHAR(50),

    -- 元数据（存储额外信息）
    metadata JSONB DEFAULT '{}',

    -- 时间戳
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 软删除
    deleted_at TIMESTAMPTZ,

    -- 约束：完成的视频必须有文件URL
    CONSTRAINT completed_video_has_url CHECK (
        status != 'completed' OR (file_url IS NOT NULL AND thumbnail_url IS NOT NULL)
    )
);

-- 3. 积分交易记录表
CREATE TABLE IF NOT EXISTS credit_transactions (
    -- 主键和外键
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- 交易信息
    type transaction_type NOT NULL,
    amount INTEGER NOT NULL,
    balance_before INTEGER NOT NULL CHECK (balance_before >= 0),
    balance_after INTEGER NOT NULL CHECK (balance_after >= 0),

    -- 关联信息
    related_id UUID,
    related_type VARCHAR(20), -- 'video', 'order', 'referral' etc.

    -- 描述
    description VARCHAR(255) NOT NULL,
    notes TEXT,

    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 约束：积分变化和余额一致
    CONSTRAINT balance_change_consistent CHECK (
        balance_after = balance_before + amount
    )
);

-- 4. 订单表
CREATE TABLE IF NOT EXISTS orders (
    -- 主键和外键
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- 订单信息
    order_no VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    credits INTEGER NOT NULL CHECK (credits > 0),

    -- 支付信息
    payment_method payment_method NOT NULL,
    payment_transaction_id VARCHAR(255),
    payment_details JSONB DEFAULT '{}',

    -- 状态
    status order_status NOT NULL DEFAULT 'pending',

    -- 优惠信息
    discount_amount DECIMAL(10, 2) DEFAULT 0 CHECK (discount_amount >= 0),
    discount_code VARCHAR(50),

    -- 时间戳
    paid_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 约束：已支付订单必须有支付时间
    CONSTRAINT paid_order_has_paid_at CHECK (
        status != 'paid' OR paid_at IS NOT NULL
    )
);

-- 5. 模板表
CREATE TABLE IF NOT EXISTS templates (
    -- 主键和外键
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- 模板信息
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    prompt TEXT NOT NULL,

    -- 配置（JSONB 存储）
    config JSONB NOT NULL DEFAULT '{}',

    -- 预览
    thumbnail_url VARCHAR(500),
    preview_video_url VARCHAR(500),

    -- 公开和使用
    is_public BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    usage_count INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0),

    -- 分类和标签
    category VARCHAR(50),
    tags TEXT[],

    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 软删除
    deleted_at TIMESTAMPTZ
);

-- 6. 系统配置表
CREATE TABLE IF NOT EXISTS system_config (
    -- 主键
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 配置键值
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,

    -- 描述和类型
    description TEXT,
    type VARCHAR(20) NOT NULL DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),

    -- 是否公开（客户端可读）
    is_public BOOLEAN NOT NULL DEFAULT false,

    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. 刷新令牌表
CREATE TABLE IF NOT EXISTS refresh_tokens (
    -- 主键和外键
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- 令牌信息
    token VARCHAR(500) UNIQUE NOT NULL,
    device_info JSONB DEFAULT '{}',

    -- 过期时间
    expires_at TIMESTAMPTZ NOT NULL,

    -- 使用信息
    last_used_at TIMESTAMPTZ,
    ip_address INET,

    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 约束：令牌未过期
    CONSTRAINT token_not_expired CHECK (expires_at > created_at)
);

-- 8. 令牌黑名单表
CREATE TABLE IF NOT EXISTS token_blacklist (
    -- 主键
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 令牌
    token VARCHAR(500) UNIQUE NOT NULL,

    -- 过期时间
    expires_at TIMESTAMPTZ NOT NULL,

    -- 原因
    reason VARCHAR(100),

    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. 视频任务队列表（Outbox Pattern）
CREATE TABLE IF NOT EXISTS video_jobs_outbox (
    -- 主键和外键
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,

    -- 事件信息
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',

    -- 状态
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

    -- 重试
    retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
    max_retries INTEGER NOT NULL DEFAULT 3 CHECK (max_retries >= 0),
    next_retry_at TIMESTAMPTZ,

    -- 错误
    error_message TEXT,

    -- 时间戳
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 第四部分：创建优化后的索引
-- =============================================================================

-- Users 表索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC) WHERE deleted_at IS NULL;

-- Videos 表索引
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_videos_openai_task_id ON videos(openai_task_id) WHERE openai_task_id IS NOT NULL;
-- 复合索引用于常见查询
CREATE INDEX IF NOT EXISTS idx_videos_user_status_created ON videos(user_id, status, created_at DESC) WHERE deleted_at IS NULL;
-- 部分索引：只索引处理中的视频
CREATE INDEX IF NOT EXISTS idx_videos_processing ON videos(id, created_at) WHERE status IN ('pending', 'processing');
-- GIN 索引用于 JSONB
CREATE INDEX IF NOT EXISTS idx_videos_metadata_gin ON videos USING GIN (metadata);

-- Credit Transactions 表索引
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created ON credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_related ON credit_transactions(related_id, related_type) WHERE related_id IS NOT NULL;

-- Orders 表索引
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_status_created ON orders(user_id, status, created_at DESC);
-- 部分索引：只索引待支付订单
CREATE INDEX IF NOT EXISTS idx_orders_pending ON orders(id, created_at) WHERE status = 'pending';
-- GIN 索引用于 JSONB
CREATE INDEX IF NOT EXISTS idx_orders_payment_details_gin ON orders USING GIN (payment_details);

-- Templates 表索引
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_templates_is_public ON templates(is_public) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_templates_is_featured ON templates(is_featured) WHERE is_featured = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_templates_usage_count ON templates(usage_count DESC) WHERE is_public = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category) WHERE category IS NOT NULL AND deleted_at IS NULL;
-- GIN 索引用于 tags 数组
CREATE INDEX IF NOT EXISTS idx_templates_tags_gin ON templates USING GIN (tags);
-- GIN 索引用于 config JSONB
CREATE INDEX IF NOT EXISTS idx_templates_config_gin ON templates USING GIN (config);

-- System Config 表索引
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);
CREATE INDEX IF NOT EXISTS idx_system_config_is_public ON system_config(is_public) WHERE is_public = true;

-- Refresh Tokens 表索引
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at) WHERE expires_at > CURRENT_TIMESTAMP;

-- Token Blacklist 表索引
CREATE INDEX IF NOT EXISTS idx_token_blacklist_token ON token_blacklist(token);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist(expires_at) WHERE expires_at > CURRENT_TIMESTAMP;

-- Video Jobs Outbox 表索引
CREATE INDEX IF NOT EXISTS idx_video_jobs_outbox_video_id ON video_jobs_outbox(video_id);
CREATE INDEX IF NOT EXISTS idx_video_jobs_outbox_status ON video_jobs_outbox(status);
CREATE INDEX IF NOT EXISTS idx_video_jobs_outbox_next_retry_at ON video_jobs_outbox(next_retry_at) WHERE next_retry_at IS NOT NULL AND status = 'pending';
-- 复合索引用于重试队列查询
CREATE INDEX IF NOT EXISTS idx_video_jobs_outbox_retry_queue ON video_jobs_outbox(status, next_retry_at, retry_count)
    WHERE status = 'pending' AND retry_count < max_retries;

-- =============================================================================
-- 第五部分：创建触发器函数
-- =============================================================================

-- 自动更新 updated_at 时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 自动更新用户的视频统计
CREATE OR REPLACE FUNCTION update_user_video_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users SET video_count = video_count + 1 WHERE id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users SET video_count = GREATEST(video_count - 1, 0) WHERE id = OLD.user_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 自动清理过期令牌
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM token_blacklist WHERE expires_at < CURRENT_TIMESTAMP;
    DELETE FROM refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 第六部分：创建触发器
-- =============================================================================

-- Users 表 updated_at 触发器
DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Videos 表 updated_at 触发器
DROP TRIGGER IF EXISTS trigger_videos_updated_at ON videos;
CREATE TRIGGER trigger_videos_updated_at
    BEFORE UPDATE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Videos 表统计触发器
DROP TRIGGER IF EXISTS trigger_update_user_video_stats_insert ON videos;
DROP TRIGGER IF EXISTS trigger_update_user_video_stats_delete ON videos;
CREATE TRIGGER trigger_update_user_video_stats_insert
    AFTER INSERT ON videos
    FOR EACH ROW
    EXECUTE FUNCTION update_user_video_stats();
CREATE TRIGGER trigger_update_user_video_stats_delete
    AFTER DELETE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION update_user_video_stats();

-- Orders 表 updated_at 触发器
DROP TRIGGER IF EXISTS trigger_orders_updated_at ON orders;
CREATE TRIGGER trigger_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Templates 表 updated_at 触发器
DROP TRIGGER IF EXISTS trigger_templates_updated_at ON templates;
CREATE TRIGGER trigger_templates_updated_at
    BEFORE UPDATE ON templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- System Config 表 updated_at 触发器
DROP TRIGGER IF EXISTS trigger_system_config_updated_at ON system_config;
CREATE TRIGGER trigger_system_config_updated_at
    BEFORE UPDATE ON system_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Video Jobs Outbox 表 updated_at 触发器
DROP TRIGGER IF EXISTS trigger_video_jobs_outbox_updated_at ON video_jobs_outbox;
CREATE TRIGGER trigger_video_jobs_outbox_updated_at
    BEFORE UPDATE ON video_jobs_outbox
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 第七部分：Row Level Security (RLS) 策略
-- =============================================================================

-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_jobs_outbox ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "Public templates are viewable by everyone" ON templates;
DROP POLICY IF EXISTS "System config is viewable by everyone" ON system_config;

-- Templates 策略：公开模板所有人可见
CREATE POLICY "public_templates_select" ON templates
    FOR SELECT USING (is_public = true AND deleted_at IS NULL);

-- System Config 策略：公开配置所有人可见
CREATE POLICY "public_system_config_select" ON system_config
    FOR SELECT USING (is_public = true);

-- =============================================================================
-- 完成！优化后的数据库 schema 创建完毕
-- =============================================================================
--
-- ✅ 优化内容：
-- 1. 统一字段命名（全部使用下划线）
-- 2. 使用 ENUM 类型（更安全，占用空间小）
-- 3. 使用 TIMESTAMPTZ（带时区的时间戳）
-- 4. 添加完整性约束（CHECK, NOT NULL）
-- 5. 优化索引（部分索引、GIN 索引、复合索引）
-- 6. 添加缺失字段（email_verified, last_login_at, metadata 等）
-- 7. 添加触发器（自动更新时间戳、统计信息）
-- 8. 添加软删除支持（deleted_at）
-- 9. 改进 RLS 策略
--
-- 📊 性能提升：
-- - 部分索引减少索引大小
-- - GIN 索引支持 JSONB 快速查询
-- - 复合索引优化常见查询
-- - CHECK 约束在数据库层面保证数据完整性
-- =============================================================================
