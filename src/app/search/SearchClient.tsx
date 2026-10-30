"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Article, Opportunity, ScholarQuestion, Category } from "@/lib/db";
import { getArticleUrl } from "@/components/ArticleCards";
import { ArtIllustration } from "@/components/SvgSprite";

interface SearchResultItem {
  id: string;
  group: "Articles" | "Opportunities" | "Q&A";
  typeLabel: string;
  title: string;
  excerpt: string;
  url: string;
  artTheme: Article["artTheme"];
  featuredImage?: string;
}

export function SearchClient({
  initialQuery,
  articles,
  opportunities,
  qas,
  categories,
}: {
  initialQuery: string;
  articles: Article[];
  opportunities: Opportunity[];
  qas: ScholarQuestion[];
  categories: Category[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<"All" | "Articles" | "Opportunities" | "Q&A">(
    "All"
  );
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    setQuery(initialQuery);
    setSubmittedQuery(initialQuery);
    setSelectedGroup("All");
    setVisibleCount(6);
  }, [initialQuery]);

  const catMap = React.useMemo(() => {
    const m: Record<string, string> = {};
    categories.forEach((c) => {
      m[c.slug] = c.name;
    });
    return m;
  }, [categories]);

  const allItems: SearchResultItem[] = React.useMemo(() => {
    const items: SearchResultItem[] = [];
    articles.forEach((a) => {
      items.push({
        id: `art-${a.id}`,
        group: "Articles",
        typeLabel: catMap[a.category] || a.category,
        title: a.title,
        excerpt: `${a.summary} (${a.tags.join(", ")})`,
        url: getArticleUrl(a),
        artTheme: a.artTheme,
        featuredImage: a.featuredImage,
      });
    });
    opportunities.forEach((o) => {
      items.push({
        id: `opp-${o.id}`,
        group: "Opportunities",
        typeLabel: `Opportunity · ${o.openClosedStatus}`,
        title: o.title,
        excerpt: `${o.summary} — Provider: ${o.provider}`,
        url: `/opportunities/${o.slug}`,
        artTheme: "library",
      });
    });
    qas.forEach((q) => {
      items.push({
        id: `qa-${q.id}`,
        group: "Q&A",
        typeLabel: `Published Q&A · ${q.topic}`,
        title: q.subject,
        excerpt: q.publicQuestionSummary || q.questionText,
        url: `/ask-a-scholar/answers/${q.slug}`,
        artTheme: "quran",
      });
    });
    return items;
  }, [articles, opportunities, qas, catMap]);

  const matchedResults = React.useMemo(() => {
    const q = submittedQuery.trim().toLowerCase();
    if (!q) return [];
    const tokens = q.split(/\s+/).filter(Boolean);
    return allItems.filter((item) => {
      const hay = `${item.title} ${item.excerpt} ${item.typeLabel}`.toLowerCase();
      return tokens.every((tk) => hay.includes(tk));
    });
  }, [allItems, submittedQuery]);

  const counts = {
    All: matchedResults.length,
    Articles: matchedResults.filter((r) => r.group === "Articles").length,
    Opportunities: matchedResults.filter((r) => r.group === "Opportunities").length,
    "Q&A": matchedResults.filter((r) => r.group === "Q&A").length,
  };

  const filteredResults =
    selectedGroup === "All"
      ? matchedResults
      : matchedResults.filter((r) => r.group === selectedGroup);

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = query.trim();
    if (!v) {
      setErrorMsg("Enter a search term, for example “scholarship”.");
      return;
    }
    setErrorMsg("");
    setSubmittedQuery(v);
    router.push(`/search?q=${encodeURIComponent(v)}`);
  }

  return (
    <div className="wrap">
      <nav className="bc" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li aria-current="page">Search</li>
        </ol>
      </nav>

      <div className="ph">
        <h1>{submittedQuery ? "Search Results" : "Search"}</h1>
        <p>
          {submittedQuery
            ? `Search results for “${submittedQuery}”`
            : "Search news, campus stories, Islamic knowledge, published answers and opportunities."}
        </p>
      </div>

      <form className="sqf" role="search" onSubmit={handleFormSubmit} noValidate>
        <label htmlFor="pq" className="sr">
          Search
        </label>
        <input
          id="pq"
          type="search"
          autoComplete="off"
          aria-describedby="pe"
          aria-invalid={!!errorMsg}
          placeholder="Search news, campus, Islamic knowledge, opportunities…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn" type="submit">
          Search
        </button>
        {submittedQuery && (
          <button
            className="btn line"
            type="button"
            onClick={() => {
              setQuery("");
              setSubmittedQuery("");
              setErrorMsg("");
              router.push("/search");
            }}
          >
            Clear search
          </button>
        )}
      </form>
      {errorMsg && (
        <p className="pe" id="pe" role="alert">
          {errorMsg}
        </p>
      )}

      {submittedQuery ? (
        matchedResults.length > 0 ? (
          <>
            <p className="meta" role="status" style={{ marginTop: 14 }}>
              {filteredResults.length} {filteredResults.length === 1 ? "result" : "results"}.
              Searches published public content only. Unpublished drafts and private submissions
              are never searchable.
            </p>
            <div
              className="tf"
              role="group"
              aria-label="Filter by content type"
              style={{ marginTop: 10 }}
            >
              {(["All", "Articles", "Opportunities", "Q&A"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={selectedGroup === g}
                  onClick={() => {
                    setSelectedGroup(g);
                    setVisibleCount(6);
                  }}
                >
                  {g} ({counts[g]})
                </button>
              ))}
            </div>

            <div>
              {filteredResults.slice(0, visibleCount).map((res) => (
                <article key={res.id} className="rc">
                  <Link href={res.url} className={`art a-${res.artTheme}`} aria-hidden="true">
                    <ArtIllustration
                      theme={res.artTheme}
                      featuredImage={res.featuredImage}
                      hideBadge
                    />
                  </Link>
                  <div>
                    <span className="cat" style={{ margin: 0 }}>
                      {res.typeLabel}
                    </span>
                    <h3>
                      <Link href={res.url}>{res.title}</Link>
                    </h3>
                    <p>{res.excerpt.slice(0, 190)}</p>
                  </div>
                </article>
              ))}
            </div>

            {filteredResults.length > visibleCount && (
              <div className="more">
                <button
                  type="button"
                  className="btn line"
                  onClick={() => setVisibleCount((c) => c + 6)}
                >
                  Load more
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="msg" style={{ marginTop: 20 }}>
            <h2>No results found for your search.</h2>
            <p>
              Check the spelling or try fewer words. You can also browse a topic from the sections
              below.
            </p>
          </div>
        )
      ) : (
        <div style={{ marginTop: 18 }}>
          <p className="meta">Try searching for:</p>
          <div className="sg">
            {["MSSN", "scholarship", "Qur’an", "career", "JAMB", "Chevening"].map((term) => (
              <button
                key={term}
                type="button"
                className="sv"
                onClick={() => {
                  setQuery(term);
                  setSubmittedQuery(term);
                  router.push(`/search?q=${encodeURIComponent(term)}`);
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Browse by Topic Discovery */}
      <section aria-labelledby="h-browse">
        <div className="sh">
          <h2 id="h-browse">Browse by section</h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 14,
          }}
        >
          {categories.slice(0, 8).map((c) => (
            <Link
              key={c.slug}
              className="topic"
              href={
                c.slug === "campus"
                  ? "/campus"
                  : c.slug === "islam"
                  ? "/islam"
                  : c.slug === "education"
                  ? "/education"
                  : `/news/${c.slug}`
              }
            >
              <b>{c.name}</b>
              <span>{c.description.slice(0, 85)}…</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
