-- Drop wallpaper_url column from app_settings table
ALTER TABLE public.app_settings DROP COLUMN IF EXISTS wallpaper_url;