import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb, hashPassword } from '@/lib/db';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const db = readDb();
    const passwordHash = hashPassword(password);
    const user = db.users.find(
      (u) => u.email.toLowerCase() === email && u.passwordHash === passwordHash && u.active
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials or inactive editorial account.' },
        { status: 401 }
      );
    }

    user.lastLoginAt = new Date().toISOString();
    writeDb(db);

    const token = createSessionToken(user);
    const res = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
        isSuperAdmin: user.isSuperAdmin,
        permissions: user.permissions,
      },
    });

    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    });

    return res;
  } catch {
    return NextResponse.json({ error: 'Authentication error.' }, { status: 500 });
  }
}
