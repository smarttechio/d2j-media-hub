import React from "react";
import Link from "next/link";
import { Article, Opportunity } from "@/lib/db";
import { ArtIllustration } from "./SvgSprite";

const CATEGORY_NAMES: Record<string, string> = {
  news: "News",
  campus: "Campus and Student Life",
  islam: "Islamic Knowledge",
  education: "Education and Careers",
  business: "Business and Economy",
  health: "Health and Well-being",
  politics: "Politics and Society",
  lifestyle: "Lifestyle",
  opinion: "Opinion and Features",
  multimedia: "Multimedia",
  events: "Community Events",
};

export function getArticleUrl(article: Article): string {
  if (article.category === "campus") return `/news/campus/${article.slug}`;
  if (article.category === "islam") return `/news/islam/${article.slug}`;
  return `/news/${article.category}/${article.slug}`;
}

export function formatDisplayDate(dateStr: string): string {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function VerificationBadge({ type }: { type: Article["verification"] }) {
  if (type === "V") return <span className="tg A">Verified source</span>;
  if (type === "S") return <span className="tg C">Source checked</span>;
  return <span className="tg B">Demo content</span>;
}

export function getArticleMetaText(article: Article): string {
  if (article.verification === "D") {
    return `${article.authorName} · Demo content`;
  }
  return `${article.sourceName || article.authorName} · ${formatDisplayDate(article.publishedAt)}`;
}

export function ArticleCard({
  article,
  showSummary = false,
  isLead = false,
}: {
  article: Article;
  showSummary?: boolean;
  isLead?: boolean;
}) {
  const url = getArticleUrl(article);
  const catLabel = CATEGORY_NAMES[article.category] || article.category;
  const isOpinion = article.category === "opinion" || article.tags.includes("Student Voices");

  return (
    <article className={isLead ? "lead card" : "card"}>
      <Link
        href={url}
        className={`art a-${article.artTheme}`}
        aria-label={`Read: ${article.title}`}
      >
        <ArtIllustration
          theme={article.artTheme}
          featuredImage={article.featuredImage}
          featuredVideo={article.featuredVideo}
          label={`Illustration for: ${article.title}`}
        />
      </Link>
      <div>
        <span className={isOpinion ? "cat opn" : "cat"}>
          {isLead ? `Featured · ${catLabel}` : isOpinion ? `Opinion · ${catLabel}` : catLabel}
        </span>{" "}
        <VerificationBadge type={article.verification} />
      </div>
      <Link href={url}>
        <h3>{article.title}</h3>
      </Link>
      {(showSummary || isLead) && <p>{article.summary}</p>}
      <div className="meta">{getArticleMetaText(article)}</div>
    </article>
  );
}

export function SmallArticleCard({ article }: { article: Article }) {
  const url = getArticleUrl(article);
  const catLabel = CATEGORY_NAMES[article.category] || article.category;

  return (
    <article className="sm card">
      <Link
        href={url}
        className={`art a-${article.artTheme}`}
        aria-label={`Read: ${article.title}`}
      >
        <ArtIllustration
          theme={article.artTheme}
          featuredImage={article.featuredImage}
          featuredVideo={article.featuredVideo}
          label={`Illustration for: ${article.title}`}
        />
      </Link>
      <div>
        <span className="cat" style={{ marginTop: 0 }}>
          {catLabel}
        </span>{" "}
        <VerificationBadge type={article.verification} />
        <Link href={url}>
          <h3>{article.title}</h3>
        </Link>
        <div className="meta">{getArticleMetaText(article)}</div>
      </div>
    </article>
  );
}

export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const isUpcomingOrOpen =
    opportunity.openClosedStatus === "Upcoming" || opportunity.openClosedStatus === "Open";

  return (
    <article className="oc">
      <span className="cat" style={{ alignSelf: "flex-start", margin: 0 }}>
        {opportunity.type}
      </span>
      <h3>
        <Link href={`/opportunities/${opportunity.slug}`}>{opportunity.title}</Link>
      </h3>
      <p>{opportunity.summary}</p>
      <dl>
        <dt>Provider</dt>
        <dd>{opportunity.provider}</dd>
        <dt>Deadline</dt>
        <dd>{opportunity.deadline}</dd>
        <dt>Status</dt>
        <dd>
          <span className={`stt ${isUpcomingOrOpen ? "up" : "cl"}`}>
            {opportunity.openClosedStatus}
          </span>
        </dd>
      </dl>
      <div className="row">
        <Link className="btn line" href={`/opportunities/${opportunity.slug}`}>
          View details
        </Link>
      </div>
    </article>
  );
}
