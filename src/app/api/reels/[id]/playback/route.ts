import { NextRequest, NextResponse } from "next/server";
import youtubedl from "youtube-dl-exec";

export const dynamic = "force-dynamic";

// In-memory short-lived resolution cache (15 minutes per shortcode)
const mediaCache = new Map<string, { cdnUrl: string; proxyUrl: string; expiresAt: number }>();

/**
 * Pure JS extraction strategies (works without Python on Vercel Serverless)
 */
async function resolveViaPureJs(shortcode: string): Promise<string | null> {
  // Strategy A: Instagram GraphQL doc_id query
  try {
    const gqlRes = await fetch(
      `https://www.instagram.com/graphql/query/?doc_id=8845758582119845&variables=%7B%22shortcode%22%3A%22${shortcode}%22%7D`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          "X-IG-App-ID": "936619743392459",
          "X-Requested-With": "XMLHttpRequest",
          "Referer": `https://www.instagram.com/reel/${shortcode}/`,
          "Accept": "*/*",
        },
      }
    );

    if (gqlRes.ok) {
      const gqlData = await gqlRes.json();
      const item = gqlData?.data?.xdt_shortcode_media;
      if (item?.is_video && item?.video_url) {
        return item.video_url;
      }
    }
  } catch (err) {
    // Continue to next strategy
  }

  // Strategy B: Public Instagram API Resolver Worker
  try {
    const workerRes = await fetch(
      `https://api.vkrdownloader.com/server?vkr=https://www.instagram.com/reel/${shortcode}/`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Accept": "application/json",
        },
      }
    );

    if (workerRes.ok) {
      const workerData = await workerRes.json();
      if (workerData?.data?.url && workerData.data.url.startsWith("http")) {
        return workerData.data.url;
      }
      if (Array.isArray(workerData?.data?.downloads) && workerData.data.downloads.length > 0) {
        const vid = workerData.data.downloads.find((d: any) => d.url && d.url.includes(".mp4"));
        if (vid?.url) return vid.url;
      }
    }
  } catch (err) {
    // Continue to next strategy
  }

  // Strategy C: FastDL parser API
  try {
    const fastdlRes = await fetch("https://fastdl.app/c/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Referer": "https://fastdl.app/en",
      },
      body: new URLSearchParams({
        url: `https://www.instagram.com/reel/${shortcode}/`,
        lang_code: "en",
      }),
    });

    if (fastdlRes.ok) {
      const text = await fastdlRes.text();
      const mp4Match =
        text.match(/https:\/\/[^"'\s\\]+cdninstagram\.com[^"'\s\\]+\.mp4[^"'\s\\]*/i) ||
        text.match(/https:\/\/media\.fastdl\.app\/get\?[^"'\s\\]+/i);
      if (mp4Match) {
        return mp4Match[0].replace(/&amp;/g, "&");
      }
    }
  } catch (err) {
    // Continue to yt-dlp
  }

  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const reelId = params.id;
  const { searchParams } = new URL(req.url);
  const instagramUrl = searchParams.get("url");
  const forceRefresh = searchParams.get("refresh") === "true";

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
  if (!forceRefresh) {
    const cached = mediaCache.get(shortcode);
    if (cached && Date.now() < cached.expiresAt) {
      return NextResponse.json({
        status: "available",
        playbackUrl: cached.proxyUrl,
        directCdnUrl: cached.cdnUrl,
        expiresAt: cached.expiresAt,
        isTemporary: true,
      });
    }
  }

  const targetUrl = instagramUrl || `https://www.instagram.com/reel/${shortcode}/`;

  let directCdnMp4Url: string | null = null;

  // 2. Try Pure-JS Extractors first (serverless friendly)
  try {
    directCdnMp4Url = await resolveViaPureJs(shortcode);
  } catch (err) {
    console.warn(`[PureJS Resolution] error for ${shortcode}:`, err);
  }

  // 3. Fallback to yt-dlp if pure JS didn't resolve and environment supports it
  if (!directCdnMp4Url) {
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
        setTimeout(() => reject(new Error("yt-dlp timeout")), 4000)
      );

      const ytdlOutput: any = await Promise.race([ytdlPromise, timeoutPromise]);

      if (ytdlOutput?.url && ytdlOutput.url.startsWith("http")) {
        directCdnMp4Url = ytdlOutput.url;
      } else if (ytdlOutput?.formats && ytdlOutput.formats.length > 0) {
        const videoFormat =
          ytdlOutput.formats.find(
            (f: any) => f.vcodec !== "none" && f.url && f.url.startsWith("http")
          ) || ytdlOutput.formats[0];
        directCdnMp4Url = videoFormat?.url || null;
      }
    } catch (err) {
      console.warn(`[yt-dlp Resolution] Notice for ${shortcode}:`, err);
    }
  }

  // 4. Return stream if resolved
  if (directCdnMp4Url && directCdnMp4Url.startsWith("http")) {
    const expiresAt = Date.now() + 900 * 1000; // 15 minutes cache
    const proxyUrl = `/api/proxy-video?url=${encodeURIComponent(directCdnMp4Url)}`;

    mediaCache.set(shortcode, { cdnUrl: directCdnMp4Url, proxyUrl, expiresAt });

    return NextResponse.json({
      status: "available",
      playbackUrl: proxyUrl,
      directCdnUrl: directCdnMp4Url,
      expiresAt,
      isTemporary: true,
    });
  }

  // 5. If resolution fails or is restricted, return clean unavailable status
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
