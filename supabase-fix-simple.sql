-- =============================================================================
-- 简化版数据库修复脚本
-- =============================================================================
-- 解决 "column deleted_at does not exist" 和类型转换问题
-- =============================================================================

BEGIN;

-- =============================================================================
-- 步骤 1: 创建 ENUM 类型
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'banned', 'pending_verification');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE video_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM (
        'signup_bonus', 'purchase', 'video_generation',
        'refund', 'admin_grant', 'admin_deduct', 'referral_bonus'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('alipay', 'wechat', 'stripe', 'paypal', 'balance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- 步骤 2: Users 表 - 添加新字段
-- =============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS video_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_spent_credits INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- =============================================================================
-- 步骤 3: Videos 表 - 添加新字段
-- =============================================================================

ALTER TABLE videos ADD COLUMN IF NOT EXISTS error_code VARCHAR(50);
ALTER TABLE videos ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- =============================================================================
-- 步骤 4: Credit Transactions 表 - 添加新字段
-- =============================================================================

ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS balance_before INTEGER NOT NULL DEFAULT 0;
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS related_type VARCHAR(20);
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS notes TEXT;

-- 更新 balance_before 为计算值
UPDATE credit_transactions
SET balance_before = balance_after - amount
WHERE balance_before = 0;

-- =============================================================================
-- 步骤 5: Orders 表 - 添加新字段
-- =============================================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_transaction_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- =============================================================================
-- 步骤 6: 转换 Users 表的 role 和 status 为 ENUM（如果需要）
-- =============================================================================

-- 转换 role 字段
DO $$
BEGIN
    -- 检查列类型是否需要转换
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role' AND data_type = 'character varying'
    ) THEN
        -- 先删除默认值
        ALTER TABLE users ALTER COLUMN role DROP DEFAULT;

        -- 转换类型
        ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::text::user_role;

        -- 重新设置默认值
        ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user'::user_role;
    END IF;
END $$;

-- 转换 status 字段
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'status' AND data_type = 'character varying'
    ) THEN
        -- 先删除默认值
        ALTER TABLE users ALTER COLUMN status DROP DEFAULT;

        -- 转换类型
        ALTER TABLE users ALTER COLUMN status TYPE user_status USING status::text::user_status;

        -- 重新设置默认值
        ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active'::user_status;
    END IF;
END $$;

-- =============================================================================
-- 步骤 7: 转换 Videos 表的 status 为 ENUM
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'videos' AND column_name = 'status' AND data_type = 'character varying'
    ) THEN
        ALTER TABLE videos ALTER COLUMN status DROP DEFAULT;
        ALTER TABLE videos ALTER COLUMN status TYPE video_status USING status::text::video_status;
        ALTER TABLE videos ALTER COLUMN status SET DEFAULT 'pending'::video_status;
    END IF;
END $$;

-- =============================================================================
-- 步骤 8: 转换 Credit Transactions 表的 type 为 ENUM
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'credit_transactions' AND column_name = 'type' AND data_type = 'character varying'
    ) THEN
        ALTER TABLE credit_transactions ALTER COLUMN type TYPE transaction_type USING
            CASE type
                WHEN 'gift' THEN 'signup_bonus'::transaction_type
                WHEN 'recharge' THEN 'purchase'::transaction_type
                WHEN 'consume' THEN 'video_generation'::transaction_type
                WHEN 'refund' THEN 'refund'::transaction_type
                ELSE 'admin_grant'::transaction_type
            END;
    END IF;
END $$;

-- =============================================================================
-- 步骤 9: 转换 Orders 表的 payment_method 和 status 为 ENUM
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'payment_method' AND data_type = 'character varying'
    ) THEN
        ALTER TABLE orders ALTER COLUMN payment_method TYPE payment_method USING payment_method::text::payment_method;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'status' AND data_type = 'character varying'
    ) THEN
        ALTER TABLE orders ALTER COLUMN status DROP DEFAULT;
        ALTER TABLE orders ALTER COLUMN status TYPE order_status USING status::text::order_status;
        ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending'::order_status;
    END IF;
END $$;

-- =============================================================================
-- 步骤 10: 创建基本索引（安全的，不会报错）
-- =============================================================================

-- Users 表索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status) WHERE deleted_at IS NULL;

-- Videos 表索引
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status) WHERE deleted_at IS NULL;

-- Credit Transactions 表索引
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);

-- Orders 表索引
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- =============================================================================
-- 步骤 11: 更新统计数据
-- =============================================================================

-- 更新用户视频数量
UPDATE users u
SET video_count = (
    SELECT COUNT(*)
    FROM videos v
    WHERE v.user_id = u.id AND v.deleted_at IS NULL
);

-- 更新用户总消费积分
UPDATE users u
SET total_spent_credits = (
    SELECT COALESCE(SUM(ABS(amount)), 0)
    FROM credit_transactions ct
    WHERE ct.user_id = u.id AND ct.amount < 0
);

-- 更新视频的 started_at
UPDATE videos
SET started_at = created_at
WHERE status IN ('processing', 'completed', 'failed') AND started_at IS NULL;

-- 更新视频的 failed_at
UPDATE videos
SET failed_at = updated_at
WHERE status = 'failed' AND failed_at IS NULL;

COMMIT;

-- =============================================================================
-- 完成！验证新字段
-- =============================================================================

SELECT
    'users' AS table_name,
    COUNT(*) FILTER (WHERE email_verified IS NOT NULL) AS has_email_verified,
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) AS has_deleted_at,
    COUNT(*) FILTER (WHERE video_count IS NOT NULL) AS has_video_count,
    COUNT(*) AS total_rows
FROM users

UNION ALL

SELECT
    'videos' AS table_name,
    COUNT(*) FILTER (WHERE metadata IS NOT NULL) AS has_metadata,
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) AS has_deleted_at,
    COUNT(*) FILTER (WHERE error_code IS NOT NULL) AS has_error_code,
    COUNT(*) AS total_rows
FROM videos

UNION ALL

SELECT
    'credit_transactions' AS table_name,
    COUNT(*) FILTER (WHERE balance_before IS NOT NULL) AS has_balance_before,
    COUNT(*) FILTER (WHERE related_type IS NOT NULL) AS has_related_type,
    COUNT(*) FILTER (WHERE notes IS NOT NULL) AS has_notes,
    COUNT(*) AS total_rows
FROM credit_transactions;

-- 显示新的列类型
SELECT
    table_name,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name IN ('users', 'videos', 'credit_transactions', 'orders')
AND column_name IN ('role', 'status', 'type', 'payment_method', 'deleted_at', 'metadata')
ORDER BY table_name, column_name;
