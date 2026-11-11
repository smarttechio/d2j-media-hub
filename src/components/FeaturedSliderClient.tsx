"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import type { Article } from "@/lib/db";
import {
  getArticleUrl,
  VerificationBadge,
  getArticleMetaText,
} from "./ArticleCards";
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

export function FeaturedStoriesCarousel({
  articles,
  autoPlayMs = 6000,
}: {
  articles: Article[];
  autoPlayMs?: number;
}) {
  const slides = articles.slice(0, 5);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const count = slides.length;

  const nextSlide = useCallback(() => {
    if (count <= 1) return;
    setActiveIndex((prev) => (prev + 1) % count);
  }, [count]);

  const prevSlide = useCallback(() => {
    if (count <= 1) return;
    setActiveIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    if (isPaused || count <= 1) return;
    const timer = setInterval(nextSlide, autoPlayMs);
    return () => clearInterval(timer);
  }, [isPaused, count, autoPlayMs, nextSlide]);

  if (count === 0) return null;

  const current = slides[activeIndex] || slides[0];
  const url = getArticleUrl(current);
  const catLabel = CATEGORY_NAMES[current.category] || current.category;
  const isOpinion =
    current.category === "opinion" || current.tags.includes("Student Voices");

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 45) {
      if (deltaX < 0) nextSlide();
      else prevSlide();
    }
    touchStartX.current = null;
  };

  return (
    <div
      className="d2j-carousel-wrap"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured stories carousel"
    >
      <article className="lead card" style={{ position: "relative" }}>
        <div style={{ position: "relative" }}>
          <Link
            href={url}
            className={`art a-${current.artTheme}`}
            aria-label={`Read: ${current.title}`}
            style={{ display: "block", position: "relative", overflow: "hidden" }}
          >
            <ArtIllustration
              theme={current.artTheme}
              featuredImage={current.featuredImage}
              featuredVideo={current.featuredVideo}
              label={`Illustration for: ${current.title}`}
            />
          </Link>

          {count > 1 && (
            <>
              {/* Top-left slide counter pill */}
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  background: "rgba(13, 59, 46, 0.88)",
                  color: "#fff",
                  fontSize: "0.73rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  padding: "4px 10px",
                  borderRadius: 999,
                  backdropFilter: "blur(4px)",
                  pointerEvents: "none",
                  zIndex: 3,
                }}
              >
                FEATURED {activeIndex + 1} / {count}
              </div>

              {/* Prev / Next Overlay Controls */}
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous featured story"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 10,
                  transform: "translateY(-50%)",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.35)",
                  background: "rgba(15, 23, 42, 0.72)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  lineHeight: 1,
                  zIndex: 3,
                  transition: "background 0.15s ease",
                }}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next featured story"
                style={{
                  position: "absolute",
                  top: "50%",
                  right: 10,
                  transform: "translateY(-50%)",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.35)",
                  background: "rgba(15, 23, 42, 0.72)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  lineHeight: 1,
                  zIndex: 3,
                  transition: "background 0.15s ease",
                }}
              >
                ›
              </button>
            </>
          )}
        </div>

        <div style={{ marginTop: 10 }}>
          <span className={isOpinion ? "cat opn" : "cat"}>
            {`Featured · ${catLabel}`}
          </span>{" "}
          <VerificationBadge type={current.verification} />
        </div>

        <Link href={url}>
          <h3>{current.title}</h3>
        </Link>
        <p>{current.summary}</p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            marginTop: 6,
          }}
        >
          <div className="meta">{getArticleMetaText(current)}</div>

          {count > 1 && (
            <div
              role="tablist"
              aria-label="Choose featured slide"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              {slides.map((item, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Slide ${idx + 1}: ${item.title}`}
                    onClick={() => setActiveIndex(idx)}
                    style={{
                      width: isActive ? 22 : 8,
                      height: 8,
                      borderRadius: 999,
                      border: "none",
                      padding: 0,
                      background: isActive ? "#0d3b2e" : "#cbd5e1",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

export interface SliderPhotoItem {
  url: string;
  caption: string;
}

export function ArticlePhotoCarousel({
  photos,
  title,
}: {
  photos: SliderPhotoItem[];
  title: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const count = photos.length;

  const nextPhoto = useCallback(() => {
    if (count <= 1) return;
    setActiveIdx((prev) => (prev + 1) % count);
  }, [count]);

  const prevPhoto = useCallback(() => {
    if (count <= 1) return;
    setActiveIdx((prev) => (prev - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    if (isPaused || count <= 1) return;
    const timer = setInterval(nextPhoto, 5500);
    return () => clearInterval(timer);
  }, [isPaused, count, nextPhoto]);

  if (count <= 1) return null;

  const current = photos[activeIdx] || photos[0];

  return (
    <section
      aria-label={`Photo gallery slider for ${title}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(deltaX) > 40) {
          if (deltaX < 0) nextPhoto();
          else prevPhoto();
        }
        touchStartX.current = null;
      }}
      style={{
        margin: "24px 0",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        overflow: "hidden",
        background: "#0f172a",
        color: "#f8fafc",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          background: "#0d3b2e",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          fontSize: "0.8rem",
          fontWeight: 600,
        }}
      >
        <span>📸 Story Photo Highlights</span>
        <span>
          Photo {activeIdx + 1} of {count}
        </span>
      </div>

      <div style={{ position: "relative", background: "#090d16" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.caption || title}
          style={{
            width: "100%",
            maxHeight: 460,
            objectFit: "cover",
            display: "block",
          }}
        />

        <button
          type="button"
          onClick={prevPhoto}
          aria-label="Previous photo"
          style={{
            position: "absolute",
            top: "50%",
            left: 12,
            transform: "translateY(-50%)",
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.4)",
            background: "rgba(15, 23, 42, 0.75)",
            color: "#fff",
            fontSize: "1.25rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ‹
        </button>

        <button
          type="button"
          onClick={nextPhoto}
          aria-label="Next photo"
          style={{
            position: "absolute",
            top: "50%",
            right: 12,
            transform: "translateY(-50%)",
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.4)",
            background: "rgba(15, 23, 42, 0.75)",
            color: "#fff",
            fontSize: "1.25rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ›
        </button>
      </div>

      <div style={{ padding: "12px 16px", background: "#1e293b" }}>
        <p
          style={{
            margin: 0,
            fontSize: "0.88rem",
            lineHeight: 1.5,
            color: "#f1f5f9",
          }}
        >
          {current.caption || title}
        </p>

        {/* Thumbnail strip */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 10,
            overflowX: "auto",
            paddingBottom: 4,
          }}
        >
          {photos.map((p, idx) => (
            <button
              key={`${p.url}-${idx}`}
              type="button"
              onClick={() => setActiveIdx(idx)}
              aria-label={`View photo ${idx + 1}`}
              style={{
                border:
                  idx === activeIdx
                    ? "2px solid #f59e0b"
                    : "2px solid transparent",
                borderRadius: 6,
                padding: 0,
                overflow: "hidden",
                width: 64,
                height: 44,
                flexShrink: 0,
                cursor: "pointer",
                opacity: idx === activeIdx ? 1 : 0.6,
                background: "#0f172a",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
