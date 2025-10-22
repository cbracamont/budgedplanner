-- Add color_theme column to app_settings table
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS color_theme TEXT DEFAULT 'gold';