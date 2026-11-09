"use client";

import React, { useState } from "react";
import type { ArticleComment } from "@/lib/db";

export function ArticleCommentsClient({
  articleId,
  articleSlug,
  initialComments,
}: {
  articleId: string;
  articleSlug: string;
  initialComments: Omit<ArticleComment, "authorEmail">[];
}) {
  const [comments, setComments] = useState<Omit<ArticleComment, "authorEmail">[]>(initialComments);
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [locationOrCampus, setLocationOrCampus] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (authorName.trim().length < 2) {
      setErrorMsg("Please enter your name (at least 2 characters).");
      return;
    }
    if (content.trim().length < 5) {
      setErrorMsg("Please write a comment of at least 5 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          articleSlug,
          authorName: authorName.trim(),
          authorEmail: authorEmail.trim(),
          locationOrCampus: locationOrCampus.trim(),
          content: content.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "Unable to post comment right now.");
      } else {
        setComments((prev) => [data.comment, ...prev]);
        setContent("");
        setSuccessMsg("Jazakallahu Khayran! Your comment has been published below.");
      }
    } catch {
      setErrorMsg("Network error while posting comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      aria-labelledby="comments-heading"
      style={{
        marginTop: 34,
        paddingTop: 26,
        borderTop: "2px solid var(--g)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <h2 id="comments-heading" style={{ margin: 0, font: "700 26px/1.2 var(--hf)" }}>
          Reader Comments ({comments.length})
        </h2>
        <span className="meta">
          Respectful, constructive discussion aligned with D2J community standards
        </span>
      </div>

      {/* Comment Submission Form */}
      <form
        onSubmit={handleSubmit}
        className="card"
        style={{
          padding: 20,
          marginBottom: 24,
          background: "var(--wh)",
          borderLeft: "4px solid var(--gold)",
        }}
      >
        <h3 style={{ margin: "0 0 12px", font: "700 19px var(--hf)" }}>
          Join the Conversation
        </h3>

        {errorMsg && (
          <div className="pnl er" style={{ marginBottom: 14, padding: "10px 14px", fontSize: 14 }}>
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div
            className="pnl"
            style={{
              marginBottom: 14,
              padding: "10px 14px",
              fontSize: 14,
              borderColor: "var(--g)",
            }}
          >
            {successMsg}
          </div>
        )}

        <div className="two" style={{ marginBottom: 12 }}>
          <div className="fld" style={{ marginBottom: 0 }}>
            <label htmlFor="cmt-name">Your Name *</label>
            <input
              id="cmt-name"
              type="text"
              required
              placeholder="e.g. Ibrahim Musa"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
            />
          </div>
          <div className="fld" style={{ marginBottom: 0 }}>
            <label htmlFor="cmt-campus">
              Campus / City <span className="h">(optional)</span>
            </label>
            <input
              id="cmt-campus"
              type="text"
              placeholder="e.g. UNILAG, ABU Zaria, Lagos"
              value={locationOrCampus}
              onChange={(e) => setLocationOrCampus(e.target.value)}
            />
          </div>
        </div>

        <div className="fld" style={{ marginBottom: 12 }}>
          <label htmlFor="cmt-email">
            Email Address <span className="h">(optional — never displayed publicly)</span>
          </label>
          <input
            id="cmt-email"
            type="email"
            placeholder="you@example.com"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
          />
        </div>

        <div className="fld" style={{ marginBottom: 14 }}>
          <label htmlFor="cmt-body">Your Comment *</label>
          <textarea
            id="cmt-body"
            rows={4}
            required
            placeholder="Share your thoughts, reflections, or additional campus context on this report..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ minHeight: 100 }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <span className="meta" style={{ fontSize: 12.5 }}>
            Comments are moderated under the D2J Editorial &amp; Community Policy.
          </span>
          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? "Posting Comment..." : "Post Comment"}
          </button>
        </div>
      </form>

      {/* Comments List */}
      {comments.length === 0 ? (
        <div
          className="card"
          style={{
            padding: 20,
            textAlign: "center",
            color: "var(--mu)",
            fontSize: 15,
          }}
        >
          No comments yet. Be the first reader to share your thoughts on this story.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {comments.map((cmt) => {
            const initials = cmt.authorName
              .split(/\s+/)
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            const dateStr = cmt.createdAt ? cmt.createdAt.slice(0, 10) : "";

            return (
              <div
                key={cmt.id}
                className="card"
                style={{
                  padding: "16px 18px",
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                }}
              >
                <span
                  className="av"
                  style={{ width: 38, height: 38, fontSize: 14, flexShrink: 0 }}
                >
                  {initials || "R"}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <strong style={{ fontSize: 15.5, color: "var(--c)" }}>
                      {cmt.authorName}
                    </strong>
                    {cmt.locationOrCampus && (
                      <span className="tagd" style={{ marginTop: 0 }}>
                        {cmt.locationOrCampus}
                      </span>
                    )}
                    <span className="meta" style={{ fontSize: 12.5, marginLeft: "auto" }}>
                      {dateStr}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 15.5,
                      lineHeight: 1.6,
                      color: "var(--c)",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {cmt.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
