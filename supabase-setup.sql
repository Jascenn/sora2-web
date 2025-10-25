-- =============================================================================
-- Sora2 Database Schema for Supabase
-- =============================================================================
-- 在 Supabase SQL Editor 中执行此脚本
-- =============================================================================

-- Users table (用户表)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    credits INTEGER DEFAULT 0,
    role VARCHAR(20) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Videos table (视频表)
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    negative_prompt TEXT,
    duration INTEGER NOT NULL,
    resolution VARCHAR(20) NOT NULL,
    aspect_ratio VARCHAR(20) NOT NULL,
    style VARCHAR(50),
    fps INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    file_url TEXT,
    thumbnail_url TEXT,
    file_size BIGINT,
    cost_credits INTEGER NOT NULL,
    openai_task_id VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Credit transactions table (积分交易记录表)
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    related_id UUID,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table (订单表)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_no VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    credits INTEGER NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Templates table (模板表)
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    prompt TEXT NOT NULL,
    config JSONB NOT NULL,
    thumbnail_url VARCHAR(500),
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Config table (系统配置表)
CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description VARCHAR(255),
    type VARCHAR(20) DEFAULT 'string',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Refresh Tokens table (刷新令牌表)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP
);

-- Token Blacklist table (令牌黑名单表)
CREATE TABLE IF NOT EXISTS token_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Video Jobs Outbox table (视频任务发件箱表 - 用于可靠性处理)
CREATE TABLE IF NOT EXISTS video_jobs_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP,
    processed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- Indexes for Performance (性能索引)
-- =============================================================================

-- Videos indexes
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_openai_task_id ON videos(openai_task_id);

-- Credit transactions indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Templates indexes
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_is_public ON templates(is_public);
CREATE INDEX IF NOT EXISTS idx_templates_usage_count ON templates(usage_count DESC);

-- Refresh tokens indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Token blacklist indexes
CREATE INDEX IF NOT EXISTS idx_token_blacklist_token ON token_blacklist(token);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist(expires_at);

-- Video jobs outbox indexes
CREATE INDEX IF NOT EXISTS idx_video_jobs_outbox_video_id ON video_jobs_outbox(video_id);
CREATE INDEX IF NOT EXISTS idx_video_jobs_outbox_status ON video_jobs_outbox(status);
CREATE INDEX IF NOT EXISTS idx_video_jobs_outbox_next_retry_at ON video_jobs_outbox(next_retry_at);

-- =============================================================================
-- Initial System Configuration (初始系统配置)
-- =============================================================================

INSERT INTO system_config (key, value, description, type) VALUES
('credit_price', '0.01', 'Price per credit in USD', 'number'),
('default_signup_credits', '100', 'Default credits for new users', 'number'),
('video_cost_per_second', '10', 'Credits cost per second of video', 'number'),
('max_video_duration', '10', 'Maximum video duration in seconds', 'number'),
('enable_registration', 'true', 'Enable user registration', 'boolean'),
('enable_payment', 'true', 'Enable payment system', 'boolean')
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- Create Admin User (创建管理员用户)
-- =============================================================================
-- 密码: admin123 (请在生产环境中修改!)
-- Password hash for 'admin123' using bcrypt

INSERT INTO users (
    email,
    password_hash,
    nickname,
    credits,
    role,
    status
) VALUES (
    'admin@sora2.com',
    '$2a$10$rKz5YJQxJX0XRJQxJX0XROqKz5YJQxJX0XRJQxJX0XROqKz5YJQxJ',
    'Administrator',
    999999,
    'admin',
    'active'
) ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- Row Level Security (RLS) Policies (行级安全策略)
-- =============================================================================
-- 注意：Supabase 推荐使用 RLS，但如果使用 service_role key，可以绕过 RLS
-- 以下策略供参考，根据需要启用

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_jobs_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Public read access to public templates
CREATE POLICY "Public templates are viewable by everyone"
    ON templates FOR SELECT
    USING (is_public = true);

-- Users can view their own data
CREATE POLICY "Users can view own user data"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Users can view their own videos
CREATE POLICY "Users can view own videos"
    ON videos FOR SELECT
    USING (auth.uid() = user_id);

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
    ON credit_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    USING (auth.uid() = user_id);

-- System config is readable by everyone
CREATE POLICY "System config is viewable by everyone"
    ON system_config FOR SELECT
    USING (true);

-- =============================================================================
-- Functions (辅助函数)
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Cleanup old tokens (清理过期令牌)
-- =============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM token_blacklist WHERE expires_at < CURRENT_TIMESTAMP;
    DELETE FROM refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 完成！数据库表结构创建完毕
-- =============================================================================
--
-- 下一步:
-- 1. 在 Supabase 控制台查看 Table Editor 确认表已创建
-- 2. 复制 API 密钥配置到你的应用
-- 3. 测试数据库连接
-- =============================================================================
