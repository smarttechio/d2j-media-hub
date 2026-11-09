# D2J Media Hub — GitHub & Production Deployment Guide

> **Important Governance Rule:** Do not publicly deploy or provision billable cloud resources without explicit stakeholder approval.

---

## 1. Push Project to GitHub

Open PowerShell or Terminal inside `c:\Users\HP\Downloads\Dpj\d2j-media-hub` and run:

```powershell
cd "c:\Users\HP\Downloads\Dpj\d2j-media-hub"

# 1. Stage all project files
git add .

# 2. Create your release commit
git commit -m "Complete D2J Media Hub full-stack application with Super Admin RBAC"

# 3. Connect your GitHub repository (create a new empty repo on https://github.com/new first)
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/d2j-media-hub.git

# 4. Push to GitHub
git push -u origin main
```

---

## 2. Environment Variables (`.env.local` / Hosting Dashboard)

See [`.env.example`](file:///c:/Users/HP/Downloads/Dpj/d2j-media-hub/.env.example) for the complete template. Set the following variables in your hosting provider's **Environment Variables** panel before going live:

```env
# Public Canonical Site URL (used by sitemap.xml, robots.txt, and Open Graph metadata)
NEXT_PUBLIC_SITE_URL=https://d2j-media-hub.vercel.app

# Supabase PostgreSQL & Durable Storage (Required for permanent persistence on Vercel)
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret_key
SUPABASE_STORAGE_BUCKET=d2j-media

# HMAC-SHA256 Secret for HTTP-Only Editorial Session Cookies
D2J_SESSION_SECRET=replace_with_64_char_random_hex_secret

# Initial Super Admin & Staff Credentials
D2J_ADMIN_EMAIL=admin@d2jmediahub.com
D2J_ADMIN_PASSWORD=replace_with_strong_super_admin_password

D2J_EDITOR_EMAIL=editor@d2jmediahub.com
D2J_EDITOR_PASSWORD=replace_with_strong_editor_password

D2J_CONTRIBUTOR_EMAIL=campus@d2jmediahub.com
D2J_CONTRIBUTOR_PASSWORD=replace_with_strong_contributor_password

D2J_SCHOLAR_EMAIL=scholars@d2jmediahub.com
D2J_SCHOLAR_PASSWORD=replace_with_strong_scholar_password
```

---

## 3. Supabase PostgreSQL & Storage Migration (Non-Destructive)

1. Open your Supabase project dashboard → **SQL Editor**.
2. Paste and run [`supabase/migrations/001_d2j_schema.sql`](file:///c:/Users/HP/Downloads/Dpj/d2j-media-hub/supabase/migrations/001_d2j_schema.sql).
   - Creates `d2j_app_state`, `categories`, `users`, `authors`, `articles`, `opportunities`, `scholar_questions`, `story_submissions`, `contact_submissions`, `media`, `admin_activity_logs`, Row-Level Security (RLS) policies, and the `d2j-media` Storage bucket using `CREATE TABLE IF NOT EXISTS`.
3. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to your Vercel Project Settings → **Environment Variables**.
4. To migrate existing records from `data/db.json` into Supabase safely without overwriting existing rows:
   ```bash
   SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co" \
   SUPABASE_SERVICE_ROLE_KEY="your_service_role_key" \
   node scripts/migrate-to-supabase.mjs
   ```

---

## 3. Hosting Options

### Option A: Deploy to Vercel (Fastest 1-Click GitHub Deployment)
1. Go to [https://vercel.com/new](https://vercel.com/new) and sign in with GitHub.
2. Import your **`d2j-media-hub`** repository.
3. Under **Environment Variables**, paste the variables from Section 2 above.
4. Click **Deploy**.
   - *Note*: The codebase includes automatic serverless fallbacks in [`src/lib/db.ts`](file:///c:/Users/HP/Downloads/Dpj/d2j-media-hub/src/lib/db.ts) and [`src/app/api/upload/route.ts`](file:///c:/Users/HP/Downloads/Dpj/d2j-media-hub/src/app/api/upload/route.ts) so it works immediately on Vercel's read-only serverless environment out of the box. For permanent multi-region cloud database persistence on Vercel, connect a free **Supabase PostgreSQL** database using the SQL schema in [`CONTENT_MODEL.md`](file:///c:/Users/HP/Downloads/Dpj/d2j-media-hub/CONTENT_MODEL.md).

### Option B: Deploy to a Node.js VPS / Render / Railway (Persistent Disk Included)
If deploying on a persistent Node.js server (Ubuntu VPS, Render Web Service with disk, or Railway):

```bash
cd d2j-media-hub
npm ci
npm run build
npm run start
```

Both `data/db.json` and `public/uploads/` persist directly on the server disk.

---

## 4. Post-Deployment Verification Checklist

Verify the following endpoints after deployment:
- `/` — Homepage renders with official logo (`/logo.webp`), breaking news ticker, hero lead, and sections.
- `/sitemap.xml` — Dynamic XML sitemap of all published routes (submit this URL to Google Search Console).
- `/robots.txt` — Allows public crawlers and disallows `/admin` and `/api`.
- `/admin/login` — Editorial authentication gate (`SUPER_ADMIN`, `ADMINISTRATOR`, `EDITOR`, `SCHOLAR`, `CONTRIBUTOR`).
