-- 增加视频URL和缩略图URL字段的长度限制
-- 从 VARCHAR(500) 增加到 VARCHAR(1000)

ALTER TABLE videos
ALTER COLUMN file_url TYPE VARCHAR(1000);

ALTER TABLE videos
ALTER COLUMN thumbnail_url TYPE VARCHAR(1000);

-- 查看修改结果
\d videos;
