import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, ContactSubmission } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, enquiryType, organisation, subject, articleUrl, message } = body;

    if (!name?.trim() || !email?.trim() || !enquiryType?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Please complete your name, email, enquiry type, and message.' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const db = getDb();
    const newContact: ContactSubmission = {
      id: `contact-${Date.now()}`,
      name: String(name).trim().slice(0, 120),
      email: String(email).trim().slice(0, 160),
      enquiryType: String(enquiryType).trim().slice(0, 80),
      organisation: organisation ? String(organisation).trim().slice(0, 160) : undefined,
      subject: subject ? String(subject).trim().slice(0, 200) : undefined,
      articleUrl: articleUrl ? String(articleUrl).trim().slice(0, 500) : undefined,
      message: String(message).trim().slice(0, 8000),
      submittedAt: new Date().toISOString(),
      status: 'New',
    };

    db.contactSubmissions.unshift(newContact);
    saveDb(db);

    return NextResponse.json({
      ok: true,
      id: newContact.id,
      message: 'Your message has been logged with the D2J Media Hub team.',
    });
  } catch {
    return NextResponse.json({ error: 'Unable to send message right now.' }, { status: 500 });
  }
}
