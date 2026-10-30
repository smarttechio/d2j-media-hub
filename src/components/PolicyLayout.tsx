import React from 'react';
import Link from 'next/link';

export interface PolicySection {
  id: string;
  title: string;
  badgeType?: 'brief' | 'proposed' | 'stakeholder' | 'legal';
  badgeLabel?: string;
  content: React.ReactNode;
}

interface PolicyLayoutProps {
  kicker: string;
  title: string;
  deck: string;
  lastUpdated: string;
  reviewStatus: string;
  owner: string;
  noticeBanner?: {
    type: 'legal' | 'stakeholder' | 'info';
    title: string;
    body: string;
  };
  sections: PolicySection[];
}

export function PolicyLayout({
  kicker,
  title,
  deck,
  lastUpdated,
  reviewStatus,
  owner,
  noticeBanner,
  sections,
}: PolicyLayoutProps) {
  return (
    <main id="main">
      {/* Sub-navigation bar for Trust & Policies */}
      <div style={{ background: 'var(--ivory-2)', borderBottom: '1px solid var(--border)', padding: '10px 0' }}>
        <div className="wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <Link href="/about" className="chip" style={{ fontSize: 12.5, padding: '5px 12px' }}>About D2J</Link>
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
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <Link href="/about">About &amp; Policies</Link>
            <span className="sep">/</span>
            <span aria-current="page">{title}</span>
          </nav>
          <span className="kicker">{kicker}</span>
          <h1>{title}</h1>
          <p className="deck">{deck}</p>

          <div className="meta-bar">
            <span><strong>Document status:</strong> {reviewStatus}</span>
            <span><strong>Effective / Updated:</strong> {lastUpdated}</span>
            <span><strong>Responsible desk:</strong> {owner}</span>
          </div>
        </div>
      </section>

      {/* Main Content + Sticky Table of Contents */}
      <section className="section">
        <div className="wrap">
          {noticeBanner && (
            <div
              className="notice"
              style={{
                marginBottom: 28,
                background: noticeBanner.type === 'legal' ? '#FEF2F2' : noticeBanner.type === 'stakeholder' ? '#FFFBEB' : 'var(--ivory-2)',
                borderLeftColor: noticeBanner.type === 'legal' ? '#B91C1C' : 'var(--gold)',
              }}
            >
              <strong style={{ display: 'block', marginBottom: 4, color: noticeBanner.type === 'legal' ? '#991B1B' : 'var(--green)' }}>
                {noticeBanner.title}
              </strong>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-2)' }}>{noticeBanner.body}</p>
            </div>
          )}

          <div className="policy-grid">
            <aside className="policy-toc" aria-label="Table of contents">
              <h4>On this page</h4>
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`}>
                  {s.title}
                </a>
              ))}
              <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <h4 style={{ marginBottom: 6 }}>Questions or corrections?</h4>
                <p style={{ fontSize: 12.5, color: 'var(--ink-3)', margin: '0 0 10px' }}>
                  Reach our editorial or compliance desk directly.
                </p>
                <Link href="/contact" className="btn btn-outline" style={{ width: '100%', padding: '8px 12px', fontSize: 12.5 }}>
                  Contact Editorial Desk
                </Link>
              </div>
            </aside>

            <div className="policy-body">
              {sections.map((section) => (
                <section key={section.id} id={section.id} style={{ scrollMarginTop: 95, marginBottom: 34, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <h2 style={{ margin: 0 }}>{section.title}</h2>
                    {section.badgeLabel && (
                      <span
                        className="chip"
                        style={{
                          fontSize: 11,
                          padding: '3px 9px',
                          background:
                            section.badgeType === 'brief'
                              ? '#E8F3EC'
                              : section.badgeType === 'legal'
                              ? '#FEE2E2'
                              : section.badgeType === 'stakeholder'
                              ? '#FEF3C7'
                              : 'var(--ivory-2)',
                          color:
                            section.badgeType === 'brief'
                              ? 'var(--green)'
                              : section.badgeType === 'legal'
                              ? '#991B1B'
                              : section.badgeType === 'stakeholder'
                              ? '#92400E'
                              : 'var(--ink-2)',
                          borderColor: 'transparent',
                        }}
                      >
                        {section.badgeLabel}
                      </span>
                    )}
                  </div>
                  {section.content}
                </section>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
