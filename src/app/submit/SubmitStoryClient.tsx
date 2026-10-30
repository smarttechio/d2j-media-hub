"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArtIllustration } from "@/components/SvgSprite";

const STORY_CATEGORIES = [
  ["Campus News", "University, polytechnic and college reporting."],
  ["News", "Community and general news."],
  ["Student Achievements", "Verified awards, projects and milestones."],
  ["Islamic Knowledge", "Sourced educational features."],
  ["Education and Careers", "Study, skills and career guides."],
  ["Business and Economy", "Halal enterprise and student finance."],
  ["Health and Well-being", "Evidence-based health and well-being."],
  ["Opinion and Features", "Signed commentary, clearly labelled."],
];

interface AttachedFile {
  name: string;
  size: number;
  error?: string;
}

export function SubmitStoryClient() {
  const [contributorName, setContributorName] = useState("");
  const [email, setEmail] = useState("");
  const [institution, setInstitution] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [preferredByline, setPreferredByline] = useState("");
  const [sourceLinks, setSourceLinks] = useState("");
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [c3, setC3] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    const next = [...files];
    selected.forEach((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase() || "";
      let err = "";
      if (!["jpg", "jpeg", "png", "pdf", "docx"].includes(ext)) {
        err = "This file type isn’t accepted. Use JPG, PNG, PDF or DOCX.";
      } else if (f.size > 5 * 1024 * 1024) {
        err = "This file is larger than 5 MB.";
      } else if (next.filter((x) => !x.error).length >= 3) {
        err = "Only 3 files can be attached.";
      }
      next.push({ name: f.name, size: f.size, error: err || undefined });
    });
    setFiles(next);
    e.target.value = "";
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!contributorName.trim()) errs.contributorName = "Enter your name.";
    if (!email.trim()) {
      errs.email = "Enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      errs.email = "Enter a valid email address, for example name@example.com.";
    }
    if (phone.trim() && !/^\+?[0-9 ()-]{7,18}$/.test(phone.trim())) {
      errs.phone = "Enter a valid phone number, or leave it blank.";
    }
    if (!category) errs.category = "Choose a story category.";
    if (!headline.trim()) errs.headline = "Enter a headline or proposed title.";
    if (!summary.trim()) {
      errs.summary = "Enter a short summary.";
    } else if (summary.trim().length < 20) {
      errs.summary = "Add a little more detail: at least 20 characters.";
    }
    if (!body.trim()) {
      errs.body = "Enter your story or pitch.";
    } else if (body.trim().length < 100) {
      errs.body = "Add more detail: at least 100 characters so editors can assess it.";
    }
    if (sourceLinks.trim()) {
      const lines = sourceLinks
        .split(/\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (!lines.every((l) => /^https?:\/\/\S+\.\S+/.test(l))) {
        errs.sourceLinks = "Each link must start with https://";
      }
    }
    if (files.some((f) => f.error)) {
      errs.files = "Remove the files that can’t be uploaded, then submit again.";
    }
    if (!c1) errs.c1 = "Confirm you own the material or have permission to submit it.";
    if (!c2) errs.c2 = "Confirm you understand how editorial review works.";
    if (!c3) errs.c3 = "Confirm you have read the guidelines and privacy information.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStatus("submitting");
    try {
      const res = await fetch("/api/submit-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributorName: contributorName.trim(),
          email: email.trim(),
          institution: institution.trim(),
          location: location.trim(),
          phone: phone.trim(),
          category,
          headline: headline.trim(),
          summary: summary.trim(),
          body: body.trim(),
          preferredByline: preferredByline.trim(),
          sourceLinks: sourceLinks.trim(),
          attachments: files.map((f) => ({ name: f.name, size: f.size })),
          consentGiven: true,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  function resetForm() {
    setContributorName("");
    setEmail("");
    setInstitution("");
    setLocation("");
    setPhone("");
    setCategory("");
    setHeadline("");
    setSummary("");
    setBody("");
    setPreferredByline("");
    setSourceLinks("");
    setFiles([]);
    setC1(false);
    setC2(false);
    setC3(false);
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
          <li aria-current="page">Submit a Story</li>
        </ol>
      </nav>

      <div className="ph hero2">
        <div>
          <h1>Submit a Story</h1>
          <p>
            Have a story worth sharing? Help us highlight important news, student experiences and
            meaningful developments within our communities. Students, campus correspondents,
            community members and writers are welcome. Every submission is reviewed before anything
            is published, and submitting does not guarantee publication.
          </p>
          <a className="btn" href="#sf-section">
            Go to the form
          </a>{" "}
          <Link className="btn line" href="/guidelines">
            Read the guidelines
          </Link>
        </div>
        <div className="art a-library">
          <ArtIllustration theme="library" label="Illustration of books and notes" />
        </div>
      </div>

      <div className="sh">
        <h2>What we may consider</h2>
        <span className="meta">Choose a category to pre-select it in the form.</span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 14,
        }}
      >
        {STORY_CATEGORIES.map(([cat, desc]) => (
          <button
            key={cat}
            type="button"
            className="topic"
            style={{ textAlign: "left", cursor: "pointer" }}
            onClick={() => {
              setCategory(cat);
              document.getElementById("sf-section")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <b>{cat}</b>
            <span>{desc}</span>
          </button>
        ))}
      </div>

      <section id="sf-section" style={{ padding: "34px 0" }} aria-labelledby="h-sf">
        <div className="sh">
          <h2 id="h-sf">Your submission</h2>
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
              <form id="sf" onSubmit={handleSubmit} noValidate>
                <fieldset>
                  <legend>About you</legend>
                  <div className={`fld ${errors.contributorName ? "bad" : ""}`}>
                    <label htmlFor="sn">
                      Contributor name <span className="h">(required)</span>
                    </label>
                    <input
                      id="sn"
                      type="text"
                      autoComplete="name"
                      value={contributorName}
                      onChange={(e) => setContributorName(e.target.value)}
                    />
                    <p className="h">
                      Your full name. You can choose a different public byline below.
                    </p>
                    {errors.contributorName && <p className="fe">{errors.contributorName}</p>}
                  </div>

                  <div className={`fld ${errors.email ? "bad" : ""}`}>
                    <label htmlFor="se">
                      Email address <span className="h">(required)</span>
                    </label>
                    <input
                      id="se"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <p className="h">Used only for editorial follow-up. Never published.</p>
                    {errors.email && <p className="fe">{errors.email}</p>}
                  </div>

                  <div className="fld">
                    <label htmlFor="si">
                      Institution or organisation <span className="h">(optional)</span>
                    </label>
                    <input
                      id="si"
                      type="text"
                      autoComplete="organization"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                    />
                    <p className="h">For example, your university, polytechnic or society.</p>
                  </div>

                  <div className="fld">
                    <label htmlFor="sl">
                      Location or campus <span className="h">(optional)</span>
                    </label>
                    <input
                      id="sl"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>

                  <div className={`fld ${errors.phone ? "bad" : ""}`}>
                    <label htmlFor="sp">
                      Phone number <span className="h">(optional)</span>
                    </label>
                    <input
                      id="sp"
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    <p className="h">
                      Only add it if you are happy for editors to call you to verify details.
                    </p>
                    {errors.phone && <p className="fe">{errors.phone}</p>}
                  </div>
                </fieldset>

                <fieldset>
                  <legend>Your story</legend>
                  <div className={`fld ${errors.category ? "bad" : ""}`}>
                    <label htmlFor="sc">
                      Story category <span className="h">(required)</span>
                    </label>
                    <select
                      id="sc"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">Choose…</option>
                      {STORY_CATEGORIES.map(([c]) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {errors.category && <p className="fe">{errors.category}</p>}
                  </div>

                  <div className={`fld ${errors.headline ? "bad" : ""}`}>
                    <label htmlFor="sh">
                      Headline or proposed title <span className="h">(required)</span>
                    </label>
                    <input
                      id="sh"
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                    />
                    <p className="h">
                      Example: “How our society organised a campus study week”
                    </p>
                    {errors.headline && <p className="fe">{errors.headline}</p>}
                  </div>

                  <div className={`fld ${errors.summary ? "bad" : ""}`}>
                    <label htmlFor="ss">
                      Summary <span className="h">(required)</span>
                    </label>
                    <textarea
                      id="ss"
                      rows={3}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                    />
                    <p className="h">
                      Two or three sentences on what happened or what you want to say.
                    </p>
                    {errors.summary && <p className="fe">{errors.summary}</p>}
                  </div>

                  <div className={`fld ${errors.body ? "bad" : ""}`}>
                    <label htmlFor="st">
                      Full story or detailed pitch <span className="h">(required)</span>
                    </label>
                    <textarea
                      id="st"
                      rows={9}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                    />
                    <p className="h">
                      Include who, what, when and where. At least 100 characters ({body.length}{" "}
                      entered).
                    </p>
                    {errors.body && <p className="fe">{errors.body}</p>}
                  </div>

                  <div className="fld">
                    <label htmlFor="sb">
                      Preferred public byline or pen name <span className="h">(optional)</span>
                    </label>
                    <input
                      id="sb"
                      type="text"
                      value={preferredByline}
                      onChange={(e) => setPreferredByline(e.target.value)}
                    />
                    <p className="h">
                      Leave blank to use your name. Credit follows the organisation’s attribution
                      policy.
                    </p>
                  </div>
                </fieldset>

                <fieldset>
                  <legend>Sources and attachments</legend>
                  <div className={`fld ${errors.sourceLinks ? "bad" : ""}`}>
                    <label htmlFor="sk">
                      Supporting source links <span className="h">(optional)</span>
                    </label>
                    <textarea
                      id="sk"
                      rows={3}
                      value={sourceLinks}
                      onChange={(e) => setSourceLinks(e.target.value)}
                    />
                    <p className="h">One link per line, starting with https://</p>
                    {errors.sourceLinks && <p className="fe">{errors.sourceLinks}</p>}
                  </div>

                  <div className={`fld ${errors.files ? "bad" : ""}`}>
                    <label htmlFor="fi">
                      Images or documents <span className="h">(optional)</span>
                    </label>
                    <div className="up">
                      <input
                        id="fi"
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.pdf,.docx"
                        onChange={handleFileChange}
                      />
                      <p className="h">
                        JPG, PNG, PDF or DOCX. Up to 3 files, 5 MB each. Only attach material you
                        may share, without other people’s private details.
                      </p>
                      {files.length > 0 && (
                        <ul className="fl">
                          {files.map((f, idx) => (
                            <li key={idx}>
                              <span>
                                {f.name} ({Math.max(1, Math.round(f.size / 1024))} KB)
                                {f.error ? (
                                  <>
                                    <br />
                                    <span style={{ color: "var(--er)", fontSize: 13.5 }}>
                                      {f.error}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <br />
                                    <span className="h">Ready to attach</span>
                                  </>
                                )}
                              </span>
                              <button
                                type="button"
                                className="sv"
                                onClick={() => removeFile(idx)}
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {errors.files && <p className="fe">{errors.files}</p>}
                  </div>
                </fieldset>

                <fieldset>
                  <legend>Consent</legend>
                  <div className={`chk ${errors.c1 ? "bad" : ""}`}>
                    <input
                      type="checkbox"
                      id="c1"
                      checked={c1}
                      onChange={(e) => setC1(e.target.checked)}
                    />
                    <label htmlFor="c1">
                      I own this material or have permission to submit it, and the information is
                      accurate to the best of my knowledge. <span className="h">(required)</span>
                    </label>
                  </div>
                  {errors.c1 && <p className="fe">{errors.c1}</p>}

                  <div className={`chk ${errors.c2 ? "bad" : ""}`}>
                    <input
                      type="checkbox"
                      id="c2"
                      checked={c2}
                      onChange={(e) => setC2(e.target.checked)}
                    />
                    <label htmlFor="c2">
                      I understand editors may review, verify and edit my submission, that
                      submitting does not guarantee publication, and that credit follows the
                      editorial policy. <span className="h">(required)</span>
                    </label>
                  </div>
                  {errors.c2 && <p className="fe">{errors.c2}</p>}

                  <div className={`chk ${errors.c3 ? "bad" : ""}`}>
                    <input
                      type="checkbox"
                      id="c3"
                      checked={c3}
                      onChange={(e) => setC3(e.target.checked)}
                    />
                    <label htmlFor="c3">
                      I have read the{" "}
                      <Link href="/guidelines" style={{ textDecoration: "underline" }}>
                        contributor guidelines
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy-policy" style={{ textDecoration: "underline" }}>
                        privacy information
                      </Link>
                      . <span className="h">(required)</span>
                    </label>
                  </div>
                  {errors.c3 && <p className="fe">{errors.c3}</p>}
                  <p className="h">Submitting does not transfer your copyright.</p>
                </fieldset>

                <button className="btn" type="submit" disabled={status === "submitting"}>
                  {status === "submitting" ? "Submitting…" : "Submit story"}
                </button>
              </form>
            )}

            {status === "success" && (
              <div className="pnl" role="status">
                <h3>Story submission received</h3>
                <p>
                  Your story submission has been securely stored in our editorial review queue.
                </p>
                <p>
                  Editors will review your submission and may contact you via email if additional
                  verification is needed. Submitting does not guarantee publication.
                </p>
                <button type="button" className="btn" onClick={resetForm}>
                  Submit another story
                </button>{" "}
                <Link className="btn line" href="/guidelines">
                  Read the guidelines
                </Link>
              </div>
            )}

            {status === "error" && (
              <div className="pnl er" role="alert" style={{ marginTop: 14 }}>
                <h3>Submission error</h3>
                <p>
                  We couldn’t submit your story. Your text is still in the form. Please try again.
                </p>
              </div>
            )}
          </div>

          <aside className="pv" aria-labelledby="h-b4">
            <h3 id="h-b4">Before you submit</h3>
            <ul>
              <li>Write only what you know to be accurate, and say where facts came from.</li>
              <li>Send original work, or material you have permission to share.</li>
              <li>Don’t include other people’s private details.</li>
              <li>Opinion pieces are labelled as opinion.</li>
            </ul>
            <p>
              Editors may review, verify and edit submissions. Read the{" "}
              <Link href="/guidelines" style={{ textDecoration: "underline" }}>
                contributor guidelines
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" style={{ textDecoration: "underline" }}>
                privacy information
              </Link>
              .
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}
