-- Advanced Performance Indexes Migration
-- This migration adds additional indexes for optimal query performance

-- ============================================================================
-- USERS TABLE INDEXES
-- ============================================================================

-- Index for email lookups (authentication)
-- Already has UNIQUE constraint, but this explicit index improves performance
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");

-- Index for phone lookups (alternative authentication)
CREATE INDEX IF NOT EXISTS "users_phone_idx" ON "users"("phone") WHERE "phone" IS NOT NULL;

-- Index for user status and role filtering (admin queries)
CREATE INDEX IF NOT EXISTS "users_status_role_idx" ON "users"("status", "role");

-- Index for finding users by credit balance (for reports/analytics)
CREATE INDEX IF NOT EXISTS "users_credits_idx" ON "users"("credits" DESC) WHERE "credits" > 0;

-- ============================================================================
-- VIDEOS TABLE INDEXES
-- ============================================================================

-- Index for openai_task_id lookups (webhook callbacks)
CREATE INDEX IF NOT EXISTS "videos_openai_task_id_idx" ON "videos"("openai_task_id") WHERE "openai_task_id" IS NOT NULL;

-- Partial index for pending/processing videos (background workers)
CREATE INDEX IF NOT EXISTS "videos_processing_status_idx" ON "videos"("status", "created_at" ASC)
WHERE "status" IN ('pending', 'processing');

-- Index for failed videos (debugging and retry logic)
CREATE INDEX IF NOT EXISTS "videos_failed_idx" ON "videos"("status", "created_at" DESC)
WHERE "status" = 'failed';

-- Index for completed videos by completion date
CREATE INDEX IF NOT EXISTS "videos_completed_at_idx" ON "videos"("completed_at" DESC)
WHERE "completed_at" IS NOT NULL;

-- Covering index for video list queries (includes commonly selected columns)
-- This allows index-only scans without accessing the table
CREATE INDEX IF NOT EXISTS "videos_list_covering_idx" ON "videos"(
  "user_id",
  "status",
  "created_at" DESC
) INCLUDE ("id", "prompt", "duration", "resolution", "file_url", "thumbnail_url", "cost_credits");

-- ============================================================================
-- ORDERS TABLE INDEXES
-- ============================================================================

-- Index for order number lookups (payment webhooks)
-- Already has UNIQUE constraint but explicit index improves performance
CREATE INDEX IF NOT EXISTS "orders_order_no_idx" ON "orders"("order_no");

-- Partial index for pending orders (payment processing)
CREATE INDEX IF NOT EXISTS "orders_pending_idx" ON "orders"("created_at" DESC)
WHERE "status" = 'pending';

-- Index for paid orders by payment date (analytics)
CREATE INDEX IF NOT EXISTS "orders_paid_at_idx" ON "orders"("paid_at" DESC)
WHERE "paid_at" IS NOT NULL;

-- Composite index for payment method analytics
CREATE INDEX IF NOT EXISTS "orders_payment_method_status_idx" ON "orders"("payment_method", "status", "created_at" DESC);

-- ============================================================================
-- CREDIT_TRANSACTIONS TABLE INDEXES
-- ============================================================================

-- Index for transaction type filtering
CREATE INDEX IF NOT EXISTS "credit_transactions_type_idx" ON "credit_transactions"("type", "created_at" DESC);

-- Index for related_id lookups (finding transactions by video/order)
CREATE INDEX IF NOT EXISTS "credit_transactions_related_id_idx" ON "credit_transactions"("related_id")
WHERE "related_id" IS NOT NULL;

-- Composite index for transaction type + user queries
CREATE INDEX IF NOT EXISTS "credit_transactions_user_type_idx" ON "credit_transactions"(
  "user_id",
  "type",
  "created_at" DESC
);

-- Index for balance tracking and validation
CREATE INDEX IF NOT EXISTS "credit_transactions_balance_idx" ON "credit_transactions"(
  "user_id",
  "created_at" ASC
) INCLUDE ("amount", "balance_after");

-- ============================================================================
-- TEMPLATES TABLE INDEXES
-- ============================================================================

-- Index for public templates (template gallery)
CREATE INDEX IF NOT EXISTS "templates_public_idx" ON "templates"("is_public", "usage_count" DESC, "created_at" DESC)
WHERE "is_public" = true;

-- Index for most used templates
CREATE INDEX IF NOT EXISTS "templates_usage_count_idx" ON "templates"("usage_count" DESC, "created_at" DESC);

-- Index for user's own templates
CREATE INDEX IF NOT EXISTS "templates_user_created_idx" ON "templates"("user_id", "created_at" DESC)
WHERE "user_id" IS NOT NULL;

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================

-- 1. Partial Indexes:
--    - Only index rows matching the WHERE clause
--    - Smaller index size = faster lookups and less maintenance overhead
--    - Used for: pending orders, processing videos, failed videos, etc.

-- 2. Covering Indexes (INCLUDE):
--    - Store additional columns in the index
--    - Enable index-only scans (no table access needed)
--    - Dramatically improves query performance for list queries

-- 3. Composite Indexes:
--    - Match the order of columns in WHERE and ORDER BY clauses
--    - Most selective columns first (except for ORDER BY requirements)
--    - Supports both equality and range queries

-- 4. Index Maintenance:
--    - PostgreSQL automatically maintains indexes
--    - VACUUM and ANALYZE keep index statistics up to date
--    - Consider REINDEX periodically for heavily updated tables

-- 5. Query Pattern Optimization:
--    - These indexes support the most common query patterns
--    - Use EXPLAIN ANALYZE to verify index usage
--    - Monitor pg_stat_user_indexes for unused indexes

-- 6. Index Size Monitoring:
--    - Run: SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid))
--           FROM pg_stat_user_indexes ORDER BY pg_relation_size(indexrelid) DESC;
--    - Keep an eye on index bloat
--    - Drop unused indexes to save space and write performance
