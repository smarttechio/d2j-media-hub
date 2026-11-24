"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function HeaderClient({
  breakingEnabled,
  breakingText,
  breakingUrl,
}: {
  breakingEnabled?: boolean;
  breakingText?: string;
  breakingUrl?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [todayStr, setTodayStr] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTodayStr(
      new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setExploreOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setExploreOpen(false);
        if (searchOpen) setSearchOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

  useEffect(() => {
    if (searchOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => searchInputRef.current?.focus(), 20);
    } else {
      document.body.style.overflow = "";
    }
  }, [searchOpen]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      setSearchError("Enter a search term, for example “scholarship”.");
      searchInputRef.current?.focus();
      return;
    }
    setSearchError("");
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function isCurrent(path: string) {
    if (path === "/" && pathname === "/") return "page";
    if (path !== "/" && pathname.startsWith(path)) return "page";
    return undefined;
  }

  return (
    <>
      <a className="skip" href="#app">
        Skip to content
      </a>
      <div className="util2">
        <div className="wrap">
          <span id="today">{todayStr || "D-Path to Jannah Media Hub"}</span>
          <nav aria-label="Quick links">
            <Link href="/ask-a-scholar">Ask a Scholar</Link>
            <Link href="/submit">Submit a Story</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/admin">Editorial Login</Link>
          </nav>
        </div>
      </div>

      <header className="hd">
        <div className="wrap hdr">
          <Link className="lgo" href="/" aria-label="D2J Media Hub, home">
            <img
              src="/logo.webp"
              alt="D2J Media Hub logo: a mosque rising from an open book with a broadcast signal. Dpath TO Jannah Media Hub. Voice in propagation of the truth"
            />
          </Link>

          <nav id="nv" className={menuOpen ? "open" : ""} aria-label="Main">
            <Link href="/" aria-current={isCurrent("/")}>
              Home
            </Link>
            <Link href="/news" aria-current={isCurrent("/news")}>
              News
            </Link>
            <Link href="/campus" aria-current={isCurrent("/campus")}>
              Campus
            </Link>
            <Link href="/islam" aria-current={isCurrent("/islam")}>
              Islam
            </Link>
            <Link href="/education" aria-current={isCurrent("/education")}>
              Education &amp; Careers
            </Link>
            <Link href="/opportunities" aria-current={isCurrent("/opportunities")}>
              Opportunities
            </Link>
            <Link href="/about" aria-current={isCurrent("/about")}>
              About
            </Link>

            <div className={`dd ${exploreOpen ? "open" : ""}`}>
              <button
                type="button"
                aria-expanded={exploreOpen}
                aria-haspopup="true"
                onClick={() => setExploreOpen((o) => !o)}
              >
                Explore ▾
              </button>
              <ul>
                <li>
                  <Link href="/news/health">Health and Well-being</Link>
                </li>
                <li>
                  <Link href="/news/business">Business and Economy</Link>
                </li>
                <li>
                  <Link href="/news/politics">Politics and Society</Link>
                </li>
                <li>
                  <Link href="/news/lifestyle">Fashion, Food and Lifestyle</Link>
                </li>
                <li>
                  <Link href="/news/multimedia">Multimedia</Link>
                </li>
                <li>
                  <Link href="/news/opinion">Opinion and Features</Link>
                </li>
                <li>
                  <Link href="/news/events">Community Events</Link>
                </li>
              </ul>
            </div>
          </nav>

          <div className="acts">
            <button
              type="button"
              className="ib2"
              id="sbtn"
              aria-label="Search"
              aria-haspopup="dialog"
              aria-expanded={searchOpen}
              onClick={() => {
                setSearchError("");
                setSearchQuery("");
                setSearchOpen(true);
              }}
            >
              ⌕
            </button>
            <button
              type="button"
              className="ib2"
              id="bgr"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="nv"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </header>

      {breakingEnabled && breakingText && (
        <div className="brk">
          <div className="wrap">
            <b>Featured</b>
            <Link href={breakingUrl || "/news"}>{breakingText}</Link>
            <time>Verified Summary</time>
          </div>
        </div>
      )}

      {searchOpen && (
        <div
          className="so"
          id="so"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sot"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSearchOpen(false);
          }}
        >
          <div className="box">
            <div className="top2">
              <h2 id="sot">Search D2J Media Hub</h2>
              <button
                type="button"
                className="x"
                id="sx"
                aria-label="Close search"
                onClick={() => setSearchOpen(false)}
              >
                ✕
              </button>
            </div>
            <form id="of" className="sqf" role="search" onSubmit={handleSearchSubmit} noValidate>
              <label htmlFor="oq" className="sr">
                Search
              </label>
              <input
                ref={searchInputRef}
                id="oq"
                type="search"
                autoComplete="off"
                aria-describedby="oe"
                aria-invalid={!!searchError}
                placeholder="Try “scholarship” or “MSSN”"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn" type="submit">
                Search
              </button>
            </form>
            {searchError && (
              <p className="pe" id="oe" role="alert">
                {searchError}
              </p>
            )}
            <div className="sg" id="osg">
              <span>Try:</span>
              {["MSSN", "scholarship", "Qur’an", "career"].map((term) => (
                <button
                  key={term}
                  type="button"
                  className="sv"
                  onClick={() => {
                    setSearchOpen(false);
                    router.push(`/search?q=${encodeURIComponent(term)}`);
                  }}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "err" | "notice">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
      setStatus("err");
      setMessage("Enter a valid email address, for example name@example.com.");
      return;
    }
    setStatus("sending");
    setMessage("Checking newsletter service…");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: v }),
      });
      const data = await res.json();
      if (data.subscribed) {
        setStatus("notice");
        setMessage(data.message);
        setEmail("");
      } else {
        setStatus("notice");
        setMessage(
          data.message ||
            "Newsletter provider is not yet connected. No subscription was created until the email service is configured."
        );
      }
    } catch {
      setStatus("err");
      setMessage("Could not connect to the newsletter service. No subscription was created.");
    }
  }

  return (
    <div className="wrap">
      <section>
        <div className="news">
          <div>
            <h2>Campus news, Islamic knowledge and opportunities, weekly</h2>
            <p>Get the week’s best stories in one short email.</p>
          </div>
          <form id="nf" onSubmit={handleSubmit} noValidate>
            <input
              type="email"
              id="ne"
              aria-label="Email address"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="btn gold" type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Checking…" : "Subscribe"}
            </button>
            {message && (
              <div
                id="nmsg"
                role="status"
                aria-live="polite"
                className={status === "err" ? "err" : "ok"}
                style={{ width: "100%", marginTop: 8, fontSize: 14 }}
              >
                {message}
              </div>
            )}
            <small>
              We use your email only for this newsletter. Unsubscribe any time. Subscriptions are
              only confirmed once an approved email provider is connected.
            </small>
          </form>
        </div>
      </section>
    </div>
  );
}

export function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="fg">
          <div>
            <img src="/logo.webp" className="lgf" alt="D2J Media Hub logo" />
            <p>
              A Muslim-centred digital news platform with a special focus on youth and campus life
              in Nigeria.
            </p>
          </div>
          <div>
            <h4>Explore</h4>
            <Link href="/news">News</Link>
            <Link href="/campus">Campus and Student Life</Link>
            <Link href="/islam">Islamic Knowledge</Link>
            <Link href="/education">Education and Careers</Link>
            <Link href="/opportunities">Opportunities</Link>
          </div>
          <div>
            <h4>Get involved</h4>
            <Link href="/submit">Submit a Story</Link>
            <Link href="/ask-a-scholar">Ask a Scholar</Link>
            <Link href="/guidelines">Contributor Guidelines</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <div>
            <h4>Policies</h4>
            <Link href="/editorial-policy">Editorial Policy</Link>
            <Link href="/corrections-policy">Corrections Policy</Link>
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms">Terms of Use</Link>
          </div>
        </div>
        <div className="fb">
          <span>
            Voice in propagation of the truth. Official social media links will be added when
            supplied.
          </span>
          <span>Verified-source summaries and clearly labelled demo content.</span>
        </div>
      </div>
    </footer>
  );
}
