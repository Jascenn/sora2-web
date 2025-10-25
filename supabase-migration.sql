-- =============================================================================
-- Supabase 数据库迁移脚本
-- =============================================================================
-- 将现有数据从旧 schema 迁移到优化后的 schema
-- =============================================================================

BEGIN;

-- =============================================================================
-- 步骤 1: 备份现有表（重命名为 _old）
-- =============================================================================

ALTER TABLE IF EXISTS users RENAME TO users_old;
ALTER TABLE IF EXISTS videos RENAME TO videos_old;
ALTER TABLE IF EXISTS credit_transactions RENAME TO credit_transactions_old;
ALTER TABLE IF EXISTS orders RENAME TO orders_old;
ALTER TABLE IF EXISTS templates RENAME TO templates_old;
ALTER TABLE IF EXISTS system_config RENAME TO system_config_old;
ALTER TABLE IF EXISTS refresh_tokens RENAME TO refresh_tokens_old;
ALTER TABLE IF EXISTS token_blacklist RENAME TO token_blacklist_old;
ALTER TABLE IF NOT EXISTS video_jobs_outbox RENAME TO video_jobs_outbox_old;

-- =============================================================================
-- 步骤 2: 执行优化后的 schema（已在 supabase-schema-optimized.sql 中）
-- =============================================================================
-- 请先手动执行 supabase-schema-optimized.sql 创建新表结构
-- 然后再执行本迁移脚本的剩余部分

-- =============================================================================
-- 步骤 3: 迁移用户数据
-- =============================================================================

INSERT INTO users (
    id,
    email,
    email_verified,
    phone,
    phone_verified,
    password_hash,
    nickname,
    avatar_url,
    bio,
    credits,
    role,
    status,
    video_count,
    total_spent_credits,
    last_login_at,
    created_at,
    updated_at,
    deleted_at
)
SELECT
    id,
    email,
    false AS email_verified,  -- 新字段，默认未验证
    phone,
    false AS phone_verified,   -- 新字段，默认未验证
    password_hash,
    nickname,
    avatar_url,
    NULL AS bio,               -- 新字段
    credits,
    CASE
        WHEN role = 'admin' THEN 'admin'::user_role
        WHEN role = 'moderator' THEN 'moderator'::user_role
        ELSE 'user'::user_role
    END AS role,
    CASE
        WHEN status = 'active' THEN 'active'::user_status
        WHEN status = 'banned' THEN 'banned'::user_status
        ELSE 'inactive'::user_status
    END AS status,
    0 AS video_count,          -- 将通过触发器自动计算
    0 AS total_spent_credits,  -- 将通过交易记录计算
    NULL AS last_login_at,     -- 新字段
    created_at,
    updated_at,
    NULL AS deleted_at         -- 新字段（软删除）
FROM users_old;

-- =============================================================================
-- 步骤 4: 迁移视频数据
-- =============================================================================

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
    error_message,
    error_code,
    metadata,
    started_at,
    completed_at,
    failed_at,
    created_at,
    updated_at,
    deleted_at
)
SELECT
    id,
    user_id,
    prompt,
    negative_prompt,
    duration,
    resolution,
    aspect_ratio,
    style,
    fps,
    CASE
        WHEN status = 'pending' THEN 'pending'::video_status
        WHEN status = 'processing' THEN 'processing'::video_status
        WHEN status = 'completed' THEN 'completed'::video_status
        WHEN status = 'failed' THEN 'failed'::video_status
        ELSE 'cancelled'::video_status
    END AS status,
    file_url,
    thumbnail_url,
    file_size,
    cost_credits,
    openai_task_id,
    error_message,
    NULL AS error_code,        -- 新字段
    '{}'::jsonb AS metadata,   -- 新字段
    CASE
        WHEN status IN ('processing', 'completed', 'failed') THEN created_at
        ELSE NULL
    END AS started_at,
    completed_at,
    CASE
        WHEN status = 'failed' THEN updated_at
        ELSE NULL
    END AS failed_at,
    created_at,
    updated_at,
    NULL AS deleted_at         -- 新字段（软删除）
FROM videos_old;

-- =============================================================================
-- 步骤 5: 迁移积分交易记录
-- =============================================================================

