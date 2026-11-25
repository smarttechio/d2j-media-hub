"use client";

import React, { useState, useEffect, useRef } from "react";
import type { AdPlacement, Advertisement } from "@/lib/db";

const DIMENSION_SPECS: Record<
  Advertisement["dimensions"],
  { maxWidth: number; aspectRatio: string }
> = {
  "728x90": { maxWidth: 728, aspectRatio: "728 / 90" },
  "970x90": { maxWidth: 970, aspectRatio: "970 / 90" },
  "300x250": { maxWidth: 300, aspectRatio: "300 / 250" },
  "300x600": { maxWidth: 300, aspectRatio: "300 / 600" },
  "320x100": { maxWidth: 320, aspectRatio: "320 / 100" },
};

// Shared in-memory cache of public active ads across placements on the same page
let cachedPublicAds: Advertisement[] | null = null;
let inflightAdsPromise: Promise<Advertisement[]> | null = null;
const trackedImpressionsInSession = new Set<string>();

async function fetchPublicActiveAds(): Promise<Advertisement[]> {
  if (cachedPublicAds) return cachedPublicAds;
  if (inflightAdsPromise) return inflightAdsPromise;

  inflightAdsPromise = fetch("/api/admin?public=1", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      const list: Advertisement[] =
        data && Array.isArray(data.advertisements) ? data.advertisements : [];
      cachedPublicAds = list;
      return list;
    })
    .catch(() => [])
    .finally(() => {
      inflightAdsPromise = null;
    });

  return inflightAdsPromise;
}

export function AdPlacementSlot({
  placement,
  categorySlug,
  initialAds,
  style,
}: {
  placement: AdPlacement;
  categorySlug?: string;
  initialAds?: Advertisement[];
  style?: React.CSSProperties;
}) {
  const [ads, setAds] = useState<Advertisement[]>(initialAds || cachedPublicAds || []);
  const impressionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPublicActiveAds().then((list) => {
      if (!cancelled && list.length > 0) {
        setAds(list);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const todayIso = new Date().toISOString().slice(0, 10);
  const matchingAds = ads.filter((ad) => {
    if (ad.status !== "Active") return false;
    if (ad.placement !== placement) return false;
    if (ad.startDate && ad.startDate > todayIso) return false;
    if (ad.endDate && ad.endDate < todayIso) return false;
    if (
      categorySlug &&
      Array.isArray(ad.targetCategories) &&
      ad.targetCategories.length > 0 &&
      !ad.targetCategories.includes("ALL") &&
      !ad.targetCategories.includes(categorySlug)
    ) {
      return false;
    }
    return true;
  });

  const activeAd = matchingAds[0];

  useEffect(() => {
    if (!activeAd) return;
    if (trackedImpressionsInSession.has(activeAd.id)) return;
    trackedImpressionsInSession.add(activeAd.id);

    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "ad_impression",
        adId: activeAd.id,
        placement,
      }),
    }).catch(() => null);
  }, [activeAd, placement]);

  if (!activeAd) {
    return null;
  }

  const spec = DIMENSION_SPECS[activeAd.dimensions] || DIMENSION_SPECS["728x90"];

  function handleAdClick() {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "ad_click",
        adId: activeAd.id,
        placement,
      }),
      keepalive: true,
    }).catch(() => null);
  }

  return (
    <aside
      ref={impressionRef}
      aria-label={`${activeAd.labelType}: ${activeAd.advertiserName}`}
      style={{
        margin: "20px auto",
        width: "100%",
        maxWidth: spec.maxWidth,
        textAlign: "center",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--mu)",
          marginBottom: 4,
          padding: "0 4px",
        }}
      >
        <span>{activeAd.labelType || "Advertisement"}</span>
        <span>{activeAd.advertiserName}</span>
      </div>
      <a
        href={activeAd.destinationUrl}
        target="_blank"
        rel="sponsored noopener noreferrer"
        onClick={handleAdClick}
        style={{
          display: "block",
          width: "100%",
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid var(--bd)",
          background: "var(--wh)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeAd.bannerUrl}
          alt={`${activeAd.labelType} — ${activeAd.title} by ${activeAd.advertiserName}`}
          loading="lazy"
          decoding="async"
          style={{
            width: "100%",
            height: "auto",
            aspectRatio: spec.aspectRatio,
            objectFit: "cover",
            display: "block",
          }}
        />
      </a>
    </aside>
  );
}
