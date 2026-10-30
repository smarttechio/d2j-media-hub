import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPublishedScholarAnswerBySlug,
  getPublishedScholarAnswers,
} from "@/lib/db";
import { ShareRow } from "@/components/CategoryListingClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const qa = getPublishedScholarAnswerBySlug(slug);
  if (!qa) return { title: "Q&A Not Found" };
  return {
    title: qa.subject,
    description: qa.publicQuestionSummary || qa.questionText,
  };
}

export default async function ScholarAnswerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const qa = getPublishedScholarAnswerBySlug(slug);
  if (!qa) notFound();

  const related = getPublishedScholarAnswers()
    .filter((q) => q.id !== qa.id)
    .slice(0, 3);

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
          <li aria-current="page">{qa.subject}</li>
        </ol>
      </nav>

      <article className="ah">
        <span className="cat">{qa.topic}</span>{" "}
        <span className="cat opn">Question and answer</span>{" "}
        {qa.isDemo && <span className="tg B">Demo content</span>}
        <h1>{qa.subject}</h1>
        <div className="by">
          <span className="av">?</span>
          <div>
            <b>Reviewer: {qa.scholarReviewerName || "[Name and verified credentials]"}</b>
            {qa.scholarCredentials || "Shown only when supplied and verified."}
          </div>
          <div>
            Published <time>{qa.publishedAt}</time>
            <br />
            Reviewed <time>{qa.reviewedAt}</time>
          </div>
          <ShareRow title={qa.subject} />
        </div>
      </article>

      <div className="bd">
        <h2 style={{ marginTop: 28 }}>The question</h2>
        <p className="upd" style={{ fontSize: 16 }}>
          {qa.questionText}
        </p>

        <h2>The response</h2>
        {qa.isDemo && (
          <p className="upd">
            <b>Placeholder response, not a ruling.</b> Reviewed scholarly content will replace this
            text. This demonstration record contains no real fatwa, verse, Hadith or citation.
          </p>
        )}
        {(qa.answerText || []).map((p, i) => (
          <p key={i}>{p}</p>
        ))}

        <h2>References</h2>
        <ol className="refs">
          {(qa.references || ["[References checked by the reviewer]"]).map((ref, idx) => (
            <li key={idx}>{ref}</li>
          ))}
        </ol>

        <h2>Editorial review</h2>
        <dl>
          <dt>Approved by</dt>
          <dd>{qa.editorApproverName || "[Editor name, date]"}</dd>
          <dt>Scholarly review</dt>
          <dd>{qa.scholarReviewerName || "[Reviewer name, date]"}</dd>
          <dt>Corrections</dt>
          <dd>None. A dated note appears here if the answer is updated.</dd>
        </dl>

        <p className="meta" style={{ fontSize: 13.5, lineHeight: 1.5 }}>
          General educational guidance. It does not replace advice on your personal situation.{" "}
          <Link href="/contact?enquiry=Report+a+Correction" style={{ textDecoration: "underline" }}>
            Report an issue with this answer
          </Link>
        </p>
      </div>

      <section className="rel">
        <div className="sh">
          <h2>Related questions</h2>
          <Link href="/ask-a-scholar/answers">All questions</Link>
        </div>
        <div>
          {related.map((r) => (
            <article key={r.id} className="qi">
              <div>
                <span className="cat" style={{ margin: 0 }}>
                  {r.topic}
                </span>
                <h3>
                  <Link href={`/ask-a-scholar/answers/${r.slug}`}>{r.subject}</Link>
                </h3>
                <p>{r.publicQuestionSummary}</p>
              </div>
              <Link className="btn line" href={`/ask-a-scholar/answers/${r.slug}`}>
                Read full answer
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="sub">
          <div>
            <h2>Have your own question?</h2>
            <p>
              Submit it for editorial and scholarly review. We cannot promise an answer to every
              question.
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
