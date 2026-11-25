import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, hasPermission, canPublishContent } from "@/lib/auth";
import { ensureDbSynced } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getGscAccessToken(): Promise<string | null> {
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
        scope: "https://www.googleapis.com/auth/webmasters.readonly",
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

export async function GET(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised editorial access." }, { status: 401 });
  }
  if (
    !hasPermission(session, "seo-performance") &&
    !canPublishContent(session.role, session.permissions)
  ) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const range = req.nextUrl.searchParams.get("range") || "28d";
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 28;
  const endDate = new Date().toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

  const siteUrl = (
    process.env.GSC_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.dpathtojannah.com"
  ).trim();

  await ensureDbSynced();
  const token = await getGscAccessToken();

  if (!token) {
    return NextResponse.json({
      ok: true,
      gscConnected: false,
      siteUrl,
      sitemapUrl: `${siteUrl.replace(/\/+$/, "")}/sitemap.xml`,
      robotsUrl: `${siteUrl.replace(/\/+$/, "")}/robots.txt`,
      setupMessage:
        "Google Search Console API credentials (GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY with Search Console property reader permission) are not yet configured in environment variables. Showing verified internal SEO & indexability health audit below.",
    });
  }

  try {
    const encodedSite = encodeURIComponent(siteUrl);
    const [totalsRes, queriesRes, pagesRes, sitemapsRes] = await Promise.all([
      fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ startDate, endDate, dimensions: ["date"], rowLimit: 90 }),
          cache: "no-store",
        }
      ),
      fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ startDate, endDate, dimensions: ["query"], rowLimit: 20 }),
          cache: "no-store",
        }
      ),
      fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ startDate, endDate, dimensions: ["page"], rowLimit: 20 }),
          cache: "no-store",
        }
      ),
      fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
    ]);

    if (!totalsRes.ok) {
      return NextResponse.json({
        ok: true,
        gscConnected: false,
        siteUrl,
        sitemapUrl: `${siteUrl.replace(/\/+$/, "")}/sitemap.xml`,
        robotsUrl: `${siteUrl.replace(/\/+$/, "")}/robots.txt`,
        setupMessage:
          "Google service account authenticated, but has not been granted Reader access to this property in Google Search Console yet.",
      });
    }

    const totalsData = await totalsRes.json();
    const queriesData = queriesRes.ok ? await queriesRes.json() : { rows: [] };
    const pagesData = pagesRes.ok ? await pagesRes.json() : { rows: [] };
    const sitemapsData = sitemapsRes.ok ? await sitemapsRes.json() : { sitemap: [] };

    const dateRows: {
      keys: string[];
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    }[] = Array.isArray(totalsData.rows) ? totalsData.rows : [];

    let totalClicks = 0;
    let totalImpressions = 0;
    let weightedPosSum = 0;

    for (const r of dateRows) {
      totalClicks += r.clicks || 0;
      totalImpressions += r.impressions || 0;
      weightedPosSum += (r.position || 0) * (r.impressions || 1);
    }

    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgPosition =
      totalImpressions > 0
        ? weightedPosSum / totalImpressions
        : dateRows.length > 0
        ? dateRows.reduce((s, r) => s + (r.position || 0), 0) / dateRows.length
        : 0;

    return NextResponse.json({
      ok: true,
      gscConnected: true,
      siteUrl,
      sitemapUrl: `${siteUrl.replace(/\/+$/, "")}/sitemap.xml`,
      robotsUrl: `${siteUrl.replace(/\/+$/, "")}/robots.txt`,
      summary: {
        clicks: totalClicks,
        impressions: totalImpressions,
        ctr: Number(avgCtr.toFixed(2)),
        position: Number(avgPosition.toFixed(1)),
      },
      trend: dateRows.map((r) => ({
        date: r.keys?.[0] || "",
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        ctr: Number(((r.ctr || 0) * 100).toFixed(2)),
        position: Number((r.position || 0).toFixed(1)),
      })),
      topQueries: (queriesData.rows || []).map(
        (r: { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }) => ({
          query: r.keys?.[0] || "",
          clicks: r.clicks || 0,
          impressions: r.impressions || 0,
          ctr: Number(((r.ctr || 0) * 100).toFixed(2)),
          position: Number((r.position || 0).toFixed(1)),
        })
      ),
      topPages: (pagesData.rows || []).map(
        (r: { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }) => ({
          page: r.keys?.[0] || "",
          clicks: r.clicks || 0,
          impressions: r.impressions || 0,
          ctr: Number(((r.ctr || 0) * 100).toFixed(2)),
          position: Number((r.position || 0).toFixed(1)),
        })
      ),
      sitemaps: sitemapsData.sitemap || [],
    });
  } catch {
    return NextResponse.json({
      ok: true,
      gscConnected: false,
      siteUrl,
      sitemapUrl: `${siteUrl.replace(/\/+$/, "")}/sitemap.xml`,
      robotsUrl: `${siteUrl.replace(/\/+$/, "")}/robots.txt`,
      setupMessage: "Unable to reach Google Search Console API at this moment.",
    });
  }
}
