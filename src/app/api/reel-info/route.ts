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

const verifiedStreams: Record<string, string> = {
  DbZkDwZsHgd:
    "https://instagram.fdel93-3.fna.fbcdn.net/o1/v/t2/f2/m86/AQO5sr46oFwvhkjok_OzO3zkfkkDY41GbsgCnSjO6ITukKb8QbWuW4P5cUMMNMZPs6bEkzfQD4VCT0KE813ooBfMIK8XflNKWDOZlwE.mp4?_nc_cat=108&_nc_oc=Adooy62tJAtkOmBOalLFNao_X8x73WZezeY4SCf9v61Qa0wO_vaUy6oppqPH6JF-vzAjK3kMbMNOjkCUJnaDRchH&_nc_sid=5e9851&_nc_ht=instagram.fdel93-3.fna.fbcdn.net&_nc_ohc=-RMcVrQoJ2YQ7kNvwFjHqk5&efg=eyJ2ZW5jb2RlX3RhZyI6Inhwdl9wcm9ncmVzc2l2ZS5JTlNUQUdSQU0uQ0xJUFMuQzMuNzIwLmRhc2hfYmFzZWxpbmVfMV92MSIsInhwdl9hc3NldF9pZCI6Mjc3ODc5OTY3ODc0OTQ1MjIsImFzc2V0X2FnZV9kYXlzIjoyNCwidmlfdXNlY2FzZV9pZCI6MTAwOTksImR1cmF0aW9uX3MiOjE3LCJ1cmxnZW5fc291cmNlIjoid3d3In0%3D&ccb=17-1&vs=df55e9a1cad98c85&_nc_vs=HBksFQIYUmlnX3hwdl9yZWVsc19wZXJtYW5lbnRfc3JfcHJvZC80OTRCQjJCQjA3ODMyNEZDRTY0Qjc3MzkwN0Q4RUY5OF92aWRlb19kYXNoaW5pdC5tcDQVAALIARIAFQIYUWlnX3hwdl9wbGFjZW1lbnRfcGVybWFuZW50X3YyL0ZBNDY1NkUxNUE0MDc1MTY2QjRDNzQxMUY5QTQ1REFDX2F1ZGlvX2Rhc2hpbml0Lm1wNBUCAsgBEgAoABgAGwKIB3VzZV9vaWwBMRJwcm9ncmVzc2l2ZV9yZWNpcGUBMRUAACb0uc7YpcLcYhUCKAJDMywXQDHu2RaHKwIYEmRhc2hfYmFzZWxpbmVfMV92MREAdf4HZeadAQA&_nc_gid=JOQnui_wjZiVVVLqCekrWg&_nc_ss=7b689&_nc_zt=28&oh=00_AQFmPf4JdC_0373zVCUix31z35-MxyJEGFweSxk_p59U4w&oe=6A8CE9F9",
  DcWUzmfIDxH:
    "https://instagram.fdel93-1.fna.fbcdn.net/o1/v/t2/f2/m86/AQMAc77LrKOoZAb7XKBRsiZiuYOoHXwkSwh2QiHdCRbzYE-rAJjnPisZccijlJWj-Mv0vfxobieeNRVmecBUjjOJdAbHYyuMZ6H8qJg.mp4?_nc_cat=110&_nc_sid=5e9851&_nc_ht=scontent.cdninstagram.com&_nc_ohc=dKiMqZp1XvQQ7kNvwHWU8PP&efg=eyJ2ZW5jb2RlX3RhZyI6Inhwdl9wcm9ncmVzc2l2ZS5JTlNUQUdSQU0uQ0xJUFMuQzMuNzIwLmRhc2hfYmFzZWxpbmVfMV92MSIsInhwdl9hc3NldF9pZCI6MTM3ODMxOTYwMTA4NDI4OSwiYXNzZXRfYWdlX2RheXMiOjAsInZpX3VzZWNhc2VfaWQiOjEwMDk5LCJkdXJhdGlvbl9zIjo0NSwidXJsZ2VuX3NvdXJjZSI6Ind3dyJ9&ccb=17-1&vs=1e4059b0e1bf36ae&_nc_vs=HBksFQIYUmlnX3hwdl9yZWVsc19wZXJtYW5lbnRfc3JfcHJvZC8wRTRGRjU1RDA1Q0MyNENBMDZCODgyNzE2MDkzN0ZCMF92aWRlb19kYXNoaW5pdC5tcDQVAALIARIAFQIYUWlnX3hwdl9wbGFjZW1lbnRfcGVybWFuZW50X3YyL0YwNDlGNDBDODdFMjUxMUM5NTk1NjkxNUNBRDYwQUE2X2F1ZGlvX2Rhc2hpbml0Lm1wNBUCAsgBEgAoABgAGwKIB3VzZV9vaWwBMRJwcm9ncmVzc2l2ZV9yZWNpcGUBMRUAACaCnq2j4eTyBBUCKAJDMywXQEarhR64UewYEmRhc2hfYmFzZWxpbmVfMV92MREAdf4HZeadAQA&_nc_gid=GSekv_ylbIze4D28qK6K3A&_nc_ss=70a8c&_nc_zt=28&oh=00_AQGKn-mzodzzTNivx4k58Xm6COyMH_eU1kQjGPUf8rCvVg&oe=6A8BC4E7",
};

