import { NextRequest, NextResponse } from "next/server";

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

// ─── Fast concurrent metadata resolver ────────────────────────────────
async function fetchInstagramOEmbed(url: string, signal: AbortSignal) {
  const oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}&omitscript=true`;
  const res = await fetch(oembedUrl, {
    signal,
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" },
  });
  if (!res.ok) throw new Error(`oEmbed failed: ${res.status}`);
  return await res.json();
}

async function fetchOpenGraphMeta(shortcode: string, mediaType: string, signal: AbortSignal) {
  const targetUrl = `https://oginstagram.com/${mediaType === "post" ? "p" : "reel"}/${shortcode}`;
  const res = await fetch(targetUrl, {
    signal,
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discord.app)",
      "Accept": "text/html",
    },
  });
  if (!res.ok) throw new Error(`OG fetch failed: ${res.status}`);
  const html = await res.text();

  const titleMatch = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]*)"/i);
  const descMatch = html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]*)"/i);
  const imgMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]*)"/i);
  const videoMatch = html.match(/<meta\s+(?:property|name)="og:video"\s+content="([^"]*)"/i);

  return {
    title: titleMatch ? decodeEntities(titleMatch[1]) : "",
    description: descMatch ? decodeEntities(descMatch[1]) : "",
    image: imgMatch ? decodeEntities(imgMatch[1]) : "",
    video: videoMatch ? decodeEntities(videoMatch[1]) : "",
  };
}

