import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPublishedArticleBySlug,
  getPublishedArticles,
  getCategoryBySlug,
  getApprovedCommentsForArticle,
  ensureDbSynced,
  readDb,
} from "@/lib/db";
import {
  ArticleCard,
  VerificationBadge,
  formatDisplayDate,
} from "@/components/ArticleCards";
import { ShareRow } from "@/components/CategoryListingClient";
import { ArtIllustration } from "@/components/SvgSprite";
import { ArticleCommentsClient } from "@/components/ArticleCommentsClient";

export const dynamic = "force-dynamic";

const VERIFICATION_NOTES = {
  V: "Verified: the source page was opened and read on 25 October 2026.",
  S: "Source text checked through a search result on 25 October 2026. Open the original to confirm.",
  D: "Demo content written to test the layout. It is not real reporting.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getPublishedArticleBySlug(slug);
  if (!article) return { title: "Article Not Found" };

  const canonicalPath = `/news/${article.category}/${article.slug}`;
  const ogImage = article.featuredImage || "/logo.webp";

  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.summary,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.summary,
      url: canonicalPath,
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.authorName],
      images: [
        {
          url: ogImage,
          alt: article.imageCaption || article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.summary,
      images: [ogImage],
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { slug } = await params;
  await ensureDbSynced();
  const article = getPublishedArticleBySlug(slug);
  if (!article) notFound();

  const cat = getCategoryBySlug(article.category);
  const catName = cat?.name || article.category;
  const catUrl =
    article.category === "campus"
      ? "/campus"
      : article.category === "islam"
      ? "/islam"
      : `/news/${article.category}`;

  const db = readDb();
  const authorObj = db.authors.find((a) => a.id === article.authorId);
  const approvedComments = getApprovedCommentsForArticle(article.id, article.slug).map(
    ({ authorEmail: _em, ...c }) => c
  );

  const sameCat = getPublishedArticles(article.category).filter(
    (a) => a.slug !== article.slug
  );
  const otherArts = getPublishedArticles().filter(
    (a) => a.category !== article.category && a.slug !== article.slug
  );
  const related = [...sameCat, ...otherArts].slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Person",
      name: article.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "D-Path to Jannah Media Hub",
      logo: {
        "@type": "ImageObject",
        url: `${(process.env.NEXT_PUBLIC_SITE_URL || "https://d2j-media-hub.vercel.app").replace(/\/+$/, "")}/logo.webp`,
      },
    },
  };

  return (
    <div className="wrap">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="bc" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href={catUrl}>{catName}</Link>
          </li>
          <li aria-current="page">{article.title}</li>
        </ol>
      </nav>

      <article>
        <header className="ah">
          <span className="cat">{catName}</span>{" "}
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
              {Math.max(2, Math.ceil(article.body.join(" ").split(" ").length / 180))} min read
            </div>
            <ShareRow title={article.title} />
          </div>
        </header>

        <figure className="fi">
          <div className={`art a-${article.artTheme}`}>
            <ArtIllustration
              theme={article.artTheme}
              featuredImage={article.featuredImage}
              featuredVideo={article.featuredVideo}
              interactiveVideo={true}
              label={`Media for: ${article.title}`}
            />
          </div>
          <figcaption>
            {article.imageCaption ||
              (article.featuredVideo
                ? "Video report — D-Path to Jannah Media Hub."
                : article.featuredImage
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
              {article.verification === "D" ? "Demo content." : "Third-party reporting."}
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
                      {block.text}
                      {block.quoteAttribution && <cite>— {block.quoteAttribution}</cite>}
                    </blockquote>
                  );
                }
                if (block.type === "image" && block.imageUrl) {
                  return (
                    <figure
                      key={block.id || idx}
                      style={{ margin: "24px 0" }}
                    >
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
                      {block.imageCaption && (
                        <figcaption>{block.imageCaption}</figcaption>
                      )}
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
                          {block.imageCaption && (
                            <figcaption>{block.imageCaption}</figcaption>
                          )}
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
                      {block.imageCaption && (
                        <figcaption>{block.imageCaption}</figcaption>
                      )}
                    </figure>
                  );
                }
                return block.text ? <p key={block.id || idx}>{block.text}</p> : null;
              })
            : article.body.map((paragraph, idx) => <p key={idx}>{paragraph}</p>)}

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
            {article.tags.map((t) => (
              <Link key={t} className="cat" href={`/search?q=${encodeURIComponent(t)}`}>
                {t}
              </Link>
            ))}
          </div>

          <ShareRow title={article.title} />
          <p className="meta" style={{ fontSize: 12.5, marginTop: 8 }}>
            Spotted a factual error?{" "}
            <Link href="/contact?enquiry=Report+a+Correction" style={{ textDecoration: "underline" }}>
              Report a correction
            </Link>{" "}
            or read our <Link href="/corrections-policy" style={{ textDecoration: "underline" }}>Corrections Policy</Link>.
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
            initialComments={approvedComments}
          />
        </div>
      </article>

      <section className="rel">
        <div className="sh">
          <h2>Related stories</h2>
          <Link href={catUrl}>More in {catName}</Link>
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
