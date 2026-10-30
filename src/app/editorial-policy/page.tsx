import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PolicyLayout } from '@/components/PolicyLayout';

export const metadata: Metadata = {
  title: 'Editorial Policy — D-Path to Jannah Media Hub',
  description:
    'Editorial Policy and journalistic standards of D-Path to Jannah Media Hub (D2J Media Hub): verification, source attribution, separation of news and opinion, and scholarly review.',
};

export default function EditorialPolicyPage() {
  return (
    <PolicyLayout
      kicker="Governance & Standards"
      title="Editorial Policy"
      deck="Our framework for accuracy, verification, source attribution, scholarly review, and ethical journalism across all D-Path to Jannah Media Hub publications."
      lastUpdated="26 October 2026"
      reviewStatus="Active Editorial Standard"
      owner="D2J Editorial Desk"
      sections={[
        {
          id: 'mission-and-independence',
          title: '1. Editorial Mission & Independence',
          badgeType: 'brief',
          badgeLabel: 'From the brief',
          content: (
            <>
              <p>
                D-Path to Jannah Media Hub (<strong>D2J Media Hub</strong>) operates under the guiding motto{' '}
                <em>&ldquo;Voice in propagation of the truth.&rdquo;</em> Our editorial mission is to serve Muslim youth, students, families, and the wider public with accurate journalism, principled analysis, authentic Islamic reminders, and verified educational and career opportunities.
              </p>
              <p>
                Editorial decisions are made independently by our editors based on public interest, factual accuracy, and relevance to our readership. Sponsored content, institutional partnerships, or announcements must be clearly labelled and never influence our news judgment or religious Q&amp;A review.
              </p>
            </>
          ),
        },
        {
          id: 'verification-and-sourcing',
          title: '2. Verification & Source Attribution',
          badgeType: 'brief',
          badgeLabel: 'From the brief',
          content: (
            <>
              <p>
                Every news report, campus dispatch, and policy explainer published on D2J Media Hub must be grounded in verifiable facts. Before publication, editors require:
              </p>
              <ul>
                <li>Primary documentation (official communiqués, circulars, court or regulatory filings, or direct on-the-record interviews) wherever available.</li>
                <li>Explicit attribution of secondary reporting where a story summarises facts established by another credible news organisation.</li>
                <li>Verification of dates, institution names, titles, and figures before a piece moves from <em>Submitted for Review</em> to <em>Approved</em>.</li>
              </ul>
              <p>
                Unverified social media rumours, forwarded broadcasts, or anonymous allegations lacking corroborating evidence will not be published.
              </p>
            </>
          ),
        },
        {
          id: 'news-vs-opinion',
          title: '3. Separation of News, Analysis & Opinion',
          badgeType: 'brief',
          badgeLabel: 'From the brief',
          content: (
            <>
              <p>
                Readers have a right to know whether they are reading a factual report, an analytical explainer, or a personal viewpoint:
              </p>
              <ul>
                <li><strong>News &amp; Campus Reports:</strong> Written in an objective, impartial voice presenting verified facts and multiple relevant perspectives.</li>
                <li><strong>Opinion &amp; Reflections:</strong> Clearly filed under the <em>Opinion</em> category with named author attribution and a clear distinction from newsroom reporting.</li>
              </ul>
            </>
          ),
        },
        {
          id: 'islamic-content-and-scholar-review',
          title: '4. Islamic Knowledge & Ask a Scholar Safeguards',
          badgeType: 'brief',
          badgeLabel: 'From the brief',
          content: (
            <>
              <p>
                Publishing Islamic reminders and scholarly answers carries both public and spiritual responsibility (<em>Amanah</em>). D2J Media Hub enforces strict safeguards on religious content:
              </p>
              <ul>
                <li><strong>Zero AI Fatwas:</strong> Artificial intelligence tools are strictly prohibited from generating religious rulings, fatwas, or scholarly answers.</li>
                <li><strong>Four-Stage Q&amp;A Workflow:</strong> Every question submitted through <Link href="/ask-a-scholar">Ask a Scholar</Link> enters as a <em>Private Submission</em>, undergoes <em>Editorial Screening</em>, is routed for <em>Scholar Review</em>, and is only made public once marked as an <em>Approved Public Answer</em>.</li>
                <li><strong>Primary Scriptural Citation:</strong> Qur&apos;anic verses must cite chapter (Surah) and verse (Ayah) numbers; Prophetic traditions (Hadith) must cite recognised collections and grading context where relevant.</li>
                <li><strong>Sensitive Personal Matters:</strong> Questions involving acute marital disputes, inheritance litigation, mental-health emergencies, or confidential pastoral care are handled privately or referred to local qualified scholars and professionals rather than published publicly.</li>
              </ul>
            </>
          ),
        },
        {
          id: 'opportunities-verification',
          title: '5. Opportunities & Scholarship Verification',
          badgeType: 'brief',
          badgeLabel: 'From the brief',
          content: (
            <>
              <p>
                Students and young graduates frequently face fraudulent scholarship portals and fee scams. Every listing in our <Link href="/opportunities">Opportunities</Link> directory must pass our <em>Source Verification</em> workflow:
              </p>
              <ul>
                <li>Editors verify the official host institution, funding Type, eligibility criteria, deadline, and direct official application URL.</li>
                <li>Each published opportunity displays its verification date and links directly to the primary provider.</li>
                <li>Expired opportunities are automatically or editorially marked as <em>Expired / Archived</em> so applicants do not waste effort on closed calls.</li>
              </ul>
            </>
          ),
        },
      ]}
    />
  );
}
