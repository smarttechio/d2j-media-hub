"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Article, Opportunity } from "@/lib/db";
import {
  ArticleCard,
  SmallArticleCard,
  OpportunityCard,
  getArticleUrl,
} from "@/components/ArticleCards";
import { ArtIllustration } from "@/components/SvgSprite";

const CAMPUS_TOPICS = [
  "All",
  "Campus News",
  "Student Achievements",
  "Scholarships",
  "Internships",
  "Campus Organisations",
  "Student Voices",
  "MSSN",
  "Study tips",
];

export function CampusClient({
  campusArticles,
  opportunities,
  opinionArticles,
}: {
  campusArticles: Article[];
  opportunities: Opportunity[];
  opinionArticles: Article[];
}) {
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [visibleCount, setVisibleCount] = useState(6);
  const [showUnverifiedPreview, setShowUnverifiedPreview] = useState(false);

  const leadArticle = campusArticles[0];
  const sideArticles = campusArticles.slice(1, 4);

  const filteredArticles =
    selectedTopic === "All"
      ? campusArticles
      : campusArticles.filter((a) =>
          a.tags.some((t) => t.toLowerCase() === selectedTopic.toLowerCase())
        );

  const achievements = [
    ["Academic success", "Profile format: how students plan their study year", "library"],
    ["Leadership", "Profile format: leading a student society programme", "campus"],
    ["Entrepreneurship", "Story format: launching an ethical campus business", "biz"],
    ["Community initiatives", "Story format: organising a campus volunteer drive", "community"],
  ] as const;

  const orgTiles = [
    ["Muslim student associations", "Profiles and updates from MSSN and campus Islamic societies."],
    ["Campus programmes", "Orientation, mentoring, tutorials and skills programmes."],
    ["Educational seminars", "Reports and summaries of lectures and academic seminars."],
    ["Community outreach", "Volunteering, hospital visits and neighbourhood service projects."],
    ["Student events", "Verified dates and coverage of events open to students."],
  ];

  return (
    <>
      <div className="wrap">
        <nav className="bc" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li aria-current="page">Campus and Student Life</li>
          </ol>
        </nav>

        <div className="ph">
          <h1>Campus and Student Life</h1>
          <p>
            The voice of Muslim students in Nigerian universities, polytechnics and colleges:
            campus news, achievements, opportunities and student voices.
          </p>
        </div>

        {/* Hero */}
        <div className="chh">
          {leadArticle && <ArticleCard article={leadArticle} isLead showSummary />}
          <div>
            {sideArticles.map((art) => (
              <SmallArticleCard key={art.id} article={art} />
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Topic Navigation */}
      <div className="tn">
        <div className="wrap">
          <div className="tf" role="group" aria-label="Campus topics">
            {CAMPUS_TOPICS.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={selectedTopic === t}
                onClick={() => {
                  setSelectedTopic(t);
                  setVisibleCount(6);
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Latest Campus News */}
      <div className="wrap">
        <section id="latest" aria-labelledby="h-l">
          <div className="sh">
            <h2 id="h-l">Latest campus news</h2>
            <span className="meta" aria-live="polite">
              {filteredArticles.length} stories
            </span>
          </div>
          {filteredArticles.length > 0 ? (
            <>
              <div className="grid3">
                {filteredArticles.slice(0, visibleCount).map((art) => (
                  <ArticleCard key={art.id} article={art} showSummary />
                ))}
              </div>
              {filteredArticles.length > visibleCount && (
                <div className="more">
                  <p>
                    Showing {visibleCount} of {filteredArticles.length} stories
                  </p>
                  <button
                    type="button"
                    className="btn line"
                    onClick={() => setVisibleCount((c) => c + 6)}
                  >
                    View more
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="meta">No stories in this topic yet.</p>
          )}
        </section>
      </div>

      {/* Student Achievements Band */}
      <div className="band" id="ach">
        <div className="wrap">
          <div className="sh">
            <h2>Student achievements</h2>
            <span className="meta">Achievements and awards appear only when verified.</span>
          </div>
          <div className="grid4">
            {achievements.map(([cat, title, theme]) => (
              <article key={title} className="card">
                <Link href="/submit" className={`art a-${theme}`} aria-label={title}>
                  <ArtIllustration theme={theme} label={title} />
                </Link>
                <span className="cat">{cat}</span>{" "}
                <span className="tg B">Format template</span>
                <Link href="/submit">
                  <h3>{title}</h3>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* Scholarships and Opportunities */}
      <div className="wrap">
        <section id="opps" aria-labelledby="h-o">
          <div className="sh">
            <h2 id="h-o">Scholarships and opportunities</h2>
            <Link href="/opportunities">View all opportunities</Link>
          </div>
          <div className="op">
            <div className="og2">
              {opportunities.map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </div>
            <aside className="vl" aria-label="Verified listing format">
              <span className="cat">Editorial verification standard</span>
              <h3>How a verified listing is checked</h3>
              <dl>
                <dt>Title</dt>
                <dd>[Official opportunity name]</dd>
                <dt>Provider</dt>
                <dd>[Official provider]</dd>
                <dt>Eligibility</dt>
                <dd>[As stated by the provider]</dd>
                <dt>Deadline</dt>
                <dd>
                  {showUnverifiedPreview
                    ? "[Missing — listing held back from public]"
                    : "[Date checked against official page]"}
                </dd>
                <dt>Official link</dt>
                <dd>[Direct official URL required]</dd>
              </dl>
              <span className="vs" style={{ display: "block", marginTop: 10, fontSize: 13, fontWeight: 600 }}>
                {showUnverifiedPreview
                  ? "Status: Not yet verified. Held in draft."
                  : "Status: Verified by an editor before publication"}
              </span>
              <button
                type="button"
                className="btn line"
                style={{ marginTop: 12 }}
                aria-pressed={showUnverifiedPreview}
                onClick={() => setShowUnverifiedPreview((v) => !v)}
              >
                {showUnverifiedPreview ? "Show verified state" : "Show unverified state"}
              </button>
            </aside>
          </div>
        </section>
      </div>

      {/* Campus Organisations */}
      <div className="wrap">
        <section aria-labelledby="h-g">
          <div className="sh">
            <h2 id="h-g">Campus organisations and activities</h2>
            <Link href="/submit">Submit society report</Link>
          </div>
          <div className="og">
            {orgTiles.map(([title, desc]) => (
              <Link key={title} className="topic" href="/submit">
                <b>{title}</b>
                <span>{desc}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Student Voices */}
      <div className="band">
        <div className="wrap">
          <div className="sh">
            <h2>Student voices</h2>
            <span className="meta">
              Opinion is the writer’s view and is separate from news reporting.
            </span>
          </div>
          <div className="vg3">
            {opinionArticles.map((art) => (
              <article key={art.id} className="vo">
                <span className="cat opn">Opinion</span>{" "}
                <span className="tg B">Demo content</span>
                <Link href={getArticleUrl(art)}>
                  <h3>{art.title}</h3>
                </Link>
                <p style={{ color: "var(--mu)", fontSize: 14.5 }}>{art.summary}</p>
                <div className="meta">{art.authorName}</div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* Submit a Campus Story */}
      <div className="wrap">
        <section id="submit" aria-labelledby="h-s">
          <div className="sub">
            <div>
              <h2 id="h-s">Submit a campus story</h2>
              <p>
                Are you a student reporter, MSSN officer or graduate? Share a campus news report,
                achievement or opinion piece. Every submission is reviewed by our editors before
                anything is published.
              </p>
            </div>
            <div>
              <ol>
                <li>Send your story with a headline, institution and source links.</li>
                <li>Editors check it against our editorial policy.</li>
                <li>If approved, it is published with your byline.</li>
              </ol>
              <Link className="btn gold" href="/submit" style={{ marginTop: 14 }}>
                Submit a campus story
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
