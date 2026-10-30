import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedArticles, getCategoryBySlug } from "@/lib/db";
import { CategoryListingClient } from "@/components/CategoryListingClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategoryBySlug(category);
  if (!cat) return { title: "Category Not Found" };
  return {
    title: cat.name,
    description: cat.description,
  };
}

export default async function NewsCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = getCategoryBySlug(category);
  if (!cat) notFound();

  const articles = getPublishedArticles(category);

  return (
    <CategoryListingClient
      categorySlug={cat.slug}
      categoryName={cat.name}
      categoryDescription={cat.description}
      articles={articles}
      customTopics={cat.topics}
    />
  );
}
