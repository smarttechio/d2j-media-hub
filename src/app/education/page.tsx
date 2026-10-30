import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedArticles, getPublishedOpportunities } from "@/lib/db";
import { ArticleCard, OpportunityCard } from "@/components/ArticleCards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Education, Careers and Opportunities",
  description:
    "Study strategies, digital skills, career guidance and verified scholarship and internship listings for students and graduates.",
};

export default function EducationCareersPage() {
  const eduArticles = getPublishedArticles("education");
  const opportunities = getPublishedOpportunities();

  return (
    <div className="wrap">
      <nav className="bc" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li aria-current="page">Education, Careers and Opportunities</li>
        </ol>
      </nav>

      <div className="ph">
        <h1>Education, Careers and Opportunities</h1>
        <p>
          Study strategies, digital skills, career guidance and verified scholarship and
          internship listings for Muslim students, graduates and young professionals.
        </p>
      </div>

      <section aria-labelledby="h-opps" style={{ paddingTop: 12 }}>
        <div className="sh">
          <h2 id="h-opps">Verified Opportunities</h2>
          <Link href="/opportunities">All opportunities</Link>
        </div>
        <div className="og2">
          {opportunities.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
        <p className="meta" style={{ marginTop: 12 }}>
          We list an opportunity only when it has an official source. Expired or closed listings
          are clearly marked.
        </p>
      </section>

      <section aria-labelledby="h-guides">
        <div className="sh">
          <h2 id="h-guides">Study, Skills and Career Guides</h2>
          <span className="meta">{eduArticles.length} guides</span>
        </div>
        <div className="grid3">
          {eduArticles.map((art) => (
            <ArticleCard key={art.id} article={art} showSummary />
          ))}
        </div>
      </section>
    </div>
  );
}
