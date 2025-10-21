-- Create system_config table
CREATE TABLE IF NOT EXISTS system_config (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  value_type VARCHAR(20) DEFAULT 'string',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);
CREATE INDEX IF NOT EXISTS idx_system_config_category ON system_config(category);

-- Insert default configuration
INSERT INTO system_config (key, value, description, category, value_type) VALUES
  ('openai_api_key', 'sk-MSrKrtbNem9oji876wVy799LuM7DiCmNkzSHbtlBqE8zyk4u', 'OpenAI API Key', 'api', 'string'),
  ('openai_api_base', 'https://api.sora2.com', 'OpenAI API Base URL', 'api', 'string'),
  ('default_model', 'sora-2', 'Default Sora Model', 'model', 'string'),
  ('model_sora2_credits', '3', 'Sora 2 标准版积分消耗 (积分/10秒)', 'pricing', 'number'),
  ('model_sora2_hd_credits', '4', 'Sora 2 HD 积分消耗 (积分/10秒)', 'pricing', 'number'),
  ('model_sora2_pro_credits', '5', 'Sora 2 Pro 积分消耗 (积分/10秒)', 'pricing', 'number'),
  ('max_video_duration', '20', '最大视频时长 (秒)', 'limits', 'number'),
  ('max_prompt_length', '500', '最大提示词长度', 'limits', 'number'),
  ('queue_concurrency', '3', '队列并发数', 'queue', 'number'),
  ('queue_max_retries', '2', '队列最大重试次数', 'queue', 'number')
ON CONFLICT (key) DO NOTHING;

-- Add comment
COMMENT ON TABLE system_config IS 'System configuration key-value store';
