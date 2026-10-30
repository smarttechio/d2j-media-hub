import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedOpportunityBySlug } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const opp = getPublishedOpportunityBySlug(slug);
  if (!opp) return { title: "Opportunity Not Found" };
  return {
    title: opp.title,
    description: opp.summary,
  };
}

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const opp = getPublishedOpportunityBySlug(slug);
  if (!opp) notFound();

  const isUpcomingOrOpen =
    opp.openClosedStatus === "Upcoming" || opp.openClosedStatus === "Open";

  return (
    <div className="wrap">
      <nav className="bc" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/opportunities">Opportunities</Link>
          </li>
          <li aria-current="page">{opp.title}</li>
        </ol>
      </nav>

      <article className="ah" style={{ paddingBottom: 30 }}>
        <span className="cat">{opp.type}</span>{" "}
        <span className={`stt ${isUpcomingOrOpen ? "up" : "cl"}`}>
          {opp.openClosedStatus}
        </span>
        <h1>{opp.title}</h1>
        <p className="sf">{opp.summary}</p>
        <div className="bd" style={{ marginLeft: 0 }}>
          <dl>
            <dt>Provider</dt>
            <dd>{opp.provider}</dd>
            <dt>Type</dt>
            <dd>{opp.type}</dd>
            <dt>Eligibility</dt>
            <dd>{opp.eligibility}</dd>
            <dt>Benefits</dt>
            <dd>{opp.benefits}</dd>
            <dt>Deadline</dt>
            <dd>{opp.deadline}</dd>
            <dt>Status</dt>
            <dd>{opp.openClosedStatus}</dd>
            <dt>Last verified</dt>
            <dd>{opp.lastVerified} against the official page</dd>
            <dt>Official page</dt>
            <dd>
              <a href={opp.officialUrl} target="_blank" rel="noopener noreferrer">
                {opp.officialUrl}
              </a>
            </dd>
          </dl>
          <p className="upd">{opp.notes}</p>
          <a
            className="btn"
            style={{ color: "#ffffff", textDecoration: "none" }}
            href={opp.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Go to the official page
          </a>{" "}
          <Link
            className="btn line"
            style={{ textDecoration: "none" }}
            href="/opportunities"
          >
            Back to opportunities
          </Link>
        </div>
      </article>
    </div>
  );
}
