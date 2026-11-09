import { NextRequest, NextResponse } from 'next/server';
import {
  ensureDbSynced,
  writeDbAsync,
  ArticleComment,
} from '@/lib/db';

const COMMENT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_COMMENTS_PER_MIN = 4;
const commentRateMap = new Map<string, { count: number; startedAt: number }>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const articleId = searchParams.get('articleId') || '';
  const articleSlug = searchParams.get('articleSlug') || '';

  const db = await ensureDbSynced();
  const list = Array.isArray(db.comments) ? db.comments : [];
  const filtered = list
    .filter(
      (c) =>
        c.status === 'Approved' &&
        ((articleId && c.articleId === articleId) ||
          (articleSlug && c.articleSlug === articleSlug))
    )
    .map(({ authorEmail: _email, ...publicSafe }) => publicSafe)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return NextResponse.json({ ok: true, comments: filtered });
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    const now = Date.now();
    const rateEntry = commentRateMap.get(clientIp);
    if (rateEntry) {
      if (now - rateEntry.startedAt > COMMENT_WINDOW_MS) {
        commentRateMap.set(clientIp, { count: 1, startedAt: now });
      } else if (rateEntry.count >= MAX_COMMENTS_PER_MIN) {
        return NextResponse.json(
          { error: 'Please wait a moment before posting another comment.' },
          { status: 429 }
        );
      } else {
        rateEntry.count += 1;
      }
    } else {
      commentRateMap.set(clientIp, { count: 1, startedAt: now });
    }

    const body = await req.json();
    const articleId = String(body.articleId || '').trim();
    const articleSlug = String(body.articleSlug || '').trim();
    const authorName = String(body.authorName || '').trim();
    const authorEmail = String(body.authorEmail || '').trim();
    const locationOrCampus = String(body.locationOrCampus || '').trim();
    const content = String(body.content || '').trim();

    if (!authorName || authorName.length < 2) {
      return NextResponse.json(
        { error: 'Please enter your name (at least 2 characters).' },
        { status: 400 }
      );
    }

    if (!content || content.length < 5) {
      return NextResponse.json(
        { error: 'Please write a comment of at least 5 characters.' },
        { status: 400 }
      );
    }

    if (content.length > 2500) {
      return NextResponse.json(
        { error: 'Comment is too long (maximum 2,500 characters).' },
        { status: 400 }
      );
    }

    const db = await ensureDbSynced();
    const article = db.articles.find(
      (a) =>
        a.status === 'Published' &&
        ((articleId && a.id === articleId) || (articleSlug && a.slug === articleSlug))
    );

    if (!article) {
      return NextResponse.json({ error: 'Article not found.' }, { status: 404 });
    }

    if (!Array.isArray(db.comments)) {
      db.comments = [];
    }

    const newComment: ArticleComment = {
      id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      articleId: article.id,
      articleSlug: article.slug,
      articleTitle: article.title,
      authorName: authorName.slice(0, 80),
      authorEmail: authorEmail ? authorEmail.slice(0, 140) : undefined,
      locationOrCampus: locationOrCampus ? locationOrCampus.slice(0, 80) : undefined,
      content: content.slice(0, 2500),
      createdAt: new Date().toISOString(),
      status: 'Approved',
    };

    db.comments.unshift(newComment);
    await writeDbAsync(db);

    const { authorEmail: _em, ...publicComment } = newComment;
    return NextResponse.json({
      ok: true,
      comment: publicComment,
      message: 'Your comment has been posted.',
    });
  } catch {
    return NextResponse.json({ error: 'Unable to post comment right now.' }, { status: 500 });
  }
}
