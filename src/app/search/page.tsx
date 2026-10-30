import React from "react";
import type { Metadata } from "next";
import {
  getPublishedArticles,
  getPublishedOpportunities,
  getPublishedScholarAnswers,
  getCategories,
} from "@/lib/db";
import { SearchClient } from "./SearchClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search and Content Discovery",
  description:
    "Search published news, campus stories, Islamic knowledge, published answers and opportunities.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const articles = getPublishedArticles();
  const opportunities = getPublishedOpportunities();
  const qas = getPublishedScholarAnswers();
  const categories = getCategories();

  return (
    <SearchClient
      initialQuery={q}
      articles={articles}
      opportunities={opportunities}
      qas={qas}
      categories={categories}
    />
  );
}
