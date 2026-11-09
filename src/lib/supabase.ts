import type { DatabaseSchema } from "./db";

export function getSupabaseConfig(): { url: string; serviceRoleKey: string } | null {
  const url = (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "");
  const serviceRoleKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    ""
  ).trim();

  if (!url || !serviceRoleKey) {
    return null;
  }
  return { url, serviceRoleKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

function getHeaders(serviceRoleKey: string, extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

/**
 * Fetch the persisted DatabaseSchema from Supabase PostgreSQL (`public.d2j_app_state`).
 * If the table exists but has no row yet, seeds `singleton` non-destructively from `fallbackInitial`.
 */
export async function loadStateFromSupabase(
  fallbackInitial?: DatabaseSchema
): Promise<DatabaseSchema | null> {
  const cfg = getSupabaseConfig();
  if (!cfg) return null;

  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/d2j_app_state?id=eq.singleton&select=state`,
      {
        method: "GET",
        headers: getHeaders(cfg.serviceRoleKey),
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return null;
    }

    const rows = (await res.json()) as { state: DatabaseSchema }[];
    if (Array.isArray(rows) && rows.length > 0 && rows[0]?.state) {
      return rows[0].state;
    }

    // If table is empty on first connection and we have initial seed data, migrate safely (DO NOTHING on conflict)
    if (fallbackInitial) {
      await saveStateToSupabase(fallbackInitial, true);
      return fallbackInitial;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Persist DatabaseSchema to Supabase PostgreSQL (`public.d2j_app_state` + relational tables).
 * When `onlyIfEmpty` is true, uses `resolution=ignore-duplicates` so existing production data is never overwritten.
 */
export async function saveStateToSupabase(
  data: DatabaseSchema,
  onlyIfEmpty = false
): Promise<boolean> {
  const cfg = getSupabaseConfig();
  if (!cfg) return false;

  try {
    const prefer = onlyIfEmpty
      ? "resolution=ignore-duplicates,return=minimal"
      : "resolution=merge-duplicates,return=minimal";

    // 1. Upsert atomic full state into d2j_app_state
    const stateRes = await fetch(`${cfg.url}/rest/v1/d2j_app_state`, {
      method: "POST",
      headers: getHeaders(cfg.serviceRoleKey, { Prefer: prefer }),
      body: JSON.stringify({
        id: "singleton",
        state: data,
        updated_at: new Date().toISOString(),
      }),
    });

    // 2. Mirror relational tables in background for SQL analytics & direct relational queries
    await syncRelationalTables(cfg.url, cfg.serviceRoleKey, data, prefer);

    return stateRes.ok;
  } catch {
    return false;
  }
}

async function syncRelationalTables(
  url: string,
  key: string,
  data: DatabaseSchema,
  prefer: string
): Promise<void> {
  const headers = getHeaders(key, { Prefer: prefer });

  const tasks: Promise<unknown>[] = [];

  if (Array.isArray(data.categories) && data.categories.length > 0) {
    tasks.push(
      fetch(`${url}/rest/v1/categories`, {
        method: "POST",
        headers,
        body: JSON.stringify(
          data.categories.map((c) => ({
            slug: c.slug,
            name: c.name,
            description: c.description,
            topics: c.topics,
          }))
        ),
      }).catch(() => null)
    );
  }

  if (Array.isArray(data.users) && data.users.length > 0) {
    tasks.push(
      fetch(`${url}/rest/v1/users`, {
        method: "POST",
        headers,
        body: JSON.stringify(
          data.users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            title: u.title,
            password_hash: u.passwordHash,
            active: u.active,
            is_super_admin: Boolean(u.isSuperAdmin),
            permissions: u.permissions || [],
            allowed_categories: u.allowedCategories || ["ALL"],
            created_by: u.createdBy || null,
            last_login_at: u.lastLoginAt || null,
          }))
        ),
      }).catch(() => null)
    );
  }

  if (Array.isArray(data.articles) && data.articles.length > 0) {
    tasks.push(
      fetch(`${url}/rest/v1/articles`, {
        method: "POST",
        headers,
        body: JSON.stringify(
          data.articles.map((a) => ({
            id: a.id,
            slug: a.slug,
            title: a.title,
            summary: a.summary,
            body: a.body,
            category: a.category,
            tags: a.tags,
            author_id: a.authorId,
            author_name: a.authorName,
            published_at: a.publishedAt,
            updated_at: a.updatedAt,
            art_theme: a.artTheme,
            featured_image: a.featuredImage || null,
            featured_video: a.featuredVideo || null,
            image_caption: a.imageCaption || null,
            verification: a.verification,
            status: a.status,
            featured: Boolean(a.featured),
            breaking: Boolean(a.breaking),
            views: a.views || 1,
            source_name: a.sourceName || null,
            source_url: a.sourceUrl || null,
            correction_note: a.correctionNote || null,
            seo_title: a.seoTitle || null,
            seo_description: a.seoDescription || null,
            last_edited_by: a.lastEditedBy || null,
            last_edited_by_id: a.lastEditedById || null,
            approved_by: a.approvedBy || null,
            approved_by_id: a.approvedById || null,
          }))
        ),
      }).catch(() => null)
    );
  }

  if (Array.isArray(data.opportunities) && data.opportunities.length > 0) {
    tasks.push(
      fetch(`${url}/rest/v1/opportunities`, {
        method: "POST",
        headers,
        body: JSON.stringify(
          data.opportunities.map((o) => ({
            id: o.id,
            slug: o.slug,
            title: o.title,
            provider: o.provider,
            type: o.type,
            summary: o.summary,
            eligibility: o.eligibility,
            benefits: o.benefits,
            deadline: o.deadline,
            official_url: o.officialUrl,
            source_name: o.sourceName,
            open_closed_status: o.openClosedStatus,
            last_verified: o.lastVerified,
            notes: o.notes,
            workflow_status: o.workflowStatus,
          }))
        ),
      }).catch(() => null)
    );
  }

  if (Array.isArray(data.scholarQuestions) && data.scholarQuestions.length > 0) {
    tasks.push(
      fetch(`${url}/rest/v1/scholar_questions`, {
        method: "POST",
        headers,
        body: JSON.stringify(
          data.scholarQuestions.map((q) => ({
            id: q.id,
            slug: q.slug,
            topic: q.topic,
            subject: q.subject,
            question_text: q.questionText,
            public_question_summary: q.publicQuestionSummary || null,
            display_name: q.displayName || null,
            email: q.email || null,
            anonymous_preference: q.anonymousPreference,
            consent_given: q.consentGiven,
            submitted_at: q.submittedAt,
            status: q.status,
            answer_text: q.answerText || [],
            references_list: q.references || [],
            scholar_reviewer_name: q.scholarReviewerName || null,
            scholar_credentials: q.scholarCredentials || null,
            editor_approver_name: q.editorApproverName || null,
            reviewed_at: q.reviewedAt || null,
            published_at: q.publishedAt || null,
            is_demo: Boolean(q.isDemo),
          }))
        ),
      }).catch(() => null)
    );
  }

  if (Array.isArray(data.storySubmissions) && data.storySubmissions.length > 0) {
    tasks.push(
      fetch(`${url}/rest/v1/story_submissions`, {
        method: "POST",
        headers,
        body: JSON.stringify(
          data.storySubmissions.map((s) => ({
            id: s.id,
            contributor_name: s.contributorName,
            email: s.email,
            institution: s.institution || null,
            location: s.location || null,
            phone: s.phone || null,
            category: s.category,
            headline: s.headline,
            summary: s.summary,
            body: s.body,
            preferred_byline: s.preferredByline || null,
            source_links: s.sourceLinks || null,
            attachments: s.attachments || [],
            consent_given: s.consentGiven,
            submitted_at: s.submittedAt,
            status: s.status,
            editor_notes: s.editorNotes || null,
          }))
        ),
      }).catch(() => null)
    );
  }

  if (Array.isArray(data.contactSubmissions) && data.contactSubmissions.length > 0) {
    tasks.push(
      fetch(`${url}/rest/v1/contact_submissions`, {
        method: "POST",
        headers,
        body: JSON.stringify(
          data.contactSubmissions.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            enquiry_type: c.enquiryType,
            organisation: c.organisation || null,
            subject: c.subject || null,
            article_url: c.articleUrl || null,
            message: c.message,
            submitted_at: c.submittedAt,
            status: c.status,
          }))
        ),
      }).catch(() => null)
    );
  }

  if (Array.isArray(data.media) && data.media.length > 0) {
    tasks.push(
      fetch(`${url}/rest/v1/media`, {
        method: "POST",
        headers,
        body: JSON.stringify(
          data.media.map((m) => ({
            id: m.id,
            filename: m.filename,
            url: m.url,
            caption: m.caption,
            credit: m.credit,
            uploaded_at: m.uploadedAt,
            uploaded_by: m.uploadedBy,
          }))
        ),
      }).catch(() => null)
    );
  }

  if (Array.isArray(data.activityLogs) && data.activityLogs.length > 0) {
    tasks.push(
      fetch(`${url}/rest/v1/admin_activity_logs`, {
        method: "POST",
        headers,
        body: JSON.stringify(
          data.activityLogs.map((l) => ({
            id: l.id,
            actor_id: l.actorId,
            actor_name: l.actorName,
            actor_email: l.actorEmail,
            actor_role: l.actorRole,
            action: l.action,
            target_type: l.targetType,
            target_id: l.targetId || null,
            target_title: l.targetTitle,
            status_change: l.statusChange || null,
            details: l.details || null,
            super_admin_review_status: l.superAdminReviewStatus || "Pending Review",
            super_admin_review_note: l.superAdminReviewNote || null,
            reviewed_by_super_admin: l.reviewedBySuperAdmin || null,
            reviewed_at: l.reviewedAt || null,
            created_at: l.createdAt,
          }))
        ),
      }).catch(() => null)
    );
  }

  await Promise.allSettled(tasks);
}

/**
 * Upload a media file to durable Supabase Storage (`d2j-media` bucket) when configured.
 * Returns the permanent public URL, or null if Supabase Storage is not configured.
 */
export async function uploadToSupabaseStorage(
  filename: string,
  buffer: Buffer,
  contentType: string
): Promise<string | null> {
  const cfg = getSupabaseConfig();
  if (!cfg) return null;

  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "d2j-media";
  try {
    // Ensure bucket exists (idempotent)
    await fetch(`${cfg.url}/storage/v1/bucket`, {
      method: "POST",
      headers: getHeaders(cfg.serviceRoleKey),
      body: JSON.stringify({ id: bucket, name: bucket, public: true }),
    }).catch(() => null);

    const uploadRes = await fetch(
      `${cfg.url}/storage/v1/object/${bucket}/${encodeURIComponent(filename)}`,
      {
        method: "POST",
        headers: {
          apikey: cfg.serviceRoleKey,
          Authorization: `Bearer ${cfg.serviceRoleKey}`,
          "Content-Type": contentType,
          "x-upsert": "true",
        },
        body: new Uint8Array(buffer),
      }
    );

    if (!uploadRes.ok) {
      return null;
    }

    return `${cfg.url}/storage/v1/object/public/${bucket}/${encodeURIComponent(filename)}`;
  } catch {
    return null;
  }
}
