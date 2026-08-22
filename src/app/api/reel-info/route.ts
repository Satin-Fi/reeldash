import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Extract shortcode and creator from URL structure if present
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

    // 1. Fetch via Cobalt API (Open-source video & metadata extractor for Instagram Reels)
    try {
      const cobaltRes = await fetch("https://api.cobalt.tools/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "ReelDash/1.0",
        },
        body: JSON.stringify({
          url,
          videoQuality: "720",
        }),
      });

      if (cobaltRes.ok) {
        const cobaltData = await cobaltRes.json();
        if (cobaltData.url) {
          mediaUrl = cobaltData.url;
        }
        if (cobaltData.filename) {
          // filename format: instagram_username_id.mp4
          const fnameParts = cobaltData.filename.split("_");
          if (fnameParts[1] && fnameParts[1] !== "instagram") {
            creatorUsername = fnameParts[1];
          }
        }
      }
    } catch (cobaltErr) {
      console.warn("Cobalt API extraction notice:", cobaltErr);
    }

    // 2. Fetch via noembed.com (CORS-enabled public oEmbed provider for Instagram)
    try {
      const noembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`, {
        next: { revalidate: 3600 },
      });
      if (noembedRes.ok) {
        const data = await noembedRes.json();
        if (data.author_name && !creatorUsername) {
          creatorUsername = data.author_name.replace(/^@/, "");
        }
        if (data.title && !caption) {
          caption = data.title;
        }
        if (data.thumbnail_url && !thumbnailUrl) {
          thumbnailUrl = data.thumbnail_url;
        }
      }
    } catch (noembedErr) {
      console.warn("noembed fetch notice:", noembedErr);
    }

    // 3. Instagram captioned embed fallback parsing
    if ((!caption || !creatorUsername) && shortcode) {
      try {
        const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
        const res = await fetch(embedUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
          },
          next: { revalidate: 3600 },
        });

        if (res.ok) {
          const html = await res.text();

          if (!creatorUsername) {
            const handleMatch =
              html.match(/class="UsernameText"[^>]*>([^<]+)</i) ||
              html.match(/instagram\.com\/([A-Za-z0-9_.]+)\/\?utm_source/i) ||
              html.match(/@([A-Za-z0-9_.]+)/);
            if (handleMatch && handleMatch[1]) {
              creatorUsername = handleMatch[1].trim();
            }
          }

          if (!thumbnailUrl) {
            const imgMatch =
              html.match(/class="EmbeddedMediaImage"[^>]*src="([^"]+)"/i) ||
              html.match(/src="(https:\/\/scontent[^"]+)"/i);
            if (imgMatch && imgMatch[1]) {
              thumbnailUrl = imgMatch[1].replace(/&amp;/g, "&");
            }
          }

          if (!caption) {
            const captionMatch =
              html.match(/class="Caption"[^>]*>([\s\S]*?)<\/div>/i) ||
              html.match(/class="CaptionComments"[^>]*>([\s\S]*?)<\/div>/i);
            if (captionMatch && captionMatch[1]) {
              const cleanCaption = captionMatch[1]
                .replace(/<[^>]+>/g, " ")
                .replace(/\s+/g, " ")
                .trim();
              if (cleanCaption) caption = cleanCaption;
            }
          }
        }
      } catch (embedErr) {
        console.warn("Instagram captioned embed notice:", embedErr);
      }
    }

    // Extract hashtags from caption
    if (caption) {
      const extractedTags = caption.match(/#[A-Za-z0-9_]+/g);
      if (extractedTags) {
        hashtags = Array.from(new Set(extractedTags));
      }
    }

    if (!creatorUsername || creatorUsername === "instagram_creator") {
      // Fallback creator handle format from shortcode if handle missing
      creatorUsername = shortcode ? `reels_${shortcode.substring(0, 6)}` : "instagram_creator";
    }

    if (!caption || caption.startsWith("Instagram Reel (")) {
      caption = `Saved Instagram Reel (${shortcode || "video"})`;
    }

    // Categorization engine
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
      thumbnailUrl: thumbnailUrl || (shortcode ? `https://www.instagram.com/p/${shortcode}/media/?size=l` : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"),
      mediaUrl,
      embedUrl,
      category,
    });
  } catch (error) {
    console.error("Reel metadata extraction error:", error);
    return NextResponse.json({ error: "Failed to process Reel metadata" }, { status: 500 });
  }
}
