-- Fix wallpapers storage bucket security
-- Make bucket private and restrict viewing to file owners only

-- Update bucket to be private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'wallpapers';

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all wallpapers" ON storage.objects;

-- Create a restricted SELECT policy that only allows users to view their own wallpapers
CREATE POLICY "Users can view their own wallpapers"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'wallpapers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);