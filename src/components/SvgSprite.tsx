import React from "react";
import { ArtTheme } from "@/lib/db";

export function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <symbol id="s-campus" viewBox="0 0 120 80">
        <path d="M0 62h120v18H0z" fill="#0003" />
        <path d="M18 62V38h44v24z" fill="#FAF8F1" />
        <path d="M30 38a10 10 0 0 1 20 0z" fill="#FE8905" />
        <path d="M34 62V51a6 6 0 0 1 12 0v11z" fill="#063A19" />
        <circle cx="82" cy="46" r="5" fill="#FE8905" />
        <rect x="76" y="52" width="12" height="20" rx="6" fill="#FAF8F1" />
        <circle cx="100" cy="48" r="5" fill="#FAF8F1" />
        <path d="M93 72c0-12 3-20 7-20s7 8 7 20z" fill="#FE8905" />
      </symbol>
      <symbol id="s-library" viewBox="0 0 120 80">
        <path d="M10 14h100M10 40h100M10 66h100" stroke="#FAF8F1" strokeWidth="3" opacity=".7" />
        <g fill="#FE8905">
          <rect x="16" y="22" width="9" height="18" />
          <rect x="28" y="26" width="8" height="14" />
          <rect x="40" y="20" width="10" height="20" />
          <rect x="70" y="48" width="9" height="18" />
          <rect x="82" y="44" width="10" height="22" />
        </g>
        <g fill="#FAF8F1">
          <rect x="56" y="24" width="8" height="16" />
          <rect x="18" y="50" width="10" height="16" />
          <rect x="32" y="48" width="8" height="18" />
        </g>
      </symbol>
      <symbol id="s-quran" viewBox="0 0 120 80">
        <path d="M60 28c-12-8-30-8-42-2v38c12-6 30-6 42 2 12-8 30-8 42-2V26c-12-6-30-6-42 2z" fill="#FAF8F1" />
        <path d="M60 28v38" stroke="#063A19" strokeWidth="2" />
        <path d="M60 8l5 8h-10z" fill="#FE8905" />
        <path d="M26 36h26M26 44h26M68 36h26M68 44h26" stroke="#FE8905" strokeWidth="2" />
      </symbol>
      <symbol id="s-community" viewBox="0 0 120 80">
        <path d="M0 66h120v14H0z" fill="#0003" />
        <g fill="#FAF8F1">
          <circle cx="30" cy="36" r="6" />
          <rect x="23" y="43" width="14" height="24" rx="7" />
          <circle cx="90" cy="36" r="6" />
          <rect x="83" y="43" width="14" height="24" rx="7" />
        </g>
        <g fill="#FE8905">
          <circle cx="50" cy="32" r="7" />
          <path d="M42 68c0-14 3-26 8-26s8 12 8 26z" />
          <circle cx="70" cy="34" r="6" />
          <rect x="63" y="41" width="14" height="26" rx="7" />
        </g>
      </symbol>
      <symbol id="s-biz" viewBox="0 0 120 80">
        <rect x="28" y="22" width="64" height="38" rx="4" fill="#FAF8F1" />
        <path d="M18 62h84l-6 8H24z" fill="#FE8905" />
        <g fill="#063A19">
          <rect x="38" y="44" width="8" height="12" />
          <rect x="52" y="36" width="8" height="20" />
          <rect x="66" y="30" width="8" height="26" />
        </g>
      </symbol>
      <symbol id="s-well" viewBox="0 0 120 80">
        <circle cx="60" cy="40" r="26" fill="#FAF8F1" opacity=".9" />
        <path d="M60 62C40 50 42 30 60 24c18 6 20 26 0 38z" fill="#3b7a5e" />
        <path d="M60 58V32" stroke="#FAF8F1" strokeWidth="2" />
        <circle cx="92" cy="20" r="6" fill="#FE8905" />
      </symbol>
    </svg>
  );
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.includes("youtube.com") && u.pathname.startsWith("/embed/")) {
      return url;
    }
  } catch {
    // ignore
  }
  return null;
}

export function ArtIllustration({
  theme = "campus",
  label = "Illustration for this story",
  featuredImage,
  featuredVideo,
  hideBadge = false,
  interactiveVideo = false,
}: {
  theme?: ArtTheme;
  label?: string;
  featuredImage?: string;
  featuredVideo?: string;
  hideBadge?: boolean;
  interactiveVideo?: boolean;
}) {
  if (featuredVideo) {
    const ytEmbed = getYouTubeEmbedUrl(featuredVideo);
    if (ytEmbed && interactiveVideo) {
      return (
        <>
          <iframe
            src={ytEmbed}
            title={label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          {!hideBadge && <em>Video report</em>}
        </>
      );
    }
    if (!ytEmbed && interactiveVideo) {
      return (
        <>
          <video
            src={featuredVideo}
            poster={featuredImage}
            controls
            playsInline
            preload="metadata"
          />
          {!hideBadge && <em>Video report</em>}
        </>
      );
    }
    if (featuredImage) {
      return (
        <>
          <img src={featuredImage} alt={label} loading="lazy" />
          {!hideBadge && <em>▶ Video · Photograph</em>}
        </>
      );
    }
    if (!ytEmbed) {
      return (
        <>
          <video src={featuredVideo} muted playsInline preload="metadata" />
          {!hideBadge && <em>▶ Video report</em>}
        </>
      );
    }
  }

  if (featuredImage) {
    return (
      <>
        <img src={featuredImage} alt={label} loading="lazy" />
        {!hideBadge && <em>Photograph</em>}
      </>
    );
  }
  return (
    <>
      <svg viewBox="0 0 120 80" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label}>
        <use href={`#s-${theme}`} />
      </svg>
      {!hideBadge && <em>Illustration · demo</em>}
    </>
  );
}
