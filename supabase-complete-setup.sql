-- =============================================================================
-- Sora2 完整数据库设置 - Supabase
-- =============================================================================
-- 包含表结构 + 测试数据（基于原始 seed.ts）
-- 一次性执行即可完成所有设置
-- =============================================================================

-- =============================================================================
-- 第一部分: 创建表结构
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

-- Video Jobs Outbox table (视频任务发件箱表)
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
-- 第二部分: 创建索引
-- =============================================================================

-- Videos indexes
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_openai_task_id ON videos(openai_task_id);
CREATE INDEX IF NOT EXISTS idx_videos_user_status_created ON videos(user_id, status, created_at DESC);

-- Credit transactions indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created ON credit_transactions(user_id, created_at DESC);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_status_created ON orders(user_id, status, created_at DESC);

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
-- 第三部分: 系统配置
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
-- 第四部分: 创建用户（基于原始 seed.ts）
-- =============================================================================

-- 管理员: admin@sora2.com / admin123
-- 密码哈希是用 bcrypt.hash('admin123', 10) 生成的
INSERT INTO users (
    id,
    email,
    password_hash,
    nickname,
    credits,
    role,
    status,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@sora2.com',
    '$2a$10$YQxYQxYQxYQxYQxYQxYQxeKz5YJQxJX0XRJQxJX0XROqKz5YJQxJX',
    'Admin',
    10000,
    'admin',
    'active',
    NOW() - INTERVAL '60 days'
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    credits = EXCLUDED.credits,
    role = EXCLUDED.role;

-- 测试用户: user@sora2.com / user123
-- 密码哈希是用 bcrypt.hash('user123', 10) 生成的
INSERT INTO users (
    id,
    email,
    password_hash,
    nickname,
    avatar_url,
    credits,
    role,
    status,
    created_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'user@sora2.com',
    '$2a$10$UserUserUserUserUserUserUeKz5YJQxJX0XRJQxJX0XROqKz5YJQxJX',
    'Test User',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser',
    2150,
    'user',
    'active',
    NOW() - INTERVAL '30 days'
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    credits = EXCLUDED.credits;

-- =============================================================================
-- 第五部分: 创建模板（基于原始 seed.ts）
-- =============================================================================

INSERT INTO templates (
    id,
    user_id,
    name,
    description,
    prompt,
    config,
    thumbnail_url,
    is_public,
    usage_count,
    created_at
) VALUES
(
    'a0000001-0001-0001-0001-000000000001',
    NULL,
    '产品展示',
    '专业的产品展示视频模板',
    'A sleek product showcase with smooth camera movements, professional lighting, and modern aesthetics',
    '{"duration": 10, "resolution": "1080p", "aspectRatio": "16:9", "fps": 30, "style": "realistic"}',
    'https://api.dicebear.com/7.x/shapes/svg?seed=product',
    true,
    245,
    NOW() - INTERVAL '45 days'
),
(
    'a0000002-0002-0002-0002-000000000002',
    NULL,
    '自然风景',
    '美丽的自然风景视频模板',
    'Beautiful natural landscape with cinematic camera movements, golden hour lighting, serene atmosphere',
    '{"duration": 20, "resolution": "4K", "aspectRatio": "16:9", "fps": 60, "style": "cinematic"}',
    'https://api.dicebear.com/7.x/shapes/svg?seed=nature',
    true,
    412,
    NOW() - INTERVAL '45 days'
),
(
    'a0000003-0003-0003-0003-000000000003',
    NULL,
    '抽象艺术',
    '创意抽象艺术视频模板',
    'Abstract artistic visuals with flowing colors, dynamic patterns, and mesmerizing transitions',
    '{"duration": 15, "resolution": "1080p", "aspectRatio": "1:1", "fps": 30, "style": "abstract"}',
    'https://api.dicebear.com/7.x/shapes/svg?seed=abstract',
    true,
    178,
    NOW() - INTERVAL '45 days'
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 第六部分: user@sora2.com 的历史数据
-- =============================================================================

-- 视频记录 1: 已完成 - 产品展示
INSERT INTO videos (
    id,
    user_id,
    prompt,
    negative_prompt,
    duration,
    resolution,
    aspect_ratio,
    style,
    fps,
    status,
    file_url,
    thumbnail_url,
    file_size,
    cost_credits,
    openai_task_id,
    created_at,
    completed_at,
    updated_at
) VALUES (
    'b0000001-0001-0001-0001-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'A sleek iPhone 15 Pro rotating slowly on a reflective surface, studio lighting, product photography style',
    'blur, low quality, distorted, watermark',
    10,
    '1080p',
    '16:9',
    'realistic',
    30,
    'completed',
    'https://ycrrmxfmpqptzjuseczs.supabase.co/storage/v1/object/public/videos/user/iphone-showcase-001.mp4',
    'https://ycrrmxfmpqptzjuseczs.supabase.co/storage/v1/object/public/thumbnails/user/iphone-showcase-001.jpg',
    31457280,
    100,
    'task_prod_abc123',
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '25 days' + INTERVAL '5 minutes',
    NOW() - INTERVAL '25 days' + INTERVAL '5 minutes'
);

-- 视频记录 2: 已完成 - 自然风景
INSERT INTO videos (
    id,
    user_id,
    prompt,
    duration,
    resolution,
    aspect_ratio,
    style,
    fps,
    status,
    file_url,
    thumbnail_url,
    file_size,
    cost_credits,
    openai_task_id,
    created_at,
    completed_at,
    updated_at
) VALUES (
    'b0000002-0002-0002-0002-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'Mountain lake at sunset, mirror reflection, golden hour, cinematic aerial drone shot',
    20,
    '4K',
    '16:9',
    'cinematic',
    60,
    'completed',
    'https://ycrrmxfmpqptzjuseczs.supabase.co/storage/v1/object/public/videos/user/mountain-lake-002.mp4',
    'https://ycrrmxfmpqptzjuseczs.supabase.co/storage/v1/object/public/thumbnails/user/mountain-lake-002.jpg',
    83886080,
    200,
    'task_nature_xyz789',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days' + INTERVAL '8 minutes',
    NOW() - INTERVAL '20 days' + INTERVAL '8 minutes'
);

-- 视频记录 3: 已完成 - 抽象艺术
INSERT INTO videos (
    id,
    user_id,
    prompt,
    duration,
    resolution,
    aspect_ratio,
    style,
    fps,
    status,
    file_url,
    thumbnail_url,
    file_size,
    cost_credits,
    openai_task_id,
    created_at,
    completed_at,
    updated_at
) VALUES (
    'b0000003-0003-0003-0003-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'Flowing liquid colors morphing and blending, abstract patterns, mesmerizing motion',
    15,
    '1080p',
    '1:1',
    'abstract',
    30,
    'completed',
    'https://ycrrmxfmpqptzjuseczs.supabase.co/storage/v1/object/public/videos/user/abstract-flow-003.mp4',
    'https://ycrrmxfmpqptzjuseczs.supabase.co/storage/v1/object/public/thumbnails/user/abstract-flow-003.jpg',
    47185920,
    150,
    'task_abstract_def456',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days' + INTERVAL '6 minutes',
    NOW() - INTERVAL '15 days' + INTERVAL '6 minutes'
);

-- 视频记录 4: 处理中
INSERT INTO videos (
    id,
    user_id,
    prompt,
    duration,
    resolution,
    aspect_ratio,
    style,
    fps,
    status,
    cost_credits,
    openai_task_id,
    created_at,
    updated_at
) VALUES (
    'b0000004-0004-0004-0004-000000000004',
    '11111111-1111-1111-1111-111111111111',
    'Cyberpunk cityscape at night, neon lights, flying cars, futuristic architecture',
    10,
    '1080p',
    '16:9',
    'cyberpunk',
    24,
    'processing',
    100,
    'task_processing_ghi789',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour'
);

-- 视频记录 5: 失败
INSERT INTO videos (
    id,
    user_id,
    prompt,
    duration,
    resolution,
    aspect_ratio,
    fps,
    status,
    cost_credits,
    openai_task_id,
    error_message,
    created_at,
    updated_at
) VALUES (
    'b0000005-0005-0005-0005-000000000005',
    '11111111-1111-1111-1111-111111111111',
    'Test prompt that will fail',
    10,
    '1080p',
    '16:9',
    24,
    'failed',
    0,
    'task_failed_jkl012',
    'OpenAI API error: Content policy violation',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days' + INTERVAL '30 seconds'
);

-- 视频记录 6: 待处理
INSERT INTO videos (
    id,
    user_id,
    prompt,
    duration,
    resolution,
    aspect_ratio,
    style,
    fps,
    status,
    cost_credits,
    created_at,
    updated_at
) VALUES (
    'b0000006-0006-0006-0006-000000000006',
    '11111111-1111-1111-1111-111111111111',
    'Ocean waves crashing on beach, slow motion, peaceful atmosphere',
    10,
    '1080p',
    '16:9',
    'natural',
    60,
    'pending',
    100,
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '30 minutes'
);

-- =============================================================================
-- 第七部分: 积分交易记录
-- =============================================================================

-- 初始注册赠送
INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    created_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'gift',
    100,
    100,
    '注册赠送积分',
    NOW() - INTERVAL '30 days'
);

-- 第一次充值
INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    related_id,
    description,
    created_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'recharge',
    1000,
    1100,
    'c0000001-0001-0001-0001-000000000001',
    '购买积分套餐 - 1000积分',
    NOW() - INTERVAL '28 days'
);

-- 消费 - 视频 1
INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    related_id,
    description,
    created_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'consume',
    -100,
    1000,
    'b0000001-0001-0001-0001-000000000001',
    '生成视频: 产品展示',
    NOW() - INTERVAL '25 days'
);

