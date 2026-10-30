"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Article, ScholarQuestion } from "@/lib/db";
import { ArticleCard, SmallArticleCard } from "@/components/ArticleCards";

const ISLAM_TOPICS = [
  "All",
  "Qur’an and Tafsir",
  "Hadith and Sunnah",
  "Islamic History",
  "Faith and Spirituality",
  "Worship and Daily Practice",
  "Character and Ethics",
  "Family and Society",
];

export function IslamClient({
  articles,
  publishedAnswers,
}: {
  articles: Article[];
  publishedAnswers: ScholarQuestion[];
}) {
  const [selectedTopic, setSelectedTopic] = useState("All");

  const leadArticle = articles[0];
  const sideArticles = articles.slice(1, 4);

  const filtered =
    selectedTopic === "All"
      ? articles
      : articles.filter((a) =>
          a.tags.some((t) => t.toLowerCase() === selectedTopic.toLowerCase())
        );

  const resources = [
    ["Study guides", "Structured reading plans for students.", "Phase 1"],
    ["Published Q&A", "Reviewed responses from qualified scholars.", "Phase 1"],
    ["Book & course notes", "Summaries of reliable classical and modern works.", "Phase 1"],
    ["Audio & video reminders", "Short lectures and campus reminders.", "Phase 2"],
  ];

  return (
    <>
      <div className="wrap">
        <nav className="bc" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li aria-current="page">Islamic Knowledge</li>
          </ol>
        </nav>

        <div className="ph">
          <h1>Islamic Knowledge</h1>
          <p>
            Educational articles, study guides and reflections for Muslim students and young
            people. Reviewer names and credentials appear only once verified.
          </p>
        </div>

        <div className="chh">
          {leadArticle && <ArticleCard article={leadArticle} isLead showSummary />}
          <div>
            {sideArticles.map((art) => (
              <SmallArticleCard key={art.id} article={art} />
            ))}
          </div>
        </div>
      </div>

      {/* Topic Nav */}
      <div className="tn">
        <div className="wrap">
          <div className="tf" role="group" aria-label="Islamic Knowledge topics">
            {ISLAM_TOPICS.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={selectedTopic === t}
                onClick={() => setSelectedTopic(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="wrap">
        <section aria-labelledby="h-ka">
          <div className="sh">
            <h2 id="h-ka">Knowledge articles</h2>
            <span className="meta">{filtered.length} articles</span>
          </div>
          {filtered.length > 0 ? (
            <div className="grid3">
              {filtered.map((art) => (
                <ArticleCard key={art.id} article={art} showSummary />
              ))}
            </div>
          ) : (
            <div className="msg">
              <h2>No articles in this topic yet</h2>
              <p>Only reviewed and approved educational articles are published here.</p>
            </div>
          )}
        </section>
      </div>

      {/* Learning Resources */}
      <div className="band">
        <div className="wrap">
          <div className="sh">
            <h2>Learning resources</h2>
            <span className="meta">Structured resources for students and young people.</span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            {resources.map(([title, desc, badge]) => (
              <div
                key={title}
                style={{
                  background: "var(--wh)",
                  border: "1px solid var(--bd)",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <b style={{ font: "600 18px var(--hf)", display: "block", marginBottom: 4 }}>
                  {title}
                </b>
                <p style={{ margin: "0 0 8px", fontSize: 14, color: "var(--mu)" }}>{desc}</p>
                <span className="tagd">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Published Q&A Preview */}
      <div className="wrap">
        <section aria-labelledby="h-pq">
          <div className="sh">
            <h2 id="h-pq">Published questions and answers</h2>
            <Link href="/ask-a-scholar/answers">View all Q&amp;A</Link>
          </div>
          <div>
            {publishedAnswers.map((qa) => (
              <article key={qa.id} className="qi">
                <div>
                  <span className="cat" style={{ margin: 0 }}>
                    {qa.topic}
                  </span>{" "}
                  {qa.isDemo && <span className="tg B">Demo content</span>}
                  <h3>
                    <Link href={`/ask-a-scholar/answers/${qa.slug}`}>{qa.subject}</Link>
                  </h3>
                  <p>{qa.publicQuestionSummary}</p>
                </div>
                <Link className="btn line" href={`/ask-a-scholar/answers/${qa.slug}`}>
                  Read full answer
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* Ask a Scholar CTA */}
        <section aria-labelledby="h-q" style={{ paddingTop: 0 }}>
          <div className="sub">
            <div>
              <h2 id="h-q">Have a Question About Islam?</h2>
              <p>
                Submit your question for review by the editorial team and an appropriately
                qualified scholar.
              </p>
              <p style={{ marginTop: 8 }}>
                We cannot promise a reply, or publication, for every question.
              </p>
            </div>
            <div>
              <Link className="btn gold" href="/ask-a-scholar">
                Ask a Scholar
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