async function fetchCloudflareWorkerMeta(shortcode: string, signal: AbortSignal) {
  const workerProxy = `https://reeldash-ig-proxy.reeldash-ig-proxy.workers.dev/api/info?url=${encodeURIComponent(
    `https://www.instagram.com/reel/${shortcode}/`
  )}`;
  const res = await fetch(workerProxy, { signal });
  if (!res.ok) throw new Error(`Worker proxy failed: ${res.status}`);
  return await res.json();
}

// ─── Categorization helper ────────────────────────────────────────────
function inferCategory(caption: string, creator: string): string {
  const text = `${caption} ${creator}`.toLowerCase();
  if (/workout|fitness|gym|bodybuilding|muscle|exercise|training|diet|protein|running/i.test(text)) return "Fitness & Health";
  if (/recipe|cooking|food|chef|baking|delicious|kitchen|meal|dinner/i.test(text)) return "Recipes & Food";
  if (/code|coding|software|developer|programming|ai|tech|startup|python|react|javascript/i.test(text)) return "Tech & Dev";
  if (/design|ui|ux|typography|architecture|art|interior|graphic/i.test(text)) return "Design & Art";
  if (/travel|hotel|trip|vacation|nature|adventure|explore|flight/i.test(text)) return "Travel & Places";
  if (/money|finance|crypto|stocks|investing|business|wealth|realestate/i.test(text)) return "Finance & Business";
  if (/humor|meme|funny|comedy|lol|joke/i.test(text)) return "Entertainment";
  return "General";
}

// ─── Main POST handler (High-Speed Extraction) ───────────────────────
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing or invalid Instagram URL" }, { status: 400 });
    }

    const cleanUrl = url.trim();
    const lowerUrl = cleanUrl.toLowerCase();

    // 1. Instant regex classification (0ms)
    let mediaType: "reel" | "post" | "audio" | "story" = "reel";
    let duration = "0:30";

    if (lowerUrl.includes("/audio/") || lowerUrl.includes("/reels/audio/")) {
      mediaType = "audio";
      duration = "2:14";
    } else if (lowerUrl.includes("/stories/")) {
      mediaType = "story";
      duration = "Story (24h)";
    } else if (lowerUrl.includes("/p/")) {
      mediaType = "post";
      duration = "Photo Post";
    } else {
      mediaType = "reel";
      duration = "0:30";
    }

    const shortcodeMatch = cleanUrl.match(/(?:reel|reels|p|audio|stories)\/([A-Za-z0-9_-]+)/);
    const shortcode = shortcodeMatch ? shortcodeMatch[1] : `sc_${Date.now().toString(36)}`;

    let creatorUsername = "";
    let creatorFullName = "";
    let caption = "";
    let likes = "";
    let commentsCount = "";
    let thumbnailUrl = shortcode ? `/api/proxy-image?shortcode=${shortcode}` : "";
    let mediaUrl = "";
    let audioTitle = "";
    let audioArtist = "";
    let hashtags: string[] = [];

    // Extract creator from URL if formatted as instagram.com/username/reel/...
    const userMatch = cleanUrl.match(/instagram\.com\/([A-Za-z0-9_.]+)\/(?:reel|reels|p)\//);
    if (userMatch && userMatch[1] && !["reel", "p", "stories", "audio"].includes(userMatch[1])) {
      creatorUsername = userMatch[1];
    }

    // 2. High-speed parallel metadata extraction with 2.2-second hard timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2200);

    const extractionTasks: Promise<void>[] = [];

    // Task A: Instagram oEmbed
    extractionTasks.push(
      fetchInstagramOEmbed(cleanUrl, controller.signal)
        .then((oe) => {
          if (oe.author_name && !creatorUsername) creatorUsername = oe.author_name;
          if (oe.author_name && !creatorFullName) creatorFullName = oe.author_name;
          if (oe.title && !caption) caption = oe.title;
          if (oe.thumbnail_url && (!thumbnailUrl || thumbnailUrl.includes("/api/proxy-image"))) {
            thumbnailUrl = `/api/proxy-image?url=${encodeURIComponent(oe.thumbnail_url)}`;
          }
        })
        .catch(() => {})
    );

    // Task B: OpenGraph
    if (shortcode) {
      extractionTasks.push(
        fetchOpenGraphMeta(shortcode, mediaType, controller.signal)
          .then((og) => {
            if (og.title && !creatorFullName) {
              const titleMatch = og.title.match(/^(.+?)\s+on\s+Instagram\s*:/i);
              if (titleMatch) creatorFullName = titleMatch[1].trim();
            }
            if (og.description) {
              const statsMatch = og.description.match(/^([0-9.,KMkm]+)\s+likes,\s+([0-9.,KMkm]+)\s+comments/i);
              if (statsMatch) {
                if (!likes) likes = statsMatch[1];
                if (!commentsCount) commentsCount = statsMatch[2];
              }
              const descCreatorMatch = og.description.match(/on\s+Instagram:\s*"([\s\S]*)"$/i);
              if (descCreatorMatch && !caption) {
                caption = descCreatorMatch[1].trim();
              } else if (!caption) {
                caption = og.description.replace(/^[0-9.,KMkm]+\s+likes,\s+[0-9.,KMkm]+\s+comments\s*-\s*/, "").trim();
              }
            }
            if (og.image && (!thumbnailUrl || thumbnailUrl.includes("/api/proxy-image"))) {
              thumbnailUrl = og.image;
            }
            if (og.video && !mediaUrl) {
              mediaUrl = og.video;
            }
          })
          .catch(() => {})
      );
    }

    // Task C: Cloudflare Edge Worker
    if (shortcode) {
      extractionTasks.push(
        fetchCloudflareWorkerMeta(shortcode, controller.signal)
          .then((workerData) => {
            if (workerData.creatorUsername && !creatorUsername) creatorUsername = workerData.creatorUsername;
            if (workerData.caption && !caption) caption = workerData.caption;
            if (workerData.thumbnailUrl && (!thumbnailUrl || thumbnailUrl.includes("/api/proxy-image"))) {
              thumbnailUrl = workerData.thumbnailUrl;
            }
            if (workerData.mediaUrl && !mediaUrl) mediaUrl = workerData.mediaUrl;
            if (workerData.likes && !likes) likes = workerData.likes;
          })
          .catch(() => {})
      );
    }

    // Task D: Instagram Captioned Embed Scraper for Real Avatar & High-Res Cover
    if (shortcode) {
      extractionTasks.push(
        (async () => {
          try {
            const embedRes = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
              headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
              cache: "no-store",
              signal: controller.signal,
            });
            if (embedRes.ok) {
              const html = await embedRes.text();
              const unescaped = html
                .replace(/\\u0026/gi, "&")
                .replace(/\\u00253D/gi, "%3D")
                .replace(/\\\//g, "/")
                .replace(/\\/g, "")
                .replace(/&amp;/g, "&");

              const matches = unescaped.match(/https:\/\/[^"'\s<>\\]+/g) || [];
              for (const m of matches) {
                if (m.includes("t51.82787-19") || m.includes("profile_pic")) {
                  creatorAvatar = `/api/proxy-image?url=${encodeURIComponent(m)}`;
                }
                if ((!thumbnailUrl || thumbnailUrl.includes("/api/proxy-image")) && (m.includes("t51.82787-15") || m.includes("CLIPS") || m.includes("CAROUSEL_ITEM") || m.includes("dst-jpg") || m.includes("dst-jpegr"))) {
                  thumbnailUrl = `/api/proxy-image?url=${encodeURIComponent(m)}`;
                }
              }
            }
          } catch {
            // Continue
          }
        })()
      );
    }

    // Wait for parallel tasks or timeout
    await Promise.allSettled(extractionTasks);
    clearTimeout(timeoutId);

    // 3. Defaults & Sanitization
    if (!creatorUsername) {
      creatorUsername = shortcode ? `ig_${shortcode.substring(0, 6)}` : "creator";
    }
    if (!creatorFullName) {
      creatorFullName = creatorUsername.charAt(0).toUpperCase() + creatorUsername.slice(1);
    }
    if (!caption) {
      caption = `Instagram ${mediaType.toUpperCase()} by @${creatorUsername}`;
    }

    // Extract hashtags from caption
    const tagMatches = caption.match(/#[A-Za-z0-9_]+/g);
    if (tagMatches) {
      hashtags = tagMatches.slice(0, 8);
    }

    const category = inferCategory(caption, creatorUsername);

    if (mediaType === "audio") {
      audioTitle = `${creatorFullName}'s Original Sound`;
      audioArtist = `${creatorFullName} • Audio Track`;
    }

    const responsePayload = {
      shortcode,
      url: cleanUrl,
      mediaType,
      creatorUsername,
      creatorFullName,
      creatorAvatar: `/api/proxy-image?username=${encodeURIComponent(creatorUsername)}`,
      thumbnailUrl,
      mediaUrl,
      embedUrl: `https://www.instagram.com/p/${shortcode}/embed/`,
      caption,
      category,
      hashtags,
      likes,
      commentsCount,
      duration,
      audioTitle: audioTitle || undefined,
      audioArtist: audioArtist || undefined,
      aiSummary: undefined,
      elapsedMs: Date.now() - startTime,
    };

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    console.error("Fast metadata extraction error:", err);
    return NextResponse.json(
      {
        error: "Failed to extract metadata",
        details: err?.message,
        mediaType: "reel",
        caption: "Saved Instagram Reel",
        category: "General",
      },
      { status: 200 }
    );
  }
}
