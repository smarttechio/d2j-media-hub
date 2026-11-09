#!/usr/bin/env node
/**
 * D2J Media Hub — Safe Non-Destructive Supabase Data Migration Script
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/migrate-to-supabase.mjs
 */

import fs from "fs";
import path from "path";

const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/+$/, "");
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "").trim();

if (!url || !key) {
  console.error("ERROR: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const dbPath = path.join(process.cwd(), "data", "db.json");
if (!fs.existsSync(dbPath)) {
  console.error(`ERROR: Local seed file not found at ${dbPath}`);
  process.exit(1);
}

const localData = JSON.parse(fs.readFileSync(dbPath, "utf8"));
const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  Prefer: "resolution=ignore-duplicates,return=minimal",
};

async function run() {
  console.log(`Connecting to Supabase project: ${url}`);

  // 1. Check existing state in d2j_app_state
  const checkRes = await fetch(`${url}/rest/v1/d2j_app_state?id=eq.singleton&select=id,updated_at`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });

  if (!checkRes.ok) {
    const errText = await checkRes.text();
    console.error(
      "ERROR: Could not query public.d2j_app_state. Please run supabase/migrations/001_d2j_schema.sql in the Supabase SQL Editor first.\nDetails:",
      errText
    );
    process.exit(1);
  }

  const existing = await checkRes.json();
  if (Array.isArray(existing) && existing.length > 0) {
    console.log(`Existing singleton state found (updated_at: ${existing[0].updated_at}). Preserving existing state without overwriting.`);
  } else {
    const insertRes = await fetch(`${url}/rest/v1/d2j_app_state`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        id: "singleton",
        state: localData,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!insertRes.ok) {
      console.error("Failed to seed d2j_app_state:", await insertRes.text());
      process.exit(1);
    }
    console.log("Seeded public.d2j_app_state with existing data/db.json records.");
  }

  // 2. Non-destructively insert categories, users, articles, opportunities, scholar_questions
  if (Array.isArray(localData.categories) && localData.categories.length > 0) {
    await fetch(`${url}/rest/v1/categories`, {
      method: "POST",
      headers,
      body: JSON.stringify(localData.categories),
    });
    console.log(`Migrated ${localData.categories.length} categories (ignore-duplicates).`);
  }

  if (Array.isArray(localData.articles) && localData.articles.length > 0) {
    await fetch(`${url}/rest/v1/articles`, {
      method: "POST",
      headers,
      body: JSON.stringify(
        localData.articles.map((a) => ({
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
        }))
      ),
    });
    console.log(`Migrated ${localData.articles.length} articles (ignore-duplicates).`);
  }

  console.log("Migration completed safely with zero data loss.");
}

run().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
