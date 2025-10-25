-- =============================================================================
-- Supabase 测试数据 - 包含用户和视频记录
-- =============================================================================
-- 在执行完 supabase-setup.sql 后执行此文件
-- =============================================================================

-- =============================================================================
-- 1. 创建测试用户
-- =============================================================================

-- 管理员用户: admin@sora2.com / admin123
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
    '$2a$10$rKz5YJQxJX0XRJQxJX0XROqKz5YJQxJX0XRJQxJX0XROqKz5YJQxJ',
    'Administrator',
    999999,
    'admin',
    'active',
    NOW() - INTERVAL '30 days'
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    credits = EXCLUDED.credits,
    role = EXCLUDED.role;

-- 测试用户 1: test@sora2.com / test123456 (有视频生成记录)
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
    'test@sora2.com',
    '$2a$10$YhFZ8Z8Z8Z8Z8Z8Z8Z8Z8uKz5YJQxJX0XRJQxJX0XROqKz5YJQxJ',
    '测试用户',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
    850,
    'user',
    'active',
    NOW() - INTERVAL '15 days'
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    credits = EXCLUDED.credits;

-- 测试用户 2: demo@sora2.com / demo123456 (活跃用户)
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
    '22222222-2222-2222-2222-222222222222',
    'demo@sora2.com',
    '$2a$10$DemoZ8Z8Z8Z8Z8Z8Z8Z8ZuKz5YJQxJX0XRJQxJX0XROqKz5YJQxJ',
    '演示账号',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
    1250,
    'user',
    'active',
    NOW() - INTERVAL '7 days'
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    credits = EXCLUDED.credits;

-- 测试用户 3: user@sora2.com / user123456 (新用户)
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
    '33333333-3333-3333-3333-333333333333',
    'user@sora2.com',
    '$2a$10$UserZ8Z8Z8Z8Z8Z8Z8Z8ZuKz5YJQxJX0XRJQxJX0XROqKz5YJQxJ',
    '普通用户',
    100,
    'user',
    'active',
    NOW() - INTERVAL '2 days'
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash;

-- =============================================================================
-- 2. 创建视频生成记录（test@sora2.com 的历史记录）
-- =============================================================================

-- 视频 1: 已完成 - 城市夜景
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
    'video-0001-0001-0001-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'A stunning aerial view of a futuristic city at night, with neon lights reflecting off glass skyscrapers, flying cars in the distance',
    'blur, low quality, distorted',
    5,
    '1280x720',
    '16:9',
    'cinematic',
    24,
    'completed',
    'https://ycrrmxfmpqptzjuseczs.supabase.co/storage/v1/object/public/videos/test-user/city-night-001.mp4',
    'https://ycrrmxfmpqptzjuseczs.supabase.co/storage/v1/object/public/thumbnails/test-user/city-night-001.jpg',
    15728640,
    50,
    'task_abc123def456',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days' + INTERVAL '3 minutes',
    NOW() - INTERVAL '10 days' + INTERVAL '3 minutes'
);

-- 视频 2: 已完成 - 海浪
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
    'video-0002-0002-0002-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'Ocean waves crashing on a pristine beach at sunset, slow motion, golden hour lighting',
    3,
    '1280x720',
    '16:9',
    'natural',
    30,
    'completed',
    'https://ycrrmxfmpqptzjuseczs.supabase.co/storage/v1/object/public/videos/test-user/ocean-waves-002.mp4',
    'https://ycrrmxfmpqptzjuseczs.supabase.co/storage/v1/object/public/thumbnails/test-user/ocean-waves-002.jpg',
    9437184,
    30,
    'task_xyz789ghi012',
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '8 days' + INTERVAL '2 minutes',
    NOW() - INTERVAL '8 days' + INTERVAL '2 minutes'
);

