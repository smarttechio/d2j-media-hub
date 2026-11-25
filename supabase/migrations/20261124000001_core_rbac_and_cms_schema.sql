-- ============================================================================
-- D2J Media Hub — Phase 2 Migration 1: Normalized Core RBAC & Editorial Schema
-- Version: 20261124000001
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Reusable trigger function to auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- A. AUTHENTICATION & ACCESS CONTROL (RBAC)
-- ============================================================================

-- 1. Roles Lookup Table
CREATE TABLE IF NOT EXISTS public.roles (
  name TEXT PRIMARY KEY CHECK (name IN ('SUPER_ADMIN', 'ADMINISTRATOR', 'EDITOR', 'CONTRIBUTOR', 'SCHOLAR')),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.roles (name, description) VALUES
  ('SUPER_ADMIN', 'Full platform governance, staff management, audit review, and unrestricted editorial publishing.'),
  ('ADMINISTRATOR', 'Managing editor permissions across content, categories, opportunities, scholar queue, and settings.'),
  ('EDITOR', 'Editorial review, approval, publishing, opportunities, comments, and submission moderation.'),
  ('CONTRIBUTOR', 'Draft creation, editing own unapproved drafts within assigned categories, and media uploads.'),
  ('SCHOLAR', 'Specialist review of Ask a Scholar questions and drafting scholarly responses and references.')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- 2. Permissions Lookup Table (14 Dashboard Permissions)
CREATE TABLE IF NOT EXISTS public.permissions (
  key TEXT PRIMARY KEY CHECK (
    key IN (
      'overview',
      'articles',
      'publish_articles',
      'categories',
      'authors',
      'opportunities',
      'ask-scholar',
      'approved-answers',
      'story-submissions',
      'contacts',
      'media',
      'users',
      'admin-reviews',
      'settings'
    )
  ),
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.permissions (key, label, description) VALUES
  ('overview', 'Dashboard Overview', 'View newsroom stats & Fast Category Finder'),
  ('articles', 'Create & Edit Articles', 'Write and edit article drafts'),
  ('publish_articles', 'Approve & Publish Live', 'Approve & publish articles to public site'),
  ('categories', 'Categories & Topics', 'Create and edit newsroom categories'),
  ('authors', 'Authors & Bylines', 'Manage author & scholar biographies'),
  ('opportunities', 'Opportunities Desk', 'Verify & publish scholarships and fellowships'),
  ('ask-scholar', 'Ask a Scholar Queue', 'Screen private questions & draft answers'),
  ('approved-answers', 'Published Scholar Q&A', 'Manage published scholarly rulings'),
  ('story-submissions', 'Reader Story Submissions', 'Review & promote reader stories'),
  ('contacts', 'Contact & Corrections', 'Handle reader messages & correction requests'),
  ('media', 'Media Library & Uploads', 'Upload images and videos'),
  ('users', 'Manage Admins & Roles', 'Add staff/admins & assign access permissions'),
  ('admin-reviews', 'Review Other Admins', 'Inspect & review other admins'' work and activity logs'),
  ('settings', 'Platform Settings', 'Edit site title, emails & breaking news ticker')
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description;

-- 3. Default Role Permissions Mapping
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_name TEXT NOT NULL REFERENCES public.roles(name) ON DELETE CASCADE,
  permission_key TEXT NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_name, permission_key)
);

-- Seed default permissions per role matching getDefaultPermissionsForRole()
INSERT INTO public.role_permissions (role_name, permission_key)
SELECT 'SUPER_ADMIN', key FROM public.permissions
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_name, permission_key) VALUES
  ('ADMINISTRATOR', 'overview'),
  ('ADMINISTRATOR', 'articles'),
  ('ADMINISTRATOR', 'publish_articles'),
  ('ADMINISTRATOR', 'categories'),
  ('ADMINISTRATOR', 'authors'),
  ('ADMINISTRATOR', 'opportunities'),
  ('ADMINISTRATOR', 'ask-scholar'),
  ('ADMINISTRATOR', 'approved-answers'),
  ('ADMINISTRATOR', 'story-submissions'),
  ('ADMINISTRATOR', 'contacts'),
  ('ADMINISTRATOR', 'media'),
  ('ADMINISTRATOR', 'admin-reviews'),
  ('ADMINISTRATOR', 'settings'),
  ('EDITOR', 'overview'),
  ('EDITOR', 'articles'),
  ('EDITOR', 'publish_articles'),
  ('EDITOR', 'categories'),
  ('EDITOR', 'authors'),
  ('EDITOR', 'opportunities'),
  ('EDITOR', 'ask-scholar'),
  ('EDITOR', 'approved-answers'),
  ('EDITOR', 'story-submissions'),
  ('EDITOR', 'contacts'),
  ('EDITOR', 'media'),
  ('SCHOLAR', 'overview'),
  ('SCHOLAR', 'ask-scholar'),
  ('SCHOLAR', 'approved-answers'),
  ('CONTRIBUTOR', 'overview'),
  ('CONTRIBUTOR', 'articles'),
  ('CONTRIBUTOR', 'media')
