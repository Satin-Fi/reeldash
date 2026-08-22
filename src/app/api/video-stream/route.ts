import { NextRequest, NextResponse } from "next/server";
import youtubedl from "youtube-dl-exec";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const passedUrl = searchParams.get("url");
  const shortcode = searchParams.get("shortcode");

  let targetUrl =
    passedUrl &&
    !passedUrl.includes("zencdn.net") &&
    !passedUrl.includes("googleapis.com") &&
    passedUrl.startsWith("http")
      ? passedUrl
      : "";

  // Attempt backend resolution on demand if not provided
  if (!targetUrl && shortcode) {
    try {
      const ytdlPromise = youtubedl(`https://www.instagram.com/reel/${shortcode}/`, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Stream resolution timeout")), 3500)
      );

      const output: any = await Promise.race([ytdlPromise, timeoutPromise]);

      if (output?.url) {
        targetUrl = output.url;
      } else if (output?.formats && output.formats.length > 0) {
        const videoFormat =
          output.formats.find((f: any) => f.vcodec !== "none" && f.url) || output.formats[0];
        targetUrl = videoFormat?.url || "";
      }
    } catch (err) {
      console.warn("Backend media stream resolution notice:", err);
    }
  }

  // Strictly enforce: NEVER substitute unrelated or random placeholder videos
  if (!targetUrl || !targetUrl.startsWith("http")) {
    return NextResponse.json(
      {
        error: "Media stream unavailable or restricted by source provider",
        shortcode,
      },
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

    const videoRes = await fetch(targetUrl, {
      headers: fetchHeaders,
    });

    if (!videoRes.ok) {
      return NextResponse.json(
        { error: "Source media stream inaccessible" },
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
    console.error("ReelDash media stream error:", err);
    return NextResponse.json(
      { error: "Failed to stream media resource" },
      { status: 500 }
    );
  }
}
