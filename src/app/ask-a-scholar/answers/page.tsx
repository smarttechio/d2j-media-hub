import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedScholarAnswers } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Published Scholarly Questions and Answers",
  description:
    "Archive of reviewed questions and scholarly responses published by D2J Media Hub.",
};

export default function PublishedAnswersListPage() {
  const answers = getPublishedScholarAnswers();

  return (
    <div className="wrap">
      <nav className="bc" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/ask-a-scholar">Ask a Scholar</Link>
          </li>
          <li aria-current="page">Published Answers</li>
        </ol>
      </nav>

      <div className="ph">
        <h1>Published Questions and Answers</h1>
        <p>
          Every item here has passed editorial screening and review by an appropriately qualified
          scholar before publication. Personal contact details are never displayed.
        </p>
      </div>

      <div>
        {answers.map((qa) => (
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

      <section>
        <div className="sub">
          <div>
            <h2>Have your own question?</h2>
            <p>
              Submit it privately for editorial and scholarly review. We cannot promise an answer
              to every question.
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
  );
}
