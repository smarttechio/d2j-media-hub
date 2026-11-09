"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type {
  AdminActivityLog,
  Article,
  ArticleBlockType,
  ArticleComment,
  ArticleContentBlock,
  ArticleStatus,
  Author,
  Category,
  ContactSubmission,
  DashboardPermission,
  MediaItem,
  Opportunity,
  ScholarQAStatus,
  ScholarQuestion,
  SiteSettings,
  StorySubmission,
  StorySubmissionStatus,
  UserRole,
  VerificationType,
} from "@/lib/db";
import type { SessionPayload } from "@/lib/auth";

const ALL_CLIENT_PERMISSIONS: DashboardPermission[] = [
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
];

function getDefaultPermissionsForRole(role: UserRole): DashboardPermission[] {
  switch (role) {
    case "SUPER_ADMIN":
      return [...ALL_CLIENT_PERMISSIONS];
    case "ADMINISTRATOR":
      return [
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
      ];
    case "EDITOR":
      return [
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
      ];
    case "SCHOLAR":
      return ["overview", "ask-scholar", "approved-answers"];
    case "CONTRIBUTOR":
    default:
      return ["overview", "articles", "media"];
  }
}

type TabId =
  | "overview"
  | "articles"
  | "categories"
  | "authors"
  | "opportunities"
  | "ask-scholar"
  | "approved-answers"
  | "story-submissions"
  | "contacts"
  | "media"
  | "users"
  | "admin-reviews"
  | "settings";

const PERMISSION_LABELS: { id: DashboardPermission; label: string; desc: string }[] = [
  { id: "overview", label: "Dashboard Overview", desc: "View newsroom stats & Fast Category Finder" },
  { id: "articles", label: "Create & Edit Articles", desc: "Write and edit article drafts" },
  { id: "publish_articles", label: "Approve & Publish Live", desc: "Approve & publish articles to public site" },
  { id: "categories", label: "Categories & Topics", desc: "Create and edit newsroom categories" },
  { id: "authors", label: "Authors & Bylines", desc: "Manage author & scholar biographies" },
  { id: "opportunities", label: "Opportunities Desk", desc: "Verify & publish scholarships and fellowships" },
  { id: "ask-scholar", label: "Ask a Scholar Queue", desc: "Screen private questions & draft answers" },
  { id: "approved-answers", label: "Published Scholar Q&A", desc: "Manage published scholarly rulings" },
  { id: "story-submissions", label: "Reader Story Submissions", desc: "Review & promote reader stories" },
  { id: "contacts", label: "Contact & Corrections", desc: "Handle reader messages & correction requests" },
  { id: "media", label: "Media Library & Uploads", desc: "Upload images and videos" },
  { id: "users", label: "Manage Admins & Roles", desc: "Add staff/admins & assign access permissions" },
  { id: "admin-reviews", label: "Review Other Admins", desc: "Inspect & review other admins' work and activity logs" },
  { id: "settings", label: "Platform Settings", desc: "Edit site title, emails & breaking news ticker" },
];

interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  active: boolean;
  isSuperAdmin?: boolean;
  permissions?: DashboardPermission[];
  allowedCategories?: string[];
  createdBy?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

interface AdminDashboardProps {
  session: SessionPayload;
  initialArticles: Article[];
  initialCategories: Category[];
  initialAuthors: Author[];
  initialOpportunities: Opportunity[];
  initialScholarQuestions: ScholarQuestion[];
  initialStorySubmissions: StorySubmission[];
  initialContactSubmissions: ContactSubmission[];
  initialComments?: ArticleComment[];
  initialMedia: MediaItem[];
  initialUsers: SafeUser[];
  initialActivityLogs?: AdminActivityLog[];
  initialSettings: SiteSettings;
}

