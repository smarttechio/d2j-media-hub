import React from "react";
import type { Metadata } from "next";
import { getPublishedArticles, getPublishedOpportunities } from "@/lib/db";
import { CampusClient } from "./CampusClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Campus and Student Life",
  description:
    "The voice of Muslim students in Nigerian universities, polytechnics and colleges: campus news, achievements, opportunities and student voices.",
};

export default function CampusPage() {
  const campusArticles = getPublishedArticles("campus");
  const allPublished = getPublishedArticles();
  const opportunities = getPublishedOpportunities();
  const opinionArticles = allPublished.filter(
    (a) => a.category === "opinion" || a.tags.includes("Student Voices")
  );

  return (
    <CampusClient
      campusArticles={campusArticles}
      opportunities={opportunities}
      opinionArticles={opinionArticles}
    />
  );
}
