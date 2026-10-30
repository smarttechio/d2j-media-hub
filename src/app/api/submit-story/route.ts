import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, StorySubmission } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      contributorName,
      email,
      institution,
      location,
      phone,
      category,
      headline,
      summary,
      body: storyBody,
      preferredByline,
      sourceLinks,
      attachments,
      consentGiven,
    } = body;

    if (
      !contributorName?.trim() ||
      !email?.trim() ||
      !category?.trim() ||
      !headline?.trim() ||
      !summary?.trim() ||
      !storyBody?.trim() ||
      !consentGiven
    ) {
      return NextResponse.json(
        { error: 'Please complete all required story submission fields and consent checkboxes.' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    const db = getDb();
    const newSubmission: StorySubmission = {
      id: `story-${Date.now()}`,
      contributorName: String(contributorName).trim().slice(0, 120),
      email: String(email).trim().slice(0, 160),
      institution: institution ? String(institution).trim().slice(0, 160) : undefined,
      location: location ? String(location).trim().slice(0, 120) : undefined,
      phone: phone ? String(phone).trim().slice(0, 40) : undefined,
      category: String(category).trim(),
      headline: String(headline).trim().slice(0, 240),
      summary: String(summary).trim().slice(0, 1000),
      body: String(storyBody).trim().slice(0, 25000),
      preferredByline: preferredByline ? String(preferredByline).trim().slice(0, 120) : undefined,
      sourceLinks: sourceLinks ? String(sourceLinks).trim().slice(0, 2000) : undefined,
      attachments: Array.isArray(attachments)
        ? attachments.slice(0, 3).map((a: { name?: string; size?: number }) => ({
            name: String(a.name || 'attachment').slice(0, 140),
            size: Number(a.size || 0),
          }))
        : [],
      consentGiven: Boolean(consentGiven),
      submittedAt: new Date().toISOString(),
      status: 'Submitted',
    };

    db.storySubmissions.unshift(newSubmission);
    saveDb(db);

    return NextResponse.json({
      ok: true,
      id: newSubmission.id,
      status: newSubmission.status,
      message: 'Your story has been submitted to the D2J Editorial Desk for review.',
    });
  } catch {
    return NextResponse.json({ error: 'Unable to process story submission.' }, { status: 500 });
  }
}
