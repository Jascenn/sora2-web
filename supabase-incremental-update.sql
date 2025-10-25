-- =============================================================================
-- Supabase 增量更新脚本
-- =============================================================================
-- 在现有数据库上添加新字段和优化，不影响现有数据
-- =============================================================================

BEGIN;

-- =============================================================================
-- 步骤 1: 创建 ENUM 类型（如果不存在）
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

-- 添加邮箱验证状态
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- 添加手机验证状态
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- 添加个人简介
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- 添加视频数量统计
ALTER TABLE users ADD COLUMN IF NOT EXISTS video_count INTEGER NOT NULL DEFAULT 0;

-- 添加总消费积分
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_spent_credits INTEGER NOT NULL DEFAULT 0;

-- 添加最后登录时间
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- 添加软删除字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 转换 role 字段为 ENUM（如果还是 VARCHAR）
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role' AND data_type = 'character varying'
    ) THEN
        ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::text::user_role;
    END IF;
END $$;

-- 转换 status 字段为 ENUM
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'status' AND data_type = 'character varying'
    ) THEN
        ALTER TABLE users ALTER COLUMN status TYPE user_status USING status::text::user_status;
    END IF;
END $$;

-- 转换时间字段为 TIMESTAMPTZ
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'created_at' AND data_type = 'timestamp without time zone'
    ) THEN
        ALTER TABLE users ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'updated_at' AND data_type = 'timestamp without time zone'
    ) THEN
        ALTER TABLE users ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
    END IF;
END $$;

-- =============================================================================
-- 步骤 3: Videos 表 - 添加新字段
-- =============================================================================

-- 添加错误代码
ALTER TABLE videos ADD COLUMN IF NOT EXISTS error_code VARCHAR(50);

-- 添加元数据
ALTER TABLE videos ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 添加开始处理时间
ALTER TABLE videos ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- 添加失败时间
ALTER TABLE videos ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ;

-- 添加软删除字段
ALTER TABLE videos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 转换 status 字段为 ENUM
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'videos' AND column_name = 'status' AND data_type = 'character varying'
    ) THEN
        ALTER TABLE videos ALTER COLUMN status TYPE video_status USING status::text::video_status;
    END IF;
END $$;

-- 转换时间字段为 TIMESTAMPTZ
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'videos' AND column_name = 'created_at' AND data_type = 'timestamp without time zone'
    ) THEN
        ALTER TABLE videos ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'videos' AND column_name = 'updated_at' AND data_type = 'timestamp without time zone'
    ) THEN
        ALTER TABLE videos ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'videos' AND column_name = 'completed_at' AND data_type = 'timestamp without time zone'
    ) THEN
        ALTER TABLE videos ALTER COLUMN completed_at TYPE TIMESTAMPTZ USING completed_at AT TIME ZONE 'UTC';
    END IF;
END $$;

-- =============================================================================
-- 步骤 4: Credit Transactions 表 - 添加新字段
-- =============================================================================

-- 添加交易前余额（如果不存在，计算值）
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS balance_before INTEGER NOT NULL DEFAULT 0;

-- 更新 balance_before 为计算值（如果是新添加的列）
UPDATE credit_transactions
SET balance_before = balance_after - amount
WHERE balance_before = 0;

-- 添加关联类型
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS related_type VARCHAR(20);

-- 添加备注
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS notes TEXT;

-- 转换 type 字段为 ENUM
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
-- 步骤 5: Orders 表 - 添加新字段
-- =============================================================================

-- 添加支付流水号
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_transaction_id VARCHAR(255);

-- 添加支付详情
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}';

-- 添加优惠金额
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- 添加优惠码
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code VARCHAR(50);

-- 添加退款时间
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- 添加取消时间
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- 添加更新时间
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- 转换 payment_method 为 ENUM
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'payment_method' AND data_type = 'character varying'
    ) THEN
        ALTER TABLE orders ALTER COLUMN payment_method TYPE payment_method USING payment_method::text::payment_method;
    END IF;
END $$;

-- 转换 status 为 ENUM
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'status' AND data_type = 'character varying'
    ) THEN
        ALTER TABLE orders ALTER COLUMN status TYPE order_status USING status::text::order_status;
    END IF;
END $$;

-- =============================================================================
-- 步骤 6: Templates 表 - 添加新字段（如果表存在）
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'templates') THEN
        -- 添加预览视频URL
        ALTER TABLE templates ADD COLUMN IF NOT EXISTS preview_video_url VARCHAR(500);

        -- 添加精选标记
        ALTER TABLE templates ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

        -- 添加分类
        ALTER TABLE templates ADD COLUMN IF NOT EXISTS category VARCHAR(50);

        -- 添加标签数组
        ALTER TABLE templates ADD COLUMN IF NOT EXISTS tags TEXT[];

        -- 添加软删除字段
        ALTER TABLE templates ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

        -- 添加更新时间
        ALTER TABLE templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- =============================================================================
-- 步骤 7: 添加 CHECK 约束
-- =============================================================================

-- Users 表约束
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_credits_check;
ALTER TABLE users ADD CONSTRAINT users_credits_check CHECK (credits >= 0);

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_video_count_check;
ALTER TABLE users ADD CONSTRAINT users_video_count_check CHECK (video_count >= 0);

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_total_spent_credits_check;
ALTER TABLE users ADD CONSTRAINT users_total_spent_credits_check CHECK (total_spent_credits >= 0);

