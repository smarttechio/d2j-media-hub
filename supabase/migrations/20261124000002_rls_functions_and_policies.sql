-- ============================================================================
-- D2J Media Hub — Phase 2 Migration 2: RBAC Helper Functions & Row Level Security
-- Version: 20261124000002
-- ============================================================================

-- ============================================================================
-- 1. SECURITY DEFINER RBAC HELPER FUNCTIONS (Fixed search_path = public)
-- ============================================================================

-- Check if the current authenticated user is an active staff member
CREATE OR REPLACE FUNCTION public.is_active_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.active = TRUE
  );
$$;

-- Check if the current authenticated user is an active Super Administrator
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.active = TRUE
      AND (p.is_super_admin = TRUE OR p.primary_role = 'SUPER_ADMIN')
  );
$$;

-- Get the current authenticated user's primary role (or NULL if inactive/unauthenticated)
CREATE OR REPLACE FUNCTION public.current_staff_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.primary_role
  FROM public.profiles p
  WHERE p.id = auth.uid()
    AND p.active = TRUE
  LIMIT 1;
$$;

-- Evaluate whether the current authenticated user has a specific DashboardPermission
-- Combines role default permissions + user_permissions ('grant') - user_permissions ('revoke')
CREATE OR REPLACE FUNCTION public.has_permission(perm_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_override TEXT;
  v_has_default BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT id, primary_role, is_super_admin, active
  INTO v_profile
  FROM public.profiles
  WHERE id = auth.uid();

  IF NOT FOUND OR v_profile.active IS NOT TRUE THEN
    RETURN FALSE;
  END IF;

  IF v_profile.is_super_admin = TRUE OR v_profile.primary_role = 'SUPER_ADMIN' THEN
    RETURN TRUE;
  END IF;

  -- Check explicit per-user override first ('grant' or 'revoke')
  SELECT up.effect
  INTO v_override
  FROM public.user_permissions up
  WHERE up.user_id = v_profile.id
    AND up.permission_key = perm_key;

  IF v_override = 'grant' THEN
    RETURN TRUE;
  ELSIF v_override = 'revoke' THEN
    RETURN FALSE;
  END IF;

  -- Fallback to role_permissions for primary_role or any assigned user_roles
  SELECT EXISTS (
    SELECT 1
    FROM public.role_permissions rp
    WHERE rp.permission_key = perm_key
      AND (
        rp.role_name = v_profile.primary_role
        OR rp.role_name IN (
          SELECT ur.role_name FROM public.user_roles ur WHERE ur.user_id = v_profile.id
        )
      )
  ) INTO v_has_default;

  RETURN COALESCE(v_has_default, FALSE);
END;
$$;

-- Match canPublishContent() in application RBAC
CREATE OR REPLACE FUNCTION public.can_publish_content()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_active_staff()
    AND (
      public.current_staff_role() IN ('SUPER_ADMIN', 'ADMINISTRATOR', 'EDITOR')
      OR public.has_permission('publish_articles')
    );
$$;

-- Match canManageUsers() in application RBAC
CREATE OR REPLACE FUNCTION public.can_manage_users()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_active_staff()
    AND (
      public.current_staff_role() IN ('SUPER_ADMIN', 'ADMINISTRATOR')
      OR public.has_permission('users')
    );
$$;

-- Match canReviewOtherAdmins() in application RBAC
CREATE OR REPLACE FUNCTION public.can_review_other_admins()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_active_staff()
    AND (
      public.current_staff_role() IN ('SUPER_ADMIN', 'ADMINISTRATOR')
      OR public.has_permission('admin-reviews')
    );
$$;

-- Match canReviewScholarQuestions() in application RBAC
CREATE OR REPLACE FUNCTION public.can_review_scholar_questions()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_active_staff()
    AND (
      public.current_staff_role() IN ('SUPER_ADMIN', 'ADMINISTRATOR', 'EDITOR', 'SCHOLAR')
      OR public.has_permission('ask-scholar')
    );
$$;

-- Check if the current authenticated user is allowed to manage content in a given category slug
CREATE OR REPLACE FUNCTION public.can_manage_category(cat_slug TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.active = TRUE
      AND (
        p.is_super_admin = TRUE
        OR p.primary_role = 'SUPER_ADMIN'
        OR p.all_categories_access = TRUE
        OR EXISTS (
          SELECT 1
          FROM public.user_category_scopes ucs
          WHERE ucs.user_id = p.id
            AND ucs.category_slug = cat_slug
        )
      )
  );
$$;

-- ============================================================================
-- 2. ENABLE ROW LEVEL SECURITY ON ALL 25 TABLES
-- ============================================================================

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_category_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholar_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholar_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. RLS POLICIES: AUTHENTICATION & ACCESS CONTROL
-- ============================================================================

-- roles, permissions, role_permissions: Readable by active staff
DROP POLICY IF EXISTS staff_read_roles ON public.roles;
CREATE POLICY staff_read_roles ON public.roles
  FOR SELECT TO authenticated
  USING (public.is_active_staff());

DROP POLICY IF EXISTS staff_read_permissions ON public.permissions;
CREATE POLICY staff_read_permissions ON public.permissions
  FOR SELECT TO authenticated
  USING (public.is_active_staff());

DROP POLICY IF EXISTS staff_read_role_permissions ON public.role_permissions;
CREATE POLICY staff_read_role_permissions ON public.role_permissions
  FOR SELECT TO authenticated
  USING (public.is_active_staff());

-- profiles: Staff can read their own profile; user managers & reviewers can read all profiles
DROP POLICY IF EXISTS profiles_select_policy ON public.profiles;
CREATE POLICY profiles_select_policy ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.can_manage_users()
    OR public.can_review_other_admins()
  );

