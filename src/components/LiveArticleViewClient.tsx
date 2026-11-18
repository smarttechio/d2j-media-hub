"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import type { Article, ArticleComment, Author } from "@/lib/db";
import {
  ArticleCard,
  VerificationBadge,
  formatDisplayDate,
  getEffectiveFeaturedImage,
} from "./ArticleCards";
import { ShareRow } from "./CategoryListingClient";
import { ArtIllustration } from "./SvgSprite";
import { ArticleCommentsClient } from "./ArticleCommentsClient";
import {
  ArticlePhotoCarousel,
  type SliderPhotoItem,
} from "./FeaturedSliderClient";

const VERIFICATION_NOTES = {
  V: "Verified: the source page was opened and read by our editorial desk.",
  S: "Source text checked through a search result. Open the original to confirm.",
  D: "Demo content written to test the layout. It is not real reporting.",
};

/**
 * Renders paragraph or quote text with clickable links:
 * - Markdown links: `[Click here](https://example.com)`
 * - Bare URLs: `https://example.com` or `www.example.com`
 */
export function renderRichTextWithLinks(text: string): React.ReactNode {
  if (!text) return null;

  // Match either [label](url) OR bare http(s)://... or www....
  const tokenRegex =
    /\[([^\]]+)\]\(((?:https?:\/\/|www\.|\/)[^\s)]+)\)|((?:https?:\/\/|www\.)[^\s<]+[^<.,:;"')\]\s])/gi;

  const nodes: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      nodes.push(text.slice(lastIdx, match.index));
    }

    const mdLabel = match[1];
    const mdUrl = match[2];
    const bareUrl = match[3];

    const rawHref = mdUrl || bareUrl || "";
    const href = /^www\./i.test(rawHref) ? `https://${rawHref}` : rawHref;
    const label = mdLabel || bareUrl || rawHref;
    const isExternal = /^https?:\/\//i.test(href);

    nodes.push(
      <a
        key={`lnk-${match.index}`}
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        style={{
          color: "var(--g)",
          textDecoration: "underline",
          fontWeight: 600,
          wordBreak: "break-word",
        }}
      >
        {label}
      </a>
    );

    lastIdx = tokenRegex.lastIndex;
  }

  if (lastIdx < text.length) {
    nodes.push(text.slice(lastIdx));
  }

  return nodes.length > 0 ? nodes : text;
}

