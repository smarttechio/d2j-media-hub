"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Article } from "@/lib/db";
import {
  ArticleCard,
  VerificationBadge,
  getArticleMetaText,
  getArticleUrl,
} from "./ArticleCards";
import { ArtIllustration } from "./SvgSprite";

export function CategoryListingClient({
  categoryName,
  categoryDescription,
  articles,
  initialTopic = "All",
  customTopics,
}: {
  categorySlug: string;
  categoryName: string;
  categoryDescription: string;
  articles: Article[];
  initialTopic?: string;
  customTopics?: string[];
}) {
  const [selectedTopic, setSelectedTopic] = useState(initialTopic);
  const [visibleCount, setVisibleCount] = useState(9);

  const allTopics = React.useMemo(() => {
    if (customTopics && customTopics.length > 0) return customTopics;
    const set = new Set<string>(["All"]);
    articles.forEach((a) => a.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [articles, customTopics]);

  const filtered = React.useMemo(() => {
    if (selectedTopic === "All") return articles;
    return articles.filter((a) =>
      a.tags.some((t) => t.toLowerCase() === selectedTopic.toLowerCase())
    );
  }, [articles, selectedTopic]);

  const featured = articles[0];
  const listItems = selectedTopic === "All" ? filtered.slice(1) : filtered;

  return (
    <div className="wrap">
      <nav className="bc" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li aria-current="page">{categoryName}</li>
        </ol>
      </nav>

      <div className="ph">
        <h1>{categoryName}</h1>
        <p>{categoryDescription}</p>
      </div>

      {allTopics.length > 1 && (
        <div className="tf" role="group" aria-label="Filter by topic">
          {allTopics.map((topic) => (
            <button
              key={topic}
              type="button"
              aria-pressed={selectedTopic === topic}
              onClick={() => {
                setSelectedTopic(topic);
                setVisibleCount(9);
              }}
            >
              {topic}
            </button>
          ))}
        </div>
      )}

      {selectedTopic === "All" && featured && (
        <div
          className="cols2"
          style={{ alignItems: "center", padding: "26px 0", borderBottom: "1px solid var(--bd)" }}
        >
          <div>
            <Link
              href={getArticleUrl(featured)}
              className={`art a-${featured.artTheme}`}
              aria-label={`Read: ${featured.title}`}
            >
              <ArtIllustration
                theme={featured.artTheme}
                featuredImage={featured.featuredImage}
                label={featured.title}
              />
            </Link>
          </div>
          <div>
            <span className="cat">Featured · {categoryName}</span>{" "}
            <VerificationBadge type={featured.verification} />
            <Link href={getArticleUrl(featured)}>
              <h2 style={{ font: "700 32px/1.15 var(--hf)", margin: "8px 0 10px" }}>
                {featured.title}
              </h2>
            </Link>
            <p style={{ color: "var(--mu)", fontSize: 16.5, margin: "0 0 10px" }}>
              {featured.summary}
            </p>
            <div className="meta" style={{ marginBottom: 12 }}>
              {getArticleMetaText(featured)}
            </div>
            <Link className="btn" href={getArticleUrl(featured)}>
              Read the story
            </Link>
          </div>
        </div>
      )}

      <div style={{ paddingTop: 26 }}>
        <div className="sh">
          <h2>
            {selectedTopic === "All" ? `Latest in ${categoryName}` : `Topic: ${selectedTopic}`}
          </h2>
          <span className="meta" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "story" : "stories"}
          </span>
        </div>

        {listItems.length > 0 ? (
          <>
            <div className="grid3">
              {listItems.slice(0, visibleCount).map((art) => (
                <ArticleCard key={art.id} article={art} showSummary />
              ))}
            </div>
            {listItems.length > visibleCount ? (
              <div className="more">
                <p>
                  Showing {visibleCount} of {listItems.length} stories
                </p>
                <button
                  type="button"
                  className="btn line"
                  onClick={() => setVisibleCount((c) => c + 6)}
                >
                  Load more stories
                </button>
              </div>
            ) : (
              <p className="meta" style={{ textAlign: "center", padding: 20 }}>
                Showing all {filtered.length} {filtered.length === 1 ? "story" : "stories"}
              </p>
            )}
          </>
        ) : (
          <div className="msg">
            <h2>Nothing published in this topic yet</h2>
            <p>We publish only verified reporting and clearly labelled demo content.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ShareRow({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "https://d2jmediahub.com";
  const encUrl = encodeURIComponent(url);
  const encTitle = encodeURIComponent(title);

  function copyLink() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      });
    }
  }

  return (
    <div className="shr">
      <a
        className="wa"
        target="_blank"
        rel="noopener noreferrer"
        href={`https://wa.me/?text=${encTitle}%20${encUrl}`}
      >
        WhatsApp
      </a>
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={`https://www.facebook.com/sharer/sharer.php?u=${encUrl}`}
      >
        Facebook
      </a>
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={`https://twitter.com/intent/tweet?text=${encTitle}&url=${encUrl}`}
      >
        X
      </a>
      <button type="button" onClick={copyLink}>
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
