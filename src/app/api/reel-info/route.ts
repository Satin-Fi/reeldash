import { NextRequest, NextResponse } from "next/server";

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

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Extract shortcode and username directly from URL structure if present
    let shortcode: string | null = null;
    let creatorUsername = "";
    let creatorFullName = "";
    let caption = "";
    let likes = "";
    let commentsCount = "";
    let hashtags: string[] = [];

    const reelMatch = url.match(/(?:reel|p)\/([A-Za-z0-9_-]+)/);
    if (reelMatch) {
      shortcode = reelMatch[1];
    }

    const userMatch = url.match(/instagram\.com\/([A-Za-z0-9_.]+)\/(?:reel|p)\//);
    if (userMatch && userMatch[1] && userMatch[1] !== "reel" && userMatch[1] !== "p") {
      creatorUsername = userMatch[1];
    }

    // 1. Fetch Instagram OpenGraph Metadata via Facebook Crawler User-Agent
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

          // Extract creator full name: "Fort City Run Circle on Instagram: ..."
          if (ogTitle) {
            const titleMatch = ogTitle.match(/^(.+?)\s+on\s+Instagram\s*:/i);
            if (titleMatch) {
              creatorFullName = titleMatch[1].trim();
            }
          }

          // Extract from ogDesc: "43 likes, 10 comments - fortruncircle on August 12, 2026: "The run was...""
          if (ogDesc) {
            const descMatch = ogDesc.match(
              /^(?:([0-9,KkMm\.]+\s+likes)?,?\s*)?(?:([0-9,KkMm\.]+\s+comments)?\s*-\s*)?([a-zA-Z0-9_\.]+)\s+on\s+[^:]+:\s*"?([\s\S]*?)"?\s*\.?\s*$/i
            );

            if (descMatch) {
              if (descMatch[1]) likes = descMatch[1].trim();
              if (descMatch[2]) commentsCount = descMatch[2].trim();
              if (descMatch[3]) creatorUsername = descMatch[3].trim();
              if (descMatch[4]) caption = descMatch[4].trim();
            }
          }

          // Fallback caption from title
          if (!caption && ogTitle.includes(":")) {
            caption = ogTitle.substring(ogTitle.indexOf(":") + 1).trim().replace(/^"|"$/g, "");
          }
        }
      } catch (ogErr) {
        console.warn("Instagram OpenGraph extraction warning:", ogErr);
      }
    }

    // 2. Fallbacks if partial
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

    // Extract hashtags from caption
    const extractedTags = caption.match(/#[A-Za-z0-9_]+/g);
    if (extractedTags) {
      hashtags = Array.from(new Set(extractedTags));
    }

    // Proxy image URL for real thumbnail cover
    const thumbnailUrl = shortcode
      ? `/api/proxy-image?shortcode=${shortcode}`
      : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80";

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

    const embedUrl = shortcode ? `https://www.instagram.com/p/${shortcode}/embed/` : null;

    return NextResponse.json({
      shortcode,
      creatorUsername,
      creatorFullName,
      caption,
      hashtags,
      likes,
      commentsCount,
      thumbnailUrl,
      mediaUrl: "",
      embedUrl,
      category,
    });
  } catch (error) {
    console.error("Reel metadata extraction error:", error);
    return NextResponse.json({ error: "Failed to process Reel metadata" }, { status: 500 });
  }
}