INSERT INTO credit_transactions (
    id,
    user_id,
    type,
    amount,
    balance_before,
    balance_after,
    related_id,
    related_type,
    description,
    notes,
    created_at
)
SELECT
    id,
    user_id,
    CASE
        WHEN type = 'gift' THEN 'signup_bonus'::transaction_type
        WHEN type = 'recharge' THEN 'purchase'::transaction_type
        WHEN type = 'consume' THEN 'video_generation'::transaction_type
        WHEN type = 'refund' THEN 'refund'::transaction_type
        ELSE 'admin_grant'::transaction_type
    END AS type,
    amount,
    balance_after - amount AS balance_before,  -- 计算之前的余额
    balance_after,
    related_id,
    CASE
        WHEN related_id IS NOT NULL THEN
            CASE
                WHEN type IN ('consume', 'refund') THEN 'video'
                WHEN type = 'recharge' THEN 'order'
                ELSE NULL
            END
        ELSE NULL
    END AS related_type,
    description,
    NULL AS notes,             -- 新字段
    created_at
FROM credit_transactions_old;

-- =============================================================================
-- 步骤 6: 迁移订单数据
-- =============================================================================

INSERT INTO orders (
    id,
    user_id,
    order_no,
    amount,
    credits,
    payment_method,
    payment_transaction_id,
    payment_details,
    status,
    discount_amount,
    discount_code,
    paid_at,
    refunded_at,
    cancelled_at,
    created_at,
    updated_at
)
SELECT
    id,
    user_id,
    order_no,
    amount,
    credits,
    CASE
        WHEN payment_method = 'alipay' THEN 'alipay'::payment_method
        WHEN payment_method = 'wechat' THEN 'wechat'::payment_method
        WHEN payment_method = 'stripe' THEN 'stripe'::payment_method
        WHEN payment_method = 'paypal' THEN 'paypal'::payment_method
        ELSE 'balance'::payment_method
    END AS payment_method,
    NULL AS payment_transaction_id,  -- 新字段
    '{}'::jsonb AS payment_details,   -- 新字段
    CASE
        WHEN status = 'pending' THEN 'pending'::order_status
        WHEN status = 'paid' THEN 'paid'::order_status
        WHEN status = 'failed' THEN 'failed'::order_status
        WHEN status = 'refunded' THEN 'refunded'::order_status
        ELSE 'cancelled'::order_status
    END AS status,
    0 AS discount_amount,             -- 新字段
    NULL AS discount_code,            -- 新字段
    paid_at,
    NULL AS refunded_at,              -- 新字段
    NULL AS cancelled_at,             -- 新字段
    created_at,
    created_at AS updated_at
FROM orders_old;

-- =============================================================================
-- 步骤 7: 迁移模板数据
-- =============================================================================

INSERT INTO templates (
    id,
    user_id,
    name,
    description,
    prompt,
    config,
    thumbnail_url,
    preview_video_url,
    is_public,
    is_featured,
    usage_count,
    category,
    tags,
    created_at,
    updated_at,
    deleted_at
)
SELECT
    id,
    user_id,
    name,
    description,
    prompt,
    config,
    thumbnail_url,
    NULL AS preview_video_url,  -- 新字段
    is_public,
    false AS is_featured,       -- 新字段
    usage_count,
    NULL AS category,           -- 新字段
    ARRAY[]::text[] AS tags,    -- 新字段
    created_at,
    created_at AS updated_at,
    NULL AS deleted_at          -- 新字段（软删除）
FROM templates_old;

-- =============================================================================
-- 步骤 8: 迁移系统配置
-- =============================================================================

INSERT INTO system_config (
    id,
    key,
    value,
    description,
    type,
    is_public,
    created_at,
    updated_at
)
SELECT
    id,
    key,
    value,
    description,
    type,
    true AS is_public,          -- 新字段，默认公开
    CURRENT_TIMESTAMP AS created_at,
    updated_at
FROM system_config_old;

-- =============================================================================
-- 步骤 9: 迁移刷新令牌
-- =============================================================================

INSERT INTO refresh_tokens (
    id,
    user_id,
    token,
    device_info,
    expires_at,
    last_used_at,
    ip_address,
    created_at
)
SELECT
    id,
    user_id,
    token,
    '{}'::jsonb AS device_info,  -- 新字段
    expires_at,
    last_used_at,
    NULL AS ip_address,          -- 新字段
    created_at
FROM refresh_tokens_old;

-- =============================================================================
-- 步骤 10: 迁移令牌黑名单
-- =============================================================================

INSERT INTO token_blacklist (
    id,
    token,
    expires_at,
    reason,
    created_at
)
SELECT
    id,
    token,
    expires_at,
    NULL AS reason,              -- 新字段
    created_at
FROM token_blacklist_old;

-- =============================================================================
-- 步骤 11: 迁移视频任务队列
-- =============================================================================

INSERT INTO video_jobs_outbox (
    id,
    video_id,
    event_type,
    payload,
    status,
    retry_count,
    max_retries,
    next_retry_at,
    error_message,
    processed_at,
    created_at,
    updated_at
)
SELECT
    id,
    video_id,
    event_type,
    payload,
    status,
    retry_count,
    max_retries,
    next_retry_at,
    error_message,
    processed_at,
    created_at,
    created_at AS updated_at