DROP POLICY IF EXISTS profiles_insert_policy ON public.profiles;
CREATE POLICY profiles_insert_policy ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.can_manage_users()
    AND (
      is_super_admin = FALSE
      AND primary_role <> 'SUPER_ADMIN'
      OR public.is_super_admin()
    )
  );

DROP POLICY IF EXISTS profiles_update_policy ON public.profiles;
CREATE POLICY profiles_update_policy ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    public.can_manage_users()
    AND (is_super_admin = FALSE OR public.is_super_admin())
  )
  WITH CHECK (
    public.can_manage_users()
    AND (
      (is_super_admin = FALSE AND primary_role <> 'SUPER_ADMIN')
      OR public.is_super_admin()
    )
  );

DROP POLICY IF EXISTS profiles_delete_policy ON public.profiles;
CREATE POLICY profiles_delete_policy ON public.profiles
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    AND id <> auth.uid()
    AND COALESCE(legacy_id, '') <> 'usr-admin'
  );

-- user_roles, user_permissions, user_category_scopes
DROP POLICY IF EXISTS user_roles_select_policy ON public.user_roles;
CREATE POLICY user_roles_select_policy ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.can_manage_users() OR public.can_review_other_admins());

DROP POLICY IF EXISTS user_roles_manage_policy ON public.user_roles;
CREATE POLICY user_roles_manage_policy ON public.user_roles
  FOR ALL TO authenticated
  USING (public.can_manage_users() AND (role_name <> 'SUPER_ADMIN' OR public.is_super_admin()))
  WITH CHECK (public.can_manage_users() AND (role_name <> 'SUPER_ADMIN' OR public.is_super_admin()));

DROP POLICY IF EXISTS user_permissions_select_policy ON public.user_permissions;
CREATE POLICY user_permissions_select_policy ON public.user_permissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.can_manage_users() OR public.can_review_other_admins());

DROP POLICY IF EXISTS user_permissions_manage_policy ON public.user_permissions;
CREATE POLICY user_permissions_manage_policy ON public.user_permissions
  FOR ALL TO authenticated
  USING (public.can_manage_users())
  WITH CHECK (public.can_manage_users());

