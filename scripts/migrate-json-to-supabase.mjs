#!/usr/bin/env node
/**
 * D2J Media Hub — Complete Idempotent JSON-to-Supabase Migration Script
 *
 * Migrates:
 *   1. Staff accounts (`users`) -> Supabase Auth (`auth.users`) + `public.profiles` + `public.user_roles` + `public.user_permissions` + `public.user_category_scopes`
 *   2. Categories (`categories`) -> `public.categories`
 *   3. Authors (`authors`) -> `public.authors`
 *   4. Tags & Articles (`articles`, `contentBlocks`) -> `public.tags`, `public.articles`, `public.article_content_blocks`, `public.article_tags`, `public.corrections`
 *   5. Opportunities (`opportunities`) -> `public.opportunities`
 *   6. Scholar Q&A (`scholarQuestions`) -> `public.scholar_questions` + `public.scholar_answers`
 *   7. Story & Contact Submissions (`storySubmissions`, `contactSubmissions`) -> `public.story_submissions`, `public.contact_submissions`
 *   8. Reader Comments (`comments`) -> `public.comments`
 *   9. Media Library & Local Files (`media` + `public/uploads/*`) -> Supabase Storage (`article-media`, `article-videos`) + `public.media`
 *  10. Site Settings & Activity Logs (`settings`, `activityLogs`) -> `public.site_settings`, `public.admin_activity_logs`
 *
 * Usage:
 *   node scripts/migrate-json-to-supabase.mjs [--dry-run]
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const isDryRun = process.argv.includes("--dry-run");

const supabaseUrl = (
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

const dbJsonPath = path.join(process.cwd(), "data", "db.json");
const backupDir = path.join(process.cwd(), "data", "backups");

function deterministicUuid(namespace, legacyId) {
  const hash = crypto
    .createHash("sha256")
    .update(`d2j-uuid-v5:${namespace}:${legacyId}`)
    .digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "5" + hash.slice(13, 16),
    ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0") +
      hash.slice(18, 20),
    hash.slice(20, 32),
  ].join("-");
}

function slugifyTag(tag) {
  return (
    String(tag || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 64) || "general"
  );
}

const ROLE_DEFAULT_PERMISSIONS = {
  SUPER_ADMIN: [
    "overview",
    "articles",
    "publish_articles",
    "categories",
    "authors",
    "opportunities",
    "ask-scholar",
    "approved-answers",
    "story-submissions",
    "contacts",
    "media",
    "users",
    "admin-reviews",
    "settings",
  ],
  ADMINISTRATOR: [
    "overview",
    "articles",
    "publish_articles",
    "categories",
    "authors",
    "opportunities",
    "ask-scholar",
    "approved-answers",
    "story-submissions",
    "contacts",
    "media",
    "admin-reviews",
    "settings",
  ],
  EDITOR: [
    "overview",
    "articles",
    "publish_articles",
    "categories",
    "authors",
    "opportunities",
    "ask-scholar",
    "approved-answers",
    "story-submissions",
    "contacts",
    "media",
  ],
  SCHOLAR: ["overview", "ask-scholar", "approved-answers"],
  CONTRIBUTOR: ["overview", "articles", "media"],
};

function computePermissionOverrides(role, userPermissions) {
  const defaults = new Set(ROLE_DEFAULT_PERMISSIONS[role] || ROLE_DEFAULT_PERMISSIONS.CONTRIBUTOR);
  const desired = new Set(Array.isArray(userPermissions) && userPermissions.length > 0 ? userPermissions : defaults);
  const allPerms = ROLE_DEFAULT_PERMISSIONS.SUPER_ADMIN;
  const overrides = [];

  for (const perm of allPerms) {
    if (!defaults.has(perm) && desired.has(perm)) {
      overrides.push({ permission_key: perm, effect: "grant" });
    } else if (defaults.has(perm) && !desired.has(perm)) {
      overrides.push({ permission_key: perm, effect: "revoke" });
    }
  }
  return overrides;
}

async function main() {
  console.log("==================================================================");
  console.log(" D2J Media Hub — JSON to Supabase PostgreSQL & Storage Migration");
  console.log(` Mode: ${isDryRun ? "DRY RUN (Validation & Mapping Only)" : "LIVE MIGRATION"}`);
  console.log("==================================================================");

  if (!fs.existsSync(dbJsonPath)) {
    console.error(`ERROR: Source database not found at ${dbJsonPath}`);
    process.exit(1);
  }

  // 1. Back up the original database non-destructively
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `db.backup-${timestamp}.json`);
  fs.copyFileSync(dbJsonPath, backupPath);
  console.log(`[1/10] Created non-destructive backup: ${backupPath}`);

  // 2. Parse & validate JSON database structure
  const raw = fs.readFileSync(dbJsonPath, "utf8");
  const sourceDb = JSON.parse(raw);

  const deletedSet = new Set(Array.isArray(sourceDb.deletedArticleIds) ? sourceDb.deletedArticleIds : []);
  const sourceCategories = Array.isArray(sourceDb.categories) ? sourceDb.categories : [];
  const sourceAuthors = Array.isArray(sourceDb.authors) ? sourceDb.authors : [];
  const sourceUsers = Array.isArray(sourceDb.users) ? sourceDb.users : [];
  const sourceArticles = (Array.isArray(sourceDb.articles) ? sourceDb.articles : []).filter(
    (a) => a && a.id && !deletedSet.has(a.id)
  );
  const sourceOpportunities = Array.isArray(sourceDb.opportunities) ? sourceDb.opportunities : [];
  const sourceScholarQas = Array.isArray(sourceDb.scholarQuestions) ? sourceDb.scholarQuestions : [];
  const sourceStories = Array.isArray(sourceDb.storySubmissions) ? sourceDb.storySubmissions : [];
  const sourceContacts = Array.isArray(sourceDb.contactSubmissions) ? sourceDb.contactSubmissions : [];
  const sourceComments = Array.isArray(sourceDb.comments) ? sourceDb.comments : [];
  const sourceMedia = Array.isArray(sourceDb.media) ? sourceDb.media : [];
  const sourceLogs = Array.isArray(sourceDb.activityLogs) ? sourceDb.activityLogs : [];
  const sourceSettings = sourceDb.settings || {};

  console.log("[2/10] Validated source JSON inventory:");
  console.log(`  - Categories:          ${sourceCategories.length}`);
  console.log(`  - Authors:             ${sourceAuthors.length}`);
  console.log(`  - Staff Users:         ${sourceUsers.length}`);
  console.log(`  - Articles (active):   ${sourceArticles.length} (skipped ${deletedSet.size} deleted IDs)`);
  console.log(`  - Opportunities:       ${sourceOpportunities.length}`);
  console.log(`  - Scholar Q&As:        ${sourceScholarQas.length}`);
  console.log(`  - Story Submissions:   ${sourceStories.length}`);
  console.log(`  - Contact Submissions: ${sourceContacts.length}`);
  console.log(`  - Reader Comments:     ${sourceComments.length}`);
  console.log(`  - Media Items:         ${sourceMedia.length}`);
  console.log(`  - Activity Logs:       ${sourceLogs.length}`);

  if (isDryRun) {
    console.log("\nDry-run validation succeeded. Run without --dry-run once SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
    return;
  }

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "\nERROR: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY must be set to execute a live migration."
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const stats = {
    categories: { ok: 0, fail: 0 },
    users: { ok: 0, fail: 0 },
    authors: { ok: 0, fail: 0 },
    articles: { ok: 0, fail: 0 },
    blocks: { ok: 0, fail: 0 },
    tags: { ok: 0, fail: 0 },
    opportunities: { ok: 0, fail: 0 },
    scholarQas: { ok: 0, fail: 0 },
    stories: { ok: 0, fail: 0 },
    contacts: { ok: 0, fail: 0 },
    comments: { ok: 0, fail: 0 },
    media: { ok: 0, fail: 0 },
    logs: { ok: 0, fail: 0 },
  };

  // 3. Migrate Categories first (referenced by user_category_scopes and articles)
  console.log("[3/10] Migrating categories...");
  const validCategorySlugs = new Set();
  for (let idx = 0; idx < sourceCategories.length; idx++) {
    const c = sourceCategories[idx];
    validCategorySlugs.add(c.slug);
    const { error } = await supabase.from("categories").upsert(
      {
        slug: c.slug,
        name: c.name,
        description: c.description || "",
        topics: Array.isArray(c.topics) ? c.topics : ["All"],
        display_order: idx,
      },
      { onConflict: "slug" }
    );
    if (error) {
      console.error(`  ! Failed category ${c.slug}:`, error.message);
      stats.categories.fail++;
    } else {
      stats.categories.ok++;
    }
  }

  // 4. Migrate Staff Users into Supabase Auth (auth.users) + profiles + user_roles + user_permissions + user_category_scopes
  console.log("[4/10] Provisioning staff accounts in Supabase Auth & profiles...");
  const legacyUserIdToUuid = new Map();
  const { data: existingAuthList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existingAuthByEmail = new Map(
    (existingAuthList?.users || []).map((u) => [(u.email || "").toLowerCase().trim(), u])
  );

  const defaultSuperAdminPassword =
    process.env.D2J_INITIAL_SUPER_ADMIN_PASSWORD ||
    process.env.D2J_ADMIN_PASSWORD ||
    crypto.randomBytes(16).toString("base64url") + "A1!";
  const defaultStaffPassword =
    process.env.D2J_INITIAL_STAFF_DEFAULT_PASSWORD ||
    crypto.randomBytes(16).toString("base64url") + "S1!";

  for (const u of sourceUsers) {
    const cleanEmail = String(u.email || "").toLowerCase().trim();
    if (!cleanEmail) continue;

    let authUserId = existingAuthByEmail.get(cleanEmail)?.id;
    if (!authUserId) {
      const initialPassword =
        u.id === "usr-admin" || u.role === "SUPER_ADMIN"
          ? defaultSuperAdminPassword
          : defaultStaffPassword;

      const { data: createdAuth, error: createAuthErr } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password: initialPassword,
        email_confirm: true,
        user_metadata: {
          name: u.name,
          title: u.title,
          legacy_id: u.id,
        },
      });

      if (createAuthErr || !createdAuth?.user) {
        console.error(`  ! Failed to create Supabase Auth user for ${cleanEmail}:`, createAuthErr?.message);
        stats.users.fail++;
        continue;
      }
      authUserId = createdAuth.user.id;
    }

    legacyUserIdToUuid.set(u.id, authUserId);
    const isSuper = Boolean(u.isSuperAdmin || u.role === "SUPER_ADMIN" || u.id === "usr-admin");
    const allowedCats = Array.isArray(u.allowedCategories) ? u.allowedCategories : ["ALL"];
    const allCatsAccess = isSuper || allowedCats.includes("ALL");

    const { error: profErr } = await supabase.from("profiles").upsert(
      {
        id: authUserId,
        legacy_id: u.id,
        email: cleanEmail,
        name: u.name,
        title: u.title || "Staff Member",
        primary_role: u.role,
        is_super_admin: isSuper,
        active: u.active !== false,
        all_categories_access: allCatsAccess,
        created_by_name: u.createdBy || "System Migration",
        last_login_at: u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : null,
      },
      { onConflict: "id" }
    );

    if (profErr) {
      console.error(`  ! Failed to upsert profile for ${cleanEmail}:`, profErr.message);
      stats.users.fail++;
      continue;
    }

    // Sync user_roles
    await supabase
      .from("user_roles")
      .upsert({ user_id: authUserId, role_name: u.role }, { onConflict: "user_id,role_name" });

    // Sync user_permissions overrides
    const overrides = computePermissionOverrides(u.role, u.permissions);
    await supabase.from("user_permissions").delete().eq("user_id", authUserId);
    if (overrides.length > 0) {
      await supabase.from("user_permissions").insert(
        overrides.map((ov) => ({
          user_id: authUserId,
          permission_key: ov.permission_key,
          effect: ov.effect,
        }))
      );
    }

    // Sync user_category_scopes
    await supabase.from("user_category_scopes").delete().eq("user_id", authUserId);
    if (!allCatsAccess) {
      const validScoped = allowedCats.filter((slug) => validCategorySlugs.has(slug));
      if (validScoped.length > 0) {
        await supabase.from("user_category_scopes").insert(
          validScoped.map((slug) => ({
            user_id: authUserId,
            category_slug: slug,
          }))
        );
      }
    }

    stats.users.ok++;
  }

  // 5. Migrate Authors
  console.log("[5/10] Migrating authors...");
  const legacyAuthorIdToUuid = new Map();
  for (const a of sourceAuthors) {
    const authorUuid = deterministicUuid("author", a.id);
    legacyAuthorIdToUuid.set(a.id, authorUuid);
    const { error } = await supabase.from("authors").upsert(
      {
        id: authorUuid,
        legacy_id: a.id,
        name: a.name,
        role: a.role || "Staff Writer",
        bio: a.bio || "",
        avatar_initials: a.avatarInitials || "DJ",
        verified_credentials: a.verifiedCredentials || null,
      },
      { onConflict: "id" }
    );
    if (error) {
      console.error(`  ! Failed author ${a.id}:`, error.message);
      stats.authors.fail++;
    } else {
      stats.authors.ok++;
    }
  }

  // 6. Migrate Articles, Content Blocks, Tags & Corrections
  console.log("[6/10] Migrating articles, content blocks, tags, and corrections...");
  const legacyArticleIdToUuid = new Map();
  const tagSlugToUuid = new Map();

  for (const art of sourceArticles) {
    const articleUuid = deterministicUuid("article", art.id);
    legacyArticleIdToUuid.set(art.id, articleUuid);

    const isDemo = art.verification === "D" || /^demo(\s+opinion)?:/i.test(art.title || "");
    const effectiveStatus = isDemo ? "Draft" : art.status;
    const categorySlug = validCategorySlugs.has(art.category) ? art.category : "news";
    const authorUuid = legacyAuthorIdToUuid.get(art.authorId) || null;
    const authorProfileUuid = legacyUserIdToUuid.get(art.authorId) || null;
    const lastEditedByUuid = art.lastEditedById
      ? legacyUserIdToUuid.get(art.lastEditedById) || null
      : null;
    const approvedByUuid = art.approvedById
      ? legacyUserIdToUuid.get(art.approvedById) || null
      : null;

    const { error: artErr } = await supabase.from("articles").upsert(
      {
        id: articleUuid,
        legacy_id: art.id,
        slug: art.slug,
        title: art.title,
        summary: art.summary || "",
        body_paragraphs: Array.isArray(art.body) ? art.body : [],
        category_slug: categorySlug,
        author_id: authorUuid,
        author_profile_id: authorProfileUuid,
        author_legacy_id: art.authorId || null,
        author_name: art.authorName || "D2J Editorial Desk",
        art_theme: art.artTheme || "campus",
        featured_image: art.featuredImage || null,
        featured_video: art.featuredVideo || null,
        image_caption: art.imageCaption || null,
        verification: art.verification || "V",
        source_name: art.sourceName || null,
        source_url: art.sourceUrl || null,
        status: effectiveStatus,
        featured: isDemo ? false : Boolean(art.featured),
        breaking: isDemo ? false : Boolean(art.breaking),
        views: Number(art.views || 0),
        seo_title: art.seoTitle || null,
        seo_description: art.seoDescription || null,
        correction_note: art.correctionNote || null,
        last_edited_by_name: art.lastEditedBy || null,
        last_edited_by_id: lastEditedByUuid,
        last_edited_by_legacy_id: art.lastEditedById || null,
        approved_by_name: art.approvedBy || null,
        approved_by_id: approvedByUuid,
        approved_by_legacy_id: art.approvedById || null,
        published_date: art.publishedAt || "2026-10-26",
        updated_date: art.updatedAt || art.publishedAt || "2026-10-26",
        published_at: art.publishedAt ? new Date(`${art.publishedAt}T09:00:00Z`).toISOString() : new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (artErr) {
      console.error(`  ! Failed article ${art.id} (${art.slug}):`, artErr.message);
      stats.articles.fail++;
      continue;
    }
    stats.articles.ok++;

    // Content Blocks: use existing contentBlocks or synthesize paragraph blocks from art.body
    const blocks =
      Array.isArray(art.contentBlocks) && art.contentBlocks.length > 0
        ? art.contentBlocks
        : (Array.isArray(art.body) ? art.body : []).map((text, idx) => ({
            id: `blk-${art.id}-${idx + 1}`,
            type: "paragraph",
            text,
          }));

    await supabase.from("article_content_blocks").delete().eq("article_id", articleUuid);
    if (blocks.length > 0) {
      const blockRows = blocks.map((b, idx) => ({
        id: deterministicUuid("block", `${art.id}:${b.id || idx}`),
        legacy_block_id: b.id || `blk-${idx}`,
        article_id: articleUuid,
        position: idx,
        type: b.type || "paragraph",
        text: b.text ?? null,
        image_url: b.imageUrl || null,
        image_caption: b.imageCaption || null,
        second_image_url: b.secondImageUrl || null,
        second_image_caption: b.secondImageCaption || null,
        video_url: b.videoUrl || null,
        quote_attribution: b.quoteAttribution || null,
      }));
      const { error: blkErr } = await supabase.from("article_content_blocks").insert(blockRows);
      if (blkErr) {
        console.error(`  ! Failed content blocks for ${art.slug}:`, blkErr.message);
        stats.blocks.fail += blockRows.length;
      } else {
        stats.blocks.ok += blockRows.length;
      }
    }

    // Tags & Article Tags
    const tags = Array.isArray(art.tags) ? art.tags.filter(Boolean) : [];
    await supabase.from("article_tags").delete().eq("article_id", articleUuid);
    for (let tIdx = 0; tIdx < tags.length; tIdx++) {
      const tagName = String(tags[tIdx]).trim();
      const tagSlug = slugifyTag(tagName);
      if (!tagName) continue;

      let tagUuid = tagSlugToUuid.get(tagSlug);
      if (!tagUuid) {
        tagUuid = deterministicUuid("tag", tagSlug);
        const { data: upsertedTag, error: tagErr } = await supabase
          .from("tags")
          .upsert({ id: tagUuid, name: tagName, slug: tagSlug }, { onConflict: "slug" })
          .select("id")
          .single();
        if (!tagErr && upsertedTag) {
          tagUuid = upsertedTag.id;
          tagSlugToUuid.set(tagSlug, tagUuid);
          stats.tags.ok++;
        }
      }
      if (tagUuid) {
        await supabase
          .from("article_tags")
          .upsert(
            { article_id: articleUuid, tag_id: tagUuid, position: tIdx },
            { onConflict: "article_id,tag_id" }
          );
      }
    }

    // Corrections
    if (art.correctionNote && art.correctionNote.trim()) {
      await supabase.from("corrections").upsert(
        {
          id: deterministicUuid("correction", art.id),
          article_id: articleUuid,
          note: art.correctionNote.trim(),
          created_by_name: art.lastEditedBy || art.authorName || "D2J Editorial Desk",
        },
        { onConflict: "id" }
      );
    }
  }

  // 7. Migrate Opportunities
  console.log("[7/10] Migrating opportunities...");
  for (const opp of sourceOpportunities) {
    const oppUuid = deterministicUuid("opportunity", opp.id);
    const { error } = await supabase.from("opportunities").upsert(
      {
        id: oppUuid,
        legacy_id: opp.id,
        slug: opp.slug,
        title: opp.title,
        provider: opp.provider,
        type: opp.type || "Scholarship",
        summary: opp.summary,
        eligibility: opp.eligibility,
        benefits: opp.benefits,
        deadline: opp.deadline,
        official_url: opp.officialUrl,
        source_name: opp.sourceName,
        open_closed_status: opp.openClosedStatus || "Open",
        last_verified: opp.lastVerified,
        notes: opp.notes,
        workflow_status: opp.workflowStatus || "Published",
      },
      { onConflict: "id" }
    );
    if (error) {
      console.error(`  ! Failed opportunity ${opp.id}:`, error.message);
      stats.opportunities.fail++;
    } else {
      stats.opportunities.ok++;
    }
  }

  // 8. Migrate Scholar Questions & Scholar Answers
  console.log("[8/10] Migrating Ask a Scholar questions & answers...");
  for (const qa of sourceScholarQas) {
    const qaUuid = deterministicUuid("scholar_qa", qa.id);
    const isDemo = Boolean(qa.isDemo || /^demo\s+question:/i.test(qa.subject || ""));
    const effectiveStatus = isDemo && qa.status === "Published" ? "Editorial Screening" : qa.status;

    const { error: qErr } = await supabase.from("scholar_questions").upsert(
      {
        id: qaUuid,
        legacy_id: qa.id,
        slug: qa.slug,
        topic: qa.topic,
        subject: qa.subject,
        question_text: qa.questionText,
        public_question_summary: qa.publicQuestionSummary || null,
        display_name: qa.displayName || null,
        email: qa.email || null,
        anonymous_preference: qa.anonymousPreference !== false,
        consent_given: qa.consentGiven !== false,
        status: effectiveStatus,
        is_demo: isDemo,
        submitted_at: qa.submittedAt ? new Date(qa.submittedAt).toISOString() : new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (qErr) {
      console.error(`  ! Failed scholar question ${qa.id}:`, qErr.message);
      stats.scholarQas.fail++;
      continue;
    }

    if (
      (Array.isArray(qa.answerText) && qa.answerText.length > 0) ||
      qa.scholarReviewerName ||
      qa.editorApproverName
    ) {
      await supabase.from("scholar_answers").upsert(
        {
          id: deterministicUuid("scholar_answer", qa.id),
          question_id: qaUuid,
          answer_text: Array.isArray(qa.answerText) ? qa.answerText : [],
          references_list: Array.isArray(qa.references) ? qa.references : [],
          scholar_reviewer_name: qa.scholarReviewerName || null,
          scholar_credentials: qa.scholarCredentials || null,
          editor_approver_name: qa.editorApproverName || null,
          reviewed_date: qa.reviewedAt || null,
          published_date: qa.publishedAt || null,
        },
        { onConflict: "question_id" }
      );
    }

    stats.scholarQas.ok++;
  }

  // 9. Migrate Story Submissions, Contact Submissions, and Reader Comments
  console.log("[9/10] Migrating submissions and reader comments...");
  for (const s of sourceStories) {
    const { error } = await supabase.from("story_submissions").upsert(
      {
        id: deterministicUuid("story", s.id),
        legacy_id: s.id,
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
        attachments: Array.isArray(s.attachments) ? s.attachments : [],
        consent_given: s.consentGiven !== false,
        status: s.status || "Submitted",
        editor_notes: s.editorNotes || null,
        submitted_at: s.submittedAt ? new Date(s.submittedAt).toISOString() : new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    if (error) stats.stories.fail++;
    else stats.stories.ok++;
  }

  for (const c of sourceContacts) {
    const { error } = await supabase.from("contact_submissions").upsert(
      {
        id: deterministicUuid("contact", c.id),
        legacy_id: c.id,
        name: c.name,
        email: c.email,
        enquiry_type: c.enquiryType,
        organisation: c.organisation || null,
        subject: c.subject || null,
        article_url: c.articleUrl || null,
        message: c.message,
        status: c.status || "New",
        submitted_at: c.submittedAt ? new Date(c.submittedAt).toISOString() : new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    if (error) stats.contacts.fail++;
    else stats.contacts.ok++;
  }

  for (const cmt of sourceComments) {
    const targetArticleUuid =
      legacyArticleIdToUuid.get(cmt.articleId) ||
      (sourceArticles.find((a) => a.slug === cmt.articleSlug)
        ? legacyArticleIdToUuid.get(sourceArticles.find((a) => a.slug === cmt.articleSlug).id)
        : null);

    if (!targetArticleUuid) continue;

    const { error } = await supabase.from("comments").upsert(
      {
        id: deterministicUuid("comment", cmt.id),
        legacy_id: cmt.id,
        article_id: targetArticleUuid,
        article_slug: cmt.articleSlug,
        article_title: cmt.articleTitle || "Article Discussion",
        author_name: cmt.authorName,
        author_email: cmt.authorEmail || null,
        location_or_campus: cmt.locationOrCampus || null,
        content: cmt.content,
        status: cmt.status || "Approved",
        created_at: cmt.createdAt ? new Date(cmt.createdAt).toISOString() : new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    if (error) stats.comments.fail++;
    else stats.comments.ok++;
  }

  // 10. Migrate Media Library, Site Settings & Admin Activity Logs
  console.log("[10/10] Migrating media library, site settings, and activity logs...");
  for (const m of sourceMedia) {
    const isVideo = /\.(mp4|webm|ogg|mov|m4v)$/i.test(m.filename || m.url || "");
    const bucketId = isVideo ? "article-videos" : "article-media";
    let finalUrl = m.url;
    let storagePath = m.filename;

    // If local file exists in public/uploads, upload to Supabase Storage bucket
    if (m.url && m.url.startsWith("/uploads/")) {
      const localFile = path.join(process.cwd(), "public", m.url);
      if (fs.existsSync(localFile)) {
        const buf = fs.readFileSync(localFile);
        const ext = path.extname(localFile).slice(1).toLowerCase();
        const mime = isVideo
          ? `video/${ext === "mov" ? "quicktime" : ext}`
          : `image/${ext === "jpg" ? "jpeg" : ext}`;
        const { error: upErr } = await supabase.storage
          .from(bucketId)
          .upload(m.filename, buf, { contentType: mime, upsert: true });
        if (!upErr) {
          const { data: pubUrl } = supabase.storage.from(bucketId).getPublicUrl(m.filename);
          if (pubUrl?.publicUrl) {
            finalUrl = pubUrl.publicUrl;
          }
        }
      }
    }

    const { error } = await supabase.from("media").upsert(
      {
        id: deterministicUuid("media", m.id),
        legacy_id: m.id,
        bucket_id: bucketId,
        storage_path: storagePath,
        filename: m.filename,
        url: finalUrl,
        caption: m.caption || "",
        credit: m.credit || "D2J Media Hub",
        uploaded_by_name: m.uploadedBy || "System",
        uploaded_date: m.uploadedAt || "2026-10-25",
      },
      { onConflict: "id" }
    );
    if (error) stats.media.fail++;
    else stats.media.ok++;
  }

  await supabase.from("site_settings").upsert(
    {
      id: 1,
      site_name: sourceSettings.siteName || "D-Path to Jannah Media Hub",
      short_name: sourceSettings.shortName || "D2J Media Hub",
      tagline: sourceSettings.tagline || "Voice in propagation of the truth",
      breaking_news_enabled: sourceSettings.breakingNewsEnabled !== false,
      breaking_news_text: sourceSettings.breakingNewsText || "",
      breaking_news_url: sourceSettings.breakingNewsUrl || "/news",
      newsletter_provider_configured: Boolean(sourceSettings.newsletterProviderConfigured),
      newsletter_provider_name:
        sourceSettings.newsletterProviderName || "Pending Provider Configuration",
      official_email: sourceSettings.officialEmail || "[Official email address, to be supplied]",
      business_email: sourceSettings.businessEmail || "[Business enquiries contact, to be supplied]",
      office_location:
        sourceSettings.officeLocation || "[Office location, only if officially supplied]",
      social_links: sourceSettings.socialLinks || { facebook: "#", x: "#", whatsapp: "#" },
    },
    { onConflict: "id" }
  );

  for (const l of sourceLogs) {
    const actorUuid = legacyUserIdToUuid.get(l.actorId) || null;
    const { error } = await supabase.from("admin_activity_logs").upsert(
      {
        id: deterministicUuid("log", l.id),
        legacy_id: l.id,
        actor_id: actorUuid,
        actor_legacy_id: l.actorId || null,
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
        reviewed_date: l.reviewedAt || null,
        created_at: l.createdAt ? new Date(l.createdAt).toISOString() : new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    if (error) stats.logs.fail++;
    else stats.logs.ok++;
  }

  console.log("\n==================================================================");
  console.log(" Migration Summary Report");
  console.log("==================================================================");
  for (const [key, val] of Object.entries(stats)) {
    console.log(`  - ${key.padEnd(16)}: ${val.ok} succeeded, ${val.fail} failed`);
  }
  console.log("==================================================================");
}

main().catch((err) => {
  console.error("Fatal migration error:", err);
  process.exit(1);
});
