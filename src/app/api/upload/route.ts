import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCurrentSession, hasPermission, canPublishContent } from '@/lib/auth';
import { ensureDbSynced, writeDbAsync } from '@/lib/db';
import { uploadToSupabaseStorage } from '@/lib/supabase';

const ALLOWED_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
const ALLOWED_VIDEO_EXTS = ['mp4', 'webm', 'ogg', 'mov', 'm4v'];

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised editorial access.' }, { status: 401 });
  }
  if (!hasPermission(session, 'media') && !canPublishContent(session.role, session.permissions)) {
    return NextResponse.json(
      { error: 'Your account does not have permission to upload media assets.' },
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const caption = String(formData.get('caption') || '').trim();
    const credit = String(formData.get('credit') || 'D2J Media Hub').trim();

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'No media file provided.' }, { status: 400 });
    }

    const originalName = file.name || 'media';
    const ext = (originalName.split('.').pop() || '').toLowerCase();
    const isImage = ALLOWED_IMAGE_EXTS.includes(ext);
    const isVideo = ALLOWED_VIDEO_EXTS.includes(ext);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        {
          error:
            'Unsupported file format. Allowed images: JPG, PNG, WEBP, GIF. Allowed videos: MP4, WEBM, MOV, OGG.',
        },
        { status: 400 }
      );
    }

    const maxBytes = isVideo ? 100 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `File exceeds maximum size (${isVideo ? '100 MB for video' : '15 MB for image'}).` },
        { status: 400 }
      );
    }

    const safeBase = originalName
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'd2j-media';

    const finalFilename = `${Date.now()}-${safeBase}.${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mime =
      file.type || (isVideo ? `video/${ext === 'mov' ? 'mp4' : ext}` : `image/${ext === 'jpg' ? 'jpeg' : ext}`);

    // 1. Prefer durable Supabase Object Storage (`d2j-media` bucket) when configured
    let publicUrl = await uploadToSupabaseStorage(finalFilename, buffer, mime);

    // 2. Fallback to local `public/uploads` (development) or base64 data URI (serverless fallback)
    if (!publicUrl) {
      publicUrl = `/uploads/${finalFilename}`;
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        fs.writeFileSync(path.join(uploadsDir, finalFilename), buffer);
      } catch {
        publicUrl = `data:${mime};base64,${buffer.toString('base64')}`;
      }
    }

    // 3. Register in the Media Library & persist
    const db = await ensureDbSynced();
    db.media.unshift({
      id: `med-${Date.now()}`,
      filename: finalFilename,
      url: publicUrl,
      caption: caption || originalName,
      credit: credit || session.name,
      uploadedAt: new Date().toISOString().slice(0, 10),
      uploadedBy: session.name,
    });
    await writeDbAsync(db);

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      filename: finalFilename,
      mediaType: isVideo ? 'video' : 'image',
      media: db.media,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to upload media file.' }, { status: 500 });
  }
}
