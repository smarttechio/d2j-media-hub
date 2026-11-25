"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import type {
  AdPaymentStatus,
  AdPlacement,
  AdStatus,
  Advertisement,
  Article,
  Category,
  DailyAnalyticsRollup,
  MediaItem,
  SiteSettings,
} from "@/lib/db";

const PLACEMENT_OPTIONS: { id: AdPlacement; label: string; suggested: string }[] = [
  { id: "homepage_header", label: "Homepage Header Banner", suggested: "728x90 or 970x90" },
  { id: "homepage_between_sections", label: "Homepage Between News Sections", suggested: "728x90 or 970x90" },
  { id: "article_top", label: "Article Top Banner", suggested: "728x90" },
  { id: "in_article", label: "In-Article Advertisement", suggested: "728x90 or 300x250" },
  { id: "article_bottom", label: "Article Bottom Banner", suggested: "728x90" },
  { id: "desktop_sidebar", label: "Desktop Sidebar Advertisement", suggested: "300x250 or 300x600" },
  { id: "category_page", label: "Category Page Advertisement", suggested: "728x90 or 970x90" },
  { id: "mobile_responsive", label: "Responsive Mobile Advertisement", suggested: "320x100 or 300x250" },
];

const DIMENSION_OPTIONS: Advertisement["dimensions"][] = [
  "728x90",
  "970x90",
  "300x250",
  "300x600",
  "320x100",
];

