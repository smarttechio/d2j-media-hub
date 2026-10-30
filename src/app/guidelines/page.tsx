import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArtIllustration } from "@/components/SvgSprite";

export const metadata: Metadata = {
  title: "Contributor Guidelines",
  description:
    "How to contribute to D2J Media Hub, what we look for, and what happens after you submit.",
};

export default function GuidelinesPage() {
  return (
    <div className="wrap">
      <nav className="bc" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/submit">Submit a Story</Link>
          </li>
          <li aria-current="page">Contributor Guidelines</li>
        </ol>
      </nav>

      <div className="ph hero2">
        <div>
          <h1>Contributor Guidelines</h1>
          <p>
            How to contribute, what we look for, and what happens after you submit. These
            guidelines explain our editorial standards for student correspondents, writers and
            community contributors.
          </p>
          <Link className="btn" href="/submit">
            Submit a story
          </Link>
        </div>
        <div className="art a-community">
          <ArtIllustration theme="community" label="Illustration of contributors and community" />
        </div>
      </div>

      <div className="sh">
        <h2>Who can contribute</h2>
      </div>
      <ul className="ck">
        <li>
          <b>Students</b>
          Campus news, achievements and student experiences.
        </li>
        <li>
          <b>Campus correspondents</b>
          Regular reports from your institution or MSSN unit.
        </li>
        <li>
          <b>Community members</b>
          Reports on Muslim community initiatives and developments.
        </li>
        <li>
          <b>Writers</b>
          Educational features and signed opinion articles.
        </li>
        <li>
          <b>Subject-matter contributors</b>
          Expert explainers in health, finance, education or Islamic studies.
        </li>
      </ul>

      <div className="sh" style={{ marginTop: 34 }}>
        <h2>What we accept</h2>
      </div>
      <ul className="ck">
        <li>
          <b>News reports</b>
          Relevant, factual and checkable reporting.
        </li>
        <li>
          <b>Campus stories</b>
          From Nigerian universities, polytechnics and colleges.
        </li>
        <li>
          <b>Educational features</b>
          Clear, sourced and original study or career guides.
        </li>
        <li>
          <b>Community reporting</b>
          Verified initiatives, programmes and events.
        </li>
        <li>
          <b>Opinion articles</b>
          Clearly labelled as opinion and separated from news.
        </li>
        <li>
          <b>Original photographs</b>
          With permission and full credit details.
        </li>
      </ul>

      <div className="sh" style={{ marginTop: 34 }}>
        <h2>Editorial standards</h2>
      </div>
      <ul className="ck">
        <li>
          <b>Accuracy</b>
          Check names, dates, institutions and figures.
        </li>
        <li>
          <b>Originality</b>
          No copied or plagiarised text.
        </li>
        <li>
          <b>Source transparency</b>
          Say clearly where facts and quotations came from.
        </li>
        <li>
          <b>Respectful language</b>
          No abuse, defamation or harassment.
        </li>
        <li>
          <b>Clear attribution</b>
          Credit people, institutions and sources accurately.
        </li>
        <li>
          <b>Photo permissions</b>
          Only share images you own or have permission to share.
        </li>
        <li>
          <b>Sensitive information</b>
          Protect private and personal details of third parties.
        </li>
      </ul>

      <div className="sh" style={{ marginTop: 34 }}>
        <h2>What happens after you submit</h2>
      </div>
      <ol className="steps">
        <li>Submission received</li>
        <li>Initial editorial review</li>
        <li>Fact-checking or follow-up where needed</li>
        <li>Editorial decision</li>
        <li>Publication, if approved</li>
      </ol>
      <p className="meta" style={{ marginTop: 10 }}>
        Not every submission is published. Contributors never publish directly to the public
        website without editorial approval.
      </p>

      <div className="two" style={{ margin: "34px 0" }}>
        <div className="pv">
          <span className="tagd">Attribution and copyright</span>
          <h3 style={{ marginTop: 8 }}>Ownership of your work</h3>
          <p>
            Contributor credit, permissions and publication rights follow the organisation’s
            editorial policies. Submitting does not by itself transfer ownership of your work.
          </p>
        </div>
        <div className="pv">
          <h3>Questions about contributing?</h3>
          <p>
            Ask the editorial team before you write, or while your story is in progress.
          </p>
          <Link className="btn" href="/contact">
            Contact the team
          </Link>
        </div>
      </div>
    </div>
  );
}
