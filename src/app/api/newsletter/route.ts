import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return NextResponse.json(
        { error: 'Enter a valid email address, for example name@example.com.' },
        { status: 400 }
      );
    }

    const db = getDb();
    if (!db.settings.newsletterProviderConfigured) {
      // Honest status per requirements brief: never falsely claim subscription succeeded when provider is not yet connected
      return NextResponse.json(
        {
          ok: false,
          providerConfigured: false,
          message:
            'Newsletter provider integration is not yet connected. Your email was validated, but no subscription has been activated yet.',
        },
        { status: 202 }
      );
    }

    return NextResponse.json({
      ok: true,
      providerConfigured: true,
      message: 'Thank you for subscribing to the D2J Weekly Digest.',
    });
  } catch {
    return NextResponse.json({ error: 'Unable to process newsletter request.' }, { status: 500 });
  }
}