DROP POLICY IF EXISTS user_category_scopes_select_policy ON public.user_category_scopes;
CREATE POLICY user_category_scopes_select_policy ON public.user_category_scopes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.can_manage_users() OR public.can_review_other_admins());

DROP POLICY IF EXISTS user_category_scopes_manage_policy ON public.user_category_scopes;
CREATE POLICY user_category_scopes_manage_policy ON public.user_category_scopes
  FOR ALL TO authenticated
  USING (public.can_manage_users())
  WITH CHECK (public.can_manage_users());

-- ============================================================================
-- 4. RLS POLICIES: CATEGORIES, AUTHORS & TAGS
-- ============================================================================

DROP POLICY IF EXISTS categories_public_read ON public.categories;
CREATE POLICY categories_public_read ON public.categories
  FOR SELECT TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS categories_staff_manage ON public.categories;
CREATE POLICY categories_staff_manage ON public.categories
  FOR ALL TO authenticated
  USING (public.can_publish_content() OR public.has_permission('categories'))
  WITH CHECK (public.can_publish_content() OR public.has_permission('categories'));

DROP POLICY IF EXISTS authors_public_read ON public.authors;
CREATE POLICY authors_public_read ON public.authors
  FOR SELECT TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS authors_staff_manage ON public.authors;
CREATE POLICY authors_staff_manage ON public.authors
  FOR ALL TO authenticated
  USING (public.can_publish_content() OR public.has_permission('authors'))
  WITH CHECK (public.can_publish_content() OR public.has_permission('authors'));

DROP POLICY IF EXISTS tags_public_read ON public.tags;
CREATE POLICY tags_public_read ON public.tags
  FOR SELECT TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS tags_staff_manage ON public.tags;
CREATE POLICY tags_staff_manage ON public.tags
  FOR ALL TO authenticated
  USING (public.is_active_staff() AND (public.has_permission('articles') OR public.can_publish_content()))
  WITH CHECK (public.is_active_staff() AND (public.has_permission('articles') OR public.can_publish_content()));

-- ============================================================================
-- 5. RLS POLICIES: ARTICLES, CONTENT BLOCKS, ARTICLE TAGS & CORRECTIONS
-- ============================================================================

-- Public readers ONLY see Published, non-demo articles
DROP POLICY IF EXISTS articles_public_read ON public.articles;
CREATE POLICY articles_public_read ON public.articles
  FOR SELECT TO anon, authenticated
  USING (
    (status = 'Published' AND verification <> 'D')
    OR public.is_active_staff()
  );

-- Staff insert: requires 'articles' or 'publish_articles', category scope, and Contributors cannot insert directly as Approved/Published
DROP POLICY IF EXISTS articles_staff_insert ON public.articles;
CREATE POLICY articles_staff_insert ON public.articles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_active_staff()
    AND (public.has_permission('articles') OR public.can_publish_content())
    AND public.can_manage_category(category_slug)
    AND (
      public.can_publish_content()
      OR status IN ('Draft', 'Submitted for Review')
    )
  );

-- Staff update:
-- Publishers (Editors/Admins) can update any article within their category scope.
-- Contributors can only update their own unapproved/unpublished drafts in their allowed categories.
DROP POLICY IF EXISTS articles_staff_update ON public.articles;
CREATE POLICY articles_staff_update ON public.articles
  FOR UPDATE TO authenticated
  USING (
    public.is_active_staff()
    AND public.can_manage_category(category_slug)
    AND (
      public.can_publish_content()
      OR (
        public.has_permission('articles')
        AND status IN ('Draft', 'Submitted for Review')
        AND (author_profile_id = auth.uid() OR last_edited_by_id = auth.uid())
      )
    )
  )
  WITH CHECK (
    public.is_active_staff()
    AND public.can_manage_category(category_slug)
    AND (
      public.can_publish_content()
      OR (
        public.has_permission('articles')
        AND status IN ('Draft', 'Submitted for Review')
      )
    )
  );

