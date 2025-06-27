-- Migration: Add colors column to clothes table
-- Run this in your Supabase SQL Editor

-- Add the new colors column
ALTER TABLE public.clothes 
ADD COLUMN IF NOT EXISTS colors TEXT;

-- Optional: Migrate existing color data to colors column
-- Uncomment the next line if you want to copy single color to colors field
-- UPDATE public.clothes SET colors = color WHERE colors IS NULL AND color IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.clothes.colors IS 'Multiple colors stored as comma-separated string';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clothes' AND table_schema = 'public'
ORDER BY ordinal_position; 