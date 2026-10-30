import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, ScholarQuestion } from '@/lib/db';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      topic,
      subject,
      questionText,
      displayName,
      email,
      anonymousPreference,
      consentGiven,
    } = body;

    if (!topic?.trim() || !subject?.trim() || !questionText?.trim() || !consentGiven) {
      return NextResponse.json(
        { error: 'Please provide a topic, subject, question text, and review consent.' },
        { status: 400 }
      );
    }

    if (String(questionText).trim().length < 20) {
      return NextResponse.json(
        { error: 'Please provide at least 20 characters of detail for your question.' },
        { status: 400 }
      );
    }

    if (email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    const db = getDb();
    const id = `qa-${Date.now()}`;
    const newQuestion: ScholarQuestion = {
      id,
      slug: `${slugify(subject)}-${Date.now().toString().slice(-4)}`,
      topic: String(topic).trim(),
      subject: String(subject).trim().slice(0, 200),
      questionText: String(questionText).trim().slice(0, 8000),
      displayName: displayName ? String(displayName).trim().slice(0, 100) : 'Anonymous Questioner',
      email: email ? String(email).trim().slice(0, 160) : undefined,
      anonymousPreference: Boolean(anonymousPreference),
      consentGiven: Boolean(consentGiven),
      submittedAt: new Date().toISOString(),
      // CRITICAL SAFEGUARD: Always stored as Private Submission initially — never auto-published or AI-answered
      status: 'Private Submission',
    };

    db.scholarQuestions.unshift(newQuestion);
    saveDb(db);

    return NextResponse.json({
      ok: true,
      id: newQuestion.id,
      status: newQuestion.status,
      message:
        'Your question has been received privately by the D2J Scholarly Review Desk. Questions are never published automatically.',
    });
  } catch {
    return NextResponse.json({ error: 'Unable to submit your question at this time.' }, { status: 500 });
  }
}
