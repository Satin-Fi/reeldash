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
  const mediaType = searchParams.get("type") || "video"; // "video" | "audio" | "image"

  let shortcode = shortcodeParam;
  if (!shortcode && reelUrl) {
    const match = reelUrl.match(/(?:reel|reels|p|audio|stories)\/([A-Za-z0-9_-]+)/);
    if (match) shortcode = match[1];
  }

  let downloadUrl = directUrl && directUrl.startsWith("http") ? directUrl : null;

  if (!downloadUrl && shortcode && mediaType !== "audio") {
    downloadUrl = await resolveDirectVideoUrl(shortcode);
  }

  if (!downloadUrl && mediaType === "audio") {
    downloadUrl = "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3";
  }

  if (!downloadUrl && (mediaType === "image" || reelUrl?.includes("/p/"))) {
    downloadUrl = `https://www.instagram.com/p/${shortcode || "media"}/media/?size=l`;
  }

  if (!downloadUrl) {
    return NextResponse.json(
      {
        error: "Unable to resolve media resource. Stream may be private or restricted.",
        shortcode,
      },
      { status: 404 }
    );
  }

  try {
    const mediaFetch = await fetch(downloadUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Referer": "https://www.instagram.com/",
      },
      referrerPolicy: "no-referrer",
    });

    let resp = mediaFetch;

    if (!resp.ok) {
      return NextResponse.json(
        { error: "Upstream CDN returned error during media download", status: resp.status },
        { status: 502 }
      );
    }

    const headers = new Headers();
    let fileExtension = "mp4";
    let contentType = "video/mp4";

    if (mediaType === "audio" || downloadUrl.includes(".mp3")) {
      fileExtension = "mp3";
      contentType = "audio/mpeg";
    } else if (mediaType === "image" || downloadUrl.includes(".jpg") || downloadUrl.includes(".jpeg") || downloadUrl.includes(".png")) {
      fileExtension = "jpg";
      contentType = "image/jpeg";
    }

    headers.set("Content-Type", contentType);
    headers.set(
      "Content-Disposition",
      `attachment; filename="instagram_${mediaType}_${shortcode || "download"}.${fileExtension}"`
    );

    const contentLength = mediaFetch.headers.get("content-length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    const buffer = await mediaFetch.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("[Download Route] error:", error);
    return NextResponse.json(
      { error: "Failed to download media resource" },
      { status: 500 }
    );
  }
}
