import React from "react";
import type { Metadata } from "next";
import { ensureDbSynced, getPublishedArticles, getCategoryBySlug } from "@/lib/db";
import { CategoryListingClient } from "@/components/CategoryListingClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "News",
  description:
    "Reporting on Nigerian Muslim communities, education, youth and international Muslim affairs.",
};

export default async function NewsLandingPage() {
  await ensureDbSynced();
  const cat = getCategoryBySlug("news");
  // Show news articles first, plus general public articles
  const newsArticles = getPublishedArticles("news");
  const allPublished = getPublishedArticles();
  const combined = [
    ...newsArticles,
    ...allPublished.filter((a) => a.category !== "news"),
  ];

  return (
    <CategoryListingClient
      categorySlug="news"
      categoryName={cat?.name || "News"}
      categoryDescription={
        cat?.description ||
        "Reporting on Nigerian Muslim communities, education, youth and international Muslim affairs."
      }
      articles={combined}
      customTopics={["All", "JAMB", "MSSN", "Education policy", "Nigeria", "Youth and community", "Study tips"]}
    />
  );
}