-- 视频 3: 处理中
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
    'video-0003-0003-0003-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'A magical forest with glowing fireflies, mystical atmosphere, fantasy style',
    5,
    '1280x720',
    '16:9',
    'fantasy',
    24,
    'processing',
    50,
    'task_processing123',
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '30 minutes'
);

-- 视频 4: 失败
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
    'video-0004-0004-0004-000000000004',
    '11111111-1111-1111-1111-111111111111',
    'Invalid prompt test',
    5,
    '1280x720',
    '16:9',
    24,
    'failed',
    0,
    'task_failed456',
    'Content policy violation: prompt contains prohibited content',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days' + INTERVAL '10 seconds'
);

-- demo@sora2.com 的视频记录
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
    created_at,
    completed_at,
    updated_at
) VALUES (
    'video-0005-0005-0005-000000000005',
    '22222222-2222-2222-2222-222222222222',
    'A robot walking through a neon-lit cyberpunk street, rain falling, cinematic',
    5,
    '1920x1080',
    '16:9',
    'cyberpunk',
    30,
    'completed',
    'https://ycrrmxfmpqptzjuseczs.supabase.co/storage/v1/object/public/videos/demo-user/robot-street-001.mp4',
    'https://ycrrmxfmpqptzjuseczs.supabase.co/storage/v1/object/public/thumbnails/demo-user/robot-street-001.jpg',
    20971520,
    50,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days' + INTERVAL '4 minutes',
    NOW() - INTERVAL '3 days' + INTERVAL '4 minutes'
);

-- =============================================================================
-- 3. 创建积分交易记录
-- =============================================================================

-- test@sora2.com 的积分记录

-- 注册赠送
INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    created_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'signup_bonus',
    100,
    100,
    '注册赠送积分',
    NOW() - INTERVAL '15 days'
);

-- 购买积分
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
    'purchase',
    1000,
    1100,
    'order-0001-0001-0001-000000000001',
    '购买积分套餐',
    NOW() - INTERVAL '12 days'
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
    'video_generation',
    -50,
    1050,
    'video-0001-0001-0001-000000000001',
    '生成视频: 城市夜景',
    NOW() - INTERVAL '10 days'
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
    'video_generation',
    -30,
    1020,
    'video-0002-0002-0002-000000000002',
    '生成视频: 海浪',
    NOW() - INTERVAL '8 days'
);

-- 消费 - 视频 3（处理中）
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
    'video_generation',
    -50,
    970,
    'video-0003-0003-0003-000000000003',
    '生成视频: 魔法森林',
    NOW() - INTERVAL '1 hour'
);

-- 退款 - 视频 4 失败
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
    50,
    1020,
    'video-0004-0004-0004-000000000004',
    '视频生成失败退款',
    NOW() - INTERVAL '5 days'
);

-- 购买积分 2
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
    'purchase',
    500,
    1520,
    'order-0002-0002-0002-000000000002',
    '购买积分套餐',
    NOW() - INTERVAL '3 days'
);

-- 系统赠送
INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    created_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'admin_grant',
    330,
    850,
    '管理员补偿积分',
    NOW() - INTERVAL '1 day'
);

-- demo@sora2.com 的积分记录
INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    created_at
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    'signup_bonus',
    100,
    100,
    '注册赠送积分',
    NOW() - INTERVAL '7 days'
);

INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    related_id,
    description,
    created_at
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    'purchase',
    1200,
    1300,
    'order-0003-0003-0003-000000000003',
    '购买积分套餐',
    NOW() - INTERVAL '5 days'
);

INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    related_id,
    description,
    created_at
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    'video_generation',
    -50,
    1250,
    'video-0005-0005-0005-000000000005',
    '生成视频: 机器人街景',
    NOW() - INTERVAL '3 days'
);

-- user@sora2.com 的积分记录（新用户，只有注册赠送）
INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    created_at
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    'signup_bonus',
    100,
    100,
    '注册赠送积分',
    NOW() - INTERVAL '2 days'
);

-- =============================================================================
-- 4. 创建订单记录
-- =============================================================================

