-- CreateIndex
-- Add composite index on videos table for optimized list queries with user, status, and date filters
-- This index significantly improves performance for queries like:
-- SELECT * FROM videos WHERE user_id = ? AND status = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS "videos_user_id_status_created_at_idx" ON "videos"("user_id", "status", "created_at" DESC);

-- CreateIndex
-- Add composite index on orders table for optimized order list queries
-- This index improves performance for queries like:
-- SELECT * FROM orders WHERE user_id = ? AND status = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS "orders_user_id_status_created_at_idx" ON "orders"("user_id", "status", "created_at" DESC);

-- CreateIndex
-- Add composite index on credit_transactions table for optimized transaction history queries
-- This index improves performance for paginated transaction lists:
-- SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
CREATE INDEX IF NOT EXISTS "credit_transactions_user_id_created_at_idx" ON "credit_transactions"("user_id", "created_at" DESC);

-- Performance Notes:
-- 1. These composite indexes eliminate the need for separate index scans and sorts
-- 2. The DESC order on created_at matches the common query pattern (newest first)
-- 3. Each index supports both filtered and unfiltered queries for the respective user_id
-- 4. Index maintenance overhead is minimal compared to the query performance gains
