import { NextRequest, NextResponse } from "next/server";
import youtubedl from "youtube-dl-exec";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { shortcode: string } }
) {
  const shortcode = params.shortcode;

  if (!shortcode) {
    return NextResponse.json({ error: "Missing shortcode" }, { status: 400 });
  }

  let directUrl = "";

  // 1. Resolve direct media URL on demand
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
      setTimeout(() => reject(new Error("Stream extraction timeout")), 4000)
    );

    const output: any = await Promise.race([ytdlPromise, timeoutPromise]);

    if (output?.url) {
      directUrl = output.url;
    } else if (output?.formats && output.formats.length > 0) {
      const videoFormat =
        output.formats.find((f: any) => f.vcodec !== "none" && f.url) || output.formats[0];
      directUrl = videoFormat?.url || "";
    }
  } catch (err) {
    console.warn(`[Stream Proxy] Failed to extract direct stream for ${shortcode}:`, err);
  }

  // Strictly enforce: Never return random fallback videos
  if (!directUrl || !directUrl.startsWith("http")) {
    return NextResponse.json(
      { error: "Media stream unavailable for this Reel" },
      { status: 404 }
    );
  }

  try {
    const range = req.headers.get("range");

    const fetchHeaders: HeadersInit = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      Referer: "https://www.instagram.com/",
    };

    if (range) {
      fetchHeaders["Range"] = range;
    }

    const videoRes = await fetch(directUrl, {
      headers: fetchHeaders,
    });

    if (!videoRes.ok) {
      return NextResponse.json(
        { error: "Upstream media resource returned non-200" },
        { status: 502 }
      );
    }

    const headers = new Headers();
    headers.set("Content-Type", "video/mp4");
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");

    const contentLength = videoRes.headers.get("content-length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    const contentRange = videoRes.headers.get("content-range");
    if (contentRange) {
      headers.set("Content-Range", contentRange);
    }

    const buffer = await videoRes.arrayBuffer();

    return new NextResponse(buffer, {
      status: videoRes.status,
      headers,
    });
  } catch (err) {
    console.error(`[Stream Proxy] Streaming error for ${shortcode}:`, err);
    return NextResponse.json(
      { error: "Internal streaming error" },
      { status: 500 }
    );
  }
}
