import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PolicyLayout } from '@/components/PolicyLayout';

export const metadata: Metadata = {
  title: 'Terms of Use — D-Path to Jannah Media Hub',
  description:
    'Terms of Use for D-Path to Jannah Media Hub (D2J Media Hub), covering intellectual property, contributor licensing, scholarly Q&A disclaimers, and external opportunity links.',
};

export default function TermsPage() {
  return (
    <PolicyLayout
      kicker="Legal & Platform Governance"
      title="Terms of Use"
      deck="The terms governing your access to D-Path to Jannah Media Hub, use of our content, contributor submissions, and third-party scholarship and opportunity portals."
      lastUpdated="26 October 2026"
      reviewStatus="Operational Terms · Legal Review Recommended"
      owner="D2J Operations & Governance"
      noticeBanner={{
        type: 'legal',
        title: 'Educational & Informational Disclaimer',
        body: 'Content published on D2J Media Hub — including Islamic Knowledge articles, Ask a Scholar responses, and Opportunity listings — is provided for general informational and educational purposes. Formal legal review is recommended before commercial syndication.',
      }}
      sections={[
        {
          id: 'acceptance-of-terms',
          title: '1. Acceptance of Terms',
          badgeType: 'proposed',
          badgeLabel: 'Standard platform terms',
          content: (
            <>
              <p>
                By accessing or using the D-Path to Jannah Media Hub (<strong>D2J Media Hub</strong>) website, submitting stories or questions, or using any of our directories, you agree to comply with these Terms of Use and our <Link href="/editorial-policy">Editorial Policy</Link> and <Link href="/privacy-policy">Privacy Policy</Link>.
              </p>
            </>
          ),
        },
        {
          id: 'intellectual-property',
          title: '2. Intellectual Property & Fair Attribution',
          badgeType: 'brief',
          badgeLabel: 'From the brief',
          content: (
            <>
              <p>
                The D-Path to Jannah Media Hub name, official logo, tagline (<em>&ldquo;Voice in propagation of the truth&rdquo;</em>), original articles, custom illustrations, and site design are protected by copyright and trademark laws.
              </p>
              <ul>
                <li>Student chapters (such as MSSN press boards), schools, and non-commercial community groups may share links and brief excerpts (up to 150 words) provided clear attribution and a direct link back to the original D2J Media Hub URL are included.</li>
                <li>Full republication, commercial syndication, or alteration of our official logo without prior written permission is prohibited.</li>
              </ul>
            </>
          ),
        },
        {
          id: 'contributor-submissions',
          title: '3. Contributor Submissions & Warranties',
          badgeType: 'brief',
          badgeLabel: 'From the brief',
          content: (
            <>
              <p>
                When you submit an article, campus report, photograph, or opinion piece through our <Link href="/submit">Submit a Story</Link> portal:
              </p>
              <ul>
                <li>You warrant that the work is your original creation, factually accurate to the best of your knowledge, and does not infringe any third party&apos;s copyright or privacy rights.</li>
                <li>You grant D2J Media Hub a non-exclusive, royalty-free licence to edit, verify, format, publish, and archive the submission across our digital channels.</li>
                <li>Submission does not guarantee publication; all drafts are subject to editorial review and fact-checking.</li>
              </ul>
            </>
          ),
        },
        {
          id: 'scholarly-and-opportunity-disclaimers',
          title: '4. Ask a Scholar & External Opportunities Disclaimer',
          badgeType: 'legal',
          badgeLabel: 'Important disclaimer',
          content: (
            <>
              <p>
                <strong>Ask a Scholar &amp; Islamic Knowledge:</strong> Published Q&amp;A responses provide general Islamic educational guidance reviewed by named scholars. They do not constitute binding legal representation, statutory marriage/divorce registration, medical treatment, or clinical psychological therapy. Readers facing urgent legal or health crises should consult licensed professionals in their jurisdiction.
              </p>
              <p>
                <strong>Opportunities Directory:</strong> While our Opportunities Desk verifies every scholarship, fellowship, and internship against official host portals on the stated verification date, D2J Media Hub does not administer these external programmes and is not responsible for subsequent changes made by third-party scholarship boards. Never pay any third-party agent to apply for a scholarship listed on D2J Media Hub.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
