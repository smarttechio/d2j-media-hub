import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ensureDbSynced, getPublishedArticleBySlug } from "@/lib/db";
import { getEffectiveFeaturedImage } from "@/components/ArticleCards";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  await ensureDbSynced();
  const article = getPublishedArticleBySlug(slug);
  const imgSource = article ? getEffectiveFeaturedImage(article) : undefined;

  if (imgSource && imgSource.startsWith("data:image/")) {
    const match = imgSource.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (match) {
      const mimeType = match[1];
      const buffer = Buffer.from(match[2], "base64");
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
    }
  }

  if (imgSource && /^https?:\/\//i.test(imgSource)) {
    return NextResponse.redirect(imgSource, 302);
  }

  if (imgSource && imgSource.startsWith("/")) {
    const localPath = path.join(process.cwd(), "public", imgSource);
    if (fs.existsSync(localPath)) {
      const ext = path.extname(localPath).toLowerCase();
      const mime =
        ext === ".png"
          ? "image/png"
          : ext === ".webp"
          ? "image/webp"
          : ext === ".gif"
          ? "image/gif"
          : "image/jpeg";
      const buf = fs.readFileSync(localPath);
      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": mime,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }
  }

  // Fallback to official logo
  const fallbackLogo = path.join(process.cwd(), "public", "logo.webp");
  if (fs.existsSync(fallbackLogo)) {
    const buf = fs.readFileSync(fallbackLogo);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  return new NextResponse("Image not found", { status: 404 });
}
