import { NextRequest, NextResponse } from "next/server";
import youtubedl from "youtube-dl-exec";

export const dynamic = "force-dynamic";

// In-memory short-lived resolution cache (10 minutes per shortcode)
const mediaCache = new Map<string, { mediaUrl: string; expiresAt: number }>();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const reelId = params.id;
  const { searchParams } = new URL(req.url);
  const instagramUrl = searchParams.get("url");

  let shortcode = reelId.replace(/^reel-/, "");
  if (instagramUrl) {
    const match = instagramUrl.match(/(?:reel|p)\/([A-Za-z0-9_-]+)/);
    if (match) shortcode = match[1];
  }

  if (!shortcode && !instagramUrl) {
    return NextResponse.json(
      { status: "unavailable", error: "Missing Reel reference or URL" },
      { status: 400 }
    );
  }

  // 1. Check cache
  const cached = mediaCache.get(shortcode);
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json({
      status: "available",
      playbackUrl: `/api/reels/stream/${shortcode}`,
      directMediaUrl: cached.mediaUrl,
      expiresAt: cached.expiresAt,
    });
  }

  const targetUrl = instagramUrl || `https://www.instagram.com/reel/${shortcode}/`;

  // 2. Resolve media via backend extractor
  try {
    const ytdlPromise = youtubedl(targetUrl, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: [
        "referer:instagram.com",
        "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      ],
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Resolution timeout")), 4000)
    );

    const ytdlOutput: any = await Promise.race([ytdlPromise, timeoutPromise]);

    let directMediaUrl = "";
    if (ytdlOutput?.url) {
      directMediaUrl = ytdlOutput.url;
    } else if (ytdlOutput?.formats && ytdlOutput.formats.length > 0) {
      const videoFormat =
        ytdlOutput.formats.find((f: any) => f.vcodec !== "none" && f.url) || ytdlOutput.formats[0];
      directMediaUrl = videoFormat?.url || "";
    }

    if (directMediaUrl && directMediaUrl.startsWith("http")) {
      const expiresAt = Date.now() + 600 * 1000; // 10 minutes cache
      mediaCache.set(shortcode, { mediaUrl: directMediaUrl, expiresAt });

      return NextResponse.json({
        status: "available",
        playbackUrl: `/api/reels/stream/${shortcode}`,
        directMediaUrl,
        expiresAt,
      });
    }
  } catch (err) {
    console.warn(`[Backend Resolution] Failed to resolve media for ${shortcode}:`, err);
  }

  // 3. If unavailable, return clean unavailable status without random substitutions
  return NextResponse.json({
    status: "unavailable",
    reason: "Direct media resource restricted by Instagram",
    shortcode,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return GET(req, { params });
}
