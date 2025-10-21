-- Token Blacklist Table
-- Used to invalidate JWT tokens on logout or security events

CREATE TABLE IF NOT EXISTS token_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_jti VARCHAR(255) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(100) DEFAULT 'logout',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by JTI (most common query)
CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti ON token_blacklist(token_jti);

-- Index for cleanup queries (delete expired tokens)
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);

-- Index for user queries (list all invalidated tokens for a user)
CREATE INDEX IF NOT EXISTS idx_token_blacklist_user_id ON token_blacklist(user_id);

-- Add comments
COMMENT ON TABLE token_blacklist IS 'Stores invalidated JWT tokens to prevent reuse after logout or security events';
COMMENT ON COLUMN token_blacklist.token_jti IS 'JWT ID (jti claim) - unique identifier for the token';
COMMENT ON COLUMN token_blacklist.reason IS 'Reason for blacklisting: logout, security_breach, password_change, etc.';
COMMENT ON COLUMN token_blacklist.expires_at IS 'Original token expiration time - used for automatic cleanup';
