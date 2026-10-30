import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PolicyLayout } from '@/components/PolicyLayout';

export const metadata: Metadata = {
  title: 'Corrections Policy — D-Path to Jannah Media Hub',
  description:
    'How D-Path to Jannah Media Hub (D2J Media Hub) handles factual errors, clarifications, updates, and reader correction requests.',
};

export default function CorrectionsPolicyPage() {
  return (
    <PolicyLayout
      kicker="Accountability & Transparency"
      title="Corrections Policy"
      deck="How D-Path to Jannah Media Hub investigates reported inaccuracies and issues transparent corrections, clarifications, and updates."
      lastUpdated="26 October 2026"
      reviewStatus="Active Editorial Standard"
      owner="D2J Standards & Accountability Desk"
      sections={[
        {
          id: 'commitment-to-accuracy',
          title: '1. Our Commitment to Prompt Corrections',
          badgeType: 'brief',
          badgeLabel: 'From the brief',
          content: (
            <>
              <p>
                Credibility requires humility and accountability. While our editors verify facts prior to publication, errors can occasionally occur. When we discover or are informed of a factual inaccuracy in any article, opportunity listing, or Q&amp;A metadata, we correct it promptly and transparently.
              </p>
              <p>
                We never silently alter a substantive factual error to hide a mistake.
              </p>
            </>
          ),
        },
        {
          id: 'levels-of-amendment',
          title: '2. Corrections, Clarifications & Updates',
          badgeType: 'proposed',
          badgeLabel: 'Editorial workflow standard',
          content: (
            <>
              <p>We distinguish between three types of post-publication amendments:</p>
              <ul>
                <li>
                  <strong>Correction:</strong> Issued when a substantive factual error (such as a misstated name, figure, date, institutional affiliation, or misquotation) is identified. The text is corrected and a dated <em>Correction Note</em> is appended at the bottom of the page explaining what was changed.
                </li>
                <li>
                  <strong>Clarification:</strong> Issued when the original text was factually accurate but phrased in a way that could mislead readers or lacked essential context.
                </li>
                <li>
                  <strong>Developing Story / Opportunity Update:</strong> When new information emerges on a developing news story or an opportunity host extends an application deadline, we update the piece and record the <em>Last Verified / Updated</em> timestamp.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: 'how-to-report-an-error',
          title: '3. How Readers Can Request a Correction',
          badgeType: 'brief',
          badgeLabel: 'From the brief',
          content: (
            <>
              <p>
                Readers, campus representatives, and institutions may report a factual error at any time by using our <Link href="/contact">Contact Us</Link> form (selecting <strong>Correction or Clarification Request</strong> as the inquiry type) or by emailing <strong>corrections@d2jmediahub.com</strong>.
              </p>
              <p>To help our editors review your request quickly, please include:</p>
              <ul>
                <li>The headline or URL of the article or listing in question.</li>
                <li>The specific statement or figure you believe is inaccurate.</li>
                <li>Supporting documentation, official links, or primary evidence verifying the correct information.</li>
              </ul>
            </>
          ),
        },
        {
          id: 'takedown-requests',
          title: '4. Policy on Unpublishing & Takedown Requests',
          badgeType: 'proposed',
          badgeLabel: 'Proposed wording',
          content: (
            <>
              <p>
                As a matter of journalistic record, D2J Media Hub does not delete published articles simply because a subject or institution prefers that accurate information no longer remain public. Instead, if new facts emerge, we update or append a follow-up report.
              </p>
              <p>
                Unpublishing is reserved for rare circumstances involving severe legal, safety, or privacy hazards, or if an entire report is found to be fundamentally unsubstantiated, and requires explicit sign-off from the Managing Editor.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
