import React from "react";
import Link from "next/link";
import {
  getPublishedArticles,
  getPublishedOpportunities,
} from "@/lib/db";
import {
  ArticleCard,
  SmallArticleCard,
  OpportunityCard,
  getArticleUrl,
} from "@/components/ArticleCards";
import { ArtIllustration } from "@/components/SvgSprite";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const allArticles = getPublishedArticles();
  const opportunities = getPublishedOpportunities();

  const leadArticle = allArticles[0];
  const heroSideArticles = allArticles.slice(1, 5);
  const campusArticles = getPublishedArticles("campus").slice(0, 5);
  const islamArticles = getPublishedArticles("islam").slice(0, 3);
  const eduArticles = getPublishedArticles("education").slice(0, 4);
  const latestArticles = allArticles.slice(0, 6);
  const mostReadArticles = [...allArticles]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  const islamTopics = [
    ["Qur’an and Tafsir", "Study guides and reflections", "/islam?topic=Qur’an+and+Tafsir"],
    ["Hadith and Sunnah", "Lessons for everyday life", "/islam?topic=Hadith+and+Sunnah"],
    ["Islamic History", "People, places and periods", "/islam?topic=Islamic+History"],
    ["Faith and Spirituality", "Character, habits and growth", "/islam?topic=Faith+and+Spirituality"],
    ["Worship and Daily Practice", "Planning ahead as a student", "/islam?topic=Worship+and+Daily+Practice"],
    ["Character and Ethics", "Ethics at work and on campus", "/islam?topic=Character+and+Ethics"],
  ];

  const miniColumns = [
    {
      title: "Business and Economy",
      slug: "business",
      articles: getPublishedArticles("business").slice(0, 2),
    },
    {
      title: "Health and Well-being",
      slug: "health",
      articles: getPublishedArticles("health").slice(0, 2),
    },
    {
      title: "Lifestyle",
      slug: "lifestyle",
      articles: getPublishedArticles("lifestyle").slice(0, 2),
    },
    {
      title: "Opinion and Features",
      slug: "opinion",
      articles: getPublishedArticles("opinion").slice(0, 2),
    },
  ];

  return (
    <>
      <div className="wrap">
        <div className="stat" style={{ marginTop: 18 }}>
          <b>How to read this site</b> Items marked{" "}
          <span className="tg A">Verified source</span> or{" "}
          <span className="tg C">Source checked</span> summarise real reporting and link to the
          original. Items marked <span className="tg B">Demo content</span> are layout samples only.
        </div>

        {/* Top Stories */}
        <section aria-labelledby="h-top" style={{ paddingTop: 12 }}>
          <div className="sh">
            <h2 id="h-top">Top stories</h2>
            <Link href="/news">All news</Link>
          </div>
          <div className="chh">
            {leadArticle && <ArticleCard article={leadArticle} isLead showSummary />}
            <div>
              {heroSideArticles.map((art) => (
                <SmallArticleCard key={art.id} article={art} />
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Verified Opportunities Band */}
      <div className="band" style={{ margin: "10px 0" }}>
        <div className="wrap">
          <div className="sh">
            <h2>Opportunities</h2>
            <Link href="/opportunities">All opportunities</Link>
          </div>
          <div
            className="og2"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))" }}
          >
            {opportunities.slice(0, 3).map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>
          <p className="meta" style={{ marginTop: 12 }}>
            Every listing shows its status and when we last checked it. Always confirm on the
            official page.
          </p>
        </div>
      </div>

      {/* Campus and Student Life — Signature Full-Width Band */}
      <section id="campus" aria-labelledby="h-camp" style={{ padding: 0 }}>
        <div className="camp">
          <div className="wrap">
            <div className="sh">
              <h2 id="h-camp" style={{ color: "#fff" }}>
                Campus and Student Life
              </h2>
              <Link href="/campus">View all campus news</Link>
            </div>
            <div className="grid">
              {campusArticles[0] && (
                <div className="big">
                  <ArticleCard article={campusArticles[0]} showSummary />
                </div>
              )}
              {campusArticles.slice(1, 5).map((art) => (
                <ArticleCard key={art.id} article={art} />
              ))}
            </div>
            <div className="strip">
              <Link href="/campus?topic=Student+Achievements">Student achievements</Link>
              <Link href="/opportunities">Scholarships and opportunities</Link>
              <Link href="/campus?topic=Campus+Organisations">Society activities</Link>
              <Link href="/news/business">Student entrepreneurship</Link>
              <Link href="/campus?topic=Study+tips">Admissions and study tips</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Latest News + Most Read Sidebar */}
      <div className="wrap">
        <section id="latest" aria-labelledby="h-lat">
          <div className="sh">
            <h2 id="h-lat">Latest news</h2>
            <Link href="/news">More news</Link>
          </div>
          <div className="lm">
            <div className="grid3">
              {latestArticles.map((art) => (
                <ArticleCard key={art.id} article={art} />
              ))}
            </div>
            <aside className="mr" aria-label="Most read">
              <h3>Most read</h3>
              <p className="meta">Ranked by article views in the database.</p>
              {mostReadArticles.map((art, idx) => (
                <Link key={art.id} href={getArticleUrl(art)}>
                  <span className="n">{idx + 1}</span>
                  <span>{art.title}</span>
                </Link>
              ))}
            </aside>
          </div>
        </section>
      </div>

      {/* Islamic Knowledge + Ask a Scholar */}
      <div className="wrap">
        <section id="islam" aria-labelledby="h-isl">
          <div className="sh">
            <h2 id="h-isl">Islamic Knowledge</h2>
            <Link href="/islam">Explore Islam</Link>
          </div>
          <div className="cols2">
            <div>
              <div className="topics">
                {islamTopics.map(([title, desc, href]) => (
                  <Link key={title} className="topic" href={href}>
                    <b>{title}</b>
                    <span>{desc}</span>
                  </Link>
                ))}
              </div>
              <div className="ask">
                <h3>Ask a Scholar</h3>
                <p>
                  Send your question and choose whether it may be published anonymously. Every
                  question is reviewed by editors and a qualified scholar before anything is
                  published. Nothing is answered automatically.
                </p>
                <Link className="btn gold" href="/ask-a-scholar">
                  Ask a question
                </Link>{" "}
                <Link className="btn line" href="/ask-a-scholar/answers">
                  Published answers
                </Link>
              </div>
            </div>
            <div>
              {islamArticles[0] && (
                <ArticleCard article={islamArticles[0]} showSummary />
              )}
            </div>
          </div>
          <div className="grid3" style={{ marginTop: 22 }}>
            {islamArticles.map((art) => (
              <ArticleCard key={art.id} article={art} />
            ))}
          </div>
        </section>
      </div>

      {/* Education and Careers */}
      <div className="wrap">
        <section id="edu" aria-labelledby="h-edu">
          <div className="sh">
            <h2 id="h-edu">Education and Careers</h2>
            <Link href="/education">Explore Education &amp; Careers</Link>
          </div>
          <div className="cols2">
            <ul className="list">
              {opportunities.map((opp) => (
                <li key={opp.id}>
                  <span className="cat" style={{ margin: 0 }}>
                    {opp.type}
                  </span>
                  <Link href={`/opportunities/${opp.slug}`}>
                    <b>{opp.title}</b>
                  </Link>
                  <span className="tagd">
                    {opp.openClosedStatus} · Verified {opp.lastVerified}
                  </span>
                </li>
              ))}
              {eduArticles.map((art) => (
                <li key={art.id}>
                  <span className="cat" style={{ margin: 0 }}>
                    Career &amp; Study Guide
                  </span>
                  <Link href={getArticleUrl(art)}>
                    <b>{art.title}</b>
                  </Link>
                  <span className="tagd">
                    {art.verification === "D" ? "Demo guide" : "Verified"}
                  </span>
                </li>
              ))}
            </ul>
            <div className="card">
              <Link href="/opportunities" className="art a-campus" aria-label="Opportunities">
                <ArtIllustration theme="campus" label="Opportunities illustration" />
              </Link>
              <span className="cat">Opportunities · Verified</span>
              <Link href="/opportunities">
                <h3>Every opportunity card shows eligibility, deadline and an official link</h3>
              </Link>
              <p>
                Every real listing is checked against an official provider page before publishing.
                Expired or closed opportunities are clearly marked.
              </p>
              <Link className="btn line" href="/opportunities" style={{ marginTop: 8 }}>
                Browse all opportunities
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* More from D-Path */}
      <div className="wrap">
        <section aria-labelledby="h-more">
          <div className="sh">
            <h2 id="h-more">More from D-Path</h2>
          </div>
          <div className="mini">
            {miniColumns.map((col) => (
              <div key={col.slug}>
                <h3>
                  <Link href={`/news/${col.slug}`}>{col.title}</Link>
                </h3>
                {col.articles.map((a) => (
                  <Link key={a.id} href={getArticleUrl(a)}>
                    {a.title}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
