-- ============================================================================
-- D2J Media Hub — Supabase PostgreSQL Production Migration (Non-Destructive)
-- Safe to run on an existing or new Supabase project (uses IF NOT EXISTS).
-- ============================================================================

-- 1. Unified JSONB Snapshot Table (Guarantees atomic full-state sync with Next.js)
CREATE TABLE IF NOT EXISTS public.d2j_app_state (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  state JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Relational Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  topics TEXT[] DEFAULT '{}'
);

-- 3. Relational Staff Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMINISTRATOR', 'EDITOR', 'CONTRIBUTOR', 'SCHOLAR')),
  title TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  is_super_admin BOOLEAN DEFAULT FALSE,
  permissions TEXT[] DEFAULT '{}',
  allowed_categories TEXT[] DEFAULT '{ALL}',
  created_by TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Relational Authors Table
CREATE TABLE IF NOT EXISTS public.authors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT NOT NULL,
  avatar_initials TEXT NOT NULL DEFAULT 'DJ',
  verified_credentials TEXT
);

-- 5. Relational Articles Table
CREATE TABLE IF NOT EXISTS public.articles (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body JSONB NOT NULL DEFAULT '[]',
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  author_id TEXT,
  author_name TEXT NOT NULL,
  published_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  art_theme TEXT DEFAULT 'campus',
  featured_image TEXT,
  featured_video TEXT,
  image_caption TEXT,
  verification TEXT NOT NULL CHECK (verification IN ('V', 'S', 'D')),
  status TEXT NOT NULL CHECK (status IN ('Draft', 'Submitted for Review', 'Approved', 'Published', 'Unpublished')),
  featured BOOLEAN DEFAULT FALSE,
  breaking BOOLEAN DEFAULT FALSE,
  views INT DEFAULT 1,
  source_name TEXT,
  source_url TEXT,
  correction_note TEXT,
  seo_title TEXT,
  seo_description TEXT,
  last_edited_by TEXT,
  last_edited_by_id TEXT,
  approved_by TEXT,
  approved_by_id TEXT
);

-- 6. Relational Opportunities Table
CREATE TABLE IF NOT EXISTS public.opportunities (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  provider TEXT NOT NULL,
  type TEXT NOT NULL,
  summary TEXT NOT NULL,
  eligibility TEXT NOT NULL,
  benefits TEXT NOT NULL,
  deadline TEXT NOT NULL,
  official_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  open_closed_status TEXT NOT NULL,
  last_verified TEXT NOT NULL,
  notes TEXT NOT NULL,
  workflow_status TEXT NOT NULL CHECK (workflow_status IN ('Draft', 'Source Verification', 'Published', 'Expired/Archived'))
);

-- 7. Relational Scholar Questions (Private Submissions & Approved Public Answers)
CREATE TABLE IF NOT EXISTS public.scholar_questions (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  topic TEXT NOT NULL,
  subject TEXT NOT NULL,
  question_text TEXT NOT NULL,
  public_question_summary TEXT,
  display_name TEXT,
  email TEXT,
  anonymous_preference BOOLEAN DEFAULT TRUE,
  consent_given BOOLEAN NOT NULL DEFAULT TRUE,
  submitted_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Private Submission', 'Editorial Screening', 'Scholar Review', 'Approved Public Answer', 'Published', 'Declined')),
  answer_text JSONB DEFAULT '[]',
  references_list JSONB DEFAULT '[]',
  scholar_reviewer_name TEXT,
  scholar_credentials TEXT,
  editor_approver_name TEXT,
  reviewed_at TEXT,
  published_at TEXT,
  is_demo BOOLEAN DEFAULT FALSE
);

-- 8. Relational Story Submissions Table
CREATE TABLE IF NOT EXISTS public.story_submissions (
  id TEXT PRIMARY KEY,
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
  attachments JSONB DEFAULT '[]',
  consent_given BOOLEAN NOT NULL DEFAULT TRUE,
  submitted_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Submitted', 'Editorial Review', 'Accepted', 'Rejected', 'Prepared for Publication')),
  editor_notes TEXT
);

-- 9. Relational Contact Submissions Table
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  enquiry_type TEXT NOT NULL,
  organisation TEXT,
  subject TEXT,
  article_url TEXT,
  message TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('New', 'Reviewed', 'Resolved'))
);

-- 10. Relational Media Assets Table
CREATE TABLE IF NOT EXISTS public.media (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  caption TEXT NOT NULL,
  credit TEXT NOT NULL,
  uploaded_at TEXT NOT NULL,
  uploaded_by TEXT NOT NULL
);

-- 11. Relational Admin Activity & Review Audit Logs Table
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  target_title TEXT NOT NULL,
  status_change TEXT,
  details TEXT,
  super_admin_review_status TEXT DEFAULT 'Pending Review',
  super_admin_review_note TEXT,
  reviewed_by_super_admin TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL
);

-- 12. Enable Row Level Security (RLS) so public anon keys cannot read private tables
ALTER TABLE public.d2j_app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholar_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Public read policies ONLY for published content (never private submissions or drafts)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_published_articles') THEN
    CREATE POLICY public_read_published_articles ON public.articles
      FOR SELECT USING (status = 'Published');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_published_opportunities') THEN
    CREATE POLICY public_read_published_opportunities ON public.opportunities
      FOR SELECT USING (workflow_status = 'Published');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_categories') THEN
    CREATE POLICY public_read_categories ON public.categories
      FOR SELECT USING (true);
  END IF;
END
$$;

-- 13. Create Durable Storage Bucket for Media Uploads ('d2j-media')
INSERT INTO storage.buckets (id, name, public)
VALUES ('d2j-media', 'd2j-media', true)
ON CONFLICT (id) DO NOTHING;
