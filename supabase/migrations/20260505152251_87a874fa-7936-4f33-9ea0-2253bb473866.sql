
-- Realtime channel authorization
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated participants can subscribe to conv channels" ON realtime.messages;
CREATE POLICY "Authenticated participants can subscribe to conv channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Topic format expected: "conversation:<uuid>"
  (
    realtime.topic() LIKE 'conversation:%'
    AND public.is_conversation_participant(
      (substring(realtime.topic() from 'conversation:(.*)'))::uuid,
      auth.uid()
    )
  )
);

-- Restrict avatars bucket listing while keeping public read of known URLs
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can list own avatar folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- Public read by direct URL (no listing because anon role gets no SELECT here)
CREATE POLICY "Public can read avatars"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
  OR (bucket_id = 'avatars' AND auth.role() = 'anon' AND false)
);

-- Allow authenticated users to list/read only their own folder
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
CREATE POLICY "Users can read own avatar folder"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Make bucket private; clients should use createSignedUrl or public URL via CDN
UPDATE storage.buckets SET public = false WHERE id = 'avatars';
