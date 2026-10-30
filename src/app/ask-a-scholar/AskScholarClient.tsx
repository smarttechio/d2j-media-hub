"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ScholarQuestion } from "@/lib/db";

const TOPICS = [
  "Qur’an and Tafsir",
  "Hadith and Sunnah",
  "Islamic History",
  "Faith and Spirituality",
  "Worship and Daily Practice",
  "Character and Ethics",
  "Family and Society",
];

export function AskScholarClient({
  publishedAnswers,
}: {
  publishedAnswers: ScholarQuestion[];
}) {
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [anonymousPreference, setAnonymousPreference] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [filterTopic, setFilterTopic] = useState("All");

  function validate() {
    const errs: Record<string, string> = {};
    if (!topic) errs.topic = "Choose a topic.";
    if (!subject.trim()) errs.subject = "Enter a short subject.";
    if (!questionText.trim()) {
      errs.questionText = "Enter your question.";
    } else if (questionText.trim().length < 20) {
      errs.questionText = "Add a little more detail: at least 20 characters.";
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      errs.email = "Enter a valid email address, for example name@example.com.";
    }
    if (!consentGiven) {
      errs.consent = "Confirm you understand how review works.";
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStatus("submitting");
    try {
      const res = await fetch("/api/ask-scholar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          subject: subject.trim(),
          questionText: questionText.trim(),
          displayName: displayName.trim(),
          email: email.trim(),
          anonymousPreference,
          consentGiven,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  function resetForm() {
    setTopic("");
    setSubject("");
    setQuestionText("");
    setDisplayName("");
    setEmail("");
    setAnonymousPreference(false);
    setConsentGiven(false);
    setErrors({});
    setStatus("idle");
  }

  const filteredAnswers =
    filterTopic === "All"
      ? publishedAnswers
      : publishedAnswers.filter((q) => q.topic === filterTopic);

  return (
    <div className="wrap">
      <nav className="bc" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/islam">Islamic Knowledge</Link>
          </li>
          <li aria-current="page">Ask a Scholar</li>
        </ol>
      </nav>

      <div className="ph">
        <h1>Ask a Scholar</h1>
        <p>
          Send a question about Islam for review by our editorial team and an appropriately
          qualified scholar. Questions are reviewed before anything is answered or published. We
          cannot promise an immediate response, or an answer to every question.
        </p>
      </div>

      <div className="two" style={{ marginBottom: 26 }}>
        <div className="pv">
          <h3>Questions we can review</h3>
          <ul>
            <li>Learning questions about beliefs, worship, character and study</li>
            <li>Questions about reliable books, courses and sources</li>
            <li>Questions on family, community and daily life in general terms</li>
          </ul>
        </div>
        <div className="pv">
          <h3>Please do not send</h3>
          <ul>
            <li>Emergencies or urgent safety concerns</li>
            <li>Legal, medical or mental-health advice</li>
            <li>Private disputes or details about other people</li>
          </ul>
          <p>
            For a complex personal situation, speak with a qualified scholar you trust in person.
          </p>
        </div>
      </div>

      <div className="sh">
        <h2>How review works</h2>
      </div>
      <ol className="steps">
        <li>Submit a question</li>
        <li>Editorial review</li>
        <li>Qualified scholarly review</li>
        <li>Answer prepared and approved</li>
        <li>Publication where appropriate</li>
      </ol>
      <p className="meta" style={{ marginTop: 10 }}>
        Not every question will receive a published answer. Questions are stored privately and
        never answered automatically by AI.
      </p>

      <section style={{ padding: "34px 0" }} aria-labelledby="h-f">
        <div className="sh">
          <h2 id="h-f">Your question</h2>
        </div>

        <div className="ask2">
          <div>
            {Object.keys(errors).length > 0 && (
              <div className="es" role="alert">
                <b>
                  Please fix {Object.keys(errors).length}{" "}
                  {Object.keys(errors).length > 1 ? "problems" : "problem"} before submitting:
                </b>
                <ul>
                  {Object.entries(errors).map(([k, msg]) => (
                    <li key={k}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}

            {status !== "success" && (
              <form id="af" onSubmit={handleSubmit} noValidate>
                <div className={`fld ${errors.topic ? "bad" : ""}`}>
                  <label htmlFor="topic">
                    Topic <span className="h">(required)</span>
                  </label>
                  <select
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    aria-invalid={!!errors.topic}
                  >
                    <option value="">Choose a topic…</option>
                    {TOPICS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {errors.topic && <p className="fe">{errors.topic}</p>}
                </div>

                <div className={`fld ${errors.subject ? "bad" : ""}`}>
                  <label htmlFor="subj">
                    Subject <span className="h">(required, a short title)</span>
                  </label>
                  <input
                    id="subj"
                    type="text"
                    maxLength={120}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    aria-invalid={!!errors.subject}
                  />
                  {errors.subject && <p className="fe">{errors.subject}</p>}
                </div>

                <div className={`fld ${errors.questionText ? "bad" : ""}`}>
                  <label htmlFor="q">
                    Your question <span className="h">(required)</span>
                  </label>
                  <textarea
                    id="q"
                    maxLength={1500}
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    aria-invalid={!!errors.questionText}
                  />
                  <p className="h">
                    {questionText.length} of 1500 characters. Please do not include other people’s
                    personal details.
                  </p>
                  {errors.questionText && <p className="fe">{errors.questionText}</p>}
                </div>

                <div className="fld">
                  <label htmlFor="nm">
                    Display name <span className="h">(optional)</span>
                  </label>
                  <input
                    id="nm"
                    type="text"
                    autoComplete="nickname"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                  <p className="h">
                    Leave blank if you prefer. A name is never published unless you agree.
                  </p>
                </div>

                <div className={`fld ${errors.email ? "bad" : ""}`}>
                  <label htmlFor="em">
                    Email <span className="h">(optional, for follow-up only)</span>
                  </label>
                  <input
                    id="em"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!errors.email}
                  />
                  <p className="h">
                    Used only if editors need to contact you. Never published.
                  </p>
                  {errors.email && <p className="fe">{errors.email}</p>}
                </div>

                <div className="chk">
                  <input
                    type="checkbox"
                    id="anon"
                    checked={anonymousPreference}
                    onChange={(e) => setAnonymousPreference(e.target.checked)}
                  />
                  <label htmlFor="anon">
                    <b>Request anonymous publication</b> if my question is selected for
                    publication.
                    <br />
                    <span className="h">
                      This is different from submitting anonymously: reviewers still see what you
                      submit. Leave name and email blank if you prefer not to share them.
                    </span>
                  </label>
                </div>

                <div className={`chk ${errors.consent ? "bad" : ""}`}>
                  <input
                    type="checkbox"
                    id="cons"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                  />
                  <label htmlFor="cons">
                    I understand my question will be reviewed by editors and a qualified scholar
                    and may not be answered or published. I have read the{" "}
                    <Link href="/privacy-policy" style={{ textDecoration: "underline" }}>
                      Privacy Policy
                    </Link>
                    . <span className="h">(required)</span>
                  </label>
                </div>
                {errors.consent && <p className="fe">{errors.consent}</p>}

                <button className="btn" type="submit" disabled={status === "submitting"}>
                  {status === "submitting" ? "Submitting…" : "Submit question"}
                </button>
              </form>
            )}

            {status === "success" && (
              <div className="pnl" role="status">
                <h3>Question received privately for review</h3>
                <p>
                  Your question has been securely saved in our private editorial screening queue. It
                  has not been published.
                </p>
                <p>
                  What happens next: editors screen the submission, then assign it to a qualified
                  scholar reviewer. Not every question receives a published answer.
                </p>
                <button type="button" className="btn line" onClick={resetForm}>
                  Submit another question
                </button>
              </div>
            )}

            {status === "error" && (
              <div className="pnl er" role="alert" style={{ marginTop: 14 }}>
                <h3>Submission error</h3>
                <p>
                  We could not submit your question. Your text is still in the form. Please try
                  again.
                </p>
              </div>
            )}
          </div>

          <aside className="pv" aria-labelledby="h-p">
            <h3 id="h-p">Privacy and consent</h3>
            <ul>
              <li>
                <b>Who reviews:</b> editorial staff, then an appropriately qualified scholar.
              </li>
              <li>
                <b>Contact details:</b> used only to follow up if needed. Never published.
              </li>
              <li>
                <b>Publication:</b> a question may be published only after approval, with personal
                details removed.
              </li>
              <li>
                <b>No AI fatwas:</b> answers are never generated automatically.
              </li>
            </ul>
            <p>
              Read the{" "}
              <Link href="/privacy-policy" style={{ textDecoration: "underline" }}>
                Privacy Policy
              </Link>
              . We collect only what is needed.
            </p>
          </aside>
        </div>
      </section>

      <section id="qa-list" aria-labelledby="h-pq">
        <div className="sh">
          <h2 id="h-pq">Published questions and answers</h2>
          <Link href="/ask-a-scholar/answers">All published Q&amp;A</Link>
        </div>
        <div className="tf" role="group" aria-label="Filter answers by topic">
          {["All", ...TOPICS].map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={filterTopic === t}
              onClick={() => setFilterTopic(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div>
          {filteredAnswers.map((qa) => (
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
    </div>
  );
}
