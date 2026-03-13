-- Storage RLS Policies for wisker-files bucket
-- Run this SQL in your Supabase SQL Editor to allow authenticated users to upload files

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'wisker-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read files from their own folder
CREATE POLICY "Users can read their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'wisker-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'wisker-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'wisker-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access (optional - for public file URLs)
CREATE POLICY "Public can read files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'wisker-files');
