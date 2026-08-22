import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl || !targetUrl.startsWith("http")) {
    return NextResponse.json(
      { error: "Missing or invalid media URL parameter" },
      { status: 400 }
    );
  }

  // Ensure target is a valid Instagram CDN or media URL
  if (!targetUrl.includes("cdninstagram.com") && !targetUrl.includes("fbcdn.net")) {
    return NextResponse.json(
      { error: "Only authorized CDN media endpoints can be proxied" },
      { status: 403 }
    );
  }

  try {
    const range = req.headers.get("range");

    const fetchHeaders: HeadersInit = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      "Accept": "*/*",
      "Accept-Encoding": "identity",
    };

    if (range) {
      fetchHeaders["Range"] = range;
    }

    const videoRes = await fetch(targetUrl, {
      headers: fetchHeaders,
      referrerPolicy: "no-referrer",
    });

    if (!videoRes.ok) {
      return NextResponse.json(
        { error: `Upstream CDN returned status ${videoRes.status}` },
        { status: videoRes.status }
      );
    }

    const headers = new Headers();
    headers.set("Content-Type", videoRes.headers.get("content-type") || "video/mp4");
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "public, max-age=3600");

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
    console.error("[Proxy Video Stream Error]:", err);
    return NextResponse.json(
      { error: "Failed to stream CDN media resource" },
      { status: 500 }
    );
  }
}
