import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PolicyLayout } from '@/components/PolicyLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy — D-Path to Jannah Media Hub',
  description:
    'Privacy Policy of D-Path to Jannah Media Hub (D2J Media Hub): how we handle reader data, story submissions, private Ask a Scholar questions, and NDPA 2023 compliance.',
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout
      kicker="Data Protection & Confidentiality"
      title="Privacy Policy"
      deck="How D-Path to Jannah Media Hub collects, uses, safeguards, and respects your personal data across our website, editorial submissions, and Ask a Scholar service."
      lastUpdated="26 October 2026"
      reviewStatus="Operational Policy · Legal Review Recommended"
      owner="D2J Data & Privacy Desk"
      noticeBanner={{
        type: 'legal',
        title: 'Legal Review & NDPA 2023 Compliance Notice',
        body: 'This Privacy Policy reflects the actual technical data practices implemented in the D2J Media Hub platform and aligns with the Nigeria Data Protection Act (NDPA) 2023 principles. Formal sign-off by qualified legal counsel is recommended prior to commercial third-party analytics or newsletter integration.',
      }}
      sections={[
        {
          id: 'information-we-collect',
          title: '1. Information We Collect',
          badgeType: 'brief',
          badgeLabel: 'From the brief',
          content: (
            <>
              <p>
                We collect only the minimum personal information necessary to operate our publishing platform and respond to your submissions:
              </p>
              <ul>
                <li>
                  <strong>Submit a Story Form (<Link href="/submit">/submit</Link>):</strong> Your name, email address, phone/WhatsApp number (optional), campus/organisation affiliation (optional), story content, and source documentation.
                </li>
                <li>
                  <strong>Ask a Scholar Form (<Link href="/ask-a-scholar">/ask-a-scholar</Link>):</strong> Your question details, topic category, optional name, and contact email (used strictly for private scholarly follow-up or notification).
                </li>
                <li>
                  <strong>Contact Form (<Link href="/contact">/contact</Link>):</strong> Your name, email address, inquiry category, and message content.
                </li>
                <li>
                  <strong>Editorial Authentication:</strong> For authorised editors, contributors, and scholars signing into the Editorial Dashboard, we use an encrypted, HTTP-only session cookie (<code>d2j_editorial_session</code>).
                </li>
              </ul>
            </>
          ),
        },
        {
          id: 'ask-a-scholar-confidentiality',
          title: '2. Special Confidentiality for "Ask a Scholar" Submissions',
          badgeType: 'brief',
          badgeLabel: 'Strict Privacy Safeguard',
          content: (
            <>
              <p>
                We recognise that questions submitted to our <Link href="/ask-a-scholar">Ask a Scholar</Link> desk often involve sensitive personal, family, or spiritual circumstances. We enforce the following technical and editorial rules:
              </p>
              <ul>
                <li>Every question is stored in our database with the initial status <code>Private Submission</code> and is <strong>never</strong> automatically displayed on the public website.</li>
                <li>Your contact email and private notes are stripped at the server layer from all public API responses and search indexes.</li>
                <li>If a question is marked <em>Keep 100% private</em> by the sender, it will never be adapted into a public Q&amp;A article.</li>
                <li>Where the sender permits public adaptation for community benefit, editors remove all identifying names, locations, and personal details before a scholar-reviewed answer is published.</li>
              </ul>
            </>
          ),
        },
        {
          id: 'cookies-and-analytics',
          title: '3. Cookies, Local Preferences & Analytics',
          badgeType: 'proposed',
          badgeLabel: 'Technical implementation',
          content: (
            <>
              <p>
                D2J Media Hub does not use invasive third-party advertising trackers or sell reader data to data brokers.
              </p>
              <ul>
                <li><strong>Theme Preference:</strong> If you toggle light or dark reading mode, your browser stores that preference locally.</li>
                <li><strong>Editorial Session Cookie:</strong> Authorised staff logging into <code>/admin</code> receive a signed HTTP-only session cookie that expires automatically after 24 hours.</li>
              </ul>
            </>
          ),
        },
        {
          id: 'your-rights-ndpa',
          title: '4. Your Rights Under the Nigeria Data Protection Act (NDPA 2023)',
          badgeType: 'legal',
          badgeLabel: 'Legal review required',
          content: (
            <>
              <p>
                Under the Nigeria Data Protection Act (NDPA) 2023 and applicable data protection laws, you have the right to:
              </p>
              <ul>
                <li>Request access to any personal data you have submitted to us via our forms.</li>
                <li>Request correction or deletion of your private submission or contact details prior to publication.</li>
                <li>Withdraw consent for public adaptation of a story submission or anonymised Q&amp;A.</li>
              </ul>
              <p>
                To exercise any of these rights, please contact us through our <Link href="/contact">Contact Us</Link> page (selecting <strong>Privacy or Data Request</strong>) or email <strong>privacy@d2jmediahub.com</strong>.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
