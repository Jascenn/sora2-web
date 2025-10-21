-- Migration: Fix URL field length limits and add missing updated_at column
-- Date: 2025-10-18
-- Description: Changes file_url and thumbnail_url from VARCHAR(500) to TEXT,
--              and adds updated_at column to videos table

-- Step 1: Alter file_url column type
ALTER TABLE videos ALTER COLUMN file_url TYPE TEXT;

-- Step 2: Alter thumbnail_url column type
ALTER TABLE videos ALTER COLUMN thumbnail_url TYPE TEXT;

-- Step 3: Add updated_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'videos' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE videos ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

        -- Set updated_at to created_at for existing records
        UPDATE videos SET updated_at = created_at WHERE updated_at IS NULL;
    END IF;
END $$;

-- Step 4: Verify changes
SELECT
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'videos'
    AND column_name IN ('file_url', 'thumbnail_url', 'updated_at')
ORDER BY column_name;
