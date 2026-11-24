import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPublishedArticleBySlug,
  getPublishedArticles,
  getCategoryBySlug,
  getApprovedCommentsForArticle,
  ensureDbSynced,
  readDb,
  type Article,
} from "@/lib/db";
import { getEffectiveFeaturedImage } from "@/components/ArticleCards";
import { LiveArticleViewClient } from "@/components/LiveArticleViewClient";

export const dynamic = "force-dynamic";

const SITE_BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.dpathtojannah.com"
).replace(/\/+$/, "");

function resolveAbsoluteOgImageUrl(article: Article): string {
  const rawImg = getEffectiveFeaturedImage(article);
  if (!rawImg) {
    return `${SITE_BASE_URL}/logo.webp`;
  }
  if (rawImg.startsWith("data:image/")) {
    return `${SITE_BASE_URL}/api/og-image/${encodeURIComponent(article.slug)}`;
  }
  if (/^https?:\/\//i.test(rawImg)) {
    return rawImg;
  }
  const cleanPath = rawImg.startsWith("/") ? rawImg : `/${rawImg}`;
  return `${SITE_BASE_URL}${cleanPath}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  await ensureDbSynced();
  const article = getPublishedArticleBySlug(slug);
  if (!article) {
    return {
      title: "Article Not Found | D2J Media Hub",
      robots: { index: false, follow: false },
    };
  }

  const canonicalUrl = `${SITE_BASE_URL}/news/${article.category}/${article.slug}`;
  const ogImageUrl = resolveAbsoluteOgImageUrl(article);
  const metaTitle = article.seoTitle || article.title;
  const metaDescription =
    article.seoDescription ||
    article.summary ||
    (article.body && article.body[0] ? article.body[0].slice(0, 160) : article.title);

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: canonicalUrl,
      siteName: "D-Path to Jannah Media Hub",
      locale: "en_NG",
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.authorName],
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: article.imageCaption || article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: [ogImageUrl],
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
  const article = getPublishedArticleBySlug(slug);
  if (!article) {
    notFound();
  }

  const effectiveCatSlug = article.category || category;
  const cat = getCategoryBySlug(effectiveCatSlug);
  const catName = cat?.name || effectiveCatSlug;
  const catUrl =
    effectiveCatSlug === "campus"
      ? "/campus"
      : effectiveCatSlug === "islam"
      ? "/islam"
      : `/news/${effectiveCatSlug}`;

  const db = readDb();
  const authorObj = db.authors.find((a) => a.id === article.authorId);
  const approvedComments = getApprovedCommentsForArticle(article.id, article.slug).map(
    ({ authorEmail: _em, ...c }) => c
  );

  const sameCat = getPublishedArticles(effectiveCatSlug).filter(
    (a) => a.slug !== article.slug
  );
  const otherArts = getPublishedArticles().filter(
    (a) => a.category !== effectiveCatSlug && a.slug !== article.slug
  );
  const related = [...sameCat, ...otherArts].slice(0, 3);

  const canonicalUrl = `${SITE_BASE_URL}/news/${article.category}/${article.slug}`;
  const ogImageUrl = resolveAbsoluteOgImageUrl(article);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    url: canonicalUrl,
    headline: article.title,
    description: article.summary,
    image: [ogImageUrl],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      "@type": "Person",
      name: article.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "D-Path to Jannah Media Hub",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_BASE_URL}/logo.webp`,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LiveArticleViewClient
        slug={article.slug}
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
