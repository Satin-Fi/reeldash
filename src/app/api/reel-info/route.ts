import { NextRequest, NextResponse } from "next/server";
import youtubedl from "youtube-dl-exec";

export const dynamic = "force-dynamic";

function decodeEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x1f45f;/g, "👟")
    .replace(/&#x1f3c3;/g, "🏃")
    .replace(/&#x200d;/g, "")
    .replace(/&#x2640;/g, "♀")
    .replace(/&#xfe0f;/g, "")
    .replace(/&#x1f37a;/g, "🍺")
    .replace(/&#x1f3c1;/g, "🏁")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => {
      try {
        return String.fromCodePoint(parseInt(code, 16));
      } catch {
        return "";
      }
    })
    .replace(/&#([0-9]+);/g, (_, code) => {
      try {
        return String.fromCodePoint(parseInt(code, 10));
      } catch {
        return "";
      }
    });
}

async function resolveDirectVideoUrl(shortcode: string): Promise<string | null> {
  const metaToken =
    process.env.INSTAGRAM_ACCESS_TOKEN ||
    process.env.GRAPH_API_TOKEN ||
    process.env.META_ACCESS_TOKEN;
  const sessionId = process.env.INSTAGRAM_SESSION_ID;
  const rapidApiKey = process.env.RAPIDAPI_KEY;

  // 1. Official Meta Graph API
  if (metaToken) {
    try {
      const graphRes = await fetch(
        `https://graph.instagram.com/v19.0/${shortcode}?fields=id,media_type,media_url,thumbnail_url,caption&access_token=${metaToken}`
      );
      if (graphRes.ok) {
        const graphData = await graphRes.json();
        if (graphData?.media_url && graphData.media_url.startsWith("http")) {
          return graphData.media_url;
        }
      }
    } catch (e) {
      // Continue
    }
  }

  // 2. GraphQL with Session if available
  try {
    const headers: HeadersInit = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      "X-IG-App-ID": "936619743392459",
      "X-Requested-With": "XMLHttpRequest",
      "Referer": `https://www.instagram.com/reel/${shortcode}/`,
    };
    if (sessionId) {
      headers["Cookie"] = `sessionid=${sessionId};`;
    }
    const gqlRes = await fetch(
      `https://www.instagram.com/graphql/query/?doc_id=8845758582119845&variables=%7B%22shortcode%22%3A%22${shortcode}%22%7D`,
      { headers }
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

  // 3. RapidAPI Scraper if available
  if (rapidApiKey) {
    try {
      const res = await fetch(
        `https://instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com/get-info-shortcode?shortcode=${shortcode}`,
        {
          headers: {
            "x-rapidapi-key": rapidApiKey,
            "x-rapidapi-host": "instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const vid = data?.video_url || data?.url || data?.download_url;
        if (vid && vid.startsWith("http")) return vid;
      }
    } catch (e) {
      // Continue
    }
  }

  // 4. FastDL parser API
  try {
    const fastdlRes = await fetch("https://fastdl.app/c/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://fastdl.app/en",
      },
      body: new URLSearchParams({
        url: `https://www.instagram.com/reel/${shortcode}/`,
        lang_code: "en",
      }),
    });
    if (fastdlRes.ok) {
      const text = await fastdlRes.text();
      const match =
        text.match(/https:\/\/[^"'\s\\]+cdninstagram\.com[^"'\s\\]+\.mp4[^"'\s\\]*/i) ||
        text.match(/https:\/\/media\.fastdl\.app\/get\?[^"'\s\\]+/i);
      if (match) return match[0].replace(/&amp;/g, "&");
    }
  } catch (e) {
    // Continue
  }

  // 5. yt-dlp execution
  try {
    const ytdlPromise = youtubedl(`https://www.instagram.com/reel/${shortcode}/`, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: [
        "referer:instagram.com",
        "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      ],
    });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("yt-dlp timeout")), 3000)
    );
    const output: any = await Promise.race([ytdlPromise, timeoutPromise]);
    if (output?.url && output.url.startsWith("http")) {
      return output.url;
    } else if (output?.formats && output.formats.length > 0) {
      const videoFormat =
        output.formats.find(
          (f: any) => f.vcodec !== "none" && f.url && f.url.startsWith("http")
        ) || output.formats[0];
      return videoFormat?.url || null;
    }
  } catch (e) {
    // End
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    let shortcode: string | null = null;
    let creatorUsername = "";
    let creatorFullName = "";
    let caption = "";
    let likes = "";
    let commentsCount = "";
    let hashtags: string[] = [];
    let mediaUrl = "";
    let thumbnailUrl = "";

    const reelMatch = url.match(/(?:reel|p)\/([A-Za-z0-9_-]+)/);
    if (reelMatch) {
      shortcode = reelMatch[1];
    }

    const userMatch = url.match(/instagram\.com\/([A-Za-z0-9_.]+)\/(?:reel|p)\//);
    if (userMatch && userMatch[1] && userMatch[1] !== "reel" && userMatch[1] !== "p") {
      creatorUsername = userMatch[1];
    }

    // 1. OpenGraph Extraction (Instant & highly reliable)
    if (shortcode) {
      try {
        const ogRes = await fetch(`https://www.instagram.com/p/${shortcode}/`, {
          headers: {
            "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
          next: { revalidate: 3600 },
        });

        if (ogRes.ok) {
          const html = await ogRes.text();

          const ogTitleMatch =
            html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]*)"/i) ||
            html.match(/content="([^"]*)"\s+property="og:title"/i);
          const ogDescMatch =
            html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]*)"/i) ||
            html.match(/content="([^"]*)"\s+property="og:description"/i);

          const ogTitle = ogTitleMatch ? decodeEntities(ogTitleMatch[1]) : "";
          const ogDesc = ogDescMatch ? decodeEntities(ogDescMatch[1]) : "";

          if (ogTitle && !creatorFullName) {
            const titleMatch = ogTitle.match(/^(.+?)\s+on\s+Instagram\s*:/i);
            if (titleMatch) {
              creatorFullName = titleMatch[1].trim();
            }
          }

          if (ogDesc) {
            const descMatch = ogDesc.match(
              /^(?:([0-9,KkMm\.]+\s+likes)?,?\s*)?(?:([0-9,KkMm\.]+\s+comments)?\s*-\s*)?([a-zA-Z0-9_\.]+)\s+on\s+[^:]+:\s*"?([\s\S]*?)"?\s*\.?\s*$/i
            );

            if (descMatch) {
              if (descMatch[1] && !likes) likes = descMatch[1].trim();
              if (descMatch[2] && !commentsCount) commentsCount = descMatch[2].trim();
              if (descMatch[3] && !creatorUsername) creatorUsername = descMatch[3].trim();
              if (descMatch[4] && !caption) caption = descMatch[4].trim();
            }
          }

          if (!caption && ogTitle.includes(":")) {
            caption = ogTitle.substring(ogTitle.indexOf(":") + 1).trim().replace(/^"|"$/g, "");
          }
        }
      } catch (ogErr) {
        console.warn("OpenGraph notice:", ogErr);
      }
    }

    // 2. Direct Video Resolution
    if (shortcode) {
      try {
        const resolvedVideo = await resolveDirectVideoUrl(shortcode);
        if (resolvedVideo && resolvedVideo.startsWith("http")) {
          mediaUrl = resolvedVideo;
        }
      } catch (vidErr) {
        console.warn("Direct video resolution notice:", vidErr);
      }
    }

    if (!creatorUsername) {
      if (creatorFullName) {
        creatorUsername = creatorFullName.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      } else {
        creatorUsername = shortcode ? `reels_${shortcode.substring(0, 6)}` : "instagram_creator";
      }
    }

    if (!creatorFullName) {
      creatorFullName = creatorUsername;
    }

    if (!caption) {
      caption = `Saved Instagram Reel (${shortcode || "video"})`;
    }

    const extractedTags = caption.match(/#[A-Za-z0-9_]+/g);
    if (extractedTags) {
      hashtags = Array.from(new Set(extractedTags));
    }

    if (!thumbnailUrl && shortcode) {
      thumbnailUrl = `/api/proxy-image?shortcode=${shortcode}`;
    }

    // AI Categorization engine
    let category = "General";
    const lowerCaption = (caption + " " + hashtags.join(" ")).toLowerCase();
    if (
      lowerCaption.includes("workout") ||
      lowerCaption.includes("exercise") ||
      lowerCaption.includes("gym") ||
      lowerCaption.includes("posture") ||
      lowerCaption.includes("fitness") ||
      lowerCaption.includes("health") ||
      lowerCaption.includes("sleep") ||
      lowerCaption.includes("run") ||
      lowerCaption.includes("race") ||
      lowerCaption.includes("marathon")
    ) {
      category = "Health & Fitness";
    } else if (
      lowerCaption.includes("recipe") ||
      lowerCaption.includes("cook") ||
      lowerCaption.includes("food") ||
      lowerCaption.includes("paneer") ||
      lowerCaption.includes("dinner") ||
      lowerCaption.includes("kitchen") ||
      lowerCaption.includes("dish") ||
      lowerCaption.includes("beer")
    ) {
      category = "Food & Cooking";
    } else if (
      lowerCaption.includes("ai") ||
      lowerCaption.includes("code") ||
      lowerCaption.includes("python") ||
      lowerCaption.includes("tech") ||
      lowerCaption.includes("software") ||
      lowerCaption.includes("agent") ||
      lowerCaption.includes("developer")
    ) {
      category = "AI & Tech";
    } else if (
      lowerCaption.includes("design") ||
      lowerCaption.includes("ui") ||
      lowerCaption.includes("figma") ||
      lowerCaption.includes("ux") ||
      lowerCaption.includes("spacing") ||
      lowerCaption.includes("fits") ||
      lowerCaption.includes("fashion") ||
      lowerCaption.includes("style")
    ) {
      category = "Design";
    } else if (
      lowerCaption.includes("productivity") ||
      lowerCaption.includes("system") ||
      lowerCaption.includes("habit") ||
      lowerCaption.includes("time") ||
      lowerCaption.includes("notion") ||
      lowerCaption.includes("focus") ||
      lowerCaption.includes("motivation")
    ) {
      category = "Productivity";
    }

    return NextResponse.json({
      shortcode,
      creatorUsername,
      creatorFullName,
      caption,
      hashtags,
      likes,
      commentsCount,
      thumbnailUrl: thumbnailUrl || `/api/proxy-image?shortcode=${shortcode}`,
      mediaUrl,
      category,
    });
  } catch (error) {
    console.error("Reel metadata extraction error:", error);
    return NextResponse.json({ error: "Failed to process Reel metadata" }, { status: 500 });
  }
}