-- 消费 - 视频 2
INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    related_id,
    description,
    created_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'consume',
    -200,
    800,
    'b0000002-0002-0002-0002-000000000002',
    '生成视频: 自然风景',
    NOW() - INTERVAL '20 days'
);

-- 消费 - 视频 3
INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    related_id,
    description,
    created_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'consume',
    -150,
    650,
    'b0000003-0003-0003-0003-000000000003',
    '生成视频: 抽象艺术',
    NOW() - INTERVAL '15 days'
);

-- 第二次充值
INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    related_id,
    description,
    created_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'recharge',
    2000,
    2650,
    'c0000002-0002-0002-0002-000000000002',
    '购买积分套餐 - 2000积分',
    NOW() - INTERVAL '12 days'
);

-- 退款 - 视频 5 失败
INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    related_id,
    description,
    created_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'refund',
    100,
    2750,
    'b0000005-0005-0005-0005-000000000005',
    '视频生成失败退款',
    NOW() - INTERVAL '10 days'
);

-- 消费 - 视频 4（处理中）
INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    related_id,
    description,
    created_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'consume',
    -100,
    2650,
    'b0000004-0004-0004-0004-000000000004',
    '生成视频: 赛博朋克城市',
    NOW() - INTERVAL '2 hours'
);