-- Staff delete: only Publishers (Editors/Admins) can delete articles
DROP POLICY IF EXISTS articles_staff_delete ON public.articles;
CREATE POLICY articles_staff_delete ON public.articles
  FOR DELETE TO authenticated
  USING (public.can_publish_content());

-- article_content_blocks: visible when parent article is visible; editable when parent article is editable
DROP POLICY IF EXISTS content_blocks_read ON public.article_content_blocks;
CREATE POLICY content_blocks_read ON public.article_content_blocks
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.articles a
      WHERE a.id = article_content_blocks.article_id
        AND ((a.status = 'Published' AND a.verification <> 'D') OR public.is_active_staff())
    )
  );

DROP POLICY IF EXISTS content_blocks_staff_write ON public.article_content_blocks;
CREATE POLICY content_blocks_staff_write ON public.article_content_blocks
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.articles a
      WHERE a.id = article_content_blocks.article_id
        AND public.can_manage_category(a.category_slug)
        AND (
          public.can_publish_content()
          OR (
            public.has_permission('articles')
            AND a.status IN ('Draft', 'Submitted for Review')
            AND (a.author_profile_id = auth.uid() OR a.last_edited_by_id = auth.uid())
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.articles a
      WHERE a.id = article_content_blocks.article_id
        AND public.can_manage_category(a.category_slug)
        AND (
          public.can_publish_content()
          OR (
            public.has_permission('articles')
            AND a.status IN ('Draft', 'Submitted for Review')
          )
        )
    )
  );

-- article_tags
DROP POLICY IF EXISTS article_tags_read ON public.article_tags;
CREATE POLICY article_tags_read ON public.article_tags
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.articles a
      WHERE a.id = article_tags.article_id
        AND ((a.status = 'Published' AND a.verification <> 'D') OR public.is_active_staff())
    )
  );

DROP POLICY IF EXISTS article_tags_staff_write ON public.article_tags;
CREATE POLICY article_tags_staff_write ON public.article_tags
  FOR ALL TO authenticated
  USING (public.is_active_staff() AND (public.has_permission('articles') OR public.can_publish_content()))
  WITH CHECK (public.is_active_staff() AND (public.has_permission('articles') OR public.can_publish_content()));

-- corrections
DROP POLICY IF EXISTS corrections_read ON public.corrections;
CREATE POLICY corrections_read ON public.corrections
  FOR SELECT TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS corrections_staff_write ON public.corrections;
CREATE POLICY corrections_staff_write ON public.corrections
  FOR ALL TO authenticated
  USING (public.can_publish_content())
  WITH CHECK (public.can_publish_content());

-- ============================================================================
-- 6. RLS POLICIES: COMMENTS, SUBMISSIONS & ASK A SCHOLAR
-- ============================================================================

-- comments: Public can read Approved comments and insert new comments on published articles
DROP POLICY IF EXISTS comments_public_read ON public.comments;
CREATE POLICY comments_public_read ON public.comments
  FOR SELECT TO anon, authenticated
  USING (status = 'Approved' OR public.can_publish_content());

DROP POLICY IF EXISTS comments_public_insert ON public.comments;
CREATE POLICY comments_public_insert ON public.comments
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    LENGTH(TRIM(author_name)) >= 2
    AND LENGTH(TRIM(content)) >= 2
    AND EXISTS (
      SELECT 1 FROM public.articles a
      WHERE a.id = comments.article_id
        AND a.status = 'Published'
    )
  );

DROP POLICY IF EXISTS comments_staff_moderate ON public.comments;
CREATE POLICY comments_staff_moderate ON public.comments
  FOR UPDATE TO authenticated
  USING (public.can_publish_content())
  WITH CHECK (public.can_publish_content());

