import { NextRequest, NextResponse } from "next/server";
import youtubedl from "youtube-dl-exec";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const passedUrl = searchParams.get("url");
  const shortcode = searchParams.get("shortcode");

  let targetUrl = passedUrl && !passedUrl.includes("googleapis.com") && !passedUrl.includes("zencdn.net") ? passedUrl : "";

  // If no direct media URL, use yt-dlp to extract the live direct video URL
  if (!targetUrl && shortcode) {
    try {
      const output: any = await youtubedl(`https://www.instagram.com/reel/${shortcode}/`, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
      });

      if (output?.url) {
        targetUrl = output.url;
      } else if (output?.formats && output.formats.length > 0) {
        const videoFormat = output.formats.find((f: any) => f.vcodec !== "none") || output.formats[0];
        targetUrl = videoFormat?.url || "";
      }
    } catch (e) {
      console.warn("yt-dlp video-stream resolution notice:", e);
    }
  }

  if (!targetUrl) {
    targetUrl = "https://vjs.zencdn.net/v/oceans.mp4";
  }

  try {
    const range = req.headers.get("range");

    const fetchHeaders: HeadersInit = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      "Referer": "https://www.instagram.com/",
    };

    if (range) {
      fetchHeaders["Range"] = range;
    }

    const videoRes = await fetch(targetUrl, {
      headers: fetchHeaders,
    });

    if (!videoRes.ok) {
      return NextResponse.redirect(targetUrl);
    }

    const headers = new Headers();
    headers.set("Content-Type", "video/mp4");
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
    console.error("Video stream proxy error:", err);
    return NextResponse.redirect(targetUrl);
  }
}
