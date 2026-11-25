import React from "react";
import type { Metadata } from "next";
import { ensureDbSynced, getPublishedOpportunities } from "@/lib/db";
import { OpportunitiesClient } from "./OpportunitiesClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Opportunities",
  description:
    "Scholarships, internships and fellowships with an official source. Each listing shows its status and when we last checked it.",
};

export default async function OpportunitiesPage() {
  await ensureDbSynced();
  const opportunities = getPublishedOpportunities();
  return <OpportunitiesClient opportunities={opportunities} />;
}
