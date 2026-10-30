# D-Path to Jannah Media Hub (D2J Media Hub)

> **Brand:** Dpath TO Jannah Media Hub (`D2J Media Hub`)  
> **Tagline:** *Voice in propagation of the truth*

A complete, full-stack, mobile-responsive editorial publishing platform built with **Next.js (App Router) + TypeScript** faithfully preserving the approved Claude HTML prototypes and implementing every requirement in the official D2J Media Hub project brief.

---

## 1. Project Overview

D2J Media Hub serves Muslim youth, students, campus chapters (including MSSN), families, and the wider public across four core pillars:
1. **Verified News & Public Affairs** (`/news`, `/news/[category]`, `/news/[category]/[slug]`)
2. **Campus & Student Life Hub** (`/campus`)
3. **Islamic Knowledge & Scholar-Reviewed Q&A** (`/islam`, `/ask-a-scholar`, `/ask-a-scholar/answers`, `/ask-a-scholar/answers/[slug]`)
4. **Education, Careers & Verified Opportunities** (`/education`, `/opportunities`, `/opportunities/[slug]`)

Plus full discovery, reader contribution, and governance pages:
- **Search & Content Discovery:** `/search`
- **Reader Contributions & Forms:** `/submit` (Submit a Story), `/guidelines` (Contributor Guidelines), `/contact` (Contact & Corrections Desk)
- **Public Trust & Governance Policies:** `/about`, `/editorial-policy`, `/corrections-policy`, `/privacy-policy`, `/terms`
- **Role-Based Editorial Dashboard:** `/admin` and `/admin/login`

---

## 2. Preserved Prototypes & Brand Assets

- **Original HTML Prototypes (Unchanged Reference Copy):** `../prototypes/`
  - `homepage.html`
  - `stage2-category-article.html`
  - `stage3-campus.html`
  - `stage4-islamic-ask-scholar.html`
  - `stage6-search.html`
  - `stage7-forms.html`
  - `stage8-about-policies.html`
  - `dpj-d2j-site.html`
- **Official Brand Logo:** `public/logo.webp` (extracted directly from the official brand asset embedded in `dpj-d2j-site.html`).
- **Approved Brand Palette:**
  - Primary Deep Green: `#063A19`
  - Dark Forest Green: `#062B13`
  - Signature Orange-Gold: `#FE8905`
  - Copper Gold: `#A8520B`
  - Warm Ivory: `#FAF8F1`
  - Dark Charcoal: `#20251F`
  - White: `#FFFFFF`

---

## 3. Local Development Setup

### Prerequisites
- Node.js `>= 20.x`
- npm `>= 10.x`

### Install & Run Development Server
```bash
cd d2j-media-hub
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

### Production Build & Start
```bash
cd d2j-media-hub
npm run build
npm run start
```

---

## 4. Editorial Dashboard & Role-Based Access Control (RBAC)

Visit `http://localhost:3000/admin/login` to access the editorial dashboard. Credentials can be configured via environment variables (`.env.local`):

| Role | Environment Variables | Default Local Dev Email | Permissions |
| :--- | :--- | :--- | :--- |
| **ADMINISTRATOR** | `D2J_ADMIN_EMAIL`, `D2J_ADMIN_PASSWORD` | `admin@d2jmediahub.local` | Full platform, content, workflow, settings, and user management |
| **EDITOR** | `D2J_EDITOR_EMAIL`, `D2J_EDITOR_PASSWORD` | `editor@d2jmediahub.local` | Review, edit, approve, and publish articles, opportunities, stories, and Q&A |
| **CONTRIBUTOR** | `D2J_CONTRIBUTOR_EMAIL`, `D2J_CONTRIBUTOR_PASSWORD` | `contributor@d2jmediahub.local` | Create drafts and submit articles for editorial review (cannot self-publish) |
| **SCHOLAR** | `D2J_SCHOLAR_EMAIL`, `D2J_SCHOLAR_PASSWORD` | `scholar@d2jmediahub.local` | Screen and review assigned Islamic questions and prepare scholarly responses |

> **Security Note:** Default passwords are only active in local development (`D2J_Admin_Secure_2026!`, `D2J_Editor_Secure_2026!`, `D2J_Contrib_Secure_2026!`, `D2J_Scholar_Secure_2026!`) and are never displayed on any public page. Override them via `.env.local` in staging/production.
