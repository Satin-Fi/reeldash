import { NextRequest, NextResponse } from "next/server";
import youtubedl from "youtube-dl-exec";

export const dynamic = "force-dynamic";

// In-memory short-lived resolution cache (10 minutes per shortcode)
const mediaCache = new Map<string, { cdnUrl: string; expiresAt: number }>();

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

  // 1. Check in-memory resolution cache
  const cached = mediaCache.get(shortcode);
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json({
      status: "available",
      playbackUrl: cached.cdnUrl,
      expiresAt: cached.expiresAt,
      isTemporary: true,
    });
  }

  const targetUrl = instagramUrl || `https://www.instagram.com/reel/${shortcode}/`;

  // 2. Resolve Reel reference to actual Instagram CDN .mp4 URL
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
      setTimeout(() => reject(new Error("Resolution timeout")), 5000)
    );

    const ytdlOutput: any = await Promise.race([ytdlPromise, timeoutPromise]);

    let directCdnMp4Url = "";
    if (ytdlOutput?.url && ytdlOutput.url.startsWith("http")) {
      directCdnMp4Url = ytdlOutput.url;
    } else if (ytdlOutput?.formats && ytdlOutput.formats.length > 0) {
      const videoFormat =
        ytdlOutput.formats.find(
          (f: any) => f.vcodec !== "none" && f.url && f.url.startsWith("http")
        ) || ytdlOutput.formats[0];
      directCdnMp4Url = videoFormat?.url || "";
    }

    if (directCdnMp4Url && directCdnMp4Url.startsWith("http")) {
      // CDN URLs are temporary (cache for 10 minutes)
      const expiresAt = Date.now() + 600 * 1000;
      mediaCache.set(shortcode, { cdnUrl: directCdnMp4Url, expiresAt });

      return NextResponse.json({
        status: "available",
        playbackUrl: directCdnMp4Url,
        expiresAt,
        isTemporary: true,
      });
    }
  } catch (err) {
    console.warn(`[Backend Playback Resolution] Failed to resolve CDN media for ${shortcode}:`, err);
  }

  // 3. If resolution fails or is restricted, return clean unavailable status
  // NEVER substitute random or unrelated videos
  return NextResponse.json({
    status: "unavailable",
    reason: "Direct media resource restricted by source provider",
    sourceUrl: targetUrl,
    shortcode,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return GET(req, { params });
}