export function LiveArticleViewClient({
  slug,
  categorySlug,
  initialArticle,
  catName,
  catUrl,
  authorObj,
  initialComments,
  initialRelated,
}: {
  slug: string;
  categorySlug: string;
  initialArticle: Article | null;
  catName: string;
  catUrl: string;
  authorObj?: Author;
  initialComments: Omit<ArticleComment, "authorEmail">[];
  initialRelated: Article[];
}) {
  const [article, setArticle] = useState<Article | null>(initialArticle);
  const [related, setRelated] = useState<Article[]>(initialRelated);
  const [loadingLive, setLoadingLive] = useState(!initialArticle);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1. Check browser IndexedDB snapshot first (instant on the editor's own device)
      if (typeof window !== "undefined" && "indexedDB" in window) {
        try {
          const snap: { savedArticles?: Article[] } | null = await new Promise((resolve) => {
            try {
              const req = window.indexedDB.open("d2j_cms_idb_v1", 1);
              req.onupgradeneeded = () => {
                if (!req.result.objectStoreNames.contains("snapshots")) {
                  req.result.createObjectStore("snapshots");
                }
              };
              req.onsuccess = () => {
                try {
                  const tx = req.result.transaction("snapshots", "readonly");
                  const getReq = tx.objectStore("snapshots").get("main");
                  getReq.onsuccess = () => resolve(getReq.result || null);
                  getReq.onerror = () => resolve(null);
                } catch {
                  resolve(null);
                }
              };
              req.onerror = () => resolve(null);
            } catch {
              resolve(null);
            }
          });
          const localMatch = snap?.savedArticles?.find((a) => a.slug === slug);
          if (!cancelled && localMatch) {
            setArticle(localMatch);
            setLoadingLive(false);
          }
        } catch {
          // ignore
        }
      }

      // 2. Fetch live article & attached pictures from /api/admin?public=1
      try {
        const res = await fetch(`/api/admin?public=1&slug=${encodeURIComponent(slug)}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.article) {
            setArticle(data.article);
          }
          if (!cancelled && Array.isArray(data.articles)) {
            const rel = (data.articles as Article[])
              .filter((a) => a.slug !== slug)
              .slice(0, 3);
            if (rel.length > 0) setRelated(rel);
          }
        }
      } catch {
        // Keep initialArticle
      } finally {
        if (!cancelled) setLoadingLive(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!article) {
    if (loadingLive) {
      return (
        <div className="wrap" style={{ padding: "64px 0", textAlign: "center" }}>
          <p className="meta">Loading article report...</p>
        </div>
      );
    }
    return (
      <div className="wrap" style={{ padding: "64px 0", textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--hf)", fontSize: 28 }}>Article Not Found</h1>
        <p style={{ margin: "12px 0 24px" }}>
          This report may have been moved or is not currently published.
        </p>
        <Link href="/news" className="btn">
          Browse Latest News
        </Link>
      </div>
    );
  }

  const sliderPhotos: SliderPhotoItem[] = [];
  if (article.featuredImage) {
    sliderPhotos.push({
      url: article.featuredImage,
      caption: article.imageCaption || article.title,
    });
  }
  if (Array.isArray(article.contentBlocks)) {
    for (const blk of article.contentBlocks) {
      if (blk.type === "image" && blk.imageUrl) {
        if (!sliderPhotos.some((p) => p.url === blk.imageUrl)) {
          sliderPhotos.push({
            url: blk.imageUrl,
            caption: blk.imageCaption || article.title,
          });
        }
      } else if (blk.type === "gallery") {
        if (blk.imageUrl && !sliderPhotos.some((p) => p.url === blk.imageUrl)) {
          sliderPhotos.push({
            url: blk.imageUrl,
            caption: blk.imageCaption || article.title,
          });
        }
        if (blk.secondImageUrl && !sliderPhotos.some((p) => p.url === blk.secondImageUrl)) {
          sliderPhotos.push({
            url: blk.secondImageUrl,
            caption: blk.secondImageCaption || article.title,
          });
        }
      }
    }
  }

  return (
    <div className="wrap">
      <nav className="bc" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href={catUrl}>{catName || categorySlug}</Link>
          </li>
          <li aria-current="page">{article.title}</li>
        </ol>
      </nav>

      <article>
        <header className="ah">
          <span className="cat">{catName || categorySlug}</span>{" "}
          <VerificationBadge type={article.verification} />
          <h1>{article.title}</h1>
          <p className="sf">{article.summary}</p>
          <div className="by">
            <span className="av">{authorObj?.avatarInitials || "D"}</span>
            <div>
              <b>{article.authorName}</b>
              {article.verification === "D"
                ? "Demo content"
                : article.sourceName
                ? `Summary of ${article.sourceName} reporting`
                : authorObj?.role || "Editorial Desk"}
            </div>
            <div>
              {article.verification === "D"
                ? "Demo content"
                : `Published ${formatDisplayDate(article.publishedAt)} · Updated ${formatDisplayDate(article.updatedAt)}`}
              <br />
              {Math.max(2, Math.ceil((article.body || []).join(" ").split(" ").length / 180))} min read
            </div>
            <ShareRow title={article.title} />
          </div>
        </header>

        <figure className="fi">
          <div className={`art a-${article.artTheme}`}>
            <ArtIllustration
              theme={article.artTheme}
              featuredImage={getEffectiveFeaturedImage(article)}
              featuredVideo={article.featuredVideo}
              interactiveVideo={true}
              label={`Media for: ${article.title}`}
            />
          </div>
          <figcaption>
            {article.imageCaption ||
              (article.featuredVideo
                ? "Video report — D-Path to Jannah Media Hub."
                : getEffectiveFeaturedImage(article)
                ? "Photograph — D-Path to Jannah Media Hub."
                : "Illustration, not a photograph from the source. Credit: D2J design illustration.")}
          </figcaption>
        </figure>

        <div className="bd">
          {article.correctionNote && (
            <p className="upd">
              <b>Correction / Update:</b> {article.correctionNote}{" "}
              <Link href="/corrections-policy">Corrections policy</Link>
            </p>
          )}

          <p className="upd">
            <b>
              {article.verification === "D" ? "Demo content." : "Editorial verification."}
            </b>{" "}
            {VERIFICATION_NOTES[article.verification]}{" "}
            {article.sourceUrl && (
              <>
                Original:{" "}
                <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {article.sourceName || article.sourceUrl}
                </a>
                .
              </>
            )}
          </p>

          {Array.isArray(article.contentBlocks) && article.contentBlocks.length > 0
            ? article.contentBlocks.map((block, idx) => {
                if (block.type === "heading") {
                  return <h2 key={block.id || idx}>{block.text}</h2>;
                }
                if (block.type === "quote") {
                  return (
                    <blockquote key={block.id || idx}>
                      {renderRichTextWithLinks(block.text || "")}
                      {block.quoteAttribution && <cite>— {block.quoteAttribution}</cite>}
                    </blockquote>
                  );
                }
                if (block.type === "image" && block.imageUrl) {
                  return (
                    <figure key={block.id || idx} style={{ margin: "24px 0" }}>
                      <img
                        src={block.imageUrl}
                        alt={block.imageCaption || article.title}
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: "100%",
                          borderRadius: 12,
                          border: "1px solid var(--bd)",
                          display: "block",
                          maxHeight: 520,
                          objectFit: "cover",
                        }}
                      />
                      {block.imageCaption && <figcaption>{block.imageCaption}</figcaption>}
                    </figure>
                  );
                }
                if (block.type === "gallery" && (block.imageUrl || block.secondImageUrl)) {
                  return (
                    <div
                      key={block.id || idx}
                      className="two"
                      style={{ margin: "24px 0", alignItems: "start" }}
                    >
                      {block.imageUrl && (
                        <figure style={{ margin: 0 }}>
                          <img
                            src={block.imageUrl}
                            alt={block.imageCaption || `${article.title} — photo 1`}
                            loading="lazy"
                            decoding="async"
                            style={{
                              width: "100%",
                              aspectRatio: "4/3",
                              objectFit: "cover",
                              borderRadius: 10,
                              border: "1px solid var(--bd)",
                              display: "block",
                            }}
                          />
                          {block.imageCaption && <figcaption>{block.imageCaption}</figcaption>}
                        </figure>
                      )}
                      {block.secondImageUrl && (
                        <figure style={{ margin: 0 }}>
                          <img
                            src={block.secondImageUrl}
                            alt={block.secondImageCaption || `${article.title} — photo 2`}
                            loading="lazy"
                            decoding="async"
                            style={{
                              width: "100%",
                              aspectRatio: "4/3",
                              objectFit: "cover",
                              borderRadius: 10,
                              border: "1px solid var(--bd)",
                              display: "block",
                            }}
                          />
                          {block.secondImageCaption && (
                            <figcaption>{block.secondImageCaption}</figcaption>
                          )}
                        </figure>
                      )}
                    </div>
                  );
                }
                if (block.type === "video" && block.videoUrl) {
                  return (
                    <figure key={block.id || idx} style={{ margin: "24px 0" }}>
                      <div className={`art a-${article.artTheme}`}>
                        <ArtIllustration
                          theme={article.artTheme}
                          featuredVideo={block.videoUrl}
                          interactiveVideo={true}
                          label={block.imageCaption || article.title}
                        />
                      </div>
                      {block.imageCaption && <figcaption>{block.imageCaption}</figcaption>}
                    </figure>
                  );
                }
                return block.text ? (
                  <p key={block.id || idx}>{renderRichTextWithLinks(block.text)}</p>
                ) : null;
              })
            : (article.body || []).map((paragraph, idx) => (
                <p key={idx}>{renderRichTextWithLinks(paragraph)}</p>
              ))}

          {sliderPhotos.length > 1 && (
            <ArticlePhotoCarousel photos={sliderPhotos} title={article.title} />
          )}

          {article.sourceUrl && (
            <p>
              <a
                className="btn"
                style={{ color: "#ffffff", textDecoration: "none" }}
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read the original report at {article.sourceName || "the source"}
              </a>
            </p>
          )}

          <div className="tags">
            {(article.tags || []).map((t) => (
              <Link key={t} className="cat" href={`/search?q=${encodeURIComponent(t)}`}>
                {t}
              </Link>
            ))}
          </div>

          <ShareRow title={article.title} />
          <p className="meta" style={{ fontSize: 12.5, marginTop: 8 }}>
            Spotted a factual error?{" "}
            <Link
              href="/contact?enquiry=Report+a+Correction"
              style={{ textDecoration: "underline" }}
            >
              Report a correction
            </Link>{" "}
            or read our{" "}
            <Link href="/corrections-policy" style={{ textDecoration: "underline" }}>
              Corrections Policy
            </Link>
            .
          </p>

          <div className="ab">
            <span className="av">{authorObj?.avatarInitials || "D"}</span>
            <div>
              <b>{article.authorName}</b>
              <p>
                {authorObj?.bio ||
                  "D-Path to Jannah Media Hub editorial desk produces verified summaries and youth-focused reporting."}
              </p>
            </div>
          </div>

          <ArticleCommentsClient
            articleId={article.id}
            articleSlug={article.slug}
            initialComments={initialComments}
          />
        </div>
      </article>

      <section className="rel">
        <div className="sh">
          <h2>Related stories</h2>
          <Link href={catUrl}>More in {catName || categorySlug}</Link>
        </div>
        <div className="grid3">
          {related.map((relArt) => (
            <ArticleCard key={relArt.id} article={relArt} />
          ))}
        </div>
      </section>
    </div>
  );
}
