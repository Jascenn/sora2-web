-- Migration: Add video_jobs outbox table for reliable queue processing
-- This implements the Outbox pattern to ensure queue jobs are never lost
-- even if the queue service is temporarily unavailable

CREATE TABLE IF NOT EXISTS video_jobs (
  video_id UUID PRIMARY KEY REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  config JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, queued, failed
  attempts INT NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for efficient outbox processing queries
CREATE INDEX IF NOT EXISTS idx_video_jobs_status_created ON video_jobs(status, created_at)
  WHERE status = 'pending';

-- Index for retry queries
CREATE INDEX IF NOT EXISTS idx_video_jobs_retry ON video_jobs(status, last_attempt_at)
  WHERE status = 'failed' AND attempts < 3;

COMMENT ON TABLE video_jobs IS 'Outbox table for reliable video generation queue processing';
COMMENT ON COLUMN video_jobs.status IS 'Job status: pending (not yet queued), queued (in Bull queue), failed (queue add failed)';
COMMENT ON COLUMN video_jobs.attempts IS 'Number of times we attempted to add this job to the queue';
