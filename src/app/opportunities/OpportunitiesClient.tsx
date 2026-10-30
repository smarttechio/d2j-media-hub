"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Opportunity } from "@/lib/db";
import { OpportunityCard } from "@/components/ArticleCards";

const TYPES = [
  "All",
  "Scholarships",
  "Internships",
  "Fellowships",
  "Graduate Opportunities",
  "Career Guides",
];

export function OpportunitiesClient({ opportunities }: { opportunities: Opportunity[] }) {
  const [selectedType, setSelectedType] = useState("All");

  const filtered = opportunities.filter((o) => {
    if (selectedType === "All") return true;
    return `${o.type}s`.toLowerCase() === selectedType.toLowerCase() ||
      o.type.toLowerCase() === selectedType.toLowerCase();
  });

  return (
    <div className="wrap">
      <nav className="bc" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li aria-current="page">Opportunities</li>
        </ol>
      </nav>

      <div className="ph">
        <h1>Opportunities</h1>
        <p>
          Scholarships, internships and fellowships with an official source. Each listing shows
          its status and when we last checked it. Always confirm on the official page, because
          details change.
        </p>
      </div>

      <div className="tf" role="group" aria-label="Opportunity type">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={selectedType === t}
            onClick={() => setSelectedType(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: "22px 0" }}>
        {filtered.length > 0 ? (
          <div className="og2">
            {filtered.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        ) : (
          <div className="msg">
            <h2>No verified {selectedType.toLowerCase()} yet</h2>
            <p>
              We list an opportunity only when it has an official source. None has been verified
              for this type so far.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
