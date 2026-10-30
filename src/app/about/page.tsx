import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArtIllustration } from '@/components/SvgSprite';

export const metadata: Metadata = {
  title: 'About Us — D-Path to Jannah Media Hub',
  description:
    'Learn about D-Path to Jannah Media Hub (D2J Media Hub) — Voice in propagation of the truth. Our mission, vision, values, audience, and editorial standards.',
};

export default function AboutPage() {
  return (
    <main id="main">
      {/* Sub-navigation bar for Trust & Policies */}
      <div style={{ background: 'var(--ivory-2)', borderBottom: '1px solid var(--border)', padding: '10px 0' }}>
        <div className="wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <Link href="/about" className="chip active" style={{ fontSize: 12.5, padding: '5px 12px' }}>About D2J</Link>
            <Link href="/editorial-policy" className="chip" style={{ fontSize: 12.5, padding: '5px 12px' }}>Editorial Policy</Link>
            <Link href="/corrections-policy" className="chip" style={{ fontSize: 12.5, padding: '5px 12px' }}>Corrections Policy</Link>
            <Link href="/privacy-policy" className="chip" style={{ fontSize: 12.5, padding: '5px 12px' }}>Privacy Policy</Link>
            <Link href="/terms" className="chip" style={{ fontSize: 12.5, padding: '5px 12px' }}>Terms of Use</Link>
          </div>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Public Trust &amp; Governance</span>
        </div>
      </div>

      {/* Hero */}
      <section className="page-hero">
        <div className="wrap">
          <div className="grid-2" style={{ alignItems: 'center', gap: 36 }}>
            <div>
              <nav className="crumbs" aria-label="Breadcrumb">
                <Link href="/">Home</Link>
                <span className="sep">/</span>
                <span aria-current="page">About Us</span>
              </nav>
              <span className="kicker">D-Path to Jannah Media Hub · D2J Media Hub</span>
              <h1>Voice in propagation of the truth.</h1>
              <p className="deck">
                D-Path to Jannah Media Hub (D2J Media Hub) is a modern digital news, campus journalism, Islamic knowledge, and verified opportunities platform built for Muslim youth, students, families, and the wider society in Nigeria and beyond.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 22 }}>
                <Link href="/editorial-policy" className="btn btn-gold">Read Our Editorial Policy</Link>
                <Link href="/submit" className="btn btn-ghost">Contribute a Story</Link>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gridColumn: '1 / -1' }}>
                <img
                  src="/logo.webp"
                  alt="Official D-Path to Jannah Media Hub Logo"
                  style={{ width: 76, height: 76, borderRadius: 12, objectFit: 'contain', background: '#fff', padding: 6, marginBottom: 10 }}
                />
                <strong style={{ fontFamily: 'var(--serif)', fontSize: 20, color: '#fff' }}>Dpath TO Jannah Media Hub</strong>
                <span style={{ fontSize: 12.5, color: 'var(--gold)', fontStyle: 'italic' }}>&ldquo;Voice in propagation of the truth&rdquo;</span>
              </div>
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.14)' }}>
                <ArtIllustration theme="campus" label="Campus & Student Life" hideBadge />
              </div>
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.14)' }}>
                <ArtIllustration theme="quran" label="Islamic Knowledge" hideBadge />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section">
        <div className="wrap">
          <div className="grid-2" style={{ gap: 24 }}>
            <div className="card" style={{ padding: 28, borderTop: '4px solid var(--green)' }}>
              <span className="kicker">Our Mission</span>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: 26, margin: '8px 0 12px' }}>
                Credible reporting, authentic reminders, and practical advancement.
              </h2>
              <p style={{ color: 'var(--ink-2)', lineHeight: 1.7, margin: 0 }}>
                To inform, educate, and empower Muslim youth, students, and the broader public through verified journalism, balanced community reporting, scholar-reviewed Islamic guidance, and curated educational and career opportunities — upholding honesty, clarity, and accountability in every story we publish.
              </p>
            </div>

            <div className="card" style={{ padding: 28, borderTop: '4px solid var(--gold)' }}>
              <span className="kicker">Our Vision</span>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: 26, margin: '8px 0 12px' }}>
                A trusted reference point for modern Muslim youth media.
              </h2>
              <p style={{ color: 'var(--ink-2)', lineHeight: 1.7, margin: 0 }}>
                To become Nigeria&apos;s most trusted digital media institution serving Muslim students, young professionals, and communities — bridging rigorous public-interest journalism, campus life, authentic Islamic scholarship, and socio-economic opportunity without sensationalism or partisanship.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Serve & What We Cover */}
      <section className="section" style={{ background: 'var(--ivory-2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="kicker">Editorial Scope</span>
              <h2>What We Cover &amp; Who We Serve</h2>
            </div>
          </div>

          <div className="grid-4">
            <div className="card" style={{ padding: 20 }}>
              <span className="cat-tag">01 · News &amp; Public Affairs</span>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: 20, margin: '8px 0' }}>Verified News</h3>
              <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: 0 }}>
                National and international news, education policy, economy, health, technology, and community affairs reported with clear source attribution.
              </p>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <span className="cat-tag">02 · Campus &amp; MSSN</span>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: 20, margin: '8px 0' }}>Campus &amp; Student Life</h3>
              <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: 0 }}>
                Dedicated reporting on university, polytechnic, and college campuses, MSSN chapters, student welfare, academic excellence, and youth leadership.
              </p>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <span className="cat-tag">03 · Faith &amp; Ethics</span>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: 20, margin: '8px 0' }}>Islamic Knowledge &amp; Q&amp;A</h3>
              <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: 0 }}>
                Qur&apos;an and Sunnah reflections, character development, contemporary ethics, and an editorially screened, scholar-reviewed Ask a Scholar desk.
              </p>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <span className="cat-tag">04 · Growth &amp; Careers</span>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: 20, margin: '8px 0' }}>Verified Opportunities</h3>
              <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: 0 }}>
                Scholarships, fellowships, grants, internships, and career guides verified directly against official host portals with zero fee-scam tolerance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Editorial Values */}
      <section className="section">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="kicker">Standards &amp; Ethics</span>
              <h2>Our Six Editorial Commitments</h2>
            </div>
            <Link href="/editorial-policy" className="more">Full Editorial Policy →</Link>
          </div>

          <div className="grid-3">
            {[
              {
                num: '01',
                title: 'Truthfulness & Verification (Amanah)',
                desc: 'We verify facts, primary documents, dates, and official statements before publication. Unverified rumours are never published as fact.',
              },
              {
                num: '02',
                title: 'Clear Separation of News & Opinion',
                desc: 'Straight news reports are strictly separated from opinion columns, personal reflections, and editorial commentary.',
              },
              {
                num: '03',
                title: 'Scholarly Accountability',
                desc: 'Religious questions submitted to Ask a Scholar are never answered by AI or unvetted writers; every published answer carries named scholar attribution.',
              },
              {
                num: '04',
                title: 'Dignity & Fairness',
                desc: 'We avoid defamation, sectarian provocation, clickbait, and sensationalism, granting fair right of reply where criticism is reported.',
              },
              {
                num: '05',
                title: 'Opportunity Integrity',
                desc: 'Every scholarship or fellowship listing includes the official application link, eligibility summary, and date of verification.',
              },
              {
                num: '06',
                title: 'Transparent Corrections',
                desc: 'When an error occurs, we correct it promptly and append a visible correction timestamp at the foot of the article.',
              },
            ].map((v) => (
              <div key={v.num} className="card" style={{ padding: 22 }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 700, color: 'var(--copper)', marginBottom: 6 }}>
                  {v.num}
                </div>
                <h3 style={{ fontFamily: 'var(--serif)', fontSize: 19, margin: '0 0 8px' }}>{v.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: 0 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial Team Structure (No Fabricated Bios) */}
      <section className="section" style={{ background: 'var(--ivory-2)', borderTop: '1px solid var(--border)' }}>
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="kicker">Newsroom Desks</span>
              <h2>Editorial &amp; Review Structure</h2>
            </div>
            <span className="chip" style={{ fontSize: 12 }}>Confirmed names added via Editorial Dashboard</span>
          </div>

          <div className="grid-4">
            <div className="card" style={{ padding: 20 }}>
              <span className="cat-tag">Desk 01</span>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: 19, margin: '6px 0' }}>D2J Editorial Desk</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: '0 0 12px' }}>
                Oversees daily news commissioning, fact-checking, headline accuracy, and public corrections.
              </p>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Contact: editorial@d2jmediahub.com</span>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <span className="cat-tag">Desk 02</span>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: 19, margin: '6px 0' }}>D2J Campus Desk</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: '0 0 12px' }}>
                Coordinates student correspondents, MSSN chapter dispatches, and higher-education reporting across Nigerian campuses.
              </p>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Contact: campus@d2jmediahub.com</span>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <span className="cat-tag">Desk 03</span>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: 19, margin: '6px 0' }}>Scholarly Review Desk</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: '0 0 12px' }}>
                Screens private Ask a Scholar submissions and assigns questions to qualified scholars for reviewed responses.
              </p>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Contact: scholars@d2jmediahub.com</span>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <span className="cat-tag">Desk 04</span>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: 19, margin: '6px 0' }}>Opportunities Desk</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: '0 0 12px' }}>
                Verifies official scholarship, fellowship, internship, and grant portals and tracks application deadlines.
              </p>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Contact: opportunities@d2jmediahub.com</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
