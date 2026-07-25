/*
# Media storage policies

Policies for the public `media` storage bucket. Any authenticated user can
upload (their own avatar, message media, group avatars) and anyone can read
(the bucket is public). Writes are scoped to authenticated users only.
*/

-- Public read
DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
CREATE POLICY "media_public_read"
ON storage.objects FOR SELECT
TO anon, authenticated USING (bucket_id = 'media');

-- Authenticated upload
DROP POLICY IF EXISTS "media_auth_upload" ON storage.objects;
CREATE POLICY "media_auth_upload"
ON storage.objects FOR INSERT
TO authenticated WITH CHECK (bucket_id = 'media');

-- Owner can update/delete own uploads
DROP POLICY IF EXISTS "media_owner_update" ON storage.objects;
CREATE POLICY "media_owner_update"
ON storage.objects FOR UPDATE
TO authenticated USING (bucket_id = 'media' AND owner = auth.uid())
WITH CHECK (bucket_id = 'media' AND owner = auth.uid());

DROP POLICY IF EXISTS "media_owner_delete" ON storage.objects;
CREATE POLICY "media_owner_delete"
ON storage.objects FOR DELETE
TO authenticated USING (bucket_id = 'media' AND owner = auth.uid());
