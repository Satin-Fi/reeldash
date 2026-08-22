import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get("url");
  const shortcode = searchParams.get("shortcode");

  let targetUrl = videoUrl && !videoUrl.includes("googleapis.com") ? videoUrl : "";

  // If no direct URL provided, try fetching high-definition open stream
  if (!targetUrl) {
    targetUrl = "https://vjs.zencdn.net/v/oceans.mp4";
  }

  try {
    const range = req.headers.get("range");

    const fetchHeaders: HeadersInit = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    };

    if (range) {
      fetchHeaders["Range"] = range;
    }

    const videoRes = await fetch(targetUrl, {
      headers: fetchHeaders,
    });

    if (!videoRes.ok) {
      return NextResponse.redirect("https://vjs.zencdn.net/v/oceans.mp4");
    }

    const headers = new Headers();
    headers.set("Content-Type", "video/mp4");
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "public, max-age=86400");

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
    console.error("Video streaming proxy error:", err);
    return NextResponse.redirect("https://vjs.zencdn.net/v/oceans.mp4");
  }
}
