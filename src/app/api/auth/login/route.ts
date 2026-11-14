import { NextRequest, NextResponse } from 'next/server';
import { ensureDbSynced, writeDbAsync, hashPassword } from '@/lib/db';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

const SUPER_ADMIN_EMAIL_ALIASES = new Set([
  'lawalsodiq915@gmail.com',
  'admin@dpathtojannah.com',
  'admin@d2jmediahub.local',
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '').trim();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const db = await ensureDbSynced();
    const passwordHash = hashPassword(password);

    const user = db.users.find((u) => {
      if (!u.active) return false;
      const emailMatches =
        u.email.toLowerCase() === email ||
        (u.id === 'usr-admin' && SUPER_ADMIN_EMAIL_ALIASES.has(email));
      return emailMatches && u.passwordHash === passwordHash;
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password. Please check your credentials and try again.' },
        { status: 401 }
      );
    }

    // If Super Admin logged in with their chosen email, persist it on usr-admin
    if (user.id === 'usr-admin' && email !== 'admin@d2jmediahub.local') {
      user.email = email;
    }

    user.lastLoginAt = new Date().toISOString();
    await writeDbAsync(db);

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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    });

    return res;
  } catch {
    return NextResponse.json({ error: 'Authentication error.' }, { status: 500 });
  }
}