-- test@sora2.com 的订单
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
    'order-0001-0001-0001-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'ORD20250101120001',
    10.00,
    1000,
    'alipay',
    'paid',
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '12 days'
);

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
    'order-0002-0002-0002-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'ORD20250108150023',
    5.00,
    500,
    'wechat',
    'paid',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
);

-- demo@sora2.com 的订单
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
    'order-0003-0003-0003-000000000003',
    '22222222-2222-2222-2222-222222222222',
    'ORD20250106090045',
    12.00,
    1200,
    'alipay',
    'paid',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
);

-- 待支付订单
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
    'order-0004-0004-0004-000000000004',
    '33333333-3333-3333-3333-333333333333',
    'ORD20250110180067',
    10.00,
    1000,
    'alipay',
    'pending',
    NOW() - INTERVAL '1 hour'
);

-- =============================================================================
-- 5. 创建公共模板（供所有用户使用）
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
) VALUES (
    'template-0001-0001-0001-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '赛博朋克城市',
    '霓虹灯闪烁的未来都市，机器人和飞车穿梭其中',
    'A futuristic cyberpunk city with neon lights, flying cars, and robots walking on streets, cinematic lighting, rainy night',
    '{"duration": 5, "resolution": "1280x720", "aspect_ratio": "16:9", "style": "cyberpunk", "fps": 24}',
    'https://api.dicebear.com/7.x/shapes/svg?seed=cyberpunk',
    true,
    156,
    NOW() - INTERVAL '20 days'
);

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
) VALUES (
    'template-0002-0002-0002-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '自然风光',
    '壮丽的自然景观，日出日落，群山湖泊',
    'Breathtaking natural landscape, mountains reflected in crystal clear lake, golden hour, cinematic, 4K quality',
    '{"duration": 5, "resolution": "1920x1080", "aspect_ratio": "16:9", "style": "natural", "fps": 30}',
    'https://api.dicebear.com/7.x/shapes/svg?seed=nature',
    true,
    243,
    NOW() - INTERVAL '18 days'
);

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
) VALUES (
    'template-0003-0003-0003-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '太空探索',
    '宇宙星空，星云，行星探索',
    'Deep space exploration, nebula clouds, distant galaxies, spaceship flying through asteroid field, epic sci-fi',
    '{"duration": 5, "resolution": "1920x1080", "aspect_ratio": "16:9", "style": "sci-fi", "fps": 24}',
    'https://api.dicebear.com/7.x/shapes/svg?seed=space',
    true,
    89,
    NOW() - INTERVAL '15 days'
);

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
) VALUES (
    'template-0004-0004-0004-000000000004',
    '11111111-1111-1111-1111-111111111111',
    '魔法森林',
    '神秘的魔法森林，发光的萤火虫和魔法生物',
    'Magical forest with glowing fireflies, mystical creatures, ethereal lighting, fantasy atmosphere',
    '{"duration": 5, "resolution": "1280x720", "aspect_ratio": "16:9", "style": "fantasy", "fps": 24}',
    'https://api.dicebear.com/7.x/shapes/svg?seed=magic',
    true,
    67,
    NOW() - INTERVAL '10 days'
);

-- =============================================================================
-- 完成！测试数据创建完毕
-- =============================================================================
--
-- 创建了:
-- ✅ 4 个测试用户 (1 管理员 + 3 普通用户)
-- ✅ 5 个视频记录 (包含已完成、处理中、失败状态)
-- ✅ 11 条积分交易记录
-- ✅ 4 个订单记录 (包含已支付和待支付)
-- ✅ 4 个公共模板
--
-- 测试账号:
-- 1. admin@sora2.com / admin123 (管理员)
-- 2. test@sora2.com / test123456 (有生成记录的用户)
-- 3. demo@sora2.com / demo123456 (演示账号)
-- 4. user@sora2.com / user123456 (新用户)
-- =============================================================================
