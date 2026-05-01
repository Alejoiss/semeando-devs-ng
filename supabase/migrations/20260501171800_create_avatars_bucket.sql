-- Create a bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up access control for the 'avatars' bucket

-- 1. Allow public access to all files in the 'avatars' bucket (for viewing)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 2. Allow authenticated users to upload files to the 'avatars' bucket
-- The filename must start with their user ID for security
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IS NULL AND -- Ensure it's in the root of the bucket
  name LIKE (auth.uid()::text || '-%')
);

-- 3. Allow users to update their own files in the 'avatars' bucket
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  name LIKE (auth.uid()::text || '-%')
);

-- 4. Allow users to delete their own files in the 'avatars' bucket
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  name LIKE (auth.uid()::text || '-%')
);
