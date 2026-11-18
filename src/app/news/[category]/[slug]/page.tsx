import React from "react";
import type { Metadata } from "next";
import {
  getPublishedArticleBySlug,
  getPublishedArticles,
  getCategoryBySlug,
  getApprovedCommentsForArticle,
  ensureDbSynced,
  readDb,
} from "@/lib/db";
import { getEffectiveFeaturedImage } from "@/components/ArticleCards";
import { LiveArticleViewClient } from "@/components/LiveArticleViewClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getPublishedArticleBySlug(slug);
  if (!article) return { title: "Article Report | D2J Media Hub" };

  const canonicalPath = `/news/${article.category}/${article.slug}`;
  const ogImage = getEffectiveFeaturedImage(article) || "/logo.webp";

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
  const { category, slug } = await params;
  await ensureDbSynced();
  const article = getPublishedArticleBySlug(slug) || null;

  const effectiveCatSlug = article?.category || category;
  const cat = getCategoryBySlug(effectiveCatSlug);
  const catName = cat?.name || effectiveCatSlug;
  const catUrl =
    effectiveCatSlug === "campus"
      ? "/campus"
      : effectiveCatSlug === "islam"
      ? "/islam"
      : `/news/${effectiveCatSlug}`;

  const db = readDb();
  const authorObj = article
    ? db.authors.find((a) => a.id === article.authorId)
    : undefined;
  const approvedComments = article
    ? getApprovedCommentsForArticle(article.id, article.slug).map(
        ({ authorEmail: _em, ...c }) => c
      )
    : [];

  const sameCat = getPublishedArticles(effectiveCatSlug).filter(
    (a) => a.slug !== slug
  );
  const otherArts = getPublishedArticles().filter(
    (a) => a.category !== effectiveCatSlug && a.slug !== slug
  );
  const related = [...sameCat, ...otherArts].slice(0, 3);

  const jsonLd = article
    ? {
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
            url: `${(process.env.NEXT_PUBLIC_SITE_URL || "https://dpathtojannah.com").replace(/\/+$/, "")}/logo.webp`,
          },
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <LiveArticleViewClient
        slug={slug}
        categorySlug={effectiveCatSlug}
        initialArticle={article}
        catName={catName}
        catUrl={catUrl}
        authorObj={authorObj}
        initialComments={approvedComments}
        initialRelated={related}
      />
    </>
  );
}
