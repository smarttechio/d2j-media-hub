import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="main" className="section" style={{ padding: '72px 0 96px' }}>
      <div className="wrap" style={{ maxWidth: 680, textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#E8F3EC',
            color: 'var(--green)',
            fontFamily: 'var(--serif)',
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 18,
            border: '2px solid var(--gold)',
          }}
        >
          404
        </div>
        <span className="kicker" style={{ display: 'block', marginBottom: 8 }}>
          Page Not Found
        </span>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(28px, 4vw, 42px)', color: 'var(--ink)', margin: '0 0 12px' }}>
          We could not find the page you requested.
        </h1>
        <p style={{ fontSize: 16, color: 'var(--ink-2)', lineHeight: 1.65, margin: '0 0 28px' }}>
          The link may have been updated, the opportunity may have been archived, or the article slug may have changed. Use the search tool or explore our core sections below.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 36 }}>
          <Link href="/" className="btn btn-primary">
            Return to Homepage
          </Link>
          <Link href="/search" className="btn btn-outline">
            Search D2J Media Hub
          </Link>
          <Link href="/news" className="btn btn-outline">
            Browse Latest News
          </Link>
        </div>

        <div className="card" style={{ padding: 22, textAlign: 'left', background: 'var(--ivory-2)' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 18, margin: '0 0 12px' }}>Quick Destination Directory</h2>
          <div className="grid-2" style={{ gap: 10, fontSize: 14 }}>
            <Link href="/campus" style={{ color: 'var(--green)', fontWeight: 600 }}>→ Campus &amp; Student Life</Link>
            <Link href="/islam" style={{ color: 'var(--green)', fontWeight: 600 }}>→ Islamic Knowledge</Link>
            <Link href="/ask-a-scholar" style={{ color: 'var(--green)', fontWeight: 600 }}>→ Ask a Scholar Desk</Link>
            <Link href="/opportunities" style={{ color: 'var(--green)', fontWeight: 600 }}>→ Verified Opportunities</Link>
            <Link href="/submit" style={{ color: 'var(--green)', fontWeight: 600 }}>→ Submit a Story</Link>
            <Link href="/contact" style={{ color: 'var(--green)', fontWeight: 600 }}>→ Contact Editorial Desk</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