DROP POLICY IF EXISTS comments_staff_delete ON public.comments;
CREATE POLICY comments_staff_delete ON public.comments
  FOR DELETE TO authenticated
  USING (public.can_publish_content());

-- story_submissions: Public can insert; only authorized staff can read/update
DROP POLICY IF EXISTS story_submissions_public_insert ON public.story_submissions;
CREATE POLICY story_submissions_public_insert ON public.story_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (consent_given = TRUE AND status = 'Submitted');

DROP POLICY IF EXISTS story_submissions_staff_read ON public.story_submissions;
CREATE POLICY story_submissions_staff_read ON public.story_submissions
  FOR SELECT TO authenticated
  USING (public.can_publish_content() OR public.has_permission('story-submissions'));

DROP POLICY IF EXISTS story_submissions_staff_update ON public.story_submissions;
CREATE POLICY story_submissions_staff_update ON public.story_submissions
  FOR UPDATE TO authenticated
  USING (public.can_publish_content() OR public.has_permission('story-submissions'))
  WITH CHECK (public.can_publish_content() OR public.has_permission('story-submissions'));

-- contact_submissions: Public can insert; only authorized staff can read/update
DROP POLICY IF EXISTS contact_submissions_public_insert ON public.contact_submissions;
CREATE POLICY contact_submissions_public_insert ON public.contact_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'New');

DROP POLICY IF EXISTS contact_submissions_staff_read ON public.contact_submissions;
CREATE POLICY contact_submissions_staff_read ON public.contact_submissions
  FOR SELECT TO authenticated
  USING (public.can_publish_content() OR public.has_permission('contacts'));

DROP POLICY IF EXISTS contact_submissions_staff_update ON public.contact_submissions;
CREATE POLICY contact_submissions_staff_update ON public.contact_submissions
  FOR UPDATE TO authenticated
  USING (public.can_publish_content() OR public.has_permission('contacts'))
  WITH CHECK (public.can_publish_content() OR public.has_permission('contacts'));

-- newsletter_subscribers: Public can insert; staff can view
DROP POLICY IF EXISTS newsletter_public_insert ON public.newsletter_subscribers;
CREATE POLICY newsletter_public_insert ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (LENGTH(TRIM(email)) >= 5);

DROP POLICY IF EXISTS newsletter_staff_read ON public.newsletter_subscribers;
CREATE POLICY newsletter_staff_read ON public.newsletter_subscribers
  FOR SELECT TO authenticated
  USING (public.can_publish_content());

-- scholar_questions & scholar_answers:
-- CRITICAL: Public can ONLY read rows where status = 'Published' AND is_demo = FALSE.
-- Public submissions MUST enter as status = 'Private Submission'.
-- Scholars can update questions up to 'Approved Public Answer', but only Editors/Admins (can_publish_content) can set status = 'Published' or DELETE.
DROP POLICY IF EXISTS scholar_questions_public_read ON public.scholar_questions;
CREATE POLICY scholar_questions_public_read ON public.scholar_questions
  FOR SELECT TO anon, authenticated
  USING (
    (status = 'Published' AND is_demo = FALSE)
    OR public.can_review_scholar_questions()
  );

DROP POLICY IF EXISTS scholar_questions_public_insert ON public.scholar_questions;
CREATE POLICY scholar_questions_public_insert ON public.scholar_questions
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    consent_given = TRUE
    AND status = 'Private Submission'
  );

DROP POLICY IF EXISTS scholar_questions_staff_update ON public.scholar_questions;
CREATE POLICY scholar_questions_staff_update ON public.scholar_questions
  FOR UPDATE TO authenticated
  USING (public.can_review_scholar_questions())
  WITH CHECK (
    public.can_review_scholar_questions()
    AND (
      status <> 'Published'
      OR public.can_publish_content()
    )
  );

