import { NextRequest, NextResponse } from 'next/server';
import { ensureDbSynced, writeDbAsync, hashPassword } from '@/lib/db';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 5;
const failedLoginTracker = new Map<string, { count: number; firstAttemptAt: number }>();

function getClientKey(req: NextRequest, email: string): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  return `${forwarded}:${email}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const clientKey = getClientKey(req, email);
    const now = Date.now();
    const existingAttempt = failedLoginTracker.get(clientKey);
    if (existingAttempt) {
      if (now - existingAttempt.firstAttemptAt > LOGIN_WINDOW_MS) {
        failedLoginTracker.delete(clientKey);
      } else if (existingAttempt.count >= MAX_FAILED_ATTEMPTS) {
        return NextResponse.json(
          {
            error:
              'Too many failed login attempts. Please wait 15 minutes before trying again.',
          },
          { status: 429 }
        );
      }
    }

    const db = await ensureDbSynced();
    const passwordHash = hashPassword(password);
    const user = db.users.find(
      (u) => u.email.toLowerCase() === email && u.passwordHash === passwordHash && u.active
    );

    if (!user) {
      const prev = failedLoginTracker.get(clientKey);
      if (!prev || now - prev.firstAttemptAt > LOGIN_WINDOW_MS) {
        failedLoginTracker.set(clientKey, { count: 1, firstAttemptAt: now });
      } else {
        prev.count += 1;
      }
      return NextResponse.json(
        { error: 'Invalid credentials or inactive editorial account.' },
        { status: 401 }
      );
    }

    failedLoginTracker.delete(clientKey);
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
