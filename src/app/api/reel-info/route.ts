import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Extract shortcode and potential username from Instagram URL
    let shortcode: string | null = null;
    let creatorUsername = "";

    const reelMatch = url.match(/(?:reel|p)\/([A-Za-z0-9_-]+)/);
    if (reelMatch) {
      shortcode = reelMatch[1];
    }

    const userMatch = url.match(/instagram\.com\/([A-Za-z0-9_.]+)\/(?:reel|p)\//);
    if (userMatch && userMatch[1] && userMatch[1] !== "reel" && userMatch[1] !== "p") {
      creatorUsername = userMatch[1];
    }

    let caption = "";
    let thumbnailUrl = "";
    let mediaUrl = "";
    let hashtags: string[] = [];

    // Fetch official Instagram captioned embed HTML (Never blocked by IG bot detection)
    if (shortcode) {
      try {
        const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
        const res = await fetch(embedUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
          },
          next: { revalidate: 3600 },
        });

        if (res.ok) {
          const html = await res.text();

          // 1. Extract Creator Username
          if (!creatorUsername) {
            const handleMatch =
              html.match(/class="UsernameText"[^>]*>([^<]+)</i) ||
              html.match(/instagram\.com\/([A-Za-z0-9_.]+)\/\?utm_source/i) ||
              html.match(/@([A-Za-z0-9_.]+)/);
            if (handleMatch && handleMatch[1]) {
              creatorUsername = handleMatch[1].trim();
            }
          }

          // 2. Extract High-Res Image Cover Thumbnail
          const imgMatch =
            html.match(/class="EmbeddedMediaImage"[^>]*src="([^"]+)"/i) ||
            html.match(/<img[^>]+src="(https:\/\/[^"]+scontent[^"]+)"/i) ||
            html.match(/src="(https:\/\/scontent[^"]+)"/i);
          if (imgMatch && imgMatch[1]) {
            thumbnailUrl = imgMatch[1].replace(/&amp;/g, "&");
          }

          // 3. Extract Caption & Hashtags
          const captionMatch =
            html.match(/class="Caption"[^>]*>([\s\S]*?)<\/div>/i) ||
            html.match(/class="CaptionComments"[^>]*>([\s\S]*?)<\/div>/i);
          if (captionMatch && captionMatch[1]) {
            // Strip HTML tags
            const cleanCaption = captionMatch[1]
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim();
            if (cleanCaption) {
              caption = cleanCaption;
            }
          }

          // Extract hashtags using regex
          const extractedTags = caption.match(/#[A-Za-z0-9_]+/g);
          if (extractedTags) {
            hashtags = Array.from(new Set(extractedTags));
          }
        }
      } catch (embedErr) {
        console.warn("Embed captioned fetch warning:", embedErr);
      }
    }

    // Fallbacks if extraction was partial
    if (!creatorUsername) {
      creatorUsername = "instagram_creator";
    }

    if (!caption) {
      caption = shortcode ? `Instagram Reel by @${creatorUsername}` : "Saved Instagram Reel";
    }

    if (!thumbnailUrl && shortcode) {
      // Direct CDN media fallback
      thumbnailUrl = `https://www.instagram.com/p/${shortcode}/media/?size=l`;
    }

    // AI Categorization based on extracted caption & hashtags
    let category = "General";
    const lowerCaption = (caption + " " + hashtags.join(" ")).toLowerCase();
    if (
      lowerCaption.includes("workout") ||
      lowerCaption.includes("exercise") ||
      lowerCaption.includes("gym") ||
      lowerCaption.includes("posture") ||
      lowerCaption.includes("fitness") ||
      lowerCaption.includes("health") ||
      lowerCaption.includes("sleep")
    ) {
      category = "Health & Fitness";
    } else if (
      lowerCaption.includes("recipe") ||
      lowerCaption.includes("cook") ||
      lowerCaption.includes("food") ||
      lowerCaption.includes("paneer") ||
      lowerCaption.includes("dinner") ||
      lowerCaption.includes("kitchen") ||
      lowerCaption.includes("dish")
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
      lowerCaption.includes("spacing")
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
      caption,
      hashtags,
      thumbnailUrl: thumbnailUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
      mediaUrl: mediaUrl || "",
      embedUrl,
      category,
    });
  } catch (error) {
    console.error("Reel metadata extraction error:", error);
    return NextResponse.json({ error: "Failed to process Reel metadata" }, { status: 500 });
  }
}
