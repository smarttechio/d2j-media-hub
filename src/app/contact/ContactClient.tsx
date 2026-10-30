"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SiteSettings } from "@/lib/db";
import { ArtIllustration } from "@/components/SvgSprite";

const ENQUIRY_TYPES = [
  "General Enquiry",
  "Editorial Feedback",
  "Report a Correction",
  "Story Lead / Tip",
  "Partnership",
  "Advertising",
];

const PARTNERSHIP_CARDS = [
  ["Sponsored articles", "Clearly labelled sponsored features separated from editorial news."],
  ["Event announcements", "Paid publicity for conferences, seminars and campus programmes."],
  ["Opportunity listings", "Verified scholarship, fellowship and graduate job notices."],
  ["Media partnerships", "Collaborations with student associations and community bodies."],
];

export function ContactClient({
  initialEnquiry,
  settings,
}: {
  initialEnquiry: string;
  settings: SiteSettings;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [enquiryType, setEnquiryType] = useState(initialEnquiry || "");
  const [organisation, setOrganisation] = useState("");
  const [subject, setSubject] = useState("");
  const [articleUrl, setArticleUrl] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  useEffect(() => {
    if (initialEnquiry) setEnquiryType(initialEnquiry);
  }, [initialEnquiry]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Enter your name.";
    if (!email.trim()) {
      errs.email = "Enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      errs.email = "Enter a valid email address, for example name@example.com.";
    }
    if (!enquiryType) errs.enquiryType = "Choose an enquiry type.";
    if (
      enquiryType === "Report a Correction" &&
      articleUrl.trim() &&
      !/^https?:\/\/\S+\.\S+/.test(articleUrl.trim())
    ) {
      errs.articleUrl = "Enter a full link starting with https://, or leave it blank.";
    }
    if (!message.trim()) {
      errs.message = "Enter your message.";
    } else if (message.trim().length < 10) {
      errs.message = "Add a little more detail.";
    }
    if (!consent) {
      errs.consent = "Confirm you have read the privacy information.";
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
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          enquiryType,
          organisation: organisation.trim(),
          subject: subject.trim(),
          articleUrl: articleUrl.trim(),
          message: message.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  function resetForm() {
    setName("");
    setEmail("");
    setEnquiryType("");
    setOrganisation("");
    setSubject("");
    setArticleUrl("");
    setMessage("");
    setConsent(false);
    setErrors({});
    setStatus("idle");
  }

  return (
    <div className="wrap">
      <nav className="bc" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li aria-current="page">Contact Us</li>
        </ol>
      </nav>

      <div className="ph hero2">
        <div>
          <h1>Contact Us</h1>
          <p>
            We welcome questions, feedback, story leads and opportunities to collaborate. Choose
            the enquiry type that fits, and our editorial team will review it.
          </p>
          <a className="btn" href="#cf-section">
            Go to the form
          </a>{" "}
          <Link className="btn line" href="/submit">
            Submit a story instead
          </Link>
        </div>
        <div className="art a-biz">
          <ArtIllustration theme="biz" label="Illustration of communication and collaboration" />
        </div>
      </div>

      <div className="sh">
        <h2>Partnerships and advertising</h2>
        <span className="meta">Rates and audience figures are provided upon enquiry.</span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 14,
        }}
      >
        {PARTNERSHIP_CARDS.map(([title, desc]) => (
          <button
            key={title}
            type="button"
            className="topic"
            style={{ textAlign: "left", cursor: "pointer" }}
            onClick={() => {
              setEnquiryType("Advertising");
              document.getElementById("cf-section")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <b>{title}</b>
            <span>{desc}</span>
          </button>
        ))}
      </div>

      <section id="cf-section" style={{ padding: "34px 0" }} aria-labelledby="h-cf">
        <div className="sh">
          <h2 id="h-cf">Send a message</h2>
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
              <form id="cf" onSubmit={handleSubmit} noValidate>
                <div className={`fld ${errors.name ? "bad" : ""}`}>
                  <label htmlFor="cn">
                    Full name <span className="h">(required)</span>
                  </label>
                  <input
                    id="cn"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {errors.name && <p className="fe">{errors.name}</p>}
                </div>

                <div className={`fld ${errors.email ? "bad" : ""}`}>
                  <label htmlFor="ce">
                    Email address <span className="h">(required)</span>
                  </label>
                  <input
                    id="ce"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {errors.email && <p className="fe">{errors.email}</p>}
                </div>

                <div className={`fld ${errors.enquiryType ? "bad" : ""}`}>
                  <label htmlFor="ct">
                    Enquiry type <span className="h">(required)</span>
                  </label>
                  <select
                    id="ct"
                    value={enquiryType}
                    onChange={(e) => setEnquiryType(e.target.value)}
                  >
                    <option value="">Choose…</option>
                    {ENQUIRY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {errors.enquiryType && <p className="fe">{errors.enquiryType}</p>}
                </div>

                {enquiryType === "Report a Correction" && (
                  <div className={`fld ${errors.articleUrl ? "bad" : ""}`}>
                    <label htmlFor="ca">
                      Link to the article <span className="h">(optional)</span>
                    </label>
                    <input
                      id="ca"
                      type="url"
                      placeholder="https://"
                      value={articleUrl}
                      onChange={(e) => setArticleUrl(e.target.value)}
                    />
                    <p className="h">
                      For corrections: paste the article address, starting with https://
                    </p>
                    {errors.articleUrl && <p className="fe">{errors.articleUrl}</p>}
                  </div>
                )}

                <div className="fld">
                  <label htmlFor="co">
                    Organisation <span className="h">(optional)</span>
                  </label>
                  <input
                    id="co"
                    type="text"
                    autoComplete="organization"
                    value={organisation}
                    onChange={(e) => setOrganisation(e.target.value)}
                  />
                </div>

                <div className="fld">
                  <label htmlFor="cs">
                    Subject <span className="h">(optional)</span>
                  </label>
                  <input
                    id="cs"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div className={`fld ${errors.message ? "bad" : ""}`}>
                  <label htmlFor="cm">
                    Message <span className="h">(required)</span>
                  </label>
                  <textarea
                    id="cm"
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  {errors.message && <p className="fe">{errors.message}</p>}
                </div>

                <div className={`chk ${errors.consent ? "bad" : ""}`}>
                  <input
                    type="checkbox"
                    id="cp"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <label htmlFor="cp">
                    I have read the{" "}
                    <Link href="/privacy-policy" style={{ textDecoration: "underline" }}>
                      privacy information
                    </Link>{" "}
                    and agree that you may use my details to reply.{" "}
                    <span className="h">(required)</span>
                  </label>
                </div>
                {errors.consent && <p className="fe">{errors.consent}</p>}

                <button className="btn" type="submit" disabled={status === "submitting"}>
                  {status === "submitting" ? "Sending…" : "Send message"}
                </button>
              </form>
            )}

            {status === "success" && (
              <div className="pnl" role="status">
                <h3>Message received</h3>
                <p>
                  Your message has been securely stored for our editorial and administrative team.
                </p>
                <button type="button" className="btn" onClick={resetForm}>
                  Send another message
                </button>
              </div>
            )}

            {status === "error" && (
              <div className="pnl er" role="alert" style={{ marginTop: 14 }}>
                <h3>Could not send message</h3>
                <p>Please check your connection and try again.</p>
              </div>
            )}
          </div>

          <aside>
            <div className="pv" style={{ marginBottom: 14 }}>
              <h3>Corrections and editorial feedback</h3>
              <p>
                Spotted a factual error? Choose “Report a Correction” and add the article link.
                Editors review every request.
              </p>
              <button
                type="button"
                className="btn line"
                onClick={() => {
                  setEnquiryType("Report a Correction");
                  document.getElementById("cf-section")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Report a correction
              </button>
            </div>

            <div className="pv">
              <h3>Contact information</h3>
              <p>
                <b>Official email:</b> {settings.officialEmail}
              </p>
              <p>
                <b>Business enquiries:</b> {settings.businessEmail}
              </p>
              <p>
                <b>Office location:</b> {settings.officeLocation}
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
