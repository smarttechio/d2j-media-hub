import React from "react";
import type { Metadata } from "next";
import { ensureDbSynced, getPublishedScholarAnswers } from "@/lib/db";
import { AskScholarClient } from "./AskScholarClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ask a Scholar",
  description:
    "Send a question about Islam for review by our editorial team and an appropriately qualified scholar.",
};

export default async function AskScholarPage() {
  await ensureDbSynced();
  const publishedAnswers = getPublishedScholarAnswers();
  return <AskScholarClient publishedAnswers={publishedAnswers} />;
}
