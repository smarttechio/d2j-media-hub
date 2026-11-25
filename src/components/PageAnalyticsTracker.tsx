"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function PageAnalyticsTracker({
  ga4MeasurementId,
  adsenseEnabled,
  adsenseClientId,
}: {
  ga4MeasurementId?: string;
  adsenseEnabled?: boolean;
  adsenseClientId?: string;
}) {
  const pathname = usePathname();
  const enteredAtRef = useRef<number>(0);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) {
      return;
    }

    enteredAtRef.current = Date.now();

    // Send GA4 page_view if configured
    if (ga4MeasurementId && typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("config", ga4MeasurementId, {
        page_path: pathname,
      });
    }

    // For non-article pages, record a general pageview beacon (article detail pages send their own beacon with stable articleId)
    const isArticleDetail = /^\/news\/[^/]+\/[^/]+$/.test(pathname);
    if (!isArticleDetail) {
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "pageview",
          pathname,
          referrer: typeof document !== "undefined" ? document.referrer : "",
        }),
      }).catch(() => null);
    }

    return () => {
      const elapsedSec = Math.round((Date.now() - enteredAtRef.current) / 1000);
      if (elapsedSec >= 5 && elapsedSec <= 1800) {
        const payload = JSON.stringify({
          eventType: "engagement",
          pathname,
          seconds: elapsedSec,
        });
        if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
          navigator.sendBeacon("/api/analytics", payload);
        } else {
          fetch("/api/analytics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch(() => null);
        }
      }
    };
  }, [pathname, ga4MeasurementId]);

  const cleanGaId = (ga4MeasurementId || "").trim();
  const cleanAdsenseId = (adsenseClientId || "").trim();

  return (
    <>
      {cleanGaId && /^G-[A-Z0-9]+$/i.test(cleanGaId) && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cleanGaId)}`}
            strategy="afterInteractive"
          />
          <Script id="d2j-ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${cleanGaId}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}

      {adsenseEnabled && cleanAdsenseId && /^ca-pub-[0-9]+$/i.test(cleanAdsenseId) && (
        <Script
          id="d2j-adsense-init"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(cleanAdsenseId)}`}
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      )}
    </>
  );
}