export function AdminDashboardClient({
  session,
  initialArticles,
  initialCategories,
  initialAuthors,
  initialOpportunities,
  initialScholarQuestions,
  initialStorySubmissions,
  initialContactSubmissions,
  initialComments = [],
  initialMedia,
  initialUsers,
  initialActivityLogs = [],
  initialSettings,
}: AdminDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [authors, setAuthors] = useState<Author[]>(initialAuthors);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities);
  const [scholarQuestions, setScholarQuestions] = useState<ScholarQuestion[]>(initialScholarQuestions);
  const [storySubmissions, setStorySubmissions] = useState<StorySubmission[]>(initialStorySubmissions);
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>(initialContactSubmissions);
  const [comments, setComments] = useState<ArticleComment[]>(initialComments);
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [users, setUsers] = useState<SafeUser[]>(initialUsers);
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>(initialActivityLogs);
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);

  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [articleFilter, setArticleFilter] = useState<string>("ALL");
  const [articleCategoryFilter, setArticleCategoryFilter] = useState<string>("ALL");
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>("");
  const [articleSearchQuery, setArticleSearchQuery] = useState<string>("");

  // Article editor state
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
  const [articleBodyText, setArticleBodyText] = useState<string>("");
  const [articleBlocks, setArticleBlocks] = useState<ArticleContentBlock[]>([]);
  const [draggedBlockIdx, setDraggedBlockIdx] = useState<number | null>(null);
  const [previewArticle, setPreviewArticle] = useState<Partial<Article> | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState<boolean>(false);

  // Opportunity editor state
  const [editingOpp, setEditingOpp] = useState<Partial<Opportunity> | null>(null);

  // Scholar Q&A review modal state
  const [reviewingQA, setReviewingQA] = useState<ScholarQuestion | null>(null);
  const [qaSummary, setQaSummary] = useState("");
  const [qaAnswerText, setQaAnswerText] = useState("");
  const [qaRefs, setQaRefs] = useState("");
  const [qaScholarName, setQaScholarName] = useState("");
  const [qaScholarCreds, setQaScholarCreds] = useState("");
  const [qaTargetStatus, setQaTargetStatus] = useState<ScholarQAStatus>("Scholar Review");

  // New Category / Author / Media / User forms
  const [newCatSlug, setNewCatSlug] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newAuthorName, setNewAuthorName] = useState("");
  const [newAuthorRole, setNewAuthorRole] = useState("");
  const [newAuthorBio, setNewAuthorBio] = useState("");
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newMediaFilename, setNewMediaFilename] = useState("");
  const [newMediaCaption, setNewMediaCaption] = useState("");
  const [newMediaCredit, setNewMediaCredit] = useState("D2J Media Hub");

  // Super Admin / Staff User Provisioning & Role Editor State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("ADMINISTRATOR");
  const [newUserTitle, setNewUserTitle] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [newUserActive, setNewUserActive] = useState<boolean>(true);
  const [newUserPermissions, setNewUserPermissions] = useState<DashboardPermission[]>(
    getDefaultPermissionsForRole("ADMINISTRATOR")
  );
  const [newUserCategories, setNewUserCategories] = useState<string[]>(["ALL"]);
  const [lastSavedCredentials, setLastSavedCredentials] = useState<{
    name: string;
    email: string;
    password?: string;
    role: UserRole;
  } | null>(null);

  // Admin Review & Oversight Filter State
  const [selectedAdminToReview, setSelectedAdminToReview] = useState<string>("ALL");
  const [reviewNoteDrafts, setReviewNoteDrafts] = useState<Record<string, string>>({});

  const isSuperAdmin = Boolean(
    session.isSuperAdmin || session.role === "SUPER_ADMIN" || session.userId === "usr-admin"
  );
  const userPerms: DashboardPermission[] =
    isSuperAdmin
      ? getDefaultPermissionsForRole("SUPER_ADMIN")
      : Array.isArray(session.permissions) && session.permissions.length > 0
      ? session.permissions
      : getDefaultPermissionsForRole(session.role);

  const hasPerm = (p: DashboardPermission) => isSuperAdmin || userPerms.includes(p);

  const canPublish =
    isSuperAdmin ||
    session.role === "ADMINISTRATOR" ||
    session.role === "EDITOR" ||
    hasPerm("publish_articles");
  const isAdmin =
    isSuperAdmin || session.role === "ADMINISTRATOR" || hasPerm("users");
  const canReviewAdmins =
    isSuperAdmin || session.role === "ADMINISTRATOR" || hasPerm("admin-reviews");
  const canScholar =
    isSuperAdmin ||
    session.role === "ADMINISTRATOR" ||
    session.role === "EDITOR" ||
    session.role === "SCHOLAR" ||
    hasPerm("ask-scholar");

  function notify(text: string, type: "ok" | "err" = "ok") {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  }

  async function apiAction(action: string, payload: Record<string, unknown>) {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || "Action failed.", "err");
      throw new Error(data.error || "Failed");
    }
    if (Array.isArray(data.activityLogs)) {
      setActivityLogs(data.activityLogs);
    }
    return data;
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  async function handleUploadFile(
    file: File,
    onUploaded: (url: string, mediaType: "image" | "video", filename: string) => void
  ) {
    setUploadingMedia(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("caption", editingArticle?.title || file.name);
      fd.append("credit", session.name);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || "Upload failed.", "err");
        return;
      }
      if (data.media) setMedia(data.media);
      onUploaded(data.url, data.mediaType, data.filename);
      notify(
        `${data.mediaType === "video" ? "Video" : "Image"} uploaded successfully (${data.filename}).`
      );
    } catch {
      notify("Error uploading file.", "err");
    } finally {
      setUploadingMedia(false);
    }
  }

  function makeBlock(type: ArticleBlockType, text = ""): ArticleContentBlock {
    return {
      id: `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      text,
      imageUrl: "",
      imageCaption: "",
      secondImageUrl: "",
      secondImageCaption: "",
      videoUrl: "",
      quoteAttribution: "",
    };
  }

  function addBlockAt(type: ArticleBlockType, afterIndex?: number) {
    setArticleBlocks((prev) => {
      const next = [...prev];
      const newBlk = makeBlock(type);
      if (afterIndex === undefined || afterIndex < 0 || afterIndex >= next.length) {
        next.push(newBlk);
      } else {
        next.splice(afterIndex + 1, 0, newBlk);
      }
      return next;
    });
  }

  function updateBlock(index: number, patch: Partial<ArticleContentBlock>) {
    setArticleBlocks((prev) =>
      prev.map((blk, idx) => (idx === index ? { ...blk, ...patch } : blk))
    );
  }

  function moveBlock(index: number, direction: -1 | 1) {
    setArticleBlocks((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
  }

  function reorderBlocks(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx) return;
    setArticleBlocks((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }

  function removeBlock(index: number) {
    setArticleBlocks((prev) => {
      if (prev.length <= 1) {
        return [makeBlock("paragraph", "")];
      }
      return prev.filter((_, idx) => idx !== index);
    });
  }

  function startNewArticle() {
    setEditingArticle({
      title: "",
      summary: "",
      category: "news",
      tags: ["Nigeria"],
      authorName: session.name,
      artTheme: "campus",
      imageCaption: "Editorial illustration — D2J Media Hub.",
      status: "Draft",
      verification: "V",
      sourceName: "",
      sourceUrl: "",
      correctionNote: "",
      seoTitle: "",
      seoDescription: "",
    });
    setArticleBodyText("");
    setArticleBlocks([makeBlock("paragraph", "")]);
  }

  function startEditArticle(a: Article) {
    setEditingArticle({ ...a });
    setArticleBodyText((a.body || []).join("\n\n"));
    if (Array.isArray(a.contentBlocks) && a.contentBlocks.length > 0) {
      setArticleBlocks(a.contentBlocks.map((b) => ({ ...b })));
    } else if (Array.isArray(a.body) && a.body.length > 0) {
      setArticleBlocks(a.body.map((p) => makeBlock("paragraph", p)));
    } else {
      setArticleBlocks([makeBlock("paragraph", "")]);
    }
    if (typeof window !== "undefined") {
      setTimeout(() => {
        document.getElementById("article-editor-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }

  async function handleSaveArticle(e: React.FormEvent) {
    e.preventDefault();
    if (!editingArticle) return;
    try {
      const cleanedBlocks = articleBlocks.filter((b) => {
        if (b.type === "paragraph" || b.type === "heading" || b.type === "quote") {
          return Boolean(b.text && b.text.trim());
        }
        if (b.type === "image") return Boolean(b.imageUrl && b.imageUrl.trim());
        if (b.type === "gallery") {
          return Boolean(
            (b.imageUrl && b.imageUrl.trim()) || (b.secondImageUrl && b.secondImageUrl.trim())
          );
        }
        if (b.type === "video") return Boolean(b.videoUrl && b.videoUrl.trim());
        return false;
      });

      const extractedParagraphs = cleanedBlocks
        .filter((b) => b.type === "paragraph" || b.type === "heading" || b.type === "quote")
        .map((b) => (b.text || "").trim())
        .filter(Boolean);

      const fallbackParagraphs = articleBodyText
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean);

      const finalParagraphs =
        extractedParagraphs.length > 0
          ? extractedParagraphs
          : fallbackParagraphs.length > 0
          ? fallbackParagraphs
          : ["Draft paragraph."];

      const data = await apiAction("save_article", {
        ...editingArticle,
        bodyParagraphs: finalParagraphs,
        contentBlocks: cleanedBlocks.length > 0 ? cleanedBlocks : undefined,
      });
      setArticles(data.articles);
      setEditingArticle(null);
      notify("Article saved successfully.");
    } catch {
      // handled
    }
  }

  async function handleArticleStatus(id: string, status: ArticleStatus) {
    try {
      const data = await apiAction("update_article_status", { id, status });
      setArticles(data.articles);
      notify(`Article moved to "${status}".`);
    } catch {
      // handled
    }
  }

  async function handleDeleteArticle(id: string, title: string) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Are you sure you want to permanently delete "${title}"?`)
    ) {
      return;
    }
    try {
      const data = await apiAction("delete_article", { id });
      setArticles(data.articles);
      if (editingArticle?.id === id) {
        setEditingArticle(null);
      }
      notify(`Deleted article: "${title}".`);
    } catch {
      // handled
    }
  }

  function openQAReview(q: ScholarQuestion) {
    setReviewingQA(q);
    setQaSummary(q.publicQuestionSummary || q.subject);
    setQaAnswerText((q.answerText || []).join("\n\n"));
    setQaRefs((q.references || []).join("\n"));
    setQaScholarName(q.scholarReviewerName || session.name);
    setQaScholarCreds(q.scholarCredentials || session.title);
    setQaTargetStatus(q.status === "Private Submission" ? "Editorial Screening" : q.status);
  }

  async function handleSaveQAReview(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewingQA) return;
    try {
      const data = await apiAction("update_scholar_qa", {
        id: reviewingQA.id,
        status: qaTargetStatus,
        publicQuestionSummary: qaSummary,
        answerParagraphs: qaAnswerText
          .split(/\n\n+/)
          .map((p) => p.trim())
          .filter(Boolean),
        references: qaRefs
          .split(/\n+/)
          .map((r) => r.trim())
          .filter(Boolean),
        scholarReviewerName: qaScholarName,
        scholarCredentials: qaScholarCreds,
      });
      setScholarQuestions(data.scholarQuestions);
      setReviewingQA(null);
      notify(`Scholar Q&A updated to "${qaTargetStatus}".`);
    } catch {
      // handled
    }
  }

  const publishedArticlesCount = articles.filter((a) => a.status === "Published").length;
  const draftArticlesCount = articles.filter((a) => a.status !== "Published").length;
  const pendingQACount = scholarQuestions.filter((q) => q.status !== "Published").length;
  const publishedQACount = scholarQuestions.filter((q) => q.status === "Published").length;

  const allowedCats = isSuperAdmin
    ? ["ALL"]
    : Array.isArray(session.allowedCategories) && session.allowedCategories.length > 0
    ? session.allowedCategories
    : ["ALL"];

  const accessibleCategories = categories.filter(
    (c) => allowedCats.includes("ALL") || allowedCats.includes(c.slug)
  );

  const matchingCategories = accessibleCategories.filter((c) => {
    if (!categorySearchQuery.trim()) return true;
    const q = categorySearchQuery.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    );
  });

  const filteredArticles = articles.filter((a) => {
    if (!allowedCats.includes("ALL") && !allowedCats.includes(a.category)) return false;
    if (articleFilter !== "ALL" && a.status !== articleFilter) return false;
    if (articleCategoryFilter !== "ALL" && a.category !== articleCategoryFilter) return false;
    if (articleSearchQuery.trim()) {
      const q = articleSearchQuery.toLowerCase().trim();
      const inTitle = a.title.toLowerCase().includes(q);
      const inSlug = a.slug.toLowerCase().includes(q);
      const inSummary = (a.summary || "").toLowerCase().includes(q);
      const inAuthor = (a.authorName || "").toLowerCase().includes(q);
      const inTags = (a.tags || []).some((t) => t.toLowerCase().includes(q));
      if (!inTitle && !inSlug && !inSummary && !inAuthor && !inTags) return false;
    }
    return true;
  });

  return (
    <main id="main" className="section" style={{ padding: "28px 0 80px" }}>
      <div className="wrap">
        {/* Top bar */}
        <div
          className="card"
          style={{
            padding: "18px 24px",
            marginBottom: 24,
            background: "var(--green-dark)",
            color: "#fff",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <img
              src="/logo.webp"
              alt="D2J Logo"
              style={{ width: 44, height: 44, borderRadius: 8, background: "#fff", padding: 3 }}
            />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <strong style={{ fontFamily: "var(--serif)", fontSize: 20 }}>
                  D2J Media Hub — Editorial Dashboard
                </strong>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 99,
                    background: "var(--gold)",
                    color: "#1B1305",
                  }}
                >
                  {session.role}
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.78)" }}>
                Signed in as <strong>{session.name}</strong> ({session.title} · {session.email})
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link href="/" className="btn btn-ghost" style={{ padding: "7px 14px", fontSize: 13 }}>
              View Public Site ↗
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-gold"
              style={{ padding: "7px 14px", fontSize: 13 }}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div
            role="status"
            style={{
              padding: "12px 18px",
              marginBottom: 18,
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              background: toast.type === "ok" ? "#E8F3EC" : "#FEE2E2",
              color: toast.type === "ok" ? "var(--green)" : "#991B1B",
              border: `1px solid ${toast.type === "ok" ? "var(--green)" : "#FCA5A5"}`,
            }}
          >
            {toast.text}
          </div>
        )}

        {/* Always-Visible Logged-In Summary Cards */}
        <div
          className="card"
          style={{
            padding: 20,
            marginBottom: 24,
            background: "var(--ivory-2)",
            border: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <span className="kicker" style={{ color: "var(--green)" }}>
              Live Newsroom Overview (Click any card to manage)
            </span>
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
              Role: <strong>{session.role}</strong>
            </span>
          </div>

          <div className="grid-4">
            <button
              type="button"
              className="stat-card"
              onClick={() => setActiveTab("articles")}
            >
              <div>
                <span className="cat-tag">Published Articles</span>
                <div className="stat-num">{publishedArticlesCount}</div>
              </div>
              <div className="stat-sub">
                <span>{draftArticlesCount} in Draft / Review pipeline</span>
                <strong style={{ color: "var(--green)" }}>→</strong>
              </div>
            </button>

            <button
              type="button"
              className="stat-card gold-top"
              onClick={() => setActiveTab("opportunities")}
            >
              <div>
                <span className="cat-tag">Verified Opportunities</span>
                <div className="stat-num">
                  {opportunities.filter((o) => o.workflowStatus === "Published").length}
                </div>
              </div>
              <div className="stat-sub">
                <span>Source-verified scholarships &amp; fellowships</span>
                <strong style={{ color: "var(--green)" }}>→</strong>
              </div>
            </button>

            <button
              type="button"
              className="stat-card copper-top"
              onClick={() => setActiveTab("ask-scholar")}
            >
              <div>
                <span className="cat-tag">Ask a Scholar Desk</span>
                <div className="stat-num">{pendingQACount}</div>
              </div>
              <div className="stat-sub">
                <span>Private questions awaiting screening/review</span>
                <strong style={{ color: "var(--green)" }}>→</strong>
              </div>
            </button>

            <button
              type="button"
              className="stat-card"
              onClick={() => setActiveTab("story-submissions")}
            >
              <div>
                <span className="cat-tag">Reader Submissions</span>
                <div className="stat-num">
                  {storySubmissions.length + contactSubmissions.length}
                </div>
              </div>
              <div className="stat-sub">
                <span>
                  {storySubmissions.length} stories · {contactSubmissions.length} contact messages
                </span>
                <strong style={{ color: "var(--green)" }}>→</strong>
              </div>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 24,
            paddingBottom: 12,
            borderBottom: "1px solid var(--border)",
          }}
        >
          {(
            [
              ["overview", "1. Overview"],
              ...(hasPerm("articles") ? ([["articles", `2. Articles (${articles.length})`]] as const) : []),
              ...(hasPerm("categories") ? ([["categories", `3. Categories (${categories.length})`]] as const) : []),
              ...(hasPerm("authors") ? ([["authors", `4. Authors (${authors.length})`]] as const) : []),
              ...(hasPerm("opportunities")
                ? ([["opportunities", `5. Opportunities (${opportunities.length})`]] as const)
                : []),
              ...(hasPerm("ask-scholar")
                ? ([["ask-scholar", `6. Ask a Scholar Queue (${pendingQACount})`]] as const)
                : []),
              ...(hasPerm("approved-answers")
                ? ([["approved-answers", `7. Published Q&A (${publishedQACount})`]] as const)
                : []),
              ...(hasPerm("story-submissions")
                ? ([["story-submissions", `8. Story Submissions (${storySubmissions.length})`]] as const)
                : []),
              ...(hasPerm("contacts")
                ? ([["contacts", `9. Contacts & Comments (${contactSubmissions.length + comments.length})`]] as const)
                : []),
              ...(hasPerm("media") ? ([["media", `10. Media Library (${media.length})`]] as const) : []),
              ...(isAdmin ? ([["users", `11. Manage Admins & Roles (${users.length})`]] as const) : []),
              ...(canReviewAdmins
                ? ([["admin-reviews", `12. Review Other Admins (${activityLogs.length})`]] as const)
                : []),
              ...(hasPerm("settings") ? ([["settings", "13. Site Settings"]] as const) : []),
            ] as [TabId, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`chip ${activeTab === id ? "active" : ""}`}
              style={{ fontSize: 12.5, padding: "6px 12px", cursor: "pointer" }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div>
            {/* Quick Jump: Search Category to Edit Articles */}
            <div className="card" style={{ padding: 22, marginBottom: 24, borderLeft: "4px solid var(--gold)" }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div>
                  <span className="kicker">Fast Category Finder</span>
                  <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, margin: "4px 0 0" }}>
                    Jump Straight to a Category to Edit Articles
                  </h2>
                </div>
                <input
                  type="search"
                  placeholder="Search category name (e.g. Campus, Islam, News)..."
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  style={{
                    padding: "9px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    width: "100%",
                    maxWidth: 320,
                    fontSize: 13.5,
                  }}
                />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {matchingCategories.map((cat) => {
                  const count = articles.filter((a) => a.category === cat.slug).length;
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      className="chip"
                      style={{ cursor: "pointer", padding: "8px 14px" }}
                      onClick={() => {
                        setArticleCategoryFilter(cat.slug);
                        setActiveTab("articles");
                      }}
                    >
                      <span>{cat.name}</span>
                      <span
                        style={{
                          background: "var(--ivory-2)",
                          color: "var(--green)",
                          padding: "1px 7px",
                          borderRadius: 99,
                          fontSize: 11.5,
                          fontWeight: 700,
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid-2">
              <div className="card" style={{ padding: 22 }}>
                <h2 style={{ fontFamily: "var(--serif)", fontSize: 20, margin: "0 0 12px" }}>
                  Editorial Workflow Enforcement
                </h2>
                <ul style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.7, paddingLeft: 18, margin: 0 }}>
                  <li>
                    <strong>News &amp; Campus Articles:</strong> <code>Draft → Submitted for Review → Approved → Published</code>
                  </li>
                  <li>
                    <strong>Story Submissions:</strong> <code>Submitted → Editorial Review → Accepted/Rejected → Prepared for Publication</code>
                  </li>
                  <li>
                    <strong>Ask a Scholar:</strong> <code>Private Submission → Editorial Screening → Scholar Review → Approved Public Answer → Published</code>
                  </li>
                  <li>
                    <strong>Opportunities:</strong> <code>Draft → Source Verification → Published → Expired/Archived</code>
                  </li>
                </ul>
              </div>

              <div className="card" style={{ padding: 22 }}>
                <h2 style={{ fontFamily: "var(--serif)", fontSize: 20, margin: "0 0 12px" }}>
                  Quick Actions
                </h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setActiveTab("articles");
                      startNewArticle();
                    }}
                  >
                    + Create New Article Draft
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      className="btn btn-gold"
                      onClick={() => setActiveTab("users")}
                    >
                      + Add Admin / Assign Roles ({users.length})
                    </button>
                  )}
                  {canReviewAdmins && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setActiveTab("admin-reviews")}
                    >
                      Review Other Admins&apos; Work ({activityLogs.length})
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setActiveTab("ask-scholar")}
                  >
                    Review Ask a Scholar Queue ({pendingQACount})
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setActiveTab("story-submissions")}
                  >
                    Review Story Submissions ({storySubmissions.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ARTICLES */}
        {activeTab === "articles" && (
          <div>
            {/* Search by Category & Keyword Bar to Save Editors from Scrolling */}
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div>
                  <span className="kicker">Filter &amp; Search Articles by Category</span>
                  <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, margin: "2px 0 0" }}>
                    Select or Search the Category You Want to Edit
                  </h2>
                </div>
                <button type="button" className="btn btn-primary" onClick={startNewArticle}>
                  + New Article
                </button>
              </div>

              {/* 3-Column Filter Controls: Category Search, Category Dropdown, Article Title/Keyword Search */}
              <div className="grid-3" style={{ marginBottom: 14 }}>
                <div className="f-row" style={{ marginBottom: 0 }}>
                  <label htmlFor="cat-search-input">1. Search Category Name</label>
                  <input
                    id="cat-search-input"
                    type="search"
                    placeholder="Type category (e.g. Campus, Islam, Health)..."
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                  />
                </div>

                <div className="f-row" style={{ marginBottom: 0 }}>
                  <label htmlFor="cat-select-dropdown">2. Filter by Category</label>
                  <select
                    id="cat-select-dropdown"
                    value={articleCategoryFilter}
                    onChange={(e) => setArticleCategoryFilter(e.target.value)}
                  >
                    <option value="ALL">All Accessible Categories ({filteredArticles.length} articles)</option>
                    {accessibleCategories.map((c) => {
                      const cnt = articles.filter((a) => a.category === c.slug).length;
                      return (
                        <option key={c.slug} value={c.slug}>
                          {c.name} ({cnt})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="f-row" style={{ marginBottom: 0 }}>
                  <label htmlFor="art-keyword-search">3. Search Headline, Author, or Tag</label>
                  <input
                    id="art-keyword-search"
                    type="search"
                    placeholder="Search article headline or keyword..."
                    value={articleSearchQuery}
                    onChange={(e) => setArticleSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Clickable Category Pills (Filtered by Category Search Input) */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)", marginBottom: 6 }}>
                  Quick Category Pills (click to filter articles immediately):
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setArticleCategoryFilter("ALL")}
                    className={`chip ${articleCategoryFilter === "ALL" ? "active" : ""}`}
                    style={{ fontSize: 12, padding: "5px 11px", cursor: "pointer" }}
                  >
                    All Categories ({articles.length})
                  </button>
                  {matchingCategories.map((c) => {
                    const cnt = articles.filter((a) => a.category === c.slug).length;
                    return (
                      <button
                        key={c.slug}
                        type="button"
                        onClick={() => setArticleCategoryFilter(c.slug)}
                        className={`chip ${articleCategoryFilter === c.slug ? "active" : ""}`}
                        style={{ fontSize: 12, padding: "5px 11px", cursor: "pointer" }}
                      >
                        {c.name} ({cnt})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Workflow Status Filter Row */}
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)", marginRight: 4 }}>
                    Status:
                  </span>
                  {["ALL", "Draft", "Submitted for Review", "Approved", "Published"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setArticleFilter(st)}
                      className={`chip ${articleFilter === st ? "active" : ""}`}
                      style={{ fontSize: 11.5, padding: "4px 10px", cursor: "pointer" }}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div style={{ fontSize: 12.5, color: "var(--ink-2)" }}>
                  Showing <strong>{filteredArticles.length}</strong> of {articles.length} articles
                  {(articleCategoryFilter !== "ALL" || articleFilter !== "ALL" || articleSearchQuery || categorySearchQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        setArticleCategoryFilter("ALL");
                        setArticleFilter("ALL");
                        setArticleSearchQuery("");
                        setCategorySearchQuery("");
                      }}
                      style={{
                        marginLeft: 10,
                        background: "none",
                        border: "none",
                        color: "var(--copper)",
                        fontWeight: 700,
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Article Editor Drawer/Card */}
            {editingArticle && (
              <div id="article-editor-card" className="card" style={{ padding: 24, marginBottom: 24, border: "2px solid var(--green)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontFamily: "var(--serif)", fontSize: 22, margin: 0 }}>
                    {editingArticle.id ? `Edit Article: ${editingArticle.title}` : "Create New Article"}
                  </h3>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: "6px 12px", fontSize: 12.5 }}
                      onClick={() =>
                        setPreviewArticle({
                          ...editingArticle,
                          body: articleBlocks
                            .filter(
                              (b) =>
                                b.type === "paragraph" || b.type === "heading" || b.type === "quote"
                            )
                            .map((b) => (b.text || "").trim())
                            .filter(Boolean),
                          contentBlocks: articleBlocks,
                        })
                      }
                    >
                      Preview Draft
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: "6px 12px", fontSize: 12.5 }}
                      onClick={() => setEditingArticle(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSaveArticle}>
                  <div className="grid-2">
                    <div className="f-row">
                      <label>Headline / Title *</label>
                      <input
                        type="text"
                        required
                        value={editingArticle.title || ""}
                        onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                      />
                    </div>
                    <div className="f-row">
                      <label>Category *</label>
                      <select
                        value={editingArticle.category || accessibleCategories[0]?.slug || "news"}
                        onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value })}
                      >
                        {accessibleCategories.map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {c.name} ({c.slug})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="f-row">
                    <label>Standfirst / Summary *</label>
                    <input
                      type="text"
                      required
                      value={editingArticle.summary || ""}
                      onChange={(e) => setEditingArticle({ ...editingArticle, summary: e.target.value })}
                    />
                  </div>

                  {/* WordPress-Style Visual Block Composer */}
                  <div
                    className="card"
                    style={{
                      padding: 18,
                      marginBottom: 18,
                      background: "var(--ivory-2)",
                      border: "1.5px solid var(--green)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 10,
                        marginBottom: 14,
                      }}
                    >
                      <div>
                        <span className="kicker">WordPress-Style Block Editor</span>
                        <h4 style={{ fontFamily: "var(--serif)", fontSize: 19, margin: "2px 0 0" }}>
                          Article Content Blocks — Paragraphs, Pictures, 2-Photo Galleries &amp; Quotes
                        </h4>
                        <p style={{ fontSize: 12.5, color: "var(--ink-2)", margin: "2px 0 0" }}>
                          Add paragraphs, insert 1 picture or 2 side-by-side pictures after any paragraph, and drag or use ↑ / ↓ to reorder blocks.
                        </p>
                      </div>
                      <span className="chip" style={{ fontSize: 12 }}>
                        {articleBlocks.length} {articleBlocks.length === 1 ? "Block" : "Blocks"}
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {articleBlocks.map((blk, idx) => (
                        <div
                          key={blk.id || idx}
                          draggable
                          onDragStart={() => setDraggedBlockIdx(idx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (draggedBlockIdx !== null && draggedBlockIdx !== idx) {
                              reorderBlocks(draggedBlockIdx, idx);
                            }
                            setDraggedBlockIdx(null);
                          }}
                          className="card"
                          style={{
                            padding: 14,
                            background: "var(--wh)",
                            border:
                              draggedBlockIdx === idx
                                ? "2px dashed var(--gold)"
                                : "1px solid var(--border)",
                          }}
                        >
                          {/* Block Header Bar */}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: 8,
                              marginBottom: 10,
                              paddingBottom: 8,
                              borderBottom: "1px solid var(--ivory-2)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span
                                title="Drag to reorder block"
                                style={{
                                  cursor: "grab",
                                  fontWeight: 700,
                                  color: "var(--ink-3)",
                                  padding: "2px 6px",
                                  background: "var(--ivory-2)",
                                  borderRadius: 4,
                                  fontSize: 12,
                                }}
                              >
                                ⠿ Block #{idx + 1}
                              </span>
                              <select
                                value={blk.type}
                                onChange={(e) =>
                                  updateBlock(idx, { type: e.target.value as ArticleBlockType })
                                }
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: 6,
                                  border: "1px solid var(--border)",
                                  fontSize: 12.5,
                                  fontWeight: 600,
                                }}
                              >
                                <option value="paragraph">¶ Paragraph Text</option>
                                <option value="heading">H2 Subheading</option>
                                <option value="image">🖼 Single Picture (Full Width)</option>
                                <option value="gallery">🖼🖼 2 Pictures Side-by-Side</option>
                                <option value="quote">❝ Quote / Highlight</option>
                                <option value="video">🎬 Inline Video / YouTube</option>
                              </select>
                            </div>

                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <button
                                type="button"
                                className="chip"
                                disabled={idx === 0}
                                onClick={() => moveBlock(idx, -1)}
                                style={{
                                  padding: "3px 9px",
                                  fontSize: 11.5,
                                  cursor: idx === 0 ? "default" : "pointer",
                                  opacity: idx === 0 ? 0.45 : 1,
                                }}
                                title="Move block up"
                              >
                                ↑ Up
                              </button>
                              <button
                                type="button"
                                className="chip"
                                disabled={idx === articleBlocks.length - 1}
                                onClick={() => moveBlock(idx, 1)}
                                style={{
                                  padding: "3px 9px",
                                  fontSize: 11.5,
                                  cursor: idx === articleBlocks.length - 1 ? "default" : "pointer",
                                  opacity: idx === articleBlocks.length - 1 ? 0.45 : 1,
                                }}
                                title="Move block down"
                              >
                                ↓ Down
                              </button>
                              <button
                                type="button"
                                className="chip"
                                onClick={() => removeBlock(idx)}
                                style={{
                                  padding: "3px 9px",
                                  fontSize: 11.5,
                                  color: "#991B1B",
                                  borderColor: "#FCA5A5",
                                  cursor: "pointer",
                                }}
                                title="Remove block"
                              >
                                ✕ Remove
                              </button>
                            </div>
                          </div>

                          {/* Block Content Inputs by Type */}
                          {blk.type === "paragraph" && (
                            <textarea
                              rows={4}
                              placeholder="Write paragraph text here..."
                              value={blk.text || ""}
                              onChange={(e) => updateBlock(idx, { text: e.target.value })}
                              style={{
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: 8,
                                border: "1px solid var(--border)",
                                font: "inherit",
                                fontSize: 14,
                              }}
                            />
                          )}

                          {blk.type === "heading" && (
                            <input
                              type="text"
                              placeholder="Enter section subheading (H2)..."
                              value={blk.text || ""}
                              onChange={(e) => updateBlock(idx, { text: e.target.value })}
                              style={{
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: 8,
                                border: "1px solid var(--border)",
                                fontFamily: "var(--serif)",
                                fontSize: 18,
                                fontWeight: 700,
                              }}
                            />
                          )}

                          {blk.type === "quote" && (
                            <div className="grid-2">
                              <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                                  Quote Text *
                                </label>
                                <textarea
                                  rows={3}
                                  placeholder="Enter quotation or key takeaway..."
                                  value={blk.text || ""}
                                  onChange={(e) => updateBlock(idx, { text: e.target.value })}
                                  style={{
                                    width: "100%",
                                    padding: "8px 10px",
                                    borderRadius: 8,
                                    border: "1px solid var(--border)",
                                  }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                                  Speaker / Attribution (optional)
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Amir, MSSN Lagos Area Unit"
                                  value={blk.quoteAttribution || ""}
                                  onChange={(e) => updateBlock(idx, { quoteAttribution: e.target.value })}
                                  style={{ width: "100%", padding: "8px 10px" }}
                                />
                              </div>
                            </div>
                          )}

                          {blk.type === "image" && (
                            <div className="grid-2" style={{ alignItems: "start" }}>
                              <div>
                                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--green)", marginBottom: 6 }}>
                                  Upload Picture from Computer or Paste URL
                                </label>
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,image/gif"
                                  disabled={uploadingMedia}
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) {
                                      handleUploadFile(f, (url) => {
                                        updateBlock(idx, { imageUrl: url });
                                      });
                                    }
                                    e.target.value = "";
                                  }}
                                  style={{ width: "100%", fontSize: 12, marginBottom: 6 }}
                                />
                                <input
                                  type="text"
                                  placeholder="Image URL (/uploads/... or https://...)"
                                  value={blk.imageUrl || ""}
                                  onChange={(e) => updateBlock(idx, { imageUrl: e.target.value })}
                                  style={{ width: "100%", fontSize: 12.5, padding: "7px 10px", marginBottom: 6 }}
                                />
                                {media.filter((m) => !/\.(mp4|webm|ogg|mov|m4v)$/i.test(m.filename || m.url)).length > 0 && (
                                  <select
                                    value=""
                                    onChange={(e) => {
                                      if (!e.target.value) return;
                                      const asset = media.find((m) => m.url === e.target.value);
                                      updateBlock(idx, {
                                        imageUrl: e.target.value,
                                        imageCaption: blk.imageCaption || asset?.caption || "",
                                      });
                                    }}
                                    style={{ width: "100%", fontSize: 12, padding: "6px 10px", marginBottom: 6 }}
                                  >
                                    <option value="">— Or choose from Media Library —</option>
                                    {media
                                      .filter((m) => !/\.(mp4|webm|ogg|mov|m4v)$/i.test(m.filename || m.url))
                                      .map((m) => (
                                        <option key={m.id} value={m.url}>
                                          {m.caption || m.filename}
                                        </option>
                                      ))}
                                  </select>
                                )}
                                <input
                                  type="text"
                                  placeholder="Picture caption (optional)"
                                  value={blk.imageCaption || ""}
                                  onChange={(e) => updateBlock(idx, { imageCaption: e.target.value })}
                                  style={{ width: "100%", fontSize: 12.5, padding: "7px 10px" }}
                                />
                              </div>
                              <div>
                                {blk.imageUrl ? (
                                  <img
                                    src={blk.imageUrl}
                                    alt={blk.imageCaption || "Block preview"}
                                    style={{
                                      width: "100%",
                                      maxHeight: 170,
                                      objectFit: "cover",
                                      borderRadius: 8,
                                      border: "1px solid var(--border)",
                                    }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      padding: 24,
                                      textAlign: "center",
                                      border: "1px dashed var(--border)",
                                      borderRadius: 8,
                                      fontSize: 12.5,
                                      color: "var(--ink-3)",
                                    }}
                                  >
                                    Picture preview will appear here
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {blk.type === "gallery" && (
                            <div className="grid-2" style={{ alignItems: "start" }}>
                              {/* Picture 1 */}
                              <div className="card" style={{ padding: 12, background: "var(--ivory-2)" }}>
                                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--green)", marginBottom: 6 }}>
                                  Left Picture (#1)
                                </label>
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,image/gif"
                                  disabled={uploadingMedia}
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) {
                                      handleUploadFile(f, (url) => {
                                        updateBlock(idx, { imageUrl: url });
                                      });
                                    }
                                    e.target.value = "";
                                  }}
                                  style={{ width: "100%", fontSize: 12, marginBottom: 6 }}
                                />
                                <input
                                  type="text"
                                  placeholder="Picture #1 URL"
                                  value={blk.imageUrl || ""}
                                  onChange={(e) => updateBlock(idx, { imageUrl: e.target.value })}
                                  style={{ width: "100%", fontSize: 12, padding: "6px 8px", marginBottom: 6 }}
                                />
                                {media.filter((m) => !/\.(mp4|webm|ogg|mov|m4v)$/i.test(m.filename || m.url)).length > 0 && (
                                  <select
                                    value=""
                                    onChange={(e) => {
                                      if (!e.target.value) return;
                                      const asset = media.find((m) => m.url === e.target.value);
                                      updateBlock(idx, {
                                        imageUrl: e.target.value,
                                        imageCaption: blk.imageCaption || asset?.caption || "",
                                      });
                                    }}
                                    style={{ width: "100%", fontSize: 12, padding: "5px 8px", marginBottom: 6 }}
                                  >
                                    <option value="">— Pick Picture #1 from Library —</option>
                                    {media
                                      .filter((m) => !/\.(mp4|webm|ogg|mov|m4v)$/i.test(m.filename || m.url))
                                      .map((m) => (
                                        <option key={m.id} value={m.url}>
                                          {m.caption || m.filename}
                                        </option>
                                      ))}
                                  </select>
                                )}
                                <input
                                  type="text"
                                  placeholder="Caption for Picture #1"
                                  value={blk.imageCaption || ""}
                                  onChange={(e) => updateBlock(idx, { imageCaption: e.target.value })}
                                  style={{ width: "100%", fontSize: 12, padding: "6px 8px" }}
                                />
                                {blk.imageUrl && (
                                  <img
                                    src={blk.imageUrl}
                                    alt="Gallery 1"
                                    style={{
                                      width: "100%",
                                      maxHeight: 120,
                                      objectFit: "cover",
                                      borderRadius: 6,
                                      marginTop: 8,
                                    }}
                                  />
                                )}
                              </div>

                              {/* Picture 2 */}
                              <div className="card" style={{ padding: 12, background: "var(--ivory-2)" }}>
                                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--green)", marginBottom: 6 }}>
                                  Right Picture (#2)
                                </label>
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,image/gif"
                                  disabled={uploadingMedia}
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) {
                                      handleUploadFile(f, (url) => {
                                        updateBlock(idx, { secondImageUrl: url });
                                      });
                                    }
                                    e.target.value = "";
                                  }}
                                  style={{ width: "100%", fontSize: 12, marginBottom: 6 }}
                                />
                                <input
                                  type="text"
                                  placeholder="Picture #2 URL"
                                  value={blk.secondImageUrl || ""}
                                  onChange={(e) => updateBlock(idx, { secondImageUrl: e.target.value })}
                                  style={{ width: "100%", fontSize: 12, padding: "6px 8px", marginBottom: 6 }}
                                />
                                {media.filter((m) => !/\.(mp4|webm|ogg|mov|m4v)$/i.test(m.filename || m.url)).length > 0 && (
                                  <select
                                    value=""
                                    onChange={(e) => {
                                      if (!e.target.value) return;
                                      const asset = media.find((m) => m.url === e.target.value);
                                      updateBlock(idx, {
                                        secondImageUrl: e.target.value,
                                        secondImageCaption: blk.secondImageCaption || asset?.caption || "",
                                      });
                                    }}
                                    style={{ width: "100%", fontSize: 12, padding: "5px 8px", marginBottom: 6 }}
                                  >
                                    <option value="">— Pick Picture #2 from Library —</option>
                                    {media
                                      .filter((m) => !/\.(mp4|webm|ogg|mov|m4v)$/i.test(m.filename || m.url))
                                      .map((m) => (
                                        <option key={m.id} value={m.url}>
                                          {m.caption || m.filename}
                                        </option>
                                      ))}
                                  </select>
                                )}
                                <input
                                  type="text"
                                  placeholder="Caption for Picture #2"
                                  value={blk.secondImageCaption || ""}
                                  onChange={(e) => updateBlock(idx, { secondImageCaption: e.target.value })}
                                  style={{ width: "100%", fontSize: 12, padding: "6px 8px" }}
                                />
                                {blk.secondImageUrl && (
                                  <img
                                    src={blk.secondImageUrl}
                                    alt="Gallery 2"
                                    style={{
                                      width: "100%",
                                      maxHeight: 120,
                                      objectFit: "cover",
                                      borderRadius: 6,
                                      marginTop: 8,
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          )}

                          {blk.type === "video" && (
                            <div className="grid-2">
                              <div>
                                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--copper)", marginBottom: 6 }}>
                                  Upload Video Clip or Paste YouTube URL
                                </label>
                                <input
                                  type="file"
                                  accept="video/mp4,video/webm,video/ogg,video/quicktime"
                                  disabled={uploadingMedia}
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) {
                                      handleUploadFile(f, (url) => {
                                        updateBlock(idx, { videoUrl: url });
                                      });
                                    }
                                    e.target.value = "";
                                  }}
                                  style={{ width: "100%", fontSize: 12, marginBottom: 6 }}
                                />
                                <input
                                  type="text"
                                  placeholder="https://youtube.com/watch?v=... or /uploads/..."
                                  value={blk.videoUrl || ""}
                                  onChange={(e) => updateBlock(idx, { videoUrl: e.target.value })}
                                  style={{ width: "100%", fontSize: 12.5, padding: "7px 10px", marginBottom: 6 }}
                                />
                                <input
                                  type="text"
                                  placeholder="Video caption (optional)"
                                  value={blk.imageCaption || ""}
                                  onChange={(e) => updateBlock(idx, { imageCaption: e.target.value })}
                                  style={{ width: "100%", fontSize: 12.5, padding: "7px 10px" }}
                                />
                              </div>
                              <div>
                                {blk.videoUrl ? (
                                  <div style={{ fontSize: 12.5, color: "var(--green)", fontWeight: 600 }}>
                                    ✓ Video attached: {blk.videoUrl}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
                                    No video selected yet.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Quick Insert Toolbar Right Under Each Block */}
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 6,
                              alignItems: "center",
                              marginTop: 10,
                              paddingTop: 8,
                              borderTop: "1px dashed var(--border)",
                            }}
                          >
                            <span style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600 }}>
                              + Insert below this block:
                            </span>
                            <button
                              type="button"
                              className="chip"
                              style={{ fontSize: 11.5, padding: "3px 9px", cursor: "pointer" }}
                              onClick={() => addBlockAt("paragraph", idx)}
                            >
                              + Paragraph
                            </button>
                            <button
                              type="button"
                              className="chip"
                              style={{ fontSize: 11.5, padding: "3px 9px", cursor: "pointer" }}
                              onClick={() => addBlockAt("heading", idx)}
                            >
                              + Subheading
                            </button>
                            <button
                              type="button"
                              className="chip"
                              style={{ fontSize: 11.5, padding: "3px 9px", cursor: "pointer" }}
                              onClick={() => addBlockAt("image", idx)}
                            >
                              + 1 Picture
                            </button>
                            <button
                              type="button"
                              className="chip"
                              style={{ fontSize: 11.5, padding: "3px 9px", cursor: "pointer" }}
                              onClick={() => addBlockAt("gallery", idx)}
                            >
                              + 2 Pictures Side-by-Side
                            </button>
                            <button
                              type="button"
                              className="chip"
                              style={{ fontSize: 11.5, padding: "3px 9px", cursor: "pointer" }}
                              onClick={() => addBlockAt("quote", idx)}
                            >
                              + Quote
                            </button>
                            <button
                              type="button"
                              className="chip"
                              style={{ fontSize: 11.5, padding: "3px 9px", cursor: "pointer" }}
                              onClick={() => addBlockAt("video", idx)}
                            >
                              + Video
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid-3">
                    <div className="f-row">
                      <label>Author Attribution</label>
                      <input
                        type="text"
                        value={editingArticle.authorName || ""}
                        onChange={(e) => setEditingArticle({ ...editingArticle, authorName: e.target.value })}
                      />
                    </div>
                    <div className="f-row">
                      <label>Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={(editingArticle.tags || []).join(", ")}
                        onChange={(e) =>
                          setEditingArticle({
                            ...editingArticle,
                            tags: e.target.value
                              .split(",")
                              .map((t) => t.trim())
                              .filter(Boolean),
                          })
                        }
                      />
                    </div>
                    <div className="f-row">
                      <label>Workflow Status</label>
                      <select
                        value={editingArticle.status || "Draft"}
                        onChange={(e) =>
                          setEditingArticle({
                            ...editingArticle,
                            status: e.target.value as ArticleStatus,
                          })
                        }
                      >
                        <option value="Draft">Draft</option>
                        <option value="Submitted for Review">Submitted for Review</option>
                        {canPublish && <option value="Approved">Approved</option>}
                        {canPublish && <option value="Published">Published</option>}
                      </select>
                    </div>
                  </div>

                  <div className="grid-3">
                    <div className="f-row">
                      <label>Verification Badge</label>
                      <select
                        value={editingArticle.verification || "V"}
                        onChange={(e) =>
                          setEditingArticle({
                            ...editingArticle,
                            verification: e.target.value as VerificationType,
                          })
                        }
                      >
                        <option value="V">V — Verified Report</option>
                        <option value="S">S — Source Checked</option>
                        <option value="D">D — Demo / Sample Content</option>
                      </select>
                    </div>
                    <div className="f-row">
                      <label>Primary Source Name (if applicable)</label>
                      <input
                        type="text"
                        value={editingArticle.sourceName || ""}
                        onChange={(e) => setEditingArticle({ ...editingArticle, sourceName: e.target.value })}
                      />
                    </div>
                    <div className="f-row">
                      <label>Primary Source URL (https://...)</label>
                      <input
                        type="url"
                        value={editingArticle.sourceUrl || ""}
                        onChange={(e) => setEditingArticle({ ...editingArticle, sourceUrl: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Upload Image or Video Section */}
                  <div
                    className="card"
                    style={{
                      background: "var(--ivory-2)",
                      marginBottom: 18,
                      border: "1px dashed var(--green)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                      <div>
                        <span className="kicker">Article Media (Image &amp; Video Upload)</span>
                        <h4 style={{ fontFamily: "var(--serif)", fontSize: 18, margin: "2px 0 0" }}>
                          Upload a Featured Photograph or Video Report
                        </h4>
                      </div>
                      {uploadingMedia && (
                        <span className="chip active" style={{ fontSize: 12 }}>
                          Uploading media file...
                        </span>
                      )}
                    </div>

                    <div className="grid-2" style={{ marginBottom: 12 }}>
                      {/* Column 1: Image Upload */}
                      <div className="card" style={{ padding: 14 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "var(--green)" }}>
                          1. Featured Image (JPG, PNG, WEBP — max 15 MB)
                        </label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          disabled={uploadingMedia}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              handleUploadFile(f, (url) => {
                                setEditingArticle((prev) => (prev ? { ...prev, featuredImage: url } : prev));
                              });
                            }
                            e.target.value = "";
                          }}
                          style={{ marginBottom: 8, width: "100%", fontSize: 12.5 }}
                        />
                        <input
                          type="text"
                          placeholder="Or paste image URL (/uploads/... or https://...)"
                          value={editingArticle.featuredImage || ""}
                          onChange={(e) =>
                            setEditingArticle({ ...editingArticle, featuredImage: e.target.value })
                          }
                          style={{ width: "100%", fontSize: 12.5, padding: "7px 10px", marginBottom: 8 }}
                        />
                        {media.filter((m) => !/\.(mp4|webm|ogg|mov|m4v)$/i.test(m.filename || m.url)).length > 0 && (
                          <select
                            aria-label="Reuse existing image from Media Library"
                            value=""
                            onChange={(e) => {
                              const chosenUrl = e.target.value;
                              if (!chosenUrl) return;
                              const chosenAsset = media.find((m) => m.url === chosenUrl);
                              setEditingArticle({
                                ...editingArticle,
                                featuredImage: chosenUrl,
                                imageCaption:
                                  editingArticle.imageCaption ||
                                  (chosenAsset?.caption
                                    ? `${chosenAsset.caption} (${chosenAsset.credit})`
                                    : editingArticle.imageCaption),
                              });
                            }}
                            style={{ width: "100%", fontSize: 12, padding: "6px 10px", marginBottom: 8 }}
                          >
                            <option value="">— Reuse an existing image from Media Library —</option>
                            {media
                              .filter((m) => !/\.(mp4|webm|ogg|mov|m4v)$/i.test(m.filename || m.url))
                              .map((m) => (
                                <option key={m.id} value={m.url}>
                                  {m.caption || m.filename} ({m.filename})
                                </option>
                              ))}
                          </select>
                        )}
                        {editingArticle.featuredImage && (
                          <div style={{ marginTop: 6 }}>
                            <img
                              src={editingArticle.featuredImage}
                              alt="Featured preview"
                              style={{
                                width: "100%",
                                maxHeight: 150,
                                objectFit: "cover",
                                borderRadius: 8,
                                border: "1px solid var(--border)",
                              }}
                            />
                            <button
                              type="button"
                              className="chip"
                              style={{ marginTop: 6, fontSize: 11.5, padding: "3px 10px", cursor: "pointer" }}
                              onClick={() =>
                                setEditingArticle({ ...editingArticle, featuredImage: "" })
                              }
                            >
                              ✕ Remove Image
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Column 2: Video Upload */}
                      <div className="card" style={{ padding: 14 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "var(--copper)" }}>
                          2. Featured Video (MP4, WEBM, MOV — max 100 MB, or YouTube URL)
                        </label>
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/ogg,video/quicktime"
                          disabled={uploadingMedia}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              handleUploadFile(f, (url) => {
                                setEditingArticle((prev) => (prev ? { ...prev, featuredVideo: url } : prev));
                              });
                            }
                            e.target.value = "";
                          }}
                          style={{ marginBottom: 8, width: "100%", fontSize: 12.5 }}
                        />
                        <input
                          type="text"
                          placeholder="Or paste video / YouTube URL (https://youtube.com/watch?v=...)"
                          value={editingArticle.featuredVideo || ""}
                          onChange={(e) =>
                            setEditingArticle({ ...editingArticle, featuredVideo: e.target.value })
                          }
                          style={{ width: "100%", fontSize: 12.5, padding: "7px 10px", marginBottom: 8 }}
                        />
                        {media.filter((m) => /\.(mp4|webm|ogg|mov|m4v)$/i.test(m.filename || m.url)).length > 0 && (
                          <select
                            aria-label="Reuse existing video from Media Library"
                            value=""
                            onChange={(e) => {
                              const chosenUrl = e.target.value;
                              if (!chosenUrl) return;
                              setEditingArticle({
                                ...editingArticle,
                                featuredVideo: chosenUrl,
                              });
                            }}
                            style={{ width: "100%", fontSize: 12, padding: "6px 10px", marginBottom: 8 }}
                          >
                            <option value="">— Reuse an existing video from Media Library —</option>
                            {media
                              .filter((m) => /\.(mp4|webm|ogg|mov|m4v)$/i.test(m.filename || m.url))
                              .map((m) => (
                                <option key={m.id} value={m.url}>
                                  {m.caption || m.filename} ({m.filename})
                                </option>
                              ))}
                          </select>
                        )}
                        {editingArticle.featuredVideo && (
                          <div style={{ marginTop: 6 }}>
                            {editingArticle.featuredVideo.includes("youtube.com") ||
                            editingArticle.featuredVideo.includes("youtu.be") ? (
                              <div style={{ fontSize: 12, color: "var(--green)", fontWeight: 600 }}>
                                ✓ YouTube Video Linked: {editingArticle.featuredVideo}
                              </div>
                            ) : (
                              <video
                                src={editingArticle.featuredVideo}
                                controls
                                style={{
                                  width: "100%",
                                  maxHeight: 150,
                                  borderRadius: 8,
                                  background: "#000",
                                }}
                              />
                            )}
                            <button
                              type="button"
                              className="chip"
                              style={{ marginTop: 6, fontSize: 11.5, padding: "3px 10px", cursor: "pointer" }}
                              onClick={() =>
                                setEditingArticle({ ...editingArticle, featuredVideo: "" })
                              }
                            >
                              ✕ Remove Video
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="f-row" style={{ marginBottom: 0 }}>
                      <label>Media Caption / Photo &amp; Video Credit</label>
                      <input
                        type="text"
                        placeholder="e.g. Delegates at the MSSN Lagos conference. Photo: D2J Campus Desk."
                        value={editingArticle.imageCaption || ""}
                        onChange={(e) =>
                          setEditingArticle({ ...editingArticle, imageCaption: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="f-row">
                      <label>SEO Meta Title</label>
                      <input
                        type="text"
                        value={editingArticle.seoTitle || ""}
                        onChange={(e) => setEditingArticle({ ...editingArticle, seoTitle: e.target.value })}
                      />
                    </div>
                    <div className="f-row">
                      <label>Correction Note (if amended post-publication)</label>
                      <input
                        type="text"
                        value={editingArticle.correctionNote || ""}
                        onChange={(e) => setEditingArticle({ ...editingArticle, correctionNote: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    <button type="submit" className="btn btn-primary">
                      Save Article
                    </button>
                    {canPublish && editingArticle.id && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ color: "#991B1B", borderColor: "#FCA5A5" }}
                        onClick={() =>
                          handleDeleteArticle(
                            editingArticle.id!,
                            editingArticle.title || "this article"
                          )
                        }
                      >
                        🗑 Delete Article
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Draft Preview Modal */}
            {previewArticle && (
              <div className="card" style={{ padding: 24, marginBottom: 24, background: "var(--ivory-2)", border: "2px dashed var(--gold)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span className="kicker">Draft Preview Mode ({previewArticle.status})</span>
                  <button type="button" className="btn btn-outline" onClick={() => setPreviewArticle(null)}>
                    Close Preview
                  </button>
                </div>
                <h2 style={{ fontFamily: "var(--serif)", fontSize: 28, margin: "0 0 8px" }}>{previewArticle.title}</h2>
                <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "0 0 16px" }}>{previewArticle.summary}</p>
                {Array.isArray(previewArticle.contentBlocks) && previewArticle.contentBlocks.length > 0
                  ? previewArticle.contentBlocks.map((b, i) => {
                      if (b.type === "heading") {
                        return (
                          <h3 key={b.id || i} style={{ fontFamily: "var(--serif)", fontSize: 22, margin: "18px 0 8px" }}>
                            {b.text}
                          </h3>
                        );
                      }
                      if (b.type === "quote") {
                        return (
                          <blockquote
                            key={b.id || i}
                            style={{
                              borderLeft: "4px solid var(--gold)",
                              paddingLeft: 16,
                              margin: "16px 0",
                              fontStyle: "italic",
                            }}
                          >
                            {b.text}
                            {b.quoteAttribution && (
                              <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 4 }}>
                                — {b.quoteAttribution}
                              </div>
                            )}
                          </blockquote>
                        );
                      }
                      if (b.type === "image" && b.imageUrl) {
                        return (
                          <figure key={b.id || i} style={{ margin: "16px 0" }}>
                            <img
                              src={b.imageUrl}
                              alt={b.imageCaption || "Preview"}
                              style={{ width: "100%", maxHeight: 360, objectFit: "cover", borderRadius: 10 }}
                            />
                            {b.imageCaption && <figcaption>{b.imageCaption}</figcaption>}
                          </figure>
                        );
                      }
                      if (b.type === "gallery" && (b.imageUrl || b.secondImageUrl)) {
                        return (
                          <div key={b.id || i} className="grid-2" style={{ margin: "16px 0" }}>
                            {b.imageUrl && (
                              <figure style={{ margin: 0 }}>
                                <img
                                  src={b.imageUrl}
                                  alt={b.imageCaption || "Photo 1"}
                                  style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 8 }}
                                />
                                {b.imageCaption && <figcaption>{b.imageCaption}</figcaption>}
                              </figure>
                            )}
                            {b.secondImageUrl && (
                              <figure style={{ margin: 0 }}>
                                <img
                                  src={b.secondImageUrl}
                                  alt={b.secondImageCaption || "Photo 2"}
                                  style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 8 }}
                                />
                                {b.secondImageCaption && <figcaption>{b.secondImageCaption}</figcaption>}
                              </figure>
                            )}
                          </div>
                        );
                      }
                      return b.text ? (
                        <p key={b.id || i} style={{ lineHeight: 1.7 }}>
                          {b.text}
                        </p>
                      ) : null;
                    })
                  : (previewArticle.body || []).map((p, i) => (
                      <p key={i} style={{ lineHeight: 1.7 }}>
                        {p}
                      </p>
                    ))}
              </div>
            )}

            {/* Articles Table */}
            <div className="card" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                <thead>
                  <tr style={{ background: "var(--ivory-2)", textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                    <th style={{ padding: 12 }}>Title &amp; Slug</th>
                    <th style={{ padding: 12 }}>Category</th>
                    <th style={{ padding: 12 }}>Status</th>
                    <th style={{ padding: 12 }}>Verification</th>
                    <th style={{ padding: 12 }}>Author / Date</th>
                    <th style={{ padding: 12 }}>Workflow &amp; Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArticles.map((art) => (
                    <tr key={art.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: 12, maxWidth: 320 }}>
                        <strong style={{ display: "block", color: "var(--ink)" }}>{art.title}</strong>
                        <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>/news/{art.category}/{art.slug}</span>
                      </td>
                      <td style={{ padding: 12 }}>{art.category}</td>
                      <td style={{ padding: 12 }}>
                        <span
                          className="chip"
                          style={{
                            fontSize: 11.5,
                            padding: "3px 9px",
                            background:
                              art.status === "Published"
                                ? "#E8F3EC"
                                : art.status === "Approved"
                                ? "#DBEAFE"
                                : art.status === "Submitted for Review"
                                ? "#FEF3C7"
                                : "var(--ivory-2)",
                            color: art.status === "Published" ? "var(--green)" : "var(--ink)",
                          }}
                        >
                          {art.status}
                        </span>
                      </td>
                      <td style={{ padding: 12 }}>Class {art.verification}</td>
                      <td style={{ padding: 12, fontSize: 12 }}>
                        {art.authorName}
                        <br />
                        <span style={{ color: "var(--ink-3)" }}>{art.publishedAt}</span>
                      </td>
                      <td style={{ padding: 12 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          <button
                            type="button"
                            className="chip"
                            style={{ fontSize: 11.5, padding: "4px 8px" }}
                            onClick={() => startEditArticle(art)}
                          >
                            Edit
                          </button>
                          {art.status === "Draft" && (
                            <button
                              type="button"
                              className="chip"
                              style={{ fontSize: 11.5, padding: "4px 8px" }}
                              onClick={() => handleArticleStatus(art.id, "Submitted for Review")}
                            >
                              Submit for Review
                            </button>
                          )}
                          {canPublish && art.status === "Submitted for Review" && (
                            <button
                              type="button"
                              className="chip"
                              style={{ fontSize: 11.5, padding: "4px 8px", background: "#DBEAFE" }}
                              onClick={() => handleArticleStatus(art.id, "Approved")}
                            >
                              Approve
                            </button>
                          )}
                          {canPublish && (art.status === "Approved" || art.status === "Draft" || art.status === "Submitted for Review") && (
                            <button
                              type="button"
                              className="chip"
                              style={{ fontSize: 11.5, padding: "4px 8px", background: "#E8F3EC", color: "var(--green)" }}
                              onClick={() => handleArticleStatus(art.id, "Published")}
                            >
                              Publish
                            </button>
                          )}
                          {canPublish && art.status === "Published" && (
                            <button
                              type="button"
                              className="chip"
                              style={{ fontSize: 11.5, padding: "4px 8px" }}
                              onClick={() => handleArticleStatus(art.id, "Draft")}
                            >
                              Unpublish to Draft
                            </button>
                          )}
                          {canPublish && (
                            <button
                              type="button"
                              className="chip"
                              style={{
                                fontSize: 11.5,
                                padding: "4px 8px",
                                color: "#991B1B",
                                borderColor: "#FCA5A5",
                                background: "#FEF2F2",
                                cursor: "pointer",
                              }}
                              onClick={() => handleDeleteArticle(art.id, art.title)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CATEGORIES */}
        {activeTab === "categories" && (
          <div className="grid-2">
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ fontFamily: "var(--serif)", fontSize: 20, margin: "0 0 12px" }}>
                Active Categories ({categories.length})
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {categories.map((c) => (
                  <li key={c.slug} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <strong>{c.name}</strong> (<code>/news/{c.slug}</code>)
                    <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "4px 0" }}>{c.description}</p>
                    <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                      Topics: {c.topics.join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {canPublish && (
              <div className="card" style={{ padding: 22 }}>
                <h3 style={{ fontFamily: "var(--serif)", fontSize: 20, margin: "0 0 12px" }}>
                  Add or Update Category
                </h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const data = await apiAction("save_category", {
                      slug: newCatSlug,
                      name: newCatName,
                      description: newCatDesc,
                    });
                    setCategories(data.categories);
                    setNewCatSlug("");
                    setNewCatName("");
                    setNewCatDesc("");
                    notify("Category saved.");
                  }}
                >
                  <div className="f-row">
                    <label>Category Name *</label>
                    <input
                      type="text"
                      required
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                    />
                  </div>
                  <div className="f-row">
                    <label>Category Slug *</label>
                    <input
                      type="text"
                      required
                      value={newCatSlug}
                      onChange={(e) => setNewCatSlug(e.target.value)}
                    />
                  </div>
                  <div className="f-row">
                    <label>Description *</label>
                    <textarea
                      rows={3}
                      required
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Save Category
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: AUTHORS */}
        {activeTab === "authors" && (
          <div className="grid-2">
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ fontFamily: "var(--serif)", fontSize: 20, margin: "0 0 12px" }}>
                Editorial Desks &amp; Authors
              </h3>
              {authors.map((a) => (
                <div key={a.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <strong>{a.name}</strong> — <span style={{ fontSize: 12.5, color: "var(--green)" }}>{a.role}</span>
                  <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "4px 0 0" }}>{a.bio}</p>
                </div>
              ))}
            </div>

            {canPublish && (
              <div className="card" style={{ padding: 22 }}>
                <h3 style={{ fontFamily: "var(--serif)", fontSize: 20, margin: "0 0 12px" }}>
                  Add Verified Author Profile
                </h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const data = await apiAction("save_author", {
                      name: newAuthorName,
                      role: newAuthorRole,
                      bio: newAuthorBio,
                    });
                    setAuthors(data.authors);
                    setNewAuthorName("");
                    setNewAuthorRole("");
                    setNewAuthorBio("");
                    notify("Author profile added.");
                  }}
                >
                  <div className="f-row">
                    <label>Author / Desk Name *</label>
                    <input
                      type="text"
                      required
                      value={newAuthorName}
                      onChange={(e) => setNewAuthorName(e.target.value)}
                    />
                  </div>
                  <div className="f-row">
                    <label>Role / Title *</label>
                    <input
                      type="text"
                      required
                      value={newAuthorRole}
                      onChange={(e) => setNewAuthorRole(e.target.value)}
                    />
                  </div>
                  <div className="f-row">
                    <label>Short Verified Biography *</label>
                    <textarea
                      rows={3}
                      required
                      value={newAuthorBio}
                      onChange={(e) => setNewAuthorBio(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Save Author
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: OPPORTUNITIES */}
        {activeTab === "opportunities" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, margin: 0 }}>
                Opportunities Directory &amp; Source Verification
              </h2>
              {canPublish && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    setEditingOpp({
                      title: "",
                      provider: "",
                      type: "Scholarship",
                      deadline: "Check official portal",
                      lastVerified: new Date().toISOString().slice(0, 10),
                      summary: "",
                      officialUrl: "https://",
                      workflowStatus: "Source Verification",
                    })
                  }
                >
                  + Add Opportunity Listing
                </button>
              )}
            </div>

            {editingOpp && (
              <div className="card" style={{ padding: 22, marginBottom: 22, border: "2px solid var(--green)" }}>
                <h3 style={{ fontFamily: "var(--serif)", fontSize: 20, margin: "0 0 12px" }}>
                  {editingOpp.id ? "Edit Opportunity" : "New Opportunity"}
                </h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const data = await apiAction("save_opportunity", editingOpp as Record<string, unknown>);
                    setOpportunities(data.opportunities);
                    setEditingOpp(null);
                    notify("Opportunity saved.");
                  }}
                >
                  <div className="grid-2">
                    <div className="f-row">
                      <label>Title *</label>
                      <input
                        type="text"
                        required
                        value={editingOpp.title || ""}
                        onChange={(e) => setEditingOpp({ ...editingOpp, title: e.target.value })}
                      />
                    </div>
                    <div className="f-row">
                      <label>Host Organisation / Provider *</label>
                      <input
                        type="text"
                        required
                        value={editingOpp.provider || ""}
                        onChange={(e) => setEditingOpp({ ...editingOpp, provider: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid-3">
                    <div className="f-row">
                      <label>Type</label>
                      <select
                        value={editingOpp.type || "Scholarship"}
                        onChange={(e) =>
                          setEditingOpp({ ...editingOpp, type: e.target.value as Opportunity["type"] })
                        }
                      >
                        <option value="Scholarship">Scholarship</option>
                        <option value="Fellowship">Fellowship</option>
                        <option value="Internship">Internship</option>
                        <option value="Graduate Opportunity">Graduate Opportunity</option>
                        <option value="Career Guide">Career Guide</option>
                        <option value="Programme">Programme</option>
                      </select>
                    </div>
                    <div className="f-row">
                      <label>Official Application URL *</label>
                      <input
                        type="url"
                        required
                        value={editingOpp.officialUrl || ""}
                        onChange={(e) => setEditingOpp({ ...editingOpp, officialUrl: e.target.value })}
                      />
                    </div>
                    <div className="f-row">
                      <label>Workflow Status</label>
                      <select
                        value={editingOpp.workflowStatus || "Draft"}
                        onChange={(e) =>
                          setEditingOpp({
                            ...editingOpp,
                            workflowStatus: e.target.value as Opportunity["workflowStatus"],
                          })
                        }
                      >
                        <option value="Draft">Draft</option>
                        <option value="Source Verification">Source Verification</option>
                        <option value="Published">Published</option>
                        <option value="Expired/Archived">Expired/Archived</option>
                      </select>
                    </div>
                  </div>
                  <div className="f-row">
                    <label>Verified Summary *</label>
                    <textarea
                      rows={3}
                      required
                      value={editingOpp.summary || ""}
                      onChange={(e) => setEditingOpp({ ...editingOpp, summary: e.target.value })}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="submit" className="btn btn-primary">
                      Save Opportunity
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => setEditingOpp(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid-3">
              {opportunities.map((o) => (
                <div key={o.id} className="card" style={{ padding: 20 }}>
                  <span className="cat-tag">
                    {o.type} · {o.workflowStatus}
                  </span>
                  <h3 style={{ fontFamily: "var(--serif)", fontSize: 18, margin: "6px 0" }}>{o.title}</h3>
                  <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "0 0 10px" }}>{o.summary}</p>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 12 }}>
                    Verified: {o.lastVerified} · <a href={o.officialUrl} target="_blank" rel="noreferrer">Official Source ↗</a>
                  </div>
                  {canPublish && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ padding: "5px 12px", fontSize: 12 }}
                        onClick={() => setEditingOpp(o)}
                      >
                        Edit / Change Status
                      </button>
                      <button
                        type="button"
                        className="chip"
                        style={{
                          padding: "5px 10px",
                          fontSize: 12,
                          color: "#991B1B",
                          borderColor: "#FCA5A5",
                          background: "#FEF2F2",
                          cursor: "pointer",
                        }}
                        onClick={async () => {
                          if (
                            typeof window !== "undefined" &&
                            !window.confirm(`Delete opportunity "${o.title}"?`)
                          ) {
                            return;
                          }
                          const data = await apiAction("delete_opportunity", { id: o.id });
                          setOpportunities(data.opportunities);
                          notify(`Deleted opportunity "${o.title}".`);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6 & 7: ASK A SCHOLAR QUEUE & APPROVED ANSWERS */}
        {(activeTab === "ask-scholar" || activeTab === "approved-answers") && (
          <div>
            <div className="notice" style={{ marginBottom: 20 }}>
              <strong>Religious Content Safeguard:</strong> Submitted questions enter as{" "}
              <code>Private Submission</code> and never appear publicly until screened by an editor, reviewed by a named scholar, and explicitly published. AI generation of fatwas is strictly prohibited.
            </div>

            {reviewingQA && (
              <div className="card" style={{ padding: 24, marginBottom: 24, border: "2px solid var(--green)" }}>
                <h3 style={{ fontFamily: "var(--serif)", fontSize: 22, margin: "0 0 8px" }}>
                  Scholar Review &amp; Editorial Screening: {reviewingQA.subject}
                </h3>
                <p style={{ fontSize: 13.5, background: "var(--ivory-2)", padding: 12, borderRadius: 8 }}>
                  <strong>Original Private Question ({reviewingQA.topic}):</strong> {reviewingQA.questionText}
                </p>

                <form onSubmit={handleSaveQAReview}>
                  <div className="f-row">
                    <label>Anonymised Public Question Summary (personal identifiers removed) *</label>
                    <input
                      type="text"
                      required
                      value={qaSummary}
                      onChange={(e) => setQaSummary(e.target.value)}
                    />
                  </div>
                  <div className="f-row">
                    <label>Scholarly Response Paragraphs (blank line between paragraphs)</label>
                    <textarea
                      rows={6}
                      value={qaAnswerText}
                      onChange={(e) => setQaAnswerText(e.target.value)}
                      placeholder="Enter the scholar-reviewed response here..."
                    />
                  </div>
                  <div className="f-row">
                    <label>Checked Scriptural / Classical References (one per line)</label>
                    <textarea
                      rows={3}
                      value={qaRefs}
                      onChange={(e) => setQaRefs(e.target.value)}
                    />
                  </div>
                  <div className="grid-3">
                    <div className="f-row">
                      <label>Scholar Reviewer Name</label>
                      <input
                        type="text"
                        value={qaScholarName}
                        onChange={(e) => setQaScholarName(e.target.value)}
                      />
                    </div>
                    <div className="f-row">
                      <label>Scholar Verified Credentials</label>
                      <input
                        type="text"
                        value={qaScholarCreds}
                        onChange={(e) => setQaScholarCreds(e.target.value)}
                      />
                    </div>
                    <div className="f-row">
                      <label>Workflow Stage</label>
                      <select
                        value={qaTargetStatus}
                        onChange={(e) => setQaTargetStatus(e.target.value as ScholarQAStatus)}
                      >
                        <option value="Private Submission">Private Submission</option>
                        <option value="Editorial Screening">Editorial Screening</option>
                        <option value="Scholar Review">Scholar Review</option>
                        <option value="Approved Public Answer">Approved Public Answer</option>
                        {canPublish && <option value="Published">Published (Public on Site)</option>}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="submit" className="btn btn-primary">
                      Save Review &amp; Status
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => setReviewingQA(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid-2">
              {scholarQuestions
                .filter((q) =>
                  activeTab === "approved-answers"
                    ? q.status === "Published" || q.status === "Approved Public Answer"
                    : true
                )
                .map((q) => (
                  <div key={q.id} className="card" style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span className="cat-tag">{q.topic}</span>
                      <span className="chip" style={{ fontSize: 11.5, padding: "2px 8px" }}>
                        {q.status}
                      </span>
                    </div>
                    <h3 style={{ fontFamily: "var(--serif)", fontSize: 18, margin: "0 0 8px" }}>{q.subject}</h3>
                    <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "0 0 10px" }}>{q.questionText}</p>
                    <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 12 }}>
                      Submitted: {q.submittedAt.slice(0, 10)} · Reviewer: {q.scholarReviewerName || "Unassigned"}
                    </div>
                    {canScholar && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: "6px 12px", fontSize: 12.5 }}
                          onClick={() => openQAReview(q)}
                        >
                          Screen / Review Question
                        </button>
                        {canPublish && (
                          <button
                            type="button"
                            className="chip"
                            style={{
                              padding: "6px 10px",
                              fontSize: 12,
                              color: "#991B1B",
                              borderColor: "#FCA5A5",
                              background: "#FEF2F2",
                              cursor: "pointer",
                            }}
                            onClick={async () => {
                              if (
                                typeof window !== "undefined" &&
                                !window.confirm(`Delete Q&A "${q.subject}"?`)
                              ) {
                                return;
                              }
                              const data = await apiAction("delete_scholar_qa", { id: q.id });
                              setScholarQuestions(data.scholarQuestions);
                              notify(`Deleted Q&A "${q.subject}".`);
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 8: STORY SUBMISSIONS */}
        {activeTab === "story-submissions" && (
          <div>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, margin: "0 0 16px" }}>
              Reader &amp; Campus Story Submissions ({storySubmissions.length})
            </h2>
            {storySubmissions.length === 0 ? (
              <div className="card" style={{ padding: 28, textAlign: "center", color: "var(--ink-3)" }}>
                No reader story submissions in queue yet. Submissions sent via <code>/submit</code> appear here in real time.
              </div>
            ) : (
              <div className="grid-2">
                {storySubmissions.map((s) => (
                  <div key={s.id} className="card" style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span className="cat-tag">{s.category}</span>
                      <span className="chip" style={{ fontSize: 11.5, padding: "2px 8px" }}>
                        {s.status}
                      </span>
                    </div>
                    <h3 style={{ fontFamily: "var(--serif)", fontSize: 19, margin: "0 0 6px" }}>{s.headline}</h3>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-2)", margin: "0 0 8px" }}>
                      By {s.contributorName} ({s.email}) {s.institution ? `· ${s.institution}` : ""}
                    </p>
                    <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "0 0 12px" }}>{s.summary}</p>
                    {canPublish && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {(["Editorial Review", "Accepted", "Rejected"] as StorySubmissionStatus[]).map((st) => (
                          <button
                            key={st}
                            type="button"
                            className="chip"
                            style={{ fontSize: 11.5, padding: "4px 10px" }}
                            onClick={async () => {
                              const data = await apiAction("update_story_submission", {
                                id: s.id,
                                status: st,
                              });
                              setStorySubmissions(data.storySubmissions);
                              notify(`Submission marked as ${st}.`);
                            }}
                          >
                            Mark {st}
                          </button>
                        ))}
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: "5px 12px", fontSize: 12 }}
                          onClick={async () => {
                            const data = await apiAction("update_story_submission", {
                              id: s.id,
                              status: "Prepared for Publication",
                              convertToDraft: true,
                            });
                            setStorySubmissions(data.storySubmissions);
                            setArticles(data.articles);
                            notify("Converted story submission into an Article Draft!");
                          }}
                        >
                          Promote to Article Draft →
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 9: CONTACT MESSAGES */}
        {activeTab === "contacts" && (
          <div>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, margin: "0 0 16px" }}>
              Contact &amp; Correction Enquiries ({contactSubmissions.length})
            </h2>
            {contactSubmissions.length === 0 ? (
              <div className="card" style={{ padding: 28, textAlign: "center", color: "var(--ink-3)" }}>
                No contact enquiries logged yet. Messages sent via <code>/contact</code> appear here.
              </div>
            ) : (
              <div className="grid-2">
                {contactSubmissions.map((c) => (
                  <div key={c.id} className="card" style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span className="cat-tag">{c.enquiryType}</span>
                      <span className="chip" style={{ fontSize: 11.5, padding: "2px 8px" }}>
                        {c.status}
                      </span>
                    </div>
                    <h3 style={{ fontFamily: "var(--serif)", fontSize: 18, margin: "0 0 6px" }}>
                      {c.subject || c.enquiryType}
                    </h3>
                    <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: "0 0 8px" }}>
                      From: {c.name} ({c.email}) · {c.submittedAt.slice(0, 10)}
                    </p>
                    <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "0 0 12px" }}>{c.message}</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      {(["Reviewed", "Resolved"] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          className="chip"
                          style={{ fontSize: 11.5, padding: "4px 10px" }}
                          onClick={async () => {
                            const data = await apiAction("update_contact_status", { id: c.id, status: st });
                            setContactSubmissions(data.contactSubmissions);
                            notify(`Contact enquiry marked ${st}.`);
                          }}
                        >
                          Mark {st}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reader Comments Moderation Section */}
            <div style={{ marginTop: 32 }}>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, margin: "0 0 14px" }}>
                Public Reader Comments on News Articles ({comments.length})
              </h2>
              {comments.length === 0 ? (
                <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--ink-3)" }}>
                  No reader comments posted yet.
                </div>
              ) : (
                <div className="grid-2">
                  {comments.map((cmt) => (
                    <div key={cmt.id} className="card" style={{ padding: 18 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span className="cat-tag">{cmt.articleTitle}</span>
                        <span
                          className="chip"
                          style={{
                            fontSize: 11.5,
                            padding: "2px 8px",
                            background: cmt.status === "Approved" ? "#E8F3EC" : "#FEE2E2",
                            color: cmt.status === "Approved" ? "#063A19" : "#991B1B",
                          }}
                        >
                          {cmt.status}
                        </span>
                      </div>
                      <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: "0 0 8px" }}>
                        By <strong>{cmt.authorName}</strong>
                        {cmt.locationOrCampus ? ` (${cmt.locationOrCampus})` : ""} ·{" "}
                        {cmt.createdAt ? cmt.createdAt.slice(0, 10) : ""}
                      </p>
                      <p style={{ fontSize: 13.5, color: "var(--ink)", margin: "0 0 12px" }}>
                        {cmt.content}
                      </p>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {cmt.status !== "Approved" && (
                          <button
                            type="button"
                            className="chip"
                            style={{ fontSize: 11.5, padding: "4px 10px", cursor: "pointer" }}
                            onClick={async () => {
                              const data = await apiAction("update_comment_status", {
                                id: cmt.id,
                                status: "Approved",
                              });
                              setComments(data.comments);
                              notify("Comment approved and visible on article.");
                            }}
                          >
                            ✓ Approve
                          </button>
                        )}
                        {cmt.status === "Approved" && (
                          <button
                            type="button"
                            className="chip"
                            style={{ fontSize: 11.5, padding: "4px 10px", cursor: "pointer" }}
                            onClick={async () => {
                              const data = await apiAction("update_comment_status", {
                                id: cmt.id,
                                status: "Hidden",
                              });
                              setComments(data.comments);
                              notify("Comment hidden from public view.");
                            }}
                          >
                            Hide Comment
                          </button>
                        )}
                        <button
                          type="button"
                          className="chip"
                          style={{
                            fontSize: 11.5,
                            padding: "4px 10px",
                            color: "#991B1B",
                            borderColor: "#FCA5A5",
                            cursor: "pointer",
                          }}
                          onClick={async () => {
                            const data = await apiAction("delete_comment", { id: cmt.id });
                            setComments(data.comments);
                            notify("Comment deleted.");
                          }}
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 10: MEDIA LIBRARY */}
        {activeTab === "media" && (
          <div className="grid-2">
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ fontFamily: "var(--serif)", fontSize: 20, margin: "0 0 12px" }}>
                Media Assets ({media.length})
              </h3>
              <div className="grid-2">
                {media.map((m) => {
                  const isVid = /\.(mp4|webm|ogg|mov|m4v)$/i.test(m.url);
                  return (
                    <div key={m.id} className="card" style={{ padding: 12 }}>
                      {isVid ? (
                        <video
                          src={m.url}
                          controls
                          style={{ width: "100%", height: 110, objectFit: "cover", background: "#000", borderRadius: 6 }}
                        />
                      ) : (
                        <img
                          src={m.url}
                          alt={m.caption}
                          style={{ width: "100%", height: 110, objectFit: "contain", background: "var(--ivory-2)", borderRadius: 6 }}
                        />
                      )}
                      <strong style={{ display: "block", fontSize: 12.5, marginTop: 8, wordBreak: "break-all" }}>
                        {m.filename}
                      </strong>
                      <span style={{ fontSize: 11.5, color: "var(--ink-3)", display: "block" }}>{m.caption}</span>
                      <code style={{ fontSize: 10.5, color: "var(--green)", display: "block", marginTop: 4 }}>
                        {m.url}
                      </code>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ fontFamily: "var(--serif)", fontSize: 20, margin: "0 0 12px" }}>
                Upload Image or Video from Computer
              </h3>
              <div
                className="card"
                style={{
                  background: "var(--ivory-2)",
                  marginBottom: 18,
                  border: "1px dashed var(--green)",
                }}
              >
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                  Select Image (JPG, PNG, WEBP) or Video (MP4, WEBM, MOV)
                </label>
                <input
                  type="file"
                  accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime"
                  disabled={uploadingMedia}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      handleUploadFile(f, (url, _type, filename) => {
                        setNewMediaUrl(url);
                        setNewMediaFilename(filename);
                        if (!newMediaCaption) setNewMediaCaption(f.name);
                      });
                    }
                    e.target.value = "";
                  }}
                />
                {uploadingMedia && (
                  <p style={{ fontSize: 12.5, color: "var(--green)", marginTop: 8, marginBottom: 0 }}>
                    Uploading file to <code>/public/uploads/</code>...
                  </p>
                )}
              </div>

              <h4 style={{ fontFamily: "var(--serif)", fontSize: 17, margin: "0 0 10px" }}>
                Or Register External Media URL
              </h4>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const data = await apiAction("save_media", {
                    filename: newMediaFilename,
                    url: newMediaUrl,
                    caption: newMediaCaption,
                    credit: newMediaCredit,
                  });
                  setMedia(data.media);
                  setNewMediaFilename("");
                  setNewMediaUrl("");
                  setNewMediaCaption("");
                  notify("Media asset registered.");
                }}
              >
                <div className="f-row">
                  <label>Filename *</label>
                  <input
                    type="text"
                    required
                    value={newMediaFilename}
                    onChange={(e) => setNewMediaFilename(e.target.value)}
                  />
                </div>
                <div className="f-row">
                  <label>Public Path or URL *</label>
                  <input
                    type="text"
                    required
                    placeholder="/logo.webp"
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                  />
                </div>
                <div className="f-row">
                  <label>Alt / Caption *</label>
                  <input
                    type="text"
                    required
                    value={newMediaCaption}
                    onChange={(e) => setNewMediaCaption(e.target.value)}
                  />
                </div>
                <div className="f-row">
                  <label>Credit *</label>
                  <input
                    type="text"
                    required
                    value={newMediaCredit}
                    onChange={(e) => setNewMediaCredit(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Save to Media Library
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 11: MANAGE ADMINS & GRANULAR ACCESS ROLES (SUPER ADMIN / USER MANAGER) */}
        {activeTab === "users" && isAdmin && (
          <div>
            <div
              className="card"
              style={{
                padding: 20,
                marginBottom: 22,
                borderLeft: "4px solid var(--gold)",
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div>
                <span className="kicker">Super Admin Access Control</span>
                <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, margin: "4px 0 0" }}>
                  Add Admins &amp; Staff · Assign Exact Roles &amp; Module Permissions
                </h2>
                <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "4px 0 0" }}>
                  Add new administrators, editors, scholars, or contributors and select the exact dashboard sections and categories each person is permitted to access.
                </p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setActiveTab("admin-reviews")}
                >
                  Review Other Admins&apos; Work ({activityLogs.length}) →
                </button>
              </div>
            </div>

            <div className="grid-2">
              {/* Left Column: Existing Admins & Staff Directory */}
              <div className="card" style={{ padding: 22 }}>
                <h3 style={{ fontFamily: "var(--serif)", fontSize: 20, margin: "0 0 14px" }}>
                  Authorised Admins &amp; Editorial Staff ({users.length})
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {users.map((u) => {
                    const authoredOrEditedCount = articles.filter(
                      (a) =>
                        a.authorId === u.id ||
                        a.lastEditedById === u.id ||
                        a.authorName.toLowerCase() === u.name.toLowerCase()
                    ).length;
                    const qaReviewedCount = scholarQuestions.filter(
                      (q) =>
                        (q.scholarReviewerName &&
                          q.scholarReviewerName.toLowerCase() === u.name.toLowerCase()) ||
                        (q.editorApproverName &&
                          q.editorApproverName.toLowerCase() === u.name.toLowerCase())
                    ).length;
                    const logsCount = activityLogs.filter((l) => l.actorId === u.id).length;
                    const perms =
                      Array.isArray(u.permissions) && u.permissions.length > 0
                        ? u.permissions
                        : getDefaultPermissionsForRole(u.role);

                    return (
                      <div
                        key={u.id}
                        className="card"
                        style={{
                          padding: 16,
                          background: u.active ? "var(--ivory)" : "var(--ivory-2)",
                          border:
                            editingUserId === u.id
                              ? "2px solid var(--green)"
                              : "1px solid var(--border)",
                          opacity: u.active ? 1 : 0.72,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                            gap: 8,
                            marginBottom: 6,
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: 15.5 }}>{u.name}</strong>
                            <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
                              {u.title} · <code>{u.email}</code>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span
                              className="chip"
                              style={{
                                fontSize: 11,
                                padding: "2px 9px",
                                background:
                                  u.role === "SUPER_ADMIN" || u.isSuperAdmin
                                    ? "var(--gold)"
                                    : u.role === "ADMINISTRATOR"
                                    ? "var(--green)"
                                    : "var(--ivory-2)",
                                color:
                                  u.role === "SUPER_ADMIN" || u.isSuperAdmin
                                    ? "#1B1305"
                                    : u.role === "ADMINISTRATOR"
                                    ? "#fff"
                                    : "var(--ink)",
                                fontWeight: 700,
                              }}
                            >
                              {u.isSuperAdmin ? "SUPER_ADMIN" : u.role}
                            </span>
                            <span
                              className="chip"
                              style={{
                                fontSize: 10.5,
                                padding: "2px 8px",
                                background: u.active ? "#E8F3EC" : "#FEE2E2",
                                color: u.active ? "var(--green)" : "#991B1B",
                              }}
                            >
                              {u.active ? "Active" : "Suspended"}
                            </span>
                          </div>
                        </div>

                        {/* Granted Module Access Pills */}
                        <div style={{ margin: "8px 0" }}>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: "var(--ink-3)",
                              marginBottom: 4,
                              textTransform: "uppercase",
                            }}
                          >
                            Granted Access Modules ({perms.length}):
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {perms.map((p) => {
                              const found = PERMISSION_LABELS.find((pl) => pl.id === p);
                              return (
                                <span
                                  key={p}
                                  style={{
                                    fontSize: 11,
                                    padding: "2px 7px",
                                    borderRadius: 6,
                                    background: "var(--ivory-2)",
                                    border: "1px solid var(--border)",
                                    color: "var(--ink-2)",
                                  }}
                                >
                                  {found ? found.label : p}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Allowed Categories */}
                        <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 8 }}>
                          <strong>Categories:</strong>{" "}
                          {!u.allowedCategories || u.allowedCategories.includes("ALL")
                            ? "All Categories"
                            : u.allowedCategories.join(", ")}
                          {u.lastLoginAt && (
                            <span> · Last login: {u.lastLoginAt.slice(0, 10)}</span>
                          )}
                        </div>

                        {/* Activity Summary & Actions */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 8,
                            paddingTop: 8,
                            borderTop: "1px solid var(--border)",
                          }}
                        >
                          <span style={{ fontSize: 12, color: "var(--ink-2)" }}>
                            <strong>{authoredOrEditedCount}</strong> articles ·{" "}
                            <strong>{qaReviewedCount}</strong> Q&amp;A reviews ·{" "}
                            <strong>{logsCount}</strong> logged actions
                          </span>

                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{ padding: "4px 10px", fontSize: 11.5 }}
                              onClick={() => {
                                setSelectedAdminToReview(u.id);
                                setActiveTab("admin-reviews");
                              }}
                            >
                              Inspect Admin&apos;s Reviews →
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ padding: "4px 10px", fontSize: 11.5 }}
                              onClick={() => {
                                setEditingUserId(u.id);
                                setNewUserName(u.name);
                                setNewUserEmail(u.email);
                                setNewUserRole(u.role);
                                setNewUserTitle(u.title);
                                setNewUserPassword("");
                                setNewUserActive(u.active);
                                setNewUserPermissions(perms);
                                setNewUserCategories(
                                  Array.isArray(u.allowedCategories) &&
                                    u.allowedCategories.length > 0
                                    ? u.allowedCategories
                                    : ["ALL"]
                                );
                              }}
                            >
                              Edit Role &amp; Access
                            </button>
                            {isSuperAdmin && u.id !== "usr-admin" && u.id !== session.userId && (
                              <button
                                type="button"
                                className="chip"
                                style={{
                                  padding: "4px 9px",
                                  fontSize: 11.5,
                                  color: "#991B1B",
                                  borderColor: "#FCA5A5",
                                  cursor: "pointer",
                                }}
                                onClick={async () => {
                                  const data = await apiAction("delete_user", { id: u.id });
                                  setUsers(data.users);
                                  if (editingUserId === u.id) setEditingUserId(null);
                                  notify(`Removed account for ${u.name}.`);
                                }}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Add or Edit Admin / Staff & Granular Access Checkboxes */}
              <div className="card" style={{ padding: 22 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <h3 style={{ fontFamily: "var(--serif)", fontSize: 20, margin: 0 }}>
                    {editingUserId
                      ? `Edit Admin / Staff Access (${newUserName})`
                      : "Add New Admin or Staff Member"}
                  </h3>
                  {editingUserId && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: "4px 10px", fontSize: 12 }}
                      onClick={() => {
                        setEditingUserId(null);
                        setNewUserName("");
                        setNewUserEmail("");
                        setNewUserRole("ADMINISTRATOR");
                        setNewUserTitle("");
                        setNewUserPassword("");
                        setNewUserActive(true);
                        setNewUserPermissions(getDefaultPermissionsForRole("ADMINISTRATOR"));
                        setNewUserCategories(["ALL"]);
                      }}
                    >
                      + Switch to New Account
                    </button>
                  )}
                </div>

                {lastSavedCredentials && (
                  <div
                    className="card"
                    style={{
                      padding: 16,
                      marginBottom: 16,
                      background: "#E8F3EC",
                      border: "1px solid var(--green)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <strong style={{ color: "var(--green)", fontSize: 14 }}>
                        ✓ Login Details Ready to Share ({lastSavedCredentials.name})
                      </strong>
                      <button
                        type="button"
                        className="chip"
                        style={{ fontSize: 11, padding: "2px 8px", cursor: "pointer" }}
                        onClick={() => setLastSavedCredentials(null)}
                      >
                        Dismiss
                      </button>
                    </div>
                    <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "var(--ink)", marginBottom: 10 }}>
                      <div>
                        <strong>Login Page:</strong>{" "}
                        <code>
                          {typeof window !== "undefined" ? `${window.location.origin}/admin/login` : "/admin/login"}
                        </code>
                      </div>
                      <div>
                        <strong>Email:</strong> <code>{lastSavedCredentials.email}</code>
                      </div>
                      <div>
                        <strong>Password:</strong>{" "}
                        <code>{lastSavedCredentials.password || "(Unchanged — existing password)"}</code>
                      </div>
                      <div>
                        <strong>Role:</strong> <code>{lastSavedCredentials.role}</code>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: "5px 12px", fontSize: 12 }}
                      onClick={() => {
                        const loginUrl =
                          typeof window !== "undefined"
                            ? `${window.location.origin}/admin/login`
                            : "/admin/login";
                        const text = `D2J Media Hub Staff Login\nLogin URL: ${loginUrl}\nEmail: ${lastSavedCredentials.email}\nPassword: ${lastSavedCredentials.password || "(your existing password)"}\nRole: ${lastSavedCredentials.role}`;
                        navigator.clipboard?.writeText(text);
                        notify("Copied login details to clipboard!");
                      }}
                    >
                      📋 Copy Login Details to Send to Staff
                    </button>
                  </div>
                )}

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const savedName = newUserName;
                    const savedEmail = newUserEmail;
                    const savedPass = newUserPassword;
                    const savedRole = newUserRole;
                    const data = await apiAction("save_user", {
                      id: editingUserId || undefined,
                      name: newUserName,
                      email: newUserEmail,
                      role: newUserRole,
                      title: newUserTitle,
                      password: newUserPassword || undefined,
                      active: newUserActive,
                      permissions: newUserPermissions,
                      allowedCategories: newUserCategories,
                    });
                    setUsers(data.users);
                    const wasEditing = Boolean(editingUserId);
                    setLastSavedCredentials({
                      name: savedName,
                      email: savedEmail,
                      password: savedPass || undefined,
                      role: savedRole,
                    });
                    setEditingUserId(null);
                    setNewUserName("");
                    setNewUserEmail("");
                    setNewUserTitle("");
                    setNewUserPassword("");
                    setNewUserActive(true);
                    notify(
                      wasEditing
                        ? "Admin / Staff role and access permissions updated."
                        : "New Admin / Staff account created with assigned permissions."
                    );
                  }}
                >
                  <div className="grid-2">
                    <div className="f-row">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ustadh Ibrahim Musa"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                      />
                    </div>
                    <div className="f-row">
                      <label>Editorial Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="admin2@d2jmediahub.local"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="f-row">
                      <label>Primary Role Preset *</label>
                      <select
                        value={newUserRole}
                        onChange={(e) => {
                          const r = e.target.value as UserRole;
                          setNewUserRole(r);
                          setNewUserPermissions(getDefaultPermissionsForRole(r));
                        }}
                      >
                        {isSuperAdmin && (
                          <option value="SUPER_ADMIN">
                            SUPER_ADMIN (Full Platform &amp; Admin Oversight)
                          </option>
                        )}
                        <option value="ADMINISTRATOR">
                          ADMINISTRATOR (Admin — Customisable Access)
                        </option>
                        <option value="EDITOR">
                          EDITOR (Review, Approve &amp; Publish Content)
                        </option>
                        <option value="SCHOLAR">
                          SCHOLAR (Ask a Scholar Q&amp;A Reviewer)
                        </option>
                        <option value="CONTRIBUTOR">
                          CONTRIBUTOR (Create Article Drafts &amp; Upload Media)
                        </option>
                      </select>
                    </div>
                    <div className="f-row">
                      <label>Desk / Official Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Managing Admin, Campus Editor"
                        value={newUserTitle}
                        onChange={(e) => setNewUserTitle(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Granular Module Access Checkboxes */}
                  <div
                    className="card"
                    style={{
                      padding: 14,
                      marginBottom: 14,
                      background: "var(--ivory-2)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                        flexWrap: "wrap",
                        gap: 6,
                      }}
                    >
                      <label style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>
                        Select Exact Dashboard Access &amp; Capabilities for This Person:
                      </label>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          className="chip"
                          style={{ fontSize: 11, padding: "2px 8px", cursor: "pointer" }}
                          onClick={() =>
                            setNewUserPermissions(PERMISSION_LABELS.map((p) => p.id))
                          }
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          className="chip"
                          style={{ fontSize: 11, padding: "2px 8px", cursor: "pointer" }}
                          onClick={() =>
                            setNewUserPermissions(getDefaultPermissionsForRole(newUserRole))
                          }
                        >
                          Reset to Role Default
                        </button>
                      </div>
                    </div>

                    <div className="grid-2" style={{ gap: 8 }}>
                      {PERMISSION_LABELS.map((perm) => {
                        const checked = newUserPermissions.includes(perm.id);
                        return (
                          <label
                            key={perm.id}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 8,
                              padding: "7px 10px",
                              borderRadius: 6,
                              background: checked ? "#E8F3EC" : "var(--ivory)",
                              border: `1px solid ${checked ? "var(--green)" : "var(--border)"}`,
                              cursor: "pointer",
                              fontSize: 12.5,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewUserPermissions([...newUserPermissions, perm.id]);
                                } else {
                                  setNewUserPermissions(
                                    newUserPermissions.filter((id) => id !== perm.id)
                                  );
                                }
                              }}
                              style={{ marginTop: 3 }}
                            />
                            <div>
                              <strong style={{ display: "block", color: "var(--ink)" }}>
                                {perm.label}
                              </strong>
                              <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
                                {perm.desc}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category Scope Assignment */}
                  <div
                    className="card"
                    style={{
                      padding: 14,
                      marginBottom: 14,
                      background: "var(--ivory-2)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <label style={{ fontWeight: 700, fontSize: 13, display: "block", marginBottom: 6 }}>
                      Assigned Editorial Categories:
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      <button
                        type="button"
                        className={`chip ${newUserCategories.includes("ALL") ? "active" : ""}`}
                        style={{ fontSize: 11.5, padding: "4px 10px", cursor: "pointer" }}
                        onClick={() => setNewUserCategories(["ALL"])}
                      >
                        All Categories (Unrestricted)
                      </button>
                      {categories.map((cat) => {
                        const isSelected =
                          !newUserCategories.includes("ALL") &&
                          newUserCategories.includes(cat.slug);
                        return (
                          <button
                            key={cat.slug}
                            type="button"
                            className={`chip ${isSelected ? "active" : ""}`}
                            style={{ fontSize: 11.5, padding: "4px 10px", cursor: "pointer" }}
                            onClick={() => {
                              const withoutAll = newUserCategories.filter((c) => c !== "ALL");
                              if (withoutAll.includes(cat.slug)) {
                                const next = withoutAll.filter((c) => c !== cat.slug);
                                setNewUserCategories(next.length > 0 ? next : ["ALL"]);
                              } else {
                                setNewUserCategories([...withoutAll, cat.slug]);
                              }
                            }}
                          >
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="f-row">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <label style={{ margin: 0 }}>
                          {editingUserId
                            ? "New Password (leave blank to keep current)"
                            : "Create Password for This Person (min 8 chars) *"}
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowUserPassword(!showUserPassword)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--green)",
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {showUserPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                      <input
                        type={showUserPassword ? "text" : "password"}
                        required={!editingUserId}
                        minLength={8}
                        placeholder={editingUserId ? "Leave blank to keep unchanged" : "Min 8 characters"}
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                      />
                    </div>
                    <div className="f-row">
                      <label>Account Status</label>
                      <select
                        value={newUserActive ? "ACTIVE" : "SUSPENDED"}
                        onChange={(e) => setNewUserActive(e.target.value === "ACTIVE")}
                      >
                        <option value="ACTIVE">Active (Can Sign In)</option>
                        <option value="SUSPENDED">Suspended (Access Revoked)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="submit" className="btn btn-primary">
                      {editingUserId
                        ? "Save Role & Access Permissions"
                        : "+ Create Admin / Staff Account"}
                    </button>
                    {editingUserId && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setEditingUserId(null)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 12: REVIEW OTHER ADMINS' WORK & ACTIVITY LOG */}
        {activeTab === "admin-reviews" && canReviewAdmins && (
          <div>
            <div
              className="card"
              style={{
                padding: 20,
                marginBottom: 20,
                borderLeft: "4px solid var(--green)",
              }}
            >
              <span className="kicker">Super Admin &amp; Editorial Oversight</span>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, margin: "4px 0 6px" }}>
                See &amp; Review Other Admins&apos; Editorial Work &amp; Decisions
              </h2>
              <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "0 0 14px" }}>
                Select any Administrator, Editor, Scholar, or Contributor below to inspect all articles they wrote or edited, scholarly answers they reviewed, and their chronological audit trail. You can approve their actions or flag items for revision.
              </p>

              {/* Filter by Specific Admin / Staff Member */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button
                  type="button"
                  className={`chip ${selectedAdminToReview === "ALL" ? "active" : ""}`}
                  style={{ padding: "6px 12px", fontSize: 12.5, cursor: "pointer" }}
                  onClick={() => setSelectedAdminToReview("ALL")}
                >
                  All Admins &amp; Staff ({activityLogs.length} actions)
                </button>
                {users.map((u) => {
                  const count = activityLogs.filter((l) => l.actorId === u.id).length;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      className={`chip ${selectedAdminToReview === u.id ? "active" : ""}`}
                      style={{ padding: "6px 12px", fontSize: 12.5, cursor: "pointer" }}
                      onClick={() => setSelectedAdminToReview(u.id)}
                    >
                      {u.name} ({u.isSuperAdmin ? "SUPER_ADMIN" : u.role}) · {count}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Work Breakdown Cards for Selected Admin (or All Admins) */}
            <div className="grid-2" style={{ marginBottom: 22 }}>
              {/* Articles Created / Edited / Approved by Selected Admin */}
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontFamily: "var(--serif)", fontSize: 19, margin: "0 0 12px" }}>
                  Articles Handled by{" "}
                  {selectedAdminToReview === "ALL"
                    ? "Editorial Team"
                    : users.find((u) => u.id === selectedAdminToReview)?.name || "Selected Admin"}
                </h3>
                {(() => {
                  const targetUser = users.find((u) => u.id === selectedAdminToReview);
                  const adminArticles =
                    selectedAdminToReview === "ALL"
                      ? articles.slice(0, 6)
                      : articles.filter(
                          (a) =>
                            a.authorId === selectedAdminToReview ||
                            a.lastEditedById === selectedAdminToReview ||
                            a.approvedById === selectedAdminToReview ||
                            (targetUser &&
                              a.authorName.toLowerCase() === targetUser.name.toLowerCase())
                        );

                  if (adminArticles.length === 0) {
                    return (
                      <p style={{ fontSize: 13, color: "var(--ink-3)" }}>
                        No articles authored or edited by this admin yet.
                      </p>
                    );
                  }

                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {adminArticles.map((art) => (
                        <div
                          key={art.id}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 8,
                            background: "var(--ivory-2)",
                            border: "1px solid var(--border)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: 13.5, display: "block" }}>
                              {art.title}
                            </strong>
                            <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                              Category: <strong>{art.category}</strong> · Status:{" "}
                              <strong>{art.status}</strong> · By: {art.lastEditedBy || art.authorName}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: "4px 10px", fontSize: 11.5, flexShrink: 0 }}
                            onClick={() => {
                              setActiveTab("articles");
                              startEditArticle(art);
                            }}
                          >
                            Review / Edit
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Scholar Q&As & Opportunities Reviewed by Selected Admin */}
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontFamily: "var(--serif)", fontSize: 19, margin: "0 0 12px" }}>
                  Scholarly Q&amp;As Reviewed by{" "}
                  {selectedAdminToReview === "ALL"
                    ? "Review Desk"
                    : users.find((u) => u.id === selectedAdminToReview)?.name || "Selected Admin"}
                </h3>
                {(() => {
                  const targetUser = users.find((u) => u.id === selectedAdminToReview);
                  const adminQAs =
                    selectedAdminToReview === "ALL"
                      ? scholarQuestions.slice(0, 6)
                      : scholarQuestions.filter(
                          (q) =>
                            targetUser &&
                            ((q.scholarReviewerName &&
                              q.scholarReviewerName
                                .toLowerCase()
                                .includes(targetUser.name.toLowerCase())) ||
                              (q.editorApproverName &&
                                q.editorApproverName
                                  .toLowerCase()
                                  .includes(targetUser.name.toLowerCase())))
                        );

                  if (adminQAs.length === 0) {
                    return (
                      <p style={{ fontSize: 13, color: "var(--ink-3)" }}>
                        No Ask a Scholar items reviewed by this staff member yet.
                      </p>
                    );
                  }

                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {adminQAs.map((qa) => (
                        <div
                          key={qa.id}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 8,
                            background: "var(--ivory-2)",
                            border: "1px solid var(--border)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: 13.5, display: "block" }}>
                              {qa.subject}
                            </strong>
                            <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                              Stage: <strong>{qa.status}</strong> · Reviewer:{" "}
                              {qa.scholarReviewerName || "Unassigned"}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: "4px 10px", fontSize: 11.5, flexShrink: 0 }}
                            onClick={() => {
                              setActiveTab("ask-scholar");
                              openQAReview(qa);
                            }}
                          >
                            Inspect Q&amp;A
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Chronological Admin Activity & Super Admin Review Audit Log */}
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ fontFamily: "var(--serif)", fontSize: 20, margin: "0 0 14px" }}>
                Chronological Admin Activity &amp; Review Log
              </h3>

              {(() => {
                const filteredLogs =
                  selectedAdminToReview === "ALL"
                    ? activityLogs
                    : activityLogs.filter((l) => l.actorId === selectedAdminToReview);

                if (filteredLogs.length === 0) {
                  return (
                    <p style={{ fontSize: 13.5, color: "var(--ink-3)" }}>
                      No activity logged for this selection yet.
                    </p>
                  );
                }

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {filteredLogs.map((log) => {
                      const statusColor =
                        log.superAdminReviewStatus === "Approved"
                          ? "var(--green)"
                          : log.superAdminReviewStatus === "Needs Revision"
                          ? "#991B1B"
                          : "var(--copper)";
                      const statusBg =
                        log.superAdminReviewStatus === "Approved"
                          ? "#E8F3EC"
                          : log.superAdminReviewStatus === "Needs Revision"
                          ? "#FEE2E2"
                          : "#FEF3C7";

                      return (
                        <div
                          key={log.id}
                          className="card"
                          style={{
                            padding: 16,
                            background: "var(--ivory)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              flexWrap: "wrap",
                              gap: 8,
                              marginBottom: 6,
                            }}
                          >
                            <div>
                              <span
                                className="cat-tag"
                                style={{ marginRight: 8, fontSize: 11 }}
                              >
                                {log.actorName} ({log.actorRole})
                              </span>
                              <strong style={{ fontSize: 15 }}>{log.action}:</strong>{" "}
                              <span style={{ fontSize: 14.5, color: "var(--ink)" }}>
                                {log.targetTitle}
                              </span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              {log.statusChange && (
                                <span
                                  className="chip"
                                  style={{ fontSize: 11, padding: "2px 8px" }}
                                >
                                  {log.statusChange}
                                </span>
                              )}
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: "2px 9px",
                                  borderRadius: 99,
                                  background: statusBg,
                                  color: statusColor,
                                }}
                              >
                                {log.superAdminReviewStatus || "Pending Review"}
                              </span>
                            </div>
                          </div>

                          <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginBottom: 8 }}>
                            {log.details && <span>{log.details} · </span>}
                            <span>
                              Logged: {log.createdAt.replace("T", " ").slice(0, 16)}
                            </span>
                            {log.reviewedBySuperAdmin && (
                              <span>
                                {" "}
                                · Reviewed by <strong>{log.reviewedBySuperAdmin}</strong>
                              </span>
                            )}
                          </div>

                          {log.superAdminReviewNote && (
                            <div
                              style={{
                                fontSize: 12.5,
                                padding: "8px 12px",
                                borderRadius: 6,
                                background: "var(--ivory-2)",
                                borderLeft: "3px solid var(--gold)",
                                marginBottom: 10,
                              }}
                            >
                              <strong>Super Admin Review Note:</strong> {log.superAdminReviewNote}
                            </div>
                          )}

                          {/* Super Admin Review Controls */}
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              alignItems: "center",
                              gap: 8,
                              paddingTop: 8,
                              borderTop: "1px solid var(--border)",
                            }}
                          >
                            <input
                              type="text"
                              placeholder="Add review note or feedback for this admin..."
                              value={
                                reviewNoteDrafts[log.id] !== undefined
                                  ? reviewNoteDrafts[log.id]
                                  : log.superAdminReviewNote || ""
                              }
                              onChange={(e) =>
                                setReviewNoteDrafts({
                                  ...reviewNoteDrafts,
                                  [log.id]: e.target.value,
                                })
                              }
                              style={{
                                flex: 1,
                                minWidth: 220,
                                padding: "6px 10px",
                                fontSize: 12.5,
                                borderRadius: 6,
                                border: "1px solid var(--border)",
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ padding: "5px 12px", fontSize: 12 }}
                              onClick={async () => {
                                await apiAction("review_admin_activity", {
                                  logId: log.id,
                                  reviewStatus: "Approved",
                                  reviewNote:
                                    reviewNoteDrafts[log.id] !== undefined
                                      ? reviewNoteDrafts[log.id]
                                      : log.superAdminReviewNote,
                                });
                                notify("Marked admin activity as Approved.");
                              }}
                            >
                              ✓ Approve Admin Work
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{
                                padding: "5px 12px",
                                fontSize: 12,
                                color: "#991B1B",
                                borderColor: "#FCA5A5",
                              }}
                              onClick={async () => {
                                await apiAction("review_admin_activity", {
                                  logId: log.id,
                                  reviewStatus: "Needs Revision",
                                  reviewNote:
                                    reviewNoteDrafts[log.id] !== undefined
                                      ? reviewNoteDrafts[log.id]
                                      : log.superAdminReviewNote,
                                });
                                notify("Flagged admin activity as Needs Revision.");
                              }}
                            >
                              ⚑ Flag for Revision
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB 13: SITE SETTINGS */}
        {activeTab === "settings" && (
          <div className="card" style={{ padding: 24, maxWidth: 720 }}>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, margin: "0 0 16px" }}>
              Platform &amp; Breaking News Settings
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const data = await apiAction("save_settings", settings as unknown as Record<string, unknown>);
                setSettings(data.settings);
                notify("Site settings updated.");
              }}
            >
              <div className="grid-2">
                <div className="f-row">
                  <label>Site Name</label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  />
                </div>
                <div className="f-row">
                  <label>Official Tagline</label>
                  <input
                    type="text"
                    value={settings.tagline}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  />
                </div>
              </div>

              <div className="f-row">
                <label>Breaking News Ticker Headline</label>
                <input
                  type="text"
                  value={settings.breakingNewsText}
                  onChange={(e) => setSettings({ ...settings, breakingNewsText: e.target.value })}
                />
              </div>

              <div className="grid-2">
                <div className="f-row">
                  <label>Official Editorial Contact Email</label>
                  <input
                    type="text"
                    value={settings.officialEmail}
                    onChange={(e) => setSettings({ ...settings, officialEmail: e.target.value })}
                  />
                </div>
                <div className="f-row">
                  <label>Partnerships &amp; Business Email</label>
                  <input
                    type="text"
                    value={settings.businessEmail}
                    onChange={(e) => setSettings({ ...settings, businessEmail: e.target.value })}
                  />
                </div>
              </div>

              {canPublish && (
                <button type="submit" className="btn btn-primary">
                  Save Site Settings
                </button>
              )}
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
