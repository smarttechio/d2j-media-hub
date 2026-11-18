import React from "react";
import {
  getPublishedArticles,
  getPublishedOpportunities,
  ensureDbSynced,
} from "@/lib/db";
import { LiveHomeViewClient } from "@/components/LiveHomeViewClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureDbSynced();
  const allArticles = getPublishedArticles();
  const opportunities = getPublishedOpportunities();

  return (
    <LiveHomeViewClient
      initialArticles={allArticles}
      initialOpportunities={opportunities}
    />
  );
}
