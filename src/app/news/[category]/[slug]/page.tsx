import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPublishedArticleBySlug,
  getPublishedArticles,
  getCategoryBySlug,
  readDb,
} from "@/lib/db";
import {
  ArticleCard,
  VerificationBadge,
  formatDisplayDate,
} from "@/components/ArticleCards";
import { ShareRow } from "@/components/CategoryListingClient";
import { ArtIllustration } from "@/components/SvgSprite";

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

  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.summary,
    openGraph: {
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.summary,
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.authorName],
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { slug } = await params;
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
        url: "https://d2jmediahub.com/logo.webp",
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

          {article.body.map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}

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
