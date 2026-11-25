import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { ensureDbSynced, writeDbAsync, type DailyAnalyticsRollup } from "@/lib/db";
import { getCurrentSession, hasPermission, canPublishContent } from "@/lib/auth";

export const dynamic = "force-dynamic";

const BOT_UA_REGEX =
  /bot|crawler|spider|slurp|WhatsApp|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|TelegramBot|Discordbot|HeadlessChrome|Lighthouse|Google-InspectionTool|AhrefsBot|SemrushBot|MJ12bot/i;

// Deduplicate visitor/page/ad beacons in-memory within a 30-minute window
const seenVisitorDaySet = new Set<string>();
const seenArticleViewWindow = new Map<string, number>();
let lastCloudFlushAt = 0;

function classifyTrafficSource(referrer: string, host: string): "direct" | "search" | "social" | "referral" {
  if (!referrer) return "direct";
  try {
    const refUrl = new URL(referrer);
    if (host && refUrl.hostname.replace(/^www\./, "") === host.replace(/^www\./, "")) {
      return "direct";
    }
    const h = refUrl.hostname.toLowerCase();
    if (/google\.|bing\.|yahoo\.|duckduckgo\.|ecosia\.|yandex\./.test(h)) {
      return "search";
    }
    if (
      /facebook\.|fb\.|t\.co|twitter\.|x\.com|whatsapp\.|instagram\.|linkedin\.|t\.me|telegram\.|tiktok\.|youtube\./.test(
        h
      )
    ) {
      return "social";
    }
    return "referral";
  } catch {
    return "direct";
  }
}

function classifyDevice(ua: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) {
    return "tablet";
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

function ensureDailyRollup(rollups: DailyAnalyticsRollup[], dateIso: string): DailyAnalyticsRollup {
  let entry = rollups.find((r) => r.date === dateIso);
  if (!entry) {
    entry = {
      date: dateIso,
      pageViews: 0,
      uniqueVisitors: 0,
      articleViews: {},
      sources: { direct: 0, search: 0, social: 0, referral: 0 },
      devices: { mobile: 0, desktop: 0, tablet: 0 },
      countries: {},
      totalEngagementSeconds: 0,
      engagedSessions: 0,
    };
    rollups.push(entry);
    // Keep up to 400 days of daily rollups
    if (rollups.length > 400) {
      rollups.sort((a, b) => (a.date < b.date ? -1 : 1));
      rollups.splice(0, rollups.length - 400);
    }
  }
  return entry;
}

/**
 * Generates a Google OAuth2 access token from a Service Account JSON key (using Node built-in `crypto`)
 * to query the official Google Analytics 4 Data API when `GA4_PROPERTY_ID`, `GOOGLE_CLIENT_EMAIL`,
 * and `GOOGLE_PRIVATE_KEY` are configured.
 */
async function getGoogleAccessToken(scope: string): Promise<string | null> {
  const clientEmail = (process.env.GOOGLE_CLIENT_EMAIL || "").trim();
  const rawPrivateKey = (process.env.GOOGLE_PRIVATE_KEY || "").trim();
  if (!clientEmail || !rawPrivateKey) return null;

  const privateKey = rawPrivateKey.replace(/\\n/g, "\n");
  try {
    const nowSec = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const claim = Buffer.from(
      JSON.stringify({
        iss: clientEmail,
        scope,
        aud: "https://oauth2.googleapis.com/token",
        exp: nowSec + 3600,
        iat: nowSec,
      })
    ).toString("base64url");

    const signer = crypto.createSign("RSA-SHA256");
    signer.update(`${header}.${claim}`);
    const signature = signer.sign(privateKey, "base64url");
    const assertion = `${header}.${claim}.${signature}`;

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }).toString(),
      cache: "no-store",
    });

    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string };
    return data.access_token || null;
  } catch {
    return null;
  }
}

