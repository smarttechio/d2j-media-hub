-- ============================================================================
-- D2J Media Hub — Phase 2 Migration 3: Supabase Storage Buckets & Policies
-- Version: 20261124000003
-- ============================================================================

-- 1. Create Dedicated Storage Buckets
-- article-media: Public bucket for article images (max 15 MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-media',
  'article-media',
  TRUE,
  15728640, -- 15 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- article-videos: Public bucket for article videos (max 100 MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-videos',
  'article-videos',
  TRUE,
  104857600, -- 100 MB
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-m4v']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- private-submissions: Private bucket for reader story attachments (max 15 MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'private-submissions',
  'private-submissions',
  FALSE,
  15728640, -- 15 MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Object RLS Policies

-- Public read access for article-media and article-videos
DROP POLICY IF EXISTS storage_public_read_article_media ON storage.objects;
CREATE POLICY storage_public_read_article_media ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('article-media', 'article-videos', 'd2j-media'));

-- Authenticated staff with 'media' or 'publish_articles' permission can upload to article-media and article-videos
DROP POLICY IF EXISTS storage_staff_upload_media ON storage.objects;
CREATE POLICY storage_staff_upload_media ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('article-media', 'article-videos')
    AND public.is_active_staff()
    AND (public.has_permission('media') OR public.can_publish_content())
  );

-- Only Publishers (Editors/Admins) can delete objects from article-media and article-videos
DROP POLICY IF EXISTS storage_staff_delete_media ON storage.objects;
CREATE POLICY storage_staff_delete_media ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('article-media', 'article-videos')
    AND public.can_publish_content()
  );

-- Private story submission attachments: only Editors/Admins or staff with 'story-submissions' can read via signed URLs
DROP POLICY IF EXISTS storage_staff_read_private_submissions ON storage.objects;
CREATE POLICY storage_staff_read_private_submissions ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'private-submissions'
    AND (public.can_publish_content() OR public.has_permission('story-submissions'))
  );
