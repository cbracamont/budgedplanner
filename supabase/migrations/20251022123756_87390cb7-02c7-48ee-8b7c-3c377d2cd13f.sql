-- Add chart_type column to app_settings table
ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS chart_type text DEFAULT 'bar';