async function fetchGa4LiveSummary(startDate: string, endDate: string) {
  const propertyId = (process.env.GA4_PROPERTY_ID || "").trim();
  if (!propertyId) return null;

  const token = await getGoogleAccessToken("https://www.googleapis.com/auth/analytics.readonly");
  if (!token) return null;

  try {
    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: "screenPageViews" },
            { name: "activeUsers" },
            { name: "userEngagementDuration" },
            { name: "engagedSessions" },
          ],
        }),
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const row = json?.rows?.[0]?.metricValues;
    if (!Array.isArray(row)) return null;
    return {
      pageViews: Number(row[0]?.value || 0),
      uniqueVisitors: Number(row[1]?.value || 0),
      totalEngagementSeconds: Number(row[2]?.value || 0),
      engagedSessions: Number(row[3]?.value || 0),
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const ua = req.headers.get("user-agent") || "";
    if (!ua || BOT_UA_REGEX.test(ua)) {
      return NextResponse.json({ ok: true, skipped: "bot" });
    }

    const body = await req.json();
    const eventType = String(body.eventType || "pageview");
    const pathname = String(body.pathname || "/");

    // Never count admin dashboard or preview visits
    if (pathname.startsWith("/admin")) {
      return NextResponse.json({ ok: true, skipped: "admin" });
    }

    const db = await ensureDbSynced();
    if (!Array.isArray(db.analyticsRollups)) db.analyticsRollups = [];
    if (!Array.isArray(db.advertisements)) db.advertisements = [];

    const todayIso = new Date().toISOString().slice(0, 10);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const country = (req.headers.get("x-vercel-ip-country") || "NG").toUpperCase();
    const visitorHash = crypto
      .createHash("sha256")
      .update(`${todayIso}:${ip}:${ua.slice(0, 120)}`)
      .digest("hex")
      .slice(0, 16);

    const rollup = ensureDailyRollup(db.analyticsRollups, todayIso);
    let dirty = false;

    if (eventType === "pageview") {
      const articleId = body.articleId ? String(body.articleId).trim() : "";
      const dedupeKey = `${visitorHash}:${pathname}:${articleId}`;
      const now = Date.now();
      const prevSeen = seenArticleViewWindow.get(dedupeKey) || 0;

      // Ignore repeated refreshes within 15 minutes from the same visitor
      if (now - prevSeen < 15 * 60 * 1000) {
        const currentArt = articleId ? db.articles.find((a) => a.id === articleId) : undefined;
        return NextResponse.json({
          ok: true,
          deduped: true,
          views: currentArt?.views,
        });
      }
      seenArticleViewWindow.set(dedupeKey, now);

      rollup.pageViews += 1;
      if (!seenVisitorDaySet.has(`${todayIso}:${visitorHash}`)) {
        seenVisitorDaySet.add(`${todayIso}:${visitorHash}`);
        rollup.uniqueVisitors += 1;
      }

      const src = classifyTrafficSource(
        String(body.referrer || ""),
        req.headers.get("host") || ""
      );
      rollup.sources[src] = (rollup.sources[src] || 0) + 1;

      const dev = classifyDevice(ua);
      rollup.devices[dev] = (rollup.devices[dev] || 0) + 1;

      rollup.countries[country] = (rollup.countries[country] || 0) + 1;
      dirty = true;

      let updatedArticleViews: number | undefined;
      if (articleId) {
        const art = db.articles.find((a) => a.id === articleId);
        if (art && art.status === "Published") {
          art.views = (Number(art.views) || 0) + 1;
          updatedArticleViews = art.views;
          rollup.articleViews[articleId] = (rollup.articleViews[articleId] || 0) + 1;
        }
      }

      // Throttle cloud persistence on high-frequency view beacons to at most once every 20s
      if (dirty && Date.now() - lastCloudFlushAt > 20000) {
        lastCloudFlushAt = Date.now();
        await writeDbAsync(db);
      }

      return NextResponse.json({
        ok: true,
        views: updatedArticleViews,
      });
    }

    if (eventType === "engagement") {
      const seconds = Math.min(600, Math.max(1, Number(body.seconds || 0)));
      if (seconds >= 5) {
        rollup.totalEngagementSeconds += seconds;
        rollup.engagedSessions += 1;
        if (Date.now() - lastCloudFlushAt > 30000) {
          lastCloudFlushAt = Date.now();
          await writeDbAsync(db);
        }
      }
      return NextResponse.json({ ok: true });
    }

    if (eventType === "ad_impression" || eventType === "ad_click") {
      const adId = String(body.adId || "").trim();
      const ad = db.advertisements.find((a) => a.id === adId);
      if (ad) {
        if (eventType === "ad_impression") {
          ad.impressions = (Number(ad.impressions) || 0) + 1;
        } else {
          ad.clicks = (Number(ad.clicks) || 0) + 1;
        }
        if (
          eventType === "ad_click" ||
          Date.now() - lastCloudFlushAt > 25000
        ) {
          lastCloudFlushAt = Date.now();
          await writeDbAsync(db);
        }
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised editorial access." }, { status: 401 });
  }
  if (
    !hasPermission(session, "analytics") &&
    !canPublishContent(session.role, session.permissions)
  ) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const range = req.nextUrl.searchParams.get("range") || "30d";
  const customStart = req.nextUrl.searchParams.get("start") || "";
  const customEnd = req.nextUrl.searchParams.get("end") || "";

  const db = await ensureDbSynced();
  const rollups = Array.isArray(db.analyticsRollups) ? db.analyticsRollups : [];
  const todayIso = new Date().toISOString().slice(0, 10);

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

  const startBound =
    range === "custom" && customStart
      ? customStart
      : new Date(Date.now() - daysBack * 86400000).toISOString().slice(0, 10);
  const endBound = range === "custom" && customEnd ? customEnd : todayIso;

  const ga4Summary = await fetchGa4LiveSummary(startBound, endBound);
  const ga4MeasurementId =
    process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ||
    db.settings.ga4MeasurementId ||
    "";

  return NextResponse.json({
    ok: true,
    ga4Configured: Boolean(ga4MeasurementId),
    ga4MeasurementId,
    ga4DataApiConnected: Boolean(ga4Summary),
    ga4Summary,
    rollups,
    todayIso,
  });
}