-- Videos 表约束
ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_prompt_length_check;
ALTER TABLE videos ADD CONSTRAINT videos_prompt_length_check
    CHECK (length(prompt) >= 10 AND length(prompt) <= 2000);

ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_cost_credits_check;
ALTER TABLE videos ADD CONSTRAINT videos_cost_credits_check CHECK (cost_credits > 0);

-- Orders 表约束
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_amount_check;
ALTER TABLE orders ADD CONSTRAINT orders_amount_check CHECK (amount > 0);

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_credits_check;
ALTER TABLE orders ADD CONSTRAINT orders_credits_check CHECK (credits > 0);

-- =============================================================================
-- 步骤 8: 创建优化的索引
-- =============================================================================

-- Users 表索引
DROP INDEX IF EXISTS idx_users_email;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS idx_users_phone;
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL AND deleted_at IS NULL;

DROP INDEX IF EXISTS idx_users_role_status;
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status) WHERE deleted_at IS NULL;

-- Videos 表索引
DROP INDEX IF EXISTS idx_videos_user_status_created;
CREATE INDEX IF NOT EXISTS idx_videos_user_status_created
    ON videos(user_id, status, created_at DESC) WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS idx_videos_processing;
CREATE INDEX IF NOT EXISTS idx_videos_processing
    ON videos(id, created_at) WHERE status IN ('pending', 'processing') AND deleted_at IS NULL;

DROP INDEX IF EXISTS idx_videos_metadata_gin;
CREATE INDEX IF NOT EXISTS idx_videos_metadata_gin ON videos USING GIN (metadata);

-- Credit Transactions 表索引
DROP INDEX IF EXISTS idx_credit_transactions_user_created;
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created
    ON credit_transactions(user_id, created_at DESC);

DROP INDEX IF EXISTS idx_credit_transactions_type;
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);

-- Orders 表索引
DROP INDEX IF EXISTS idx_orders_user_status;
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);

DROP INDEX IF EXISTS idx_orders_pending;
CREATE INDEX IF NOT EXISTS idx_orders_pending
    ON orders(id, created_at) WHERE status = 'pending';

DROP INDEX IF EXISTS idx_orders_payment_details_gin;
CREATE INDEX IF NOT EXISTS idx_orders_payment_details_gin ON orders USING GIN (payment_details);

-- =============================================================================
-- 步骤 9: 更新现有数据的统计信息
-- =============================================================================

-- 更新用户视频数量
UPDATE users u
SET video_count = (
    SELECT COUNT(*)
    FROM videos v
    WHERE v.user_id = u.id AND (v.deleted_at IS NULL OR v.deleted_at IS NULL)
);

-- 更新用户总消费积分
UPDATE users u
SET total_spent_credits = (
    SELECT COALESCE(SUM(ABS(amount)), 0)
    FROM credit_transactions ct
    WHERE ct.user_id = u.id AND ct.amount < 0
);

-- 更新视频的 started_at（如果状态不是 pending）
UPDATE videos
SET started_at = created_at
WHERE status IN ('processing', 'completed', 'failed') AND started_at IS NULL;

-- 更新视频的 failed_at（如果状态是 failed）
UPDATE videos
SET failed_at = updated_at
WHERE status = 'failed' AND failed_at IS NULL;

-- =============================================================================
-- 步骤 10: 创建或更新触发器函数
-- =============================================================================

-- 更新 updated_at 触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 用户视频统计触发器函数
CREATE OR REPLACE FUNCTION update_user_video_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users
        SET video_count = video_count + 1
        WHERE id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users
        SET video_count = GREATEST(0, video_count - 1)
        WHERE id = OLD.user_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_videos_updated_at ON videos;
CREATE TRIGGER trigger_videos_updated_at
    BEFORE UPDATE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_orders_updated_at ON orders;
CREATE TRIGGER trigger_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_user_video_stats_insert ON videos;
CREATE TRIGGER trigger_update_user_video_stats_insert
    AFTER INSERT ON videos
    FOR EACH ROW
    EXECUTE FUNCTION update_user_video_stats();

DROP TRIGGER IF EXISTS trigger_update_user_video_stats_delete ON videos;
CREATE TRIGGER trigger_update_user_video_stats_delete
    AFTER DELETE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION update_user_video_stats();

COMMIT;

-- =============================================================================
-- 完成！
-- =============================================================================
--
-- ✅ 增量更新完成！
--
-- 已添加的新字段：
-- - Users: email_verified, phone_verified, bio, video_count, total_spent_credits, last_login_at, deleted_at
-- - Videos: error_code, metadata, started_at, failed_at, deleted_at
-- - Credit Transactions: balance_before, related_type, notes
-- - Orders: payment_transaction_id, payment_details, discount_amount, discount_code, refunded_at, cancelled_at, updated_at
--
-- 已优化：
-- - 所有 VARCHAR 状态字段已转换为 ENUM 类型
-- - 所有 TIMESTAMP 字段已转换为 TIMESTAMPTZ
-- - 添加了 CHECK 约束确保数据有效性
-- - 创建了优化的索引（部分索引、GIN 索引、复合索引）
-- - 添加了触发器自动更新统计信息
--
-- 现有数据已保留，可以继续使用！
-- =============================================================================