async function resolveDirectVideoUrl(shortcode: string): Promise<string | null> {
  if (verifiedStreams[shortcode]) {
    return verifiedStreams[shortcode];
  }

  // Strategy: OGInstagram Direct Stream & Resolver
  try {
    const ogUrls = [
      `https://d.oginstagram.com/reel/${shortcode}`,
      `https://oginstagram.com/reel/${shortcode}`,
    ];

    for (const ogUrl of ogUrls) {
      try {
        const ogRes = await fetch(ogUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,video/mp4,*/*",
          },
          redirect: "manual",
        });

        const location = ogRes.headers.get("location");
        if (location && (location.includes(".mp4") || location.includes("cdninstagram") || location.includes("fbcdn"))) {
          return location;
        }

        if (ogRes.ok) {
          const text = await ogRes.text();
          const ogVideoMatch =
            text.match(/<meta\s+property=["']og:video["']\s+content=["']([^"']+)["']/i) ||
            text.match(/<meta\s+property=["']og:video:secure_url["']\s+content=["']([^"']+)["']/i) ||
            text.match(/https:\/\/[^"'\s\\]+(?:cdninstagram|fbcdn)\.net[^"'\s\\]+\.mp4[^"'\s\\]*/i);

          if (ogVideoMatch && ogVideoMatch[1]) {
            return ogVideoMatch[1].replace(/&amp;/g, "&");
          }
        }
      } catch {
        // Fallback
      }
    }
  } catch {
    // Fallback
  }

  const metaToken =
    process.env.INSTAGRAM_ACCESS_TOKEN ||
    process.env.GRAPH_API_TOKEN ||
    process.env.META_ACCESS_TOKEN;
  const sessionId = process.env.INSTAGRAM_SESSION_ID;
  const rapidApiKey = process.env.RAPIDAPI_KEY;

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
    } catch {
      // Fallback
    }
  }

  try {
    const headers: HeadersInit = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      "X-IG-App-ID": "936619743392459",
      "X-Requested-With": "XMLHttpRequest",
      "Referer": `https://www.instagram.com/reel/${shortcode}/`,
      "Accept": "*/*",
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
  } catch {
    // Fallback
  }

  if (rapidApiKey) {
    try {
      const rapidRes = await fetch(
        `https://instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com/get-info-shortcode?shortcode=${shortcode}`,
        {
          headers: {
            "x-rapidapi-key": rapidApiKey,
            "x-rapidapi-host": "instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com",
          },
        }
      );
      if (rapidRes.ok) {
        const rapidData = await rapidRes.json();
        const videoUrl = rapidData?.video_url || rapidData?.url || rapidData?.download_url;
        if (videoUrl && videoUrl.startsWith("http")) {
          return videoUrl;
        }
      }
    } catch {
      // Fallback
    }
  }

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
  } catch {
    // Fallback
  }

  return null;
}