ON CONFLICT DO NOTHING;

-- 4. Staff Profiles Table (1-to-1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  legacy_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Staff Member',
  primary_role TEXT NOT NULL DEFAULT 'CONTRIBUTOR' REFERENCES public.roles(name),
  is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  all_categories_access BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_name TEXT,
  created_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_profiles_legacy_id ON public.profiles(legacy_id);
CREATE INDEX IF NOT EXISTS idx_profiles_active_role ON public.profiles(active, primary_role);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. User Roles Junction Table
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL REFERENCES public.roles(name) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role_name)
);

-- 6. User Permission Overrides (Supports explicit 'grant' and 'revoke')
CREATE TABLE IF NOT EXISTS public.user_permissions (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  effect TEXT NOT NULL CHECK (effect IN ('grant', 'revoke')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, permission_key)
);

-- ============================================================================
-- B. EDITORIAL CMS TABLES
-- ============================================================================

-- 7. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  topics TEXT[] NOT NULL DEFAULT '{All}',
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8. User Category Scopes (Restricts contributors/staff when all_categories_access = FALSE)
CREATE TABLE IF NOT EXISTS public.user_category_scopes (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_slug TEXT NOT NULL REFERENCES public.categories(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, category_slug)
);

CREATE INDEX IF NOT EXISTS idx_user_category_scopes_user ON public.user_category_scopes(user_id);

-- 9. Authors Table
CREATE TABLE IF NOT EXISTS public.authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id TEXT UNIQUE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Staff Writer',
  bio TEXT NOT NULL DEFAULT '',
  avatar_initials TEXT NOT NULL DEFAULT 'DJ',
  verified_credentials TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_authors_legacy_id ON public.authors(legacy_id);

DROP TRIGGER IF EXISTS trg_authors_updated_at ON public.authors;
CREATE TRIGGER trg_authors_updated_at
  BEFORE UPDATE ON public.authors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 10. Articles Table
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id TEXT UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  body_paragraphs TEXT[] NOT NULL DEFAULT '{}',
  category_slug TEXT NOT NULL REFERENCES public.categories(slug) ON UPDATE CASCADE,
  author_id UUID REFERENCES public.authors(id) ON DELETE SET NULL,
  author_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_legacy_id TEXT,
  author_name TEXT NOT NULL,
  art_theme TEXT NOT NULL DEFAULT 'campus' CHECK (art_theme IN ('campus', 'library', 'quran', 'community', 'biz', 'well')),
  featured_image TEXT,
  featured_video TEXT,
  image_caption TEXT,
  verification TEXT NOT NULL DEFAULT 'V' CHECK (verification IN ('V', 'S', 'D')),
  source_name TEXT,
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted for Review', 'Approved', 'Published', 'Unpublished')),
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  breaking BOOLEAN NOT NULL DEFAULT FALSE,
  views INT NOT NULL DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  correction_note TEXT,
  last_edited_by_name TEXT,
  last_edited_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_edited_by_legacy_id TEXT,
  approved_by_name TEXT,
  approved_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by_legacy_id TEXT,
  published_date TEXT NOT NULL DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD'),
  updated_date TEXT NOT NULL DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD'),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_public_listing ON public.articles(status, verification, published_date DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category_status ON public.articles(category_slug, status, published_date DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_legacy_id ON public.articles(legacy_id);
CREATE INDEX IF NOT EXISTS idx_articles_author_profile ON public.articles(author_profile_id);