FROM video_jobs_outbox_old
WHERE EXISTS (SELECT 1 FROM video_jobs_outbox_old);

-- =============================================================================
-- 步骤 12: 更新用户统计信息
-- =============================================================================

-- 更新视频数量
UPDATE users u
SET video_count = (
    SELECT COUNT(*)
    FROM videos v
    WHERE v.user_id = u.id AND v.deleted_at IS NULL
);

-- 更新总消费积分
UPDATE users u
SET total_spent_credits = (
    SELECT COALESCE(SUM(ABS(amount)), 0)
    FROM credit_transactions ct
    WHERE ct.user_id = u.id AND ct.amount < 0
);

-- =============================================================================
-- 步骤 13: 验证数据迁移
-- =============================================================================

-- 验证记录数是否匹配
DO $$
DECLARE
    old_count INTEGER;
    new_count INTEGER;
BEGIN
    -- 验证用户表
    SELECT COUNT(*) INTO old_count FROM users_old;
    SELECT COUNT(*) INTO new_count FROM users;
    IF old_count != new_count THEN
        RAISE EXCEPTION 'Users table migration failed: old=%, new=%', old_count, new_count;
    END IF;
    RAISE NOTICE 'Users: % records migrated', new_count;

    -- 验证视频表
    SELECT COUNT(*) INTO old_count FROM videos_old;
    SELECT COUNT(*) INTO new_count FROM videos;
    IF old_count != new_count THEN
        RAISE EXCEPTION 'Videos table migration failed: old=%, new=%', old_count, new_count;
    END IF;
    RAISE NOTICE 'Videos: % records migrated', new_count;

    -- 验证交易表
    SELECT COUNT(*) INTO old_count FROM credit_transactions_old;
    SELECT COUNT(*) INTO new_count FROM credit_transactions;
    IF old_count != new_count THEN
        RAISE EXCEPTION 'Credit transactions migration failed: old=%, new=%', old_count, new_count;
    END IF;
    RAISE NOTICE 'Credit Transactions: % records migrated', new_count;

    -- 验证订单表
    SELECT COUNT(*) INTO old_count FROM orders_old;
    SELECT COUNT(*) INTO new_count FROM orders;
    IF old_count != new_count THEN
        RAISE EXCEPTION 'Orders migration failed: old=%, new=%', old_count, new_count;
    END IF;
    RAISE NOTICE 'Orders: % records migrated', new_count;

    -- 验证模板表
    SELECT COUNT(*) INTO old_count FROM templates_old;
    SELECT COUNT(*) INTO new_count FROM templates;
    IF old_count != new_count THEN
        RAISE EXCEPTION 'Templates migration failed: old=%, new=%', old_count, new_count;
    END IF;
    RAISE NOTICE 'Templates: % records migrated', new_count;

    RAISE NOTICE 'All data migrated successfully!';
END $$;

COMMIT;

-- =============================================================================
-- 步骤 14: 清理旧表（可选，建议先备份后再执行）
-- =============================================================================

-- 取消注释以下命令来删除旧表（请先确保数据迁移成功！）
-- DROP TABLE IF EXISTS users_old CASCADE;
-- DROP TABLE IF EXISTS videos_old CASCADE;
-- DROP TABLE IF EXISTS credit_transactions_old CASCADE;
-- DROP TABLE IF EXISTS orders_old CASCADE;
-- DROP TABLE IF EXISTS templates_old CASCADE;
-- DROP TABLE IF EXISTS system_config_old CASCADE;
-- DROP TABLE IF EXISTS refresh_tokens_old CASCADE;
-- DROP TABLE IF EXISTS token_blacklist_old CASCADE;
-- DROP TABLE IF EXISTS video_jobs_outbox_old CASCADE;

-- =============================================================================
-- 完成！
-- =============================================================================
--
-- ✅ 迁移完成！
--
-- 📊 迁移的数据：
-- - Users: 包含所有用户数据 + 新增字段（email_verified, last_login_at 等）
-- - Videos: 包含所有视频 + 新增字段（metadata, error_code 等）
-- - Credit Transactions: 包含所有交易 + 新增字段（balance_before, related_type 等）
-- - Orders: 包含所有订单 + 新增字段（payment_details, discount 等）
-- - Templates: 包含所有模板 + 新增字段（category, tags 等）
--
-- ⚠️ 注意事项：
-- 1. 旧表已重命名为 *_old，建议验证数据后再删除
-- 2. 部分新字段使用默认值，可能需要手动更新
-- 3. 枚举类型已转换，确保应用代码兼容
-- 4. 时间戳已转换为 TIMESTAMPTZ（带时区）
-- =============================================================================
