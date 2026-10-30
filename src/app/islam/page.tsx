import React from "react";
import type { Metadata } from "next";
import { getPublishedArticles, getPublishedScholarAnswers } from "@/lib/db";
import { IslamClient } from "./IslamClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Islamic Knowledge",
  description:
    "Educational articles, study guides and reflections for Muslim students and young people. Reviewer names and credentials appear only once verified.",
};

export default function IslamPage() {
  const islamArticles = getPublishedArticles("islam");
  const publishedAnswers = getPublishedScholarAnswers();

  return <IslamClient articles={islamArticles} publishedAnswers={publishedAnswers} />;
}
