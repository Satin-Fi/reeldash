import { NextRequest, NextResponse } from "next/server";
import youtubedl from "youtube-dl-exec";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { url, shortcode: passedShortcode } = await req.json();

    let shortcode = passedShortcode;
    if (!shortcode && url) {
      const match = url.match(/(?:reel|p)\/([A-Za-z0-9_-]+)/);
      if (match) shortcode = match[1];
    }

    if (!shortcode && !url) {
      return NextResponse.json(
        { resolved: false, error: "Missing Reel reference URL or shortcode" },
        { status: 400 }
      );
    }

    const reelUrl = url || `https://www.instagram.com/reel/${shortcode}/`;

    // Attempt resolution via backend media extraction layer
    try {
      const ytdlPromise = youtubedl(reelUrl, {
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
        setTimeout(() => reject(new Error("Resolution timeout")), 3500)
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
        return NextResponse.json({
          resolved: true,
          mediaUrl: directMediaUrl,
          streamEndpoint: `/api/video-stream?shortcode=${shortcode}`,
          isTemporary: true,
          expiresInSeconds: 86400,
        });
      }
    } catch (resolutionErr) {
      console.warn("Backend media resolution attempt notice:", resolutionErr);
    }

    // If resolution is not permitted or unavailable, return clean failure
    // NEVER substitute random or unrelated video files
    return NextResponse.json({
      resolved: false,
      reason: "Direct media resource restricted by source provider",
      sourceUrl: reelUrl,
      shortcode,
    });
  } catch (error) {
    console.error("Media resolution endpoint error:", error);
    return NextResponse.json(
      {
        resolved: false,
        error: "Failed to resolve media resource",
      },
      { status: 500 }
    );
  }
}