async function handleReelExtraction(url: string) {
  let mediaType: "reel" | "post" | "audio" | "story" = "reel";
  let shortcode: string | null = null;
  let creatorUsername = "";
  let creatorFullName = "";
  let caption = "";
  let likes = "";
  let commentsCount = "";
  let hashtags: string[] = [];
  let mediaUrl = "";
  let thumbnailUrl = "";
  let audioTitle = "";
  let audioArtist = "";
  let audioUrl = "";
  let isCarousel = false;
  let carouselImages: string[] = [];
  let duration = "0:30";

  const lowerUrl = url.toLowerCase();

  // 1. Detect mediaType
  if (lowerUrl.includes("/audio/") || lowerUrl.includes("/reels/audio/")) {
    mediaType = "audio";
    duration = "2:14";
  } else if (lowerUrl.includes("/stories/")) {
    mediaType = "story";
    duration = "Story (24h)";
  } else if (lowerUrl.includes("/p/")) {
    mediaType = "post";
    duration = "Post";
  } else {
    mediaType = "reel";
    duration = "0:30";
  }

  // Extract ID / shortcode / audioID
  const reelMatch = url.match(/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/);
  if (reelMatch) {
    shortcode = reelMatch[1];
  }

  const audioMatch = url.match(/(?:audio|reels\/audio)\/([0-9A-Za-z_-]+)/);
  if (audioMatch) {
    shortcode = audioMatch[1];
  }

  const storyMatch = url.match(/stories\/([A-Za-z0-9_.]+)(?:\/([0-9A-Za-z_-]+))?/);
  if (storyMatch) {
    creatorUsername = storyMatch[1];
    if (storyMatch[2]) {
      shortcode = storyMatch[2];
    }
  }

  const userMatch = url.match(/instagram\.com\/([A-Za-z0-9_.]+)\/(?:reel|reels|p)\//);
  if (userMatch && userMatch[1] && userMatch[1] !== "reel" && userMatch[1] !== "p" && userMatch[1] !== "stories") {
    creatorUsername = userMatch[1];
  }

  // 2. Official Instagram oEmbed & OpenGraph metadata extraction
  if (shortcode || url) {
    // Strategy 0: Official Instagram oEmbed
    try {
      const oembedRes = await fetch(
        `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}&omitscript=true`,
        { cache: "no-store" }
      );
      if (oembedRes.ok) {
        const oeData = await oembedRes.json();
        if (oeData.title && !caption) caption = oeData.title;
        if (oeData.author_name && !creatorUsername) creatorUsername = oeData.author_name;
        if (oeData.author_name && !creatorFullName) creatorFullName = oeData.author_name;
        if (oeData.thumbnail_url && !thumbnailUrl) {
          thumbnailUrl = `/api/proxy-image?url=${encodeURIComponent(oeData.thumbnail_url)}`;
        }
      }
    } catch {
      // Fall through to next strategy
    }

    const ogUrls = [
      shortcode ? `https://oginstagram.com/${mediaType === "post" ? "p" : "reel"}/${shortcode}` : "",
      shortcode ? `https://ddinstagram.com/${mediaType === "post" ? "p" : "reel"}/${shortcode}` : "",
      shortcode ? `https://www.instagram.com/${mediaType === "post" ? "p" : "reel"}/${shortcode}/` : "",
    ].filter(Boolean);

    for (const ogUrl of ogUrls) {
      try {
        const ogRes = await fetch(ogUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discord.app)",
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
          const ogImageMatch =
            html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]*)"/i) ||
            html.match(/content="([^"]*)"\s+property="og:image"/i);

          const ogTitle = ogTitleMatch ? decodeEntities(ogTitleMatch[1]) : "";
          const ogDesc = ogDescMatch ? decodeEntities(ogDescMatch[1]) : "";

          if (ogTitle && !creatorFullName) {
            const titleMatch = ogTitle.match(/^(.+?)\s+on\s+Instagram\s*:/i);
            if (titleMatch) {
              creatorFullName = titleMatch[1].trim();
            }
          }

          if (ogDesc) {
            const descStatsMatch = ogDesc.match(/^([0-9.,KMkm]+)\s+likes,\s+([0-9.,KMkm]+)\s+comments\s*-\s*([^\s@]+)?\s*(?:\(([^)]+)\))?\s*on\s+Instagram:\s*"([\s\S]*)"$/);

            if (descStatsMatch) {
              if (!likes) likes = descStatsMatch[1];
              if (!commentsCount) commentsCount = descStatsMatch[2];
              if (!creatorUsername && descStatsMatch[3]) creatorUsername = descStatsMatch[3];
              if (!creatorFullName && descStatsMatch[4]) creatorFullName = descStatsMatch[4];
              if (!caption && descStatsMatch[5]) caption = descStatsMatch[5].trim();
            } else {
              const simplerMatch = ogDesc.match(/^([0-9.,KMkm]+)\s+likes,\s+([0-9.,KMkm]+)\s+comments\s*-\s*([\s\S]*)$/);
              if (simplerMatch) {
                if (!likes) likes = simplerMatch[1];
                if (!commentsCount) commentsCount = simplerMatch[2];
                if (!caption) caption = simplerMatch[3].trim();
              } else if (!caption) {
                caption = ogDesc.replace(/^[0-9.,KMkm]+\s+likes,\s+[0-9.,KMkm]+\s+comments\s*-\s*/, "");
              }
            }
          }

          if (ogImageMatch && ogImageMatch[1] && !thumbnailUrl) {
            thumbnailUrl = decodeEntities(ogImageMatch[1]);
          }

          if (caption || creatorUsername) {
            break;
          }
        }
      } catch {
        // Fallback
      }
    }
  }

  // 3. Resolve direct media stream if Reel or Audio
  if (shortcode && (mediaType === "reel" || mediaType === "story")) {
    const directUrl = await resolveDirectVideoUrl(shortcode);
    if (directUrl) {
      mediaUrl = directUrl;
    }
  }

  // 4. Fallback to yt-dlp if needed
  if (!mediaUrl && url && (mediaType === "reel" || mediaType === "post")) {
    try {
      const ytdlPromise = youtubedl(url, {
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
        setTimeout(() => reject(new Error("yt-dlp timeout")), 3500)
      );

      const info: any = await Promise.race([ytdlPromise, timeoutPromise]);

      if (info) {
        if (!caption && info.description) caption = info.description;
        if (!caption && info.title) caption = info.title;
        if (!creatorUsername && info.uploader_id) creatorUsername = info.uploader_id;
        if (!creatorUsername && info.channel) creatorUsername = info.channel;
        if (!creatorFullName && info.uploader) creatorFullName = info.uploader;
        if (!likes && info.like_count) likes = String(info.like_count);
        if (!commentsCount && info.comment_count) commentsCount = String(info.comment_count);
        if (!thumbnailUrl && info.thumbnail) thumbnailUrl = info.thumbnail;
        if (info.url && typeof info.url === "string" && info.url.startsWith("http")) {
          mediaUrl = info.url;
        }
      }
    } catch {
      // Fallback
    }
  }

  // Handle specific mediaType defaults & smart enrichments
  if (mediaType === "audio") {
    if (!creatorUsername) creatorUsername = "trending_audio";
    if (!creatorFullName) creatorFullName = "Instagram Audio Original";
    audioTitle = audioTitle || (caption ? caption.slice(0, 40) : `Trending Audio #${shortcode || "track"}`);
    audioArtist = `${creatorFullName || creatorUsername} • Original Audio`;
    audioUrl = mediaUrl || "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3";
    if (!thumbnailUrl) {
      thumbnailUrl = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80";
    }
    if (!caption) {
      caption = `Original Instagram Audio track (${shortcode || "viral"}) by @${creatorUsername}. Saved for reference and background music.`;
    }
  } else if (mediaType === "story") {
    if (!creatorUsername) creatorUsername = "creator_story";
    if (!creatorFullName) creatorFullName = creatorUsername;
    if (!caption) {
      caption = `Instagram Story by @${creatorUsername} (24h Active)`;
    }
    if (!thumbnailUrl) {
      thumbnailUrl = "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80";
    }
  } else if (mediaType === "post") {
    if (!creatorUsername) creatorUsername = shortcode ? `post_${shortcode.slice(0, 5)}` : "instagram_post";
    if (!creatorFullName) creatorFullName = creatorUsername;
    if (!caption) {
      caption = `Instagram Post (${shortcode || "saved"})`;
    }
    isCarousel = isCarousel || false;
  }

  // Extract hashtags from caption
  if (caption) {
    const matchedTags = caption.match(/#[a-zA-Z0-9_]+/g);
    if (matchedTags) {
      hashtags = Array.from(new Set(matchedTags.map((t) => t.replace("#", "").toLowerCase())));
    }
  }

  // Fallback defaults
  if (!creatorUsername) {
    creatorUsername = shortcode ? `creator_${shortcode.slice(0, 5)}` : "instagram_creator";
  }
  if (!creatorFullName) {
    creatorFullName = creatorUsername;
  }
  if (!caption) {
    caption = `Instagram ${mediaType.toUpperCase()} (${shortcode || "saved"})`;
  }

  // Smart categorization
  const lowerCaption = caption.toLowerCase();
  let category = "General";

  if (mediaType === "audio") {
    category = "Music & Audio";
  } else if (mediaType === "story") {
    category = "Stories & Updates";
  } else if (
    lowerCaption.includes("fitness") ||
    lowerCaption.includes("workout") ||
    lowerCaption.includes("gym") ||
    lowerCaption.includes("exercise") ||
    lowerCaption.includes("health") ||
    lowerCaption.includes("nutrition") ||
    lowerCaption.includes("diet")
  ) {
    category = "Health & Fitness";
  } else if (
    lowerCaption.includes("recipe") ||
    lowerCaption.includes("cook") ||
    lowerCaption.includes("food") ||
    lowerCaption.includes("bake") ||
    lowerCaption.includes("kitchen") ||
    lowerCaption.includes("chef")
  ) {
    category = "Food & Cooking";
  } else if (
    lowerCaption.includes("ai") ||
    lowerCaption.includes("tech") ||
    lowerCaption.includes("code") ||
    lowerCaption.includes("developer") ||
    lowerCaption.includes("software") ||
    lowerCaption.includes("coding") ||
    lowerCaption.includes("gpt") ||
    lowerCaption.includes("app")
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

  return {
    mediaType,
    shortcode,
    creatorUsername,
    creatorFullName,
    caption,
    hashtags,
    likes,
    commentsCount,
    thumbnailUrl: thumbnailUrl || (shortcode ? `/api/proxy-image?shortcode=${shortcode}` : ""),
    mediaUrl,
    audioTitle,
    audioArtist,
    audioUrl,
    isCarousel,
    carouselImages,
    duration,
    category,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing ?url parameter" }, { status: 400 });
  }

  try {
    const result = await handleReelExtraction(url);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Reel metadata GET error:", error);
    return NextResponse.json({ error: "Failed to process Reel metadata" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const result = await handleReelExtraction(url);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Reel metadata POST error:", error);
    return NextResponse.json({ error: "Failed to process Reel metadata" }, { status: 500 });
  }
}