DROP POLICY IF EXISTS scholar_questions_staff_delete ON public.scholar_questions;
CREATE POLICY scholar_questions_staff_delete ON public.scholar_questions
  FOR DELETE TO authenticated
  USING (public.can_publish_content());

DROP POLICY IF EXISTS scholar_answers_read ON public.scholar_answers;
CREATE POLICY scholar_answers_read ON public.scholar_answers
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.scholar_questions sq
      WHERE sq.id = scholar_answers.question_id
        AND ((sq.status = 'Published' AND sq.is_demo = FALSE) OR public.can_review_scholar_questions())
    )
  );

DROP POLICY IF EXISTS scholar_answers_staff_write ON public.scholar_answers;
CREATE POLICY scholar_answers_staff_write ON public.scholar_answers
  FOR ALL TO authenticated
  USING (public.can_review_scholar_questions())
  WITH CHECK (public.can_review_scholar_questions());

-- ============================================================================
-- 7. RLS POLICIES: OPPORTUNITIES, MEDIA, SITE SETTINGS & ACTIVITY LOGS
-- ============================================================================

DROP POLICY IF EXISTS opportunity_categories_public_read ON public.opportunity_categories;
CREATE POLICY opportunity_categories_public_read ON public.opportunity_categories
  FOR SELECT TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS opportunities_read ON public.opportunities;
CREATE POLICY opportunities_read ON public.opportunities
  FOR SELECT TO anon, authenticated
  USING (workflow_status = 'Published' OR public.is_active_staff());

DROP POLICY IF EXISTS opportunities_staff_write ON public.opportunities;
CREATE POLICY opportunities_staff_write ON public.opportunities
  FOR ALL TO authenticated
  USING (public.can_publish_content() OR public.has_permission('opportunities'))
  WITH CHECK (public.can_publish_content() OR public.has_permission('opportunities'));

-- media: Public can read public media URLs; staff with 'media' or 'publish_articles' can insert; publishers can delete
DROP POLICY IF EXISTS media_public_read ON public.media;
CREATE POLICY media_public_read ON public.media
  FOR SELECT TO anon, authenticated
  USING (bucket_id <> 'private-submissions' OR public.is_active_staff());

DROP POLICY IF EXISTS media_staff_insert ON public.media;
CREATE POLICY media_staff_insert ON public.media
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_active_staff()
    AND (public.has_permission('media') OR public.can_publish_content())
  );

DROP POLICY IF EXISTS media_staff_delete ON public.media;
CREATE POLICY media_staff_delete ON public.media
  FOR DELETE TO authenticated
  USING (public.can_publish_content());

-- site_settings: Public can read site configuration; Publishers/Settings staff can update
DROP POLICY IF EXISTS site_settings_public_read ON public.site_settings;
CREATE POLICY site_settings_public_read ON public.site_settings
  FOR SELECT TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS site_settings_staff_update ON public.site_settings;
CREATE POLICY site_settings_staff_update ON public.site_settings
  FOR ALL TO authenticated
  USING (public.can_publish_content() OR public.has_permission('settings'))
  WITH CHECK (public.can_publish_content() OR public.has_permission('settings'));

-- admin_activity_logs: Staff can insert own logs and read own logs; Reviewers/Super Admins can read & review all logs
DROP POLICY IF EXISTS activity_logs_select ON public.admin_activity_logs;
CREATE POLICY activity_logs_select ON public.admin_activity_logs
  FOR SELECT TO authenticated
  USING (
    actor_id = auth.uid()
    OR public.can_review_other_admins()
  );

DROP POLICY IF EXISTS activity_logs_insert ON public.admin_activity_logs;
CREATE POLICY activity_logs_insert ON public.admin_activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_active_staff());

DROP POLICY IF EXISTS activity_logs_review_update ON public.admin_activity_logs;
CREATE POLICY activity_logs_review_update ON public.admin_activity_logs
  FOR UPDATE TO authenticated
  USING (public.can_review_other_admins())
  WITH CHECK (public.can_review_other_admins());