DROP TRIGGER IF EXISTS trg_articles_updated_at ON public.articles;
CREATE TRIGGER trg_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 11. Article Content Blocks Table
CREATE TABLE IF NOT EXISTS public.article_content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_block_id TEXT,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  position INT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('paragraph', 'heading', 'image', 'gallery', 'quote', 'video')),
  text TEXT,
  image_url TEXT,
  image_caption TEXT,
  second_image_url TEXT,
  second_image_caption TEXT,
  video_url TEXT,
  quote_attribution TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (article_id, position)
);

CREATE INDEX IF NOT EXISTS idx_article_content_blocks_article ON public.article_content_blocks(article_id, position ASC);

-- 12. Tags Table
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Article Tags Junction Table
CREATE TABLE IF NOT EXISTS public.article_tags (
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  PRIMARY KEY (article_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_article_tags_article ON public.article_tags(article_id, position ASC);
CREATE INDEX IF NOT EXISTS idx_article_tags_tag ON public.article_tags(tag_id);

-- 14. Article Corrections Audit Table
CREATE TABLE IF NOT EXISTS public.corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corrections_article ON public.corrections(article_id, created_at DESC);

-- ============================================================================
-- C. PUBLIC INTERACTIONS & SUBMISSIONS
-- ============================================================================

-- 15. Reader Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id TEXT UNIQUE,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  article_slug TEXT NOT NULL,
  article_title TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT,
  location_or_campus TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Approved' CHECK (status IN ('Approved', 'Pending', 'Hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_article_status ON public.comments(article_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_slug_status ON public.comments(article_slug, status, created_at DESC);

DROP TRIGGER IF EXISTS trg_comments_updated_at ON public.comments;
CREATE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 16. Story Submissions Table
CREATE TABLE IF NOT EXISTS public.story_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id TEXT UNIQUE,
  contributor_name TEXT NOT NULL,
  email TEXT NOT NULL,
  institution TEXT,
  location TEXT,
  phone TEXT,
  category TEXT NOT NULL,
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  preferred_byline TEXT,
  source_links TEXT,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  consent_given BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'Submitted' CHECK (
    status IN ('Submitted', 'Editorial Review', 'Accepted', 'Rejected', 'Prepared for Publication')
  ),
  editor_notes TEXT,
  promoted_article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_story_submissions_status ON public.story_submissions(status, submitted_at DESC);

DROP TRIGGER IF EXISTS trg_story_submissions_updated_at ON public.story_submissions;
CREATE TRIGGER trg_story_submissions_updated_at
  BEFORE UPDATE ON public.story_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 17. Scholar Questions Table
CREATE TABLE IF NOT EXISTS public.scholar_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id TEXT UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  topic TEXT NOT NULL,
  subject TEXT NOT NULL,
  question_text TEXT NOT NULL,
  public_question_summary TEXT,
  display_name TEXT,
  email TEXT,
  anonymous_preference BOOLEAN NOT NULL DEFAULT TRUE,
  consent_given BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'Private Submission' CHECK (
    status IN (
      'Private Submission',
      'Editorial Screening',
      'Scholar Review',
      'Approved Public Answer',
      'Published',
      'Declined'
    )
  ),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scholar_questions_public ON public.scholar_questions(status, is_demo, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_scholar_questions_slug ON public.scholar_questions(slug);

DROP TRIGGER IF EXISTS trg_scholar_questions_updated_at ON public.scholar_questions;
CREATE TRIGGER trg_scholar_questions_updated_at
  BEFORE UPDATE ON public.scholar_questions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 18. Scholar Answers Table (Normalized 1-to-1 response for Scholar Questions)
CREATE TABLE IF NOT EXISTS public.scholar_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID UNIQUE NOT NULL REFERENCES public.scholar_questions(id) ON DELETE CASCADE,
  answer_text TEXT[] NOT NULL DEFAULT '{}',
  references_list TEXT[] NOT NULL DEFAULT '{}',
  scholar_reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  scholar_reviewer_name TEXT,
  scholar_credentials TEXT,
  editor_approver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  editor_approver_name TEXT,
  reviewed_date TEXT,
  published_date TEXT,
  reviewed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_scholar_answers_updated_at ON public.scholar_answers;
CREATE TRIGGER trg_scholar_answers_updated_at
  BEFORE UPDATE ON public.scholar_answers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 19. Contact & Correction Submissions Table
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  enquiry_type TEXT NOT NULL,
  organisation TEXT,
  subject TEXT,
  article_url TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Reviewed', 'Resolved')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions(status, submitted_at DESC);

DROP TRIGGER IF EXISTS trg_contact_submissions_updated_at ON public.contact_submissions;
CREATE TRIGGER trg_contact_submissions_updated_at
  BEFORE UPDATE ON public.contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 20. Newsletter Subscribers Table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_provider' CHECK (status IN ('pending_provider', 'active', 'unsubscribed')),
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- D. OPPORTUNITIES, MEDIA & CONFIGURATION
-- ============================================================================

-- 21. Opportunity Categories Table
CREATE TABLE IF NOT EXISTS public.opportunity_categories (
  slug TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.opportunity_categories (slug, name) VALUES
  ('scholarship', 'Scholarship'),
  ('internship', 'Internship'),
  ('fellowship', 'Fellowship'),
  ('graduate-opportunity', 'Graduate Opportunity'),
  ('career-guide', 'Career Guide'),
  ('programme', 'Programme')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- 22. Opportunities Table
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id TEXT UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  provider TEXT NOT NULL,
  type TEXT NOT NULL REFERENCES public.opportunity_categories(name) ON UPDATE CASCADE,
  summary TEXT NOT NULL,
  eligibility TEXT NOT NULL,
  benefits TEXT NOT NULL,
  deadline TEXT NOT NULL,
  official_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  open_closed_status TEXT NOT NULL CHECK (
    open_closed_status IN ('Upcoming', 'Open', 'Closed', 'Closed (deadline unconfirmed)')
  ),
  last_verified TEXT NOT NULL,
  notes TEXT NOT NULL,
  workflow_status TEXT NOT NULL DEFAULT 'Draft' CHECK (
    workflow_status IN ('Draft', 'Source Verification', 'Published', 'Expired/Archived')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_workflow ON public.opportunities(workflow_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_slug ON public.opportunities(slug);

DROP TRIGGER IF EXISTS trg_opportunities_updated_at ON public.opportunities;
CREATE TRIGGER trg_opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 23. Media Library Table
CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id TEXT UNIQUE,
  bucket_id TEXT NOT NULL DEFAULT 'article-media',
  storage_path TEXT NOT NULL DEFAULT '',
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  caption TEXT NOT NULL DEFAULT '',
  credit TEXT NOT NULL DEFAULT 'D2J Media Hub',
  uploaded_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploaded_by_name TEXT NOT NULL DEFAULT 'System',
  uploaded_date TEXT NOT NULL DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD'),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_uploaded_at ON public.media(uploaded_at DESC);

-- 24. Site Settings Singleton Table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_name TEXT NOT NULL DEFAULT 'D-Path to Jannah Media Hub',
  short_name TEXT NOT NULL DEFAULT 'D2J Media Hub',
  tagline TEXT NOT NULL DEFAULT 'Voice in propagation of the truth',
  breaking_news_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  breaking_news_text TEXT NOT NULL DEFAULT '',
  breaking_news_url TEXT NOT NULL DEFAULT '/news',
  newsletter_provider_configured BOOLEAN NOT NULL DEFAULT FALSE,
  newsletter_provider_name TEXT NOT NULL DEFAULT 'Pending Provider Configuration',
  official_email TEXT NOT NULL DEFAULT '[Official email address, to be supplied]',
  business_email TEXT NOT NULL DEFAULT '[Business enquiries contact, to be supplied]',
  office_location TEXT NOT NULL DEFAULT '[Office location, only if officially supplied]',
  social_links JSONB NOT NULL DEFAULT '{"facebook":"#","x":"#","whatsapp":"#"}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 25. Admin Activity Audit Logs Table
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id TEXT UNIQUE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_legacy_id TEXT,
  actor_name TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (
    target_type IN (
      'article',
      'opportunity',
      'scholar_qa',
      'story_submission',
      'contact',
      'comment',
      'user',
      'category',
      'author',
      'media',
      'settings'
    )
  ),
  target_id TEXT,
  target_title TEXT NOT NULL,
  status_change TEXT,
  details TEXT,
  super_admin_review_status TEXT NOT NULL DEFAULT 'Pending Review' CHECK (
    super_admin_review_status IN ('Pending Review', 'Approved', 'Needs Revision')
  ),
  super_admin_review_note TEXT,
  reviewed_by_super_admin TEXT,
  reviewed_date TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.admin_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor ON public.admin_activity_logs(actor_id, created_at DESC);
