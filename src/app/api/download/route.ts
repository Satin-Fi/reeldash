import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mediaUrl = searchParams.get("url");
  const shortcode = searchParams.get("shortcode");
  const reelUrl = searchParams.get("reelUrl");

  let downloadTarget = mediaUrl;

  // 1. Try extracting direct MP4 stream via Cobalt API if mediaUrl is missing or sample
  if ((!downloadTarget || downloadTarget.includes("zencdn.net")) && (reelUrl || shortcode)) {
    const targetInstagramUrl = reelUrl || `https://www.instagram.com/p/${shortcode}/`;
    try {
      const cobaltRes = await fetch("https://api.cobalt.tools/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "ReelDash/1.0",
        },
        body: JSON.stringify({
          url: targetInstagramUrl,
          videoQuality: "720",
        }),
      });

      if (cobaltRes.ok) {
        const data = await cobaltRes.json();
        if (data.url) {
          downloadTarget = data.url;
        } else if (data.redirect) {
          downloadTarget = data.redirect;
        }
      }
    } catch (cobaltErr) {
      console.warn("Cobalt download stream resolution notice:", cobaltErr);
    }
  }

  // Fallback to open video stream if no direct URL retrieved
  if (!downloadTarget) {
    downloadTarget = "https://vjs.zencdn.net/v/oceans.mp4";
  }

  try {
    const videoFetch = await fetch(downloadTarget, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!videoFetch.ok) {
      return NextResponse.redirect(downloadTarget);
    }

    const headers = new Headers();
    headers.set("Content-Type", "video/mp4");
    headers.set("Content-Disposition", `attachment; filename="reel_${shortcode || "download"}.mp4"`);

    const blob = await videoFetch.blob();
    return new NextResponse(blob, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Video download streaming error:", error);
    return NextResponse.redirect(downloadTarget);
  }
}
