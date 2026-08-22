import { NextRequest, NextResponse } from "next/server";
import youtubedl from "youtube-dl-exec";

export const dynamic = "force-dynamic";

async function resolveDirectVideoUrl(shortcode: string): Promise<string | null> {
  // Strategy 1: GraphQL doc_id
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
  } catch (e) {
    // Continue
  }

  // Strategy 2: FastDL parser
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
  } catch (e) {
    // Continue
  }

  // Strategy 3: Dedicated parsing worker
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
  } catch (e) {
    // Continue
  }

  // Strategy 4: yt-dlp execution
  try {
    const ytdlPromise = youtubedl(`https://www.instagram.com/reel/${shortcode}/`, {
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
      return ytdlOutput.url;
    } else if (ytdlOutput?.formats && ytdlOutput.formats.length > 0) {
      const videoFormat =
        ytdlOutput.formats.find(
          (f: any) => f.vcodec !== "none" && f.url && f.url.startsWith("http")
        ) || ytdlOutput.formats[0];
      return videoFormat?.url || null;
    }
  } catch (e) {
    // End of strategies
  }

  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const directUrl = searchParams.get("url");
  const shortcodeParam = searchParams.get("shortcode");
  const reelUrl = searchParams.get("reelUrl");

  let shortcode = shortcodeParam;
  if (!shortcode && reelUrl) {
    const match = reelUrl.match(/(?:reel|p)\/([A-Za-z0-9_-]+)/);
    if (match) shortcode = match[1];
  }

  let downloadUrl = directUrl && directUrl.startsWith("http") ? directUrl : null;

  if (!downloadUrl && shortcode) {
    downloadUrl = await resolveDirectVideoUrl(shortcode);
  }

  if (!downloadUrl) {
    return NextResponse.json(
      {
        error: "Unable to resolve direct MP4 video stream. Instagram stream may be private or restricted.",
        shortcode,
      },
      { status: 404 }
    );
  }

  try {
    const videoFetch = await fetch(downloadUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Referer": "https://www.instagram.com/",
      },
      referrerPolicy: "no-referrer",
    });

    if (!videoFetch.ok) {
      return NextResponse.json(
        { error: "Upstream Instagram CDN returned error during download", status: videoFetch.status },
        { status: 502 }
      );
    }

    const headers = new Headers();
    headers.set("Content-Type", "video/mp4");
    headers.set(
      "Content-Disposition",
      `attachment; filename="reel_${shortcode || "download"}.mp4"`
    );

    const contentLength = videoFetch.headers.get("content-length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    const buffer = await videoFetch.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("[Download Route] error:", error);
    return NextResponse.json(
      { error: "Failed to download media stream" },
      { status: 500 }
    );
  }
}
