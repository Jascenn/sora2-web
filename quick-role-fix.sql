-- 快速修复 role 字段类型转换
-- 如果 role 字段还没有完全转换为 ENUM，执行此脚本

BEGIN;

-- 检查并修复 users.role 字段
DO $$
BEGIN
    -- 删除旧的默认值
    ALTER TABLE users ALTER COLUMN role DROP DEFAULT;

    -- 强制转换为 ENUM 类型
    ALTER TABLE users
    ALTER COLUMN role TYPE user_role
    USING CASE
        WHEN role::text = 'admin' THEN 'admin'::user_role
        WHEN role::text = 'moderator' THEN 'moderator'::user_role
        ELSE 'user'::user_role
    END;

    -- 重新设置默认值
    ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user'::user_role;

    RAISE NOTICE 'Role field converted successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Role field already converted or error: %', SQLERRM;
END $$;

-- 验证 role 字段类型
SELECT
    column_name,
    data_type,
    udt_name,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name = 'role';

COMMIT;