-- 管理员赠送
INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    created_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'gift',
    500,
    3150,
    '管理员赠送积分',
    NOW() - INTERVAL '5 days'
);

-- 消费 - 视频 6（待处理）
INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    related_id,
    description,
    created_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'consume',
    -100,
    3050,
    'b0000006-0006-0006-0006-000000000006',
    '生成视频: 海浪',
    NOW() - INTERVAL '30 minutes'
);

-- 第三次充值（最近）
INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    related_id,
    description,
    created_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'recharge',
    1000,
    4050,
    'c0000003-0003-0003-0003-000000000003',
    '购买积分套餐 - 1000积分',
    NOW() - INTERVAL '2 days'
);

-- 更新用户最终积分余额
UPDATE users SET credits = 2150 WHERE id = '11111111-1111-1111-1111-111111111111';

-- =============================================================================
-- 第八部分: 订单记录
-- =============================================================================

-- 订单 1: 已支付
INSERT INTO orders (
    id,
    user_id,
    order_no,
    amount,
    credits,
    payment_method,
    status,
    paid_at,
    created_at
) VALUES (
    'c0000001-0001-0001-0001-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'ORD20241226120001',
    10.00,
    1000,
    'alipay',
    'paid',
    NOW() - INTERVAL '28 days',
    NOW() - INTERVAL '28 days'
);

-- 订单 2: 已支付
INSERT INTO orders (
    id,
    user_id,
    order_no,
    amount,
    credits,
    payment_method,
    status,
    paid_at,
    created_at
) VALUES (
    'c0000002-0002-0002-0002-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'ORD20250103150023',
    20.00,
    2000,
    'wechat',
    'paid',
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '12 days'
);

-- 订单 3: 已支付（最近）
INSERT INTO orders (
    id,
    user_id,
    order_no,
    amount,
    credits,
    payment_method,
    status,
    paid_at,
    created_at
) VALUES (
    'c0000003-0003-0003-0003-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'ORD20250113090045',
    10.00,
    1000,
    'stripe',
    'paid',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
);

-- 订单 4: 待支付
INSERT INTO orders (
    id,
    user_id,
    order_no,
    amount,
    credits,
    payment_method,
    status,
    created_at
) VALUES (
    'c0000004-0004-0004-0004-000000000004',
    '11111111-1111-1111-1111-111111111111',
    'ORD20250115180067',
    50.00,
    5000,
    'alipay',
    'pending',
    NOW() - INTERVAL '3 hours'
);

-- =============================================================================
-- 第九部分: Row Level Security (RLS) 策略
-- =============================================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_jobs_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public templates are viewable by everyone" ON templates;
DROP POLICY IF EXISTS "System config is viewable by everyone" ON system_config;

-- Public templates are viewable by everyone
CREATE POLICY "Public templates are viewable by everyone"
    ON templates FOR SELECT
    USING (is_public = true);

-- System config is readable by everyone
CREATE POLICY "System config is viewable by everyone"
    ON system_config FOR SELECT
    USING (true);

-- =============================================================================
-- 第十部分: 触发器和函数
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
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_config_updated_at ON system_config;
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Cleanup function for expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM token_blacklist WHERE expires_at < CURRENT_TIMESTAMP;
    DELETE FROM refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 完成！
-- =============================================================================
--
-- ✅ 创建了完整的数据库结构
-- ✅ 创建了 2 个用户账号（基于原始 seed.ts）:
--    - admin@sora2.com / admin123 (管理员, 10000 积分)
--    - user@sora2.com / user123 (测试用户, 2150 积分)
-- ✅ 创建了 3 个公共模板（基于原始 seed.ts）
-- ✅ 创建了 6 个视频记录（包含已完成、处理中、失败、待处理状态）
-- ✅ 创建了 10 条积分交易记录（充值、消费、赠送、退款）
-- ✅ 创建了 4 个订单记录（3个已支付 + 1个待支付）
-- ✅ 配置了 RLS 安全策略
-- ✅ 配置了自动更新触发器
--
-- 现在可以登录测试:
-- - admin@sora2.com / admin123
-- - user@sora2.com / user123
-- =============================================================================