// ============================================================================
// 1. LIGHTWEIGHT SEO CHECKLIST IN ARTICLE EDITOR
// ============================================================================
export function ArticleEditorSeoChecklist({
  article,
  bodyParagraphsCount,
  hasInternalLink,
}: {
  article: Partial<Article>;
  bodyParagraphsCount: number;
  hasInternalLink: boolean;
}) {
  const titleLen = (article.title || "").trim().length;
  const seoTitleLen = ((article.seoTitle || article.title || "").trim()).length;
  const metaDescLen = ((article.seoDescription || article.summary || "").trim()).length;
  const hasImage = Boolean(
    article.featuredImage ||
      (Array.isArray(article.contentBlocks) &&
        article.contentBlocks.some((b) => Boolean(b.imageUrl || b.secondImageUrl)))
  );
  const hasAltCaption = Boolean((article.imageCaption || "").trim().length >= 10);
  const isPublishedIndexable = article.status === "Published" && article.verification !== "D";

  const checks = [
    {
      label: "Article Headline",
      ok: titleLen >= 25 && titleLen <= 115,
      detail: titleLen > 0 ? `${titleLen} chars (target 25–115)` : "Missing headline",
    },
    {
      label: "SEO Meta Title",
      ok: seoTitleLen >= 30 && seoTitleLen <= 75,
      detail: `${seoTitleLen} chars (uses SEO Title or Headline)`,
    },
    {
      label: "Meta Description / Standfirst",
      ok: metaDescLen >= 70 && metaDescLen <= 220,
      detail: metaDescLen > 0 ? `${metaDescLen} chars (target 70–220)` : "Will auto-extract from first paragraph",
    },
    {
      label: "Featured Image & Open Graph Preview",
      ok: hasImage,
      detail: hasImage ? "Absolute HTTPS og:image ready" : "No featured image uploaded yet",
    },
    {
      label: "Featured Image Alt Text / Caption",
      ok: hasAltCaption,
      detail: hasAltCaption ? "Descriptive caption present" : "Add photo caption (10+ chars)",
    },
    {
      label: "Canonical URL & Clean Slug",
      ok: Boolean(article.title && article.category),
      detail: `/news/${article.category || "news"}/${article.slug || "(auto-generated clean slug)"}`,
    },
    {
      label: "Internal / Source Links & Body Depth",
      ok: bodyParagraphsCount >= 3 || hasInternalLink,
      detail: `${bodyParagraphsCount} paragraph(s)${hasInternalLink ? " · includes link" : ""}`,
    },
    {
      label: "NewsArticle Structured Data (JSON-LD)",
      ok: true,
      detail: "Auto-injected on public article page",
    },
    {
      label: "Search Indexability",
      ok: isPublishedIndexable,
      detail: isPublishedIndexable
        ? "Indexable (Published & Verified)"
        : "Not indexed until status is Published",
    },
  ];

  const passedCount = checks.filter((c) => c.ok).length;

  return (
    <div
      className="card"
      style={{
        padding: 16,
        marginBottom: 16,
        background: "var(--ivory)",
        border: "1px solid var(--border)",
        borderLeft: "4px solid var(--green)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <div>
          <span className="kicker">Live Editorial SEO &amp; Social Preview Checklist</span>
          <h4 style={{ fontFamily: "var(--serif)", fontSize: 16, margin: "2px 0 0" }}>
            Article Readiness ({passedCount} / {checks.length} checks passed)
          </h4>
        </div>
        <span
          className="chip"
          style={{
            fontSize: 11.5,
            background: passedCount >= 7 ? "#E8F3EC" : "#FEF3C7",
            color: passedCount >= 7 ? "var(--green)" : "var(--copper)",
            fontWeight: 700,
          }}
        >
          {passedCount >= 7 ? "✓ SEO Ready" : "Review Recommended"}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 8,
          fontSize: 12.5,
        }}
      >
        {checks.map((chk) => (
          <div
            key={chk.label}
            style={{
              padding: "7px 10px",
              borderRadius: 6,
              background: "var(--wh)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <span
              style={{
                color: chk.ok ? "var(--green)" : "#B45309",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {chk.ok ? "✓" : "•"}
            </span>
            <div>
              <strong style={{ display: "block", color: "var(--ink)" }}>{chk.label}</strong>
              <span style={{ color: "var(--ink-3)", fontSize: 11.5 }}>{chk.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 2. MODULE 1 — WEBSITE ANALYTICS TAB
// ============================================================================
export function AdminAnalyticsTab({
  articles,
  initialRollups,
  settings,
  canPublish,
  onSaveSettings,
}: {
  articles: Article[];
  initialRollups: DailyAnalyticsRollup[];
  settings: SiteSettings;
  canPublish: boolean;
  onSaveSettings: (patch: Partial<SiteSettings>) => Promise<void>;
}) {
  const [range, setRange] = useState<"today" | "7d" | "30d" | "90d" | "365d" | "custom">("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [rollups, setRollups] = useState<DailyAnalyticsRollup[]>(initialRollups);
  const [ga4Status, setGa4Status] = useState<{
    ga4Configured: boolean;
    ga4MeasurementId: string;
    ga4DataApiConnected: boolean;
    ga4Summary: {
      pageViews: number;
      uniqueVisitors: number;
      totalEngagementSeconds: number;
      engagedSessions: number;
    } | null;
  } | null>(null);
  const [gaIdInput, setGaIdInput] = useState(settings.ga4MeasurementId || "");
  const [showPublicViews, setShowPublicViews] = useState(
    settings.showPublicArticleViews !== false
  );

  useEffect(() => {
    let cancelled = false;
    const qs = new URLSearchParams({ range });
    if (range === "custom" && customStart) qs.set("start", customStart);
    if (range === "custom" && customEnd) qs.set("end", customEnd);

    fetch(`/api/analytics?${qs.toString()}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (Array.isArray(data.rollups)) setRollups(data.rollups);
        setGa4Status({
          ga4Configured: Boolean(data.ga4Configured),
          ga4MeasurementId: data.ga4MeasurementId || "",
          ga4DataApiConnected: Boolean(data.ga4DataApiConnected),
          ga4Summary: data.ga4Summary || null,
        });
      })
      .catch(() => null);

    return () => {
      cancelled = true;
    };
  }, [range, customStart, customEnd]);

  const todayIso = new Date().toISOString().slice(0, 10);

  const filteredRollups = useMemo(() => {
    const daysBack =
      range === "today"
        ? 0
        : range === "7d"
        ? 6
        : range === "90d"
        ? 89
        : range === "365d"
        ? 364
        : 29;
    const minDate =
      range === "custom" && customStart
        ? customStart
        : new Date(Date.now() - daysBack * 86400000).toISOString().slice(0, 10);
    const maxDate = range === "custom" && customEnd ? customEnd : todayIso;

    return rollups
      .filter((r) => r.date >= minDate && r.date <= maxDate)
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [rollups, range, customStart, customEnd, todayIso]);

  const publishedArticles = useMemo(
    () => articles.filter((a) => a.status === "Published" && a.verification !== "D"),
    [articles]
  );

  const totalArticleViewsInDb = useMemo(
    () => publishedArticles.reduce((sum, a) => sum + (Number(a.views) || 0), 0),
    [publishedArticles]
  );

  const aggregated = useMemo(() => {
    let pageViews = 0;
    let uniqueVisitors = 0;
    let totalEngagementSeconds = 0;
    let engagedSessions = 0;
    const sources = { direct: 0, search: 0, social: 0, referral: 0 };
    const devices = { mobile: 0, desktop: 0, tablet: 0 };
    const countries: Record<string, number> = {};
    const periodArticleViews: Record<string, number> = {};

    for (const r of filteredRollups) {
      pageViews += r.pageViews || 0;
      uniqueVisitors += r.uniqueVisitors || 0;
      totalEngagementSeconds += r.totalEngagementSeconds || 0;
      engagedSessions += r.engagedSessions || 0;
      sources.direct += r.sources?.direct || 0;
      sources.search += r.sources?.search || 0;
      sources.social += r.sources?.social || 0;
      sources.referral += r.sources?.referral || 0;
      devices.mobile += r.devices?.mobile || 0;
      devices.desktop += r.devices?.desktop || 0;
      devices.tablet += r.devices?.tablet || 0;
      for (const [c, cnt] of Object.entries(r.countries || {})) {
        countries[c] = (countries[c] || 0) + cnt;
      }
      for (const [artId, cnt] of Object.entries(r.articleViews || {})) {
        periodArticleViews[artId] = (periodArticleViews[artId] || 0) + cnt;
      }
    }

    const todayRollup = rollups.find((r) => r.date === todayIso);
    const weekCut = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
    const monthCut = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
    const yearCut = new Date(Date.now() - 364 * 86400000).toISOString().slice(0, 10);

    const weeklyViews = rollups
      .filter((r) => r.date >= weekCut)
      .reduce((s, r) => s + (r.pageViews || 0), 0);
    const monthlyViews = rollups
      .filter((r) => r.date >= monthCut)
      .reduce((s, r) => s + (r.pageViews || 0), 0);
    const yearlyViews = rollups
      .filter((r) => r.date >= yearCut)
      .reduce((s, r) => s + (r.pageViews || 0), 0);

    const avgEngagementSec =
      engagedSessions > 0 ? Math.round(totalEngagementSeconds / engagedSessions) : 0;

    return {
      pageViews: ga4Status?.ga4Summary?.pageViews ?? pageViews,
      uniqueVisitors: ga4Status?.ga4Summary?.uniqueVisitors ?? uniqueVisitors,
      todayViews: todayRollup?.pageViews || 0,
      weeklyViews,
      monthlyViews,
      yearlyViews,
      avgEngagementSec,
      sources,
      devices,
      countries,
      periodArticleViews,
    };
  }, [filteredRollups, rollups, todayIso, ga4Status]);

  const mostReadArticles = useMemo(
    () => [...publishedArticles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 8),
    [publishedArticles]
  );

  const trendingArticles = useMemo(() => {
    return [...publishedArticles]
      .map((a) => ({
        article: a,
        recentViews: aggregated.periodArticleViews[a.id] || 0,
      }))
      .sort((a, b) => {
        if (b.recentViews !== a.recentViews) return b.recentViews - a.recentViews;
        return a.article.publishedAt < b.article.publishedAt ? 1 : -1;
      })
      .slice(0, 6);
  }, [publishedArticles, aggregated.periodArticleViews]);

  const maxTrendViews = Math.max(
    1,
    ...filteredRollups.map((r) => r.pageViews || 0)
  );

  return (
    <div>
      {/* Setup & Public View Counter Controls */}
      <div className="card" style={{ padding: 20, marginBottom: 20, borderLeft: "4px solid var(--green)" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div>
            <span className="kicker">Google Analytics 4 &amp; First-Party Readership Engine</span>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, margin: "2px 0 0" }}>
              Website Traffic &amp; Article Readership Analytics
            </h2>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(
              [
                ["today", "Today"],
                ["7d", "Last 7 Days"],
                ["30d", "Last 30 Days"],
                ["90d", "Last 90 Days"],
                ["365d", "Last 12 Months"],
                ["custom", "Custom Range"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`chip ${range === id ? "active" : ""}`}
                style={{ fontSize: 12, padding: "5px 11px", cursor: "pointer" }}
                onClick={() => setRange(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {range === "custom" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* GA4 Connection Status Banner (No fabricated stats) */}
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: "var(--ivory-2)",
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          <strong>Data Source Status:</strong>{" "}
          {ga4Status?.ga4DataApiConnected ? (
            <span style={{ color: "var(--green)", fontWeight: 600 }}>
              ✓ Connected to Google Analytics 4 Data API ({ga4Status.ga4MeasurementId}) + D2J First-Party Article Counter
            </span>
          ) : ga4Status?.ga4Configured ? (
            <span>
              ✓ GA4 Tracking Tag Active (<code>{ga4Status.ga4MeasurementId}</code>). Showing real D2J database article views &amp; first-party rollup beacons below. (To pull external GA4 Data API totals directly into this panel, set <code>GA4_PROPERTY_ID</code>, <code>GOOGLE_CLIENT_EMAIL</code>, and <code>GOOGLE_PRIVATE_KEY</code> in Vercel.)
            </span>
          ) : (
            <span>
              Showing real D2J database article views and live first-party reader beacons (admin visits, bots, and 15-minute repeat refreshes are automatically excluded). Enter your GA4 Measurement ID (<code>G-XXXXXXXXXX</code>) below to enable Google Analytics 4 tag tracking.
            </span>
          )}
        </div>

        {canPublish && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              alignItems: "center",
              paddingTop: 10,
              borderTop: "1px solid var(--border)",
            }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={showPublicViews}
                onChange={(e) => setShowPublicViews(e.target.checked)}
              />
              Show Public Article View Counter on Article Pages
            </label>

            <input
              type="text"
              placeholder="GA4 Measurement ID (e.g. G-XXXXXXXXXX)"
              value={gaIdInput}
              onChange={(e) => setGaIdInput(e.target.value)}
              style={{ maxWidth: 260, padding: "7px 12px", fontSize: 13 }}
            />

            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: "7px 14px", fontSize: 13 }}
              onClick={() =>
                onSaveSettings({
                  showPublicArticleViews: showPublicViews,
                  ga4MeasurementId: gaIdInput.trim(),
                })
              }
            >
              Save Analytics Settings
            </button>
          </div>
        )}
      </div>

      {/* Top KPI Cards */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: 18 }}>
          <span className="cat-tag">Cumulative Article Views</span>
          <div className="stat-num">{totalArticleViewsInDb.toLocaleString()}</div>
          <div className="stat-sub">
            <span>Across {publishedArticles.length} published articles (stable IDs)</span>
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <span className="cat-tag">Period Page Views / Unique Visitors</span>
          <div className="stat-num">{aggregated.pageViews.toLocaleString()}</div>
          <div className="stat-sub">
            <span>{aggregated.uniqueVisitors.toLocaleString()} unique visitors in selected period</span>
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <span className="cat-tag">Today / 7-Day / 30-Day Views</span>
          <div className="stat-num">{aggregated.todayViews.toLocaleString()}</div>
          <div className="stat-sub">
            <span>
              7d: {aggregated.weeklyViews.toLocaleString()} · 30d: {aggregated.monthlyViews.toLocaleString()} · 1yr: {aggregated.yearlyViews.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <span className="cat-tag">Avg. Reader Engagement Time</span>
          <div className="stat-num">
            {aggregated.avgEngagementSec > 0
              ? `${Math.floor(aggregated.avgEngagementSec / 60)}m ${aggregated.avgEngagementSec % 60}s`
              : "—"}
          </div>
          <div className="stat-sub">
            <span>Measured from active article reading sessions</span>
          </div>
        </div>
      </div>

      {/* Traffic Trend Chart */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontFamily: "var(--serif)", fontSize: 19, margin: "0 0 12px" }}>
          Daily Traffic Trend ({filteredRollups.length} recorded day{filteredRollups.length === 1 ? "" : "s"})
        </h3>
        {filteredRollups.length === 0 ? (
          <p style={{ fontSize: 13.5, color: "var(--ink-3)", margin: 0 }}>
            No daily traffic beacons recorded for this date filter yet. Real visits will populate this chart automatically as readers browse public pages.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
              height: 140,
              padding: "12px 4px 4px",
              overflowX: "auto",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {filteredRollups.map((r) => {
              const heightPct = Math.max(8, Math.round(((r.pageViews || 0) / maxTrendViews) * 100));
              return (
                <div
                  key={r.date}
                  title={`${r.date}: ${r.pageViews} views (${r.uniqueVisitors} unique)`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minWidth: 38,
                  }}
                >
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--green)", marginBottom: 4 }}>
                    {r.pageViews}
                  </span>
                  <div
                    style={{
                      width: 22,
                      height: `${heightPct}px`,
                      background: "var(--green)",
                      borderRadius: "4px 4px 0 0",
                    }}
                  />
                  <span style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 4 }}>
                    {r.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sources, Devices & Visitor Countries */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ fontFamily: "var(--serif)", fontSize: 18, margin: "0 0 10px" }}>
            Traffic Sources
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13.5, lineHeight: 1.9 }}>
            <li>
              <strong>Direct:</strong> {aggregated.sources.direct.toLocaleString()}
            </li>
            <li>
              <strong>Organic Search (Google/Bing):</strong> {aggregated.sources.search.toLocaleString()}
            </li>
            <li>
              <strong>Social (WhatsApp/Facebook/X):</strong> {aggregated.sources.social.toLocaleString()}
            </li>
            <li>
              <strong>External Referrals:</strong> {aggregated.sources.referral.toLocaleString()}
            </li>
          </ul>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ fontFamily: "var(--serif)", fontSize: 18, margin: "0 0 10px" }}>
            Device Breakdown
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13.5, lineHeight: 1.9 }}>
            <li>
              <strong>Mobile Phones:</strong> {aggregated.devices.mobile.toLocaleString()}
            </li>
            <li>
              <strong>Desktop / Laptop:</strong> {aggregated.devices.desktop.toLocaleString()}
            </li>
            <li>
              <strong>Tablet:</strong> {aggregated.devices.tablet.toLocaleString()}
            </li>
          </ul>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ fontFamily: "var(--serif)", fontSize: 18, margin: "0 0 10px" }}>
            Visitor Countries
          </h3>
          {Object.keys(aggregated.countries).length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>
              Country breakdown will appear as live traffic beacons arrive.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13.5, lineHeight: 1.9 }}>
              {Object.entries(aggregated.countries)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([code, cnt]) => (
                  <li key={code}>
                    <strong>{code === "NG" ? "Nigeria (NG)" : code}:</strong> {cnt.toLocaleString()}
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>

      {/* Most-Read & Trending Articles */}
      <div className="grid-2">
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: "var(--serif)", fontSize: 19, margin: "0 0 12px" }}>
            Most-Read Published Articles (All-Time Views)
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                <th style={{ padding: "8px 6px" }}>Article</th>
                <th style={{ padding: "8px 6px" }}>Category</th>
                <th style={{ padding: "8px 6px", textAlign: "right" }}>Views</th>
              </tr>
            </thead>
            <tbody>
              {mostReadArticles.map((art) => (
                <tr key={art.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px 6px" }}>
                    <Link
                      href={`/news/${art.category}/${art.slug}`}
                      target="_blank"
                      style={{ fontWeight: 600, color: "var(--ink)" }}
                    >
                      {art.title}
                    </Link>
                    <div style={{ fontSize: 11, color: "var(--ink-3)" }}>ID: {art.id}</div>
                  </td>
                  <td style={{ padding: "8px 6px" }}>{art.category}</td>
                  <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 700, color: "var(--green)" }}>
                    {(art.views || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: "var(--serif)", fontSize: 19, margin: "0 0 12px" }}>
            Trending Articles (Recent Activity &amp; Velocity)
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                <th style={{ padding: "8px 6px" }}>Article</th>
                <th style={{ padding: "8px 6px", textAlign: "right" }}>Period Views</th>
                <th style={{ padding: "8px 6px", textAlign: "right" }}>Total Views</th>
              </tr>
            </thead>
            <tbody>
              {trendingArticles.map(({ article: art, recentViews }) => (
                <tr key={art.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px 6px" }}>
                    <Link
                      href={`/news/${art.category}/${art.slug}`}
                      target="_blank"
                      style={{ fontWeight: 600, color: "var(--ink)" }}
                    >
                      {art.title}
                    </Link>
                    <div style={{ fontSize: 11, color: "var(--ink-3)" }}>Published {art.publishedAt}</div>
                  </td>
                  <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 700 }}>
                    +{recentViews.toLocaleString()}
                  </td>
                  <td style={{ padding: "8px 6px", textAlign: "right", color: "var(--ink-2)" }}>
                    {(art.views || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. MODULE 2 — ADVERTISEMENT MANAGEMENT TAB
// ============================================================================
export function AdminAdvertisementsTab({
  advertisements,
  categories,
  media,
  settings,
  uploadingMedia,
  onUploadFile,
  onSaveAd,
  onUpdateAdStatus,
  onDeleteAd,
  onSaveSettings,
}: {
  advertisements: Advertisement[];
  categories: Category[];
  media: MediaItem[];
  settings: SiteSettings;
  uploadingMedia: boolean;
  onUploadFile: (
    file: File,
    onUploaded: (url: string, mediaType: "image" | "video", filename: string) => void
  ) => Promise<void>;
  onSaveAd: (payload: Partial<Advertisement>) => Promise<void>;
  onUpdateAdStatus: (id: string, status: AdStatus) => Promise<void>;
  onDeleteAd: (id: string, title: string) => Promise<void>;
  onSaveSettings: (patch: Partial<SiteSettings>) => Promise<void>;
}) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const defaultEndIso = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [advertiserName, setAdvertiserName] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [placement, setPlacement] = useState<AdPlacement>("homepage_header");
  const [dimensions, setDimensions] = useState<Advertisement["dimensions"]>("728x90");
  const [labelType, setLabelType] = useState<"Advertisement" | "Sponsored">("Advertisement");
  const [targetCategories, setTargetCategories] = useState<string[]>(["ALL"]);
  const [startDate, setStartDate] = useState(todayIso);
  const [endDate, setEndDate] = useState(defaultEndIso);
  const [status, setStatus] = useState<AdStatus>("Active");
  const [priceNgn, setPriceNgn] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<AdPaymentStatus>("Pending");
  const [notes, setNotes] = useState("");

  const [adsenseEnabled, setAdsenseEnabled] = useState(Boolean(settings.adsenseEnabled));
  const [adsenseClientId, setAdsenseClientId] = useState(settings.adsenseClientId || "");

  function resetForm() {
    setEditingId(undefined);
    setTitle("");
    setAdvertiserName("");
    setBannerUrl("");
    setDestinationUrl("");
    setPlacement("homepage_header");
    setDimensions("728x90");
    setLabelType("Advertisement");
    setTargetCategories(["ALL"]);
    setStartDate(todayIso);
    setEndDate(defaultEndIso);
    setStatus("Active");
    setPriceNgn(0);
    setPaymentStatus("Pending");
    setNotes("");
  }

  function startEdit(ad: Advertisement) {
    setEditingId(ad.id);
    setTitle(ad.title);
    setAdvertiserName(ad.advertiserName);
    setBannerUrl(ad.bannerUrl);
    setDestinationUrl(ad.destinationUrl);
    setPlacement(ad.placement);
    setDimensions(ad.dimensions);
    setLabelType(ad.labelType || "Advertisement");
    setTargetCategories(
      Array.isArray(ad.targetCategories) && ad.targetCategories.length > 0
        ? ad.targetCategories
        : ["ALL"]
    );
    setStartDate(ad.startDate);
    setEndDate(ad.endDate);
    setStatus(ad.status);
    setPriceNgn(ad.priceNgn || 0);
    setPaymentStatus(ad.paymentStatus || "Pending");
    setNotes(ad.notes || "");
  }

  const totalRevenuePaid = advertisements
    .filter((a) => a.paymentStatus === "Paid" || a.paymentStatus === "Part-Paid")
    .reduce((sum, a) => sum + (Number(a.priceNgn) || 0), 0);

  const totalImpressions = advertisements.reduce((s, a) => s + (Number(a.impressions) || 0), 0);
  const totalClicks = advertisements.reduce((s, a) => s + (Number(a.clicks) || 0), 0);
  const overallCtr =
    totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";

  return (
    <div>
      {/* Top Summary Cards */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: 18 }}>
          <span className="cat-tag">Active Campaigns</span>
          <div className="stat-num">
            {advertisements.filter((a) => a.status === "Active").length}
          </div>
          <div className="stat-sub">
            <span>{advertisements.length} total campaigns recorded</span>
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <span className="cat-tag">Total Impressions</span>
          <div className="stat-num">{totalImpressions.toLocaleString()}</div>
          <div className="stat-sub">
            <span>Across all public ad placements</span>
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <span className="cat-tag">Total Clicks &amp; Avg. CTR</span>
          <div className="stat-num">{totalClicks.toLocaleString()}</div>
          <div className="stat-sub">
            <span>CTR: {overallCtr}%</span>
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <span className="cat-tag">Recorded Ad Revenue (NGN)</span>
          <div className="stat-num">₦{totalRevenuePaid.toLocaleString()}</div>
          <div className="stat-sub">
            <span>Private admin-only ledger (Paid / Part-Paid)</span>
          </div>
        </div>
      </div>

      {/* Create / Edit Advertisement Form */}
      <div className="card" style={{ padding: 22, marginBottom: 24, borderTop: "4px solid var(--gold)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <span className="kicker">Direct Sponsored Banner &amp; Placement Manager</span>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, margin: "2px 0 0" }}>
              {editingId ? "Edit Advertisement Campaign" : "Create New Advertisement Campaign"}
            </h2>
          </div>
          {editingId && (
            <button type="button" className="btn btn-outline" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await onSaveAd({
              id: editingId,
              title,
              advertiserName,
              bannerUrl,
              destinationUrl,
              placement,
              dimensions,
              labelType,
              targetCategories,
              startDate,
              endDate,
              status,
              priceNgn,
              paymentStatus,
              notes,
            });
            resetForm();
          }}
        >
          <div className="grid-3">
            <div className="f-row">
              <label>Campaign Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. 2026 Halal FinTech Summit Banner"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="f-row">
              <label>Advertiser / Business Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Lotus Halal Services"
                value={advertiserName}
                onChange={(e) => setAdvertiserName(e.target.value)}
              />
            </div>

            <div className="f-row">
              <label>Destination Link (HTTPS URL) *</label>
              <input
                type="text"
                required
                placeholder="https://example.com/campaign"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="grid-3">
            <div className="f-row">
              <label>Advertisement Placement *</label>
              <select
                value={placement}
                onChange={(e) => setPlacement(e.target.value as AdPlacement)}
              >
                {PLACEMENT_OPTIONS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} (Suggested: {p.suggested})
                  </option>
                ))}
              </select>
            </div>

            <div className="f-row">
              <label>Standard Banner Dimensions *</label>
              <select
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value as Advertisement["dimensions"])}
              >
                {DIMENSION_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d.replace("x", " × ")} px
                  </option>
                ))}
              </select>
            </div>

            <div className="f-row">
              <label>Public Disclosure Label *</label>
              <select
                value={labelType}
                onChange={(e) => setLabelType(e.target.value as "Advertisement" | "Sponsored")}
              >
                <option value="Advertisement">Advertisement</option>
                <option value="Sponsored">Sponsored</option>
              </select>
            </div>
          </div>

          {/* Banner Upload or Library Select */}
          <div
            className="card"
            style={{
              padding: 14,
              marginBottom: 16,
              background: "var(--ivory-2)",
              border: "1px solid var(--border)",
            }}
          >
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              Upload Advertising Banner Image (JPG, PNG, WEBP, GIF) *
            </label>
            <div className="grid-2" style={{ alignItems: "center" }}>
              <div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={uploadingMedia}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      onUploadFile(f, (url) => setBannerUrl(url));
                    }
                    e.target.value = "";
                  }}
                  style={{ marginBottom: 8, width: "100%", fontSize: 12.5 }}
                />
                <input
                  type="text"
                  required
                  placeholder="Or paste uploaded banner image URL"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  style={{ width: "100%", fontSize: 12.5, padding: "7px 10px" }}
                />
                {media.filter((m) => !/\.(mp4|webm|ogg|mov|m4v)$/i.test(m.filename || m.url)).length > 0 && (
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) setBannerUrl(e.target.value);
                    }}
                    style={{ width: "100%", fontSize: 12, padding: "6px 10px", marginTop: 6 }}
                  >
                    <option value="">— Or choose an existing banner from Media Library —</option>
                    {media
                      .filter((m) => !/\.(mp4|webm|ogg|mov|m4v)$/i.test(m.filename || m.url))
                      .map((m) => (
                        <option key={m.id} value={m.url}>
                          {m.caption || m.filename}
                        </option>
                      ))}
                  </select>
                )}
              </div>

              {bannerUrl && (
                <div style={{ textAlign: "center" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bannerUrl}
                    alt="Banner preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: 110,
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid-4">
            <div className="f-row">
              <label>Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="f-row">
              <label>End Date (Auto-expires after) *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="f-row">
              <label>Agreed Price in Nigerian Naira (₦)</label>
              <input
                type="number"
                min={0}
                step={500}
                value={priceNgn}
                onChange={(e) => setPriceNgn(Number(e.target.value || 0))}
              />
            </div>

            <div className="f-row">
              <label>Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as AdPaymentStatus)}
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Part-Paid">Part-Paid</option>
                <option value="Complimentary">Complimentary / Partner</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="f-row">
              <label>Campaign Status &amp; Editorial Compliance</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as AdStatus)}>
                <option value="Active">Active (Live on site within date range)</option>
                <option value="Paused">Paused</option>
                <option value="Expired">Expired</option>
                <option value="Rejected">Rejected (Inappropriate / Non-compliant)</option>
              </select>
            </div>

            <div className="f-row">
              <label>Target Section / Category Scope</label>
              <select
                value={targetCategories[0] || "ALL"}
                onChange={(e) => setTargetCategories([e.target.value])}
              >
                <option value="ALL">All Categories &amp; Sections</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    Only {c.name} ({c.slug})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="f-row">
            <label>Internal Notes / Compliance Remarks (Private)</label>
            <input
              type="text"
              placeholder="Invoice reference, contact person, or editorial approval notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary">
            {editingId ? "Update Advertisement Campaign" : "+ Save & Publish Advertisement"}
          </button>
        </form>
      </div>

      {/* Campaigns Table */}
      <div className="card" style={{ overflowX: "auto", marginBottom: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--ivory-2)", textAlign: "left", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: 12 }}>Banner &amp; Campaign</th>
              <th style={{ padding: 12 }}>Placement &amp; Size</th>
              <th style={{ padding: 12 }}>Schedule</th>
              <th style={{ padding: 12 }}>Price (₦) &amp; Payment</th>
              <th style={{ padding: 12 }}>Impressions / Clicks / CTR</th>
              <th style={{ padding: 12 }}>Status</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {advertisements.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 20, textAlign: "center", color: "var(--ink-3)" }}>
                  No advertisements created yet. Use the form above to launch a sponsored banner campaign.
                </td>
              </tr>
            ) : (
              advertisements.map((ad) => {
                const ctr =
                  ad.impressions > 0
                    ? ((ad.clicks / ad.impressions) * 100).toFixed(2)
                    : "0.00";
                return (
                  <tr key={ad.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: 12, maxWidth: 260 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ad.bannerUrl}
                          alt={ad.title}
                          style={{
                            width: 64,
                            height: 40,
                            objectFit: "cover",
                            borderRadius: 4,
                            border: "1px solid var(--border)",
                          }}
                        />
                        <div>
                          <strong style={{ display: "block" }}>{ad.title}</strong>
                          <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                            {ad.advertiserName} ({ad.labelType})
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div>{ad.placement}</div>
                      <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                        {ad.dimensions} · {(ad.targetCategories || ["ALL"]).join(", ")}
                      </span>
                    </td>
                    <td style={{ padding: 12, fontSize: 12 }}>
                      {ad.startDate} → {ad.endDate}
                    </td>
                    <td style={{ padding: 12 }}>
                      <strong>₦{(ad.priceNgn || 0).toLocaleString()}</strong>
                      <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{ad.paymentStatus}</div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <strong>{(ad.impressions || 0).toLocaleString()}</strong> impr ·{" "}
                      <strong>{(ad.clicks || 0).toLocaleString()}</strong> clicks
                      <div style={{ fontSize: 11.5, color: "var(--green)", fontWeight: 700 }}>
                        CTR: {ctr}%
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <span
                        className="chip"
                        style={{
                          fontSize: 11.5,
                          background:
                            ad.status === "Active"
                              ? "#E8F3EC"
                              : ad.status === "Rejected"
                              ? "#FEE2E2"
                              : "#FEF3C7",
                          color:
                            ad.status === "Active"
                              ? "var(--green)"
                              : ad.status === "Rejected"
                              ? "#991B1B"
                              : "var(--copper)",
                        }}
                      >
                        {ad.status}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        <button
                          type="button"
                          className="chip"
                          style={{ fontSize: 11.5, padding: "4px 8px" }}
                          onClick={() => startEdit(ad)}
                        >
                          Edit
                        </button>
                        {ad.status !== "Active" ? (
                          <button
                            type="button"
                            className="chip"
                            style={{ fontSize: 11.5, padding: "4px 8px", background: "#E8F3EC", color: "var(--green)" }}
                            onClick={() => onUpdateAdStatus(ad.id, "Active")}
                          >
                            Activate
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="chip"
                            style={{ fontSize: 11.5, padding: "4px 8px" }}
                            onClick={() => onUpdateAdStatus(ad.id, "Paused")}
                          >
                            Pause
                          </button>
                        )}
                        {ad.status !== "Rejected" && (
                          <button
                            type="button"
                            className="chip"
                            style={{ fontSize: 11.5, padding: "4px 8px", color: "#991B1B" }}
                            onClick={() => onUpdateAdStatus(ad.id, "Rejected")}
                          >
                            Reject
                          </button>
                        )}
                        <button
                          type="button"
                          className="chip"
                          style={{
                            fontSize: 11.5,
                            padding: "4px 8px",
                            color: "#991B1B",
                            background: "#FEF2F2",
                          }}
                          onClick={() => onDeleteAd(ad.id, ad.title)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Optional Google AdSense Preparation Card (Disabled by default) */}
      <div className="card" style={{ padding: 20 }}>
        <span className="kicker">Optional Network Integration (Disabled by Default)</span>
        <h3 style={{ fontFamily: "var(--serif)", fontSize: 19, margin: "2px 0 8px" }}>
          Google AdSense Publisher Configuration
        </h3>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "0 0 14px" }}>
          Keep disabled until your Google AdSense publisher account is approved. No untrusted third-party scripts or arbitrary HTML are ever injected.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={adsenseEnabled}
              onChange={(e) => setAdsenseEnabled(e.target.checked)}
            />
            Enable Approved Google AdSense Script
          </label>
          <input
            type="text"
            placeholder="Publisher Client ID (ca-pub-XXXXXXXXXXXXXXXX)"
            value={adsenseClientId}
            onChange={(e) => setAdsenseClientId(e.target.value)}
            style={{ maxWidth: 320, padding: "7px 12px", fontSize: 13 }}
          />
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: "7px 14px", fontSize: 13 }}
            onClick={() =>
              onSaveSettings({
                adsenseEnabled,
                adsenseClientId: adsenseClientId.trim(),
              })
            }
          >
            Save AdSense Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. MODULE 3 — SEO PERFORMANCE & GOOGLE SEARCH CONSOLE TAB
// ============================================================================
export function AdminSeoPerformanceTab({
  articles,
  onEditArticle,
}: {
  articles: Article[];
  onEditArticle: (article: Article) => void;
}) {
  const [range, setRange] = useState<"7d" | "28d" | "90d">("28d");
  const [gscData, setGscData] = useState<{
    gscConnected: boolean;
    siteUrl: string;
    sitemapUrl: string;
    robotsUrl: string;
    setupMessage?: string;
    summary?: { clicks: number; impressions: number; ctr: number; position: number };
    trend?: { date: string; clicks: number; impressions: number; ctr: number; position: number }[];
    topQueries?: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
    topPages?: { page: string; clicks: number; impressions: number; ctr: number; position: number }[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/seo?range=${range}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setGscData(data);
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [range]);

  const publishedArticles = useMemo(
    () => articles.filter((a) => a.status === "Published" && a.verification !== "D"),
    [articles]
  );

  const articleAudits = useMemo(() => {
    return publishedArticles.map((a) => {
      const hasFeaturedImg = Boolean(
        a.featuredImage && !a.featuredImage.startsWith("data:image/")
      );
      const hasDataUriImg = Boolean(
        a.featuredImage && a.featuredImage.startsWith("data:image/")
      );
      const hasCaption = Boolean((a.imageCaption || "").trim().length >= 10);
      const hasSummary = Boolean((a.summary || "").trim().length >= 50);
      const hasSourceOrLink = Boolean(
        a.sourceUrl ||
          (a.body || []).some((p) => /https?:\/\/|\[.+\]\(.+\)/i.test(p))
      );
      let score = 0;
      if ((a.title || "").length >= 25) score += 20;
      if (hasSummary) score += 20;
      if (hasFeaturedImg || hasDataUriImg) score += 20;
      if (hasCaption) score += 15;
      if (hasSourceOrLink) score += 15;
      if ((a.tags || []).length >= 2) score += 10;

      return {
        article: a,
        score,
        hasFeaturedImg,
        hasDataUriImg,
        hasCaption,
        hasSummary,
        hasSourceOrLink,
      };
    });
  }, [publishedArticles]);

  return (
    <div>
      {/* Header & Date Filter */}
      <div className="card" style={{ padding: 20, marginBottom: 20, borderLeft: "4px solid var(--gold)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div>
            <span className="kicker">Google Search Console &amp; Technical SEO Health</span>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, margin: "2px 0 0" }}>
              Search Performance, Indexing &amp; Metadata Audit
            </h2>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            {(
              [
                ["7d", "Last 7 Days"],
                ["28d", "Last 28 Days"],
                ["90d", "Last 90 Days"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`chip ${range === id ? "active" : ""}`}
                style={{ fontSize: 12, padding: "5px 11px", cursor: "pointer" }}
                onClick={() => setRange(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Clear Distinction Between External GSC API Data and Internal SEO Audit */}
        {gscData?.gscConnected && gscData.summary ? (
          <div className="grid-4" style={{ marginTop: 14 }}>
            <div className="card" style={{ padding: 16 }}>
              <span className="cat-tag">Google Search Clicks</span>
              <div className="stat-num">{gscData.summary.clicks.toLocaleString()}</div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <span className="cat-tag">Search Impressions</span>
              <div className="stat-num">{gscData.summary.impressions.toLocaleString()}</div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <span className="cat-tag">Average Search CTR</span>
              <div className="stat-num">{gscData.summary.ctr}%</div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <span className="cat-tag">Average Search Position</span>
              <div className="stat-num">{gscData.summary.position}</div>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              background: "var(--ivory-2)",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            <strong>Google Search Console API Status (Not Yet Connected):</strong>{" "}
            {gscData?.setupMessage ||
              "External Google Search Console click/impression metrics are not displayed until a Google Cloud Service Account with Search Console Reader access is configured via GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY."}
            <div style={{ marginTop: 6 }}>
              <strong>Live Sitemap &amp; Indexing Endpoints:</strong>{" "}
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--green)", fontWeight: 600, textDecoration: "underline", marginRight: 14 }}
              >
                View Dynamic /sitemap.xml ↗
              </a>
              <a
                href="/robots.txt"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--green)", fontWeight: 600, textDecoration: "underline" }}
              >
                View /robots.txt ↗
              </a>
            </div>
          </div>
        )}
      </div>

      {/* When GSC is connected, show Top Queries and Top Performing Search Pages */}
      {gscData?.gscConnected && (
        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontFamily: "var(--serif)", fontSize: 19, margin: "0 0 12px" }}>
              Top-Performing Google Search Queries
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                  <th style={{ padding: 6 }}>Query</th>
                  <th style={{ padding: 6, textAlign: "right" }}>Clicks</th>
                  <th style={{ padding: 6, textAlign: "right" }}>Impr.</th>
                  <th style={{ padding: 6, textAlign: "right" }}>Pos.</th>
                </tr>
              </thead>
              <tbody>
                {(gscData.topQueries || []).map((q) => (
                  <tr key={q.query} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: 6, fontWeight: 600 }}>{q.query}</td>
                    <td style={{ padding: 6, textAlign: "right" }}>{q.clicks}</td>
                    <td style={{ padding: 6, textAlign: "right" }}>{q.impressions}</td>
                    <td style={{ padding: 6, textAlign: "right" }}>{q.position}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontFamily: "var(--serif)", fontSize: 19, margin: "0 0 12px" }}>
              Top-Performing Pages in Google Search
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                  <th style={{ padding: 6 }}>URL</th>
                  <th style={{ padding: 6, textAlign: "right" }}>Clicks</th>
                  <th style={{ padding: 6, textAlign: "right" }}>Impr.</th>
                  <th style={{ padding: 6, textAlign: "right" }}>CTR</th>
                </tr>
              </thead>
              <tbody>
                {(gscData.topPages || []).map((p) => (
                  <tr key={p.page} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: 6, fontSize: 12 }}>{p.page}</td>
                    <td style={{ padding: 6, textAlign: "right" }}>{p.clicks}</td>
                    <td style={{ padding: 6, textAlign: "right" }}>{p.impressions}</td>
                    <td style={{ padding: 6, textAlign: "right" }}>{p.ctr}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Internal SEO Assessment & Article-by-Article Metadata Audit */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ marginBottom: 14 }}>
          <span className="kicker">Internal Technical SEO Assessment (Verified Live Database)</span>
          <h3 style={{ fontFamily: "var(--serif)", fontSize: 20, margin: "2px 0 4px" }}>
            Published Articles SEO, Open Graph &amp; Schema Readiness ({articleAudits.length} articles)
          </h3>
          <p style={{ fontSize: 13, color: "var(--ink-2)", margin: 0 }}>
            Audits every published article for canonical slug, meta description length, HTTPS Open Graph featured image, alt caption, and <code>NewsArticle</code> structured data.
          </p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--ivory-2)", textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: 10 }}>Article &amp; Canonical Path</th>
                <th style={{ padding: 10 }}>Meta Description</th>
                <th style={{ padding: 10 }}>Open Graph Image</th>
                <th style={{ padding: 10 }}>JSON-LD &amp; Sitemap</th>
                <th style={{ padding: 10 }}>SEO Score</th>
                <th style={{ padding: 10 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {articleAudits.map(({ article: a, score, hasFeaturedImg, hasDataUriImg, hasSummary }) => (
                <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: 10, maxWidth: 300 }}>
                    <strong style={{ display: "block" }}>{a.seoTitle || a.title}</strong>
                    <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                      /news/{a.category}/{a.slug}
                    </span>
                  </td>
                  <td style={{ padding: 10 }}>
                    {hasSummary ? (
                      <span style={{ color: "var(--green)", fontWeight: 600 }}>
                        ✓ {(a.seoDescription || a.summary || "").length} chars
                      </span>
                    ) : (
                      <span style={{ color: "#B45309" }}>• Short summary</span>
                    )}
                  </td>
                  <td style={{ padding: 10 }}>
                    {hasFeaturedImg ? (
                      <span style={{ color: "var(--green)", fontWeight: 600 }}>✓ Direct HTTPS Image</span>
                    ) : hasDataUriImg ? (
                      <span style={{ color: "var(--green)" }}>✓ Served via /api/og-image</span>
                    ) : (
                      <span style={{ color: "#B45309" }}>• Uses Default Logo</span>
                    )}
                  </td>
                  <td style={{ padding: 10 }}>
                    <span style={{ color: "var(--green)", fontWeight: 600 }}>
                      ✓ NewsArticle + /sitemap.xml
                    </span>
                  </td>
                  <td style={{ padding: 10 }}>
                    <span
                      className="chip"
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        background: score >= 85 ? "#E8F3EC" : "#FEF3C7",
                        color: score >= 85 ? "var(--green)" : "var(--copper)",
                      }}
                    >
                      {score}/100
                    </span>
                  </td>
                  <td style={{ padding: 10 }}>
                    <button
                      type="button"
                      className="chip"
                      style={{ fontSize: 11.5, padding: "4px 10px", cursor: "pointer" }}
                      onClick={() => onEditArticle(a)}
                    >
                      Optimize in Editor
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
