import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Extract shortcode from Instagram URL
    // Examples: https://www.instagram.com/reel/Cz12345/ or https://instagram.com/p/Cz12345/
    const match = url.match(/(?:reel|p)\/([A-Za-z0-9_-]+)/);
    const shortcode = match ? match[1] : null;

    let creatorUsername = "instagram_creator";
    let caption = "Instagram Reel";
    let thumbnailUrl = "";
    let mediaUrl = "";
    let category = "General";

    // Direct Instagram thumbnail endpoint
    if (shortcode) {
      thumbnailUrl = `https://www.instagram.com/p/${shortcode}/media/?size=l`;
    }

    // Attempt to fetch OpenGraph metadata from Instagram link
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
        next: { revalidate: 3600 },
      });

      if (response.ok) {
        const html = await response.text();

        // Extract og:title (e.g. "Creator Name (@username) on Instagram: 'Caption text...'")
        const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
                           html.match(/<meta\s+name="twitter:title"\s+content="([^"]+)"/i);
        
        // Extract og:description
        const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i) ||
                          html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);

        // Extract og:image
        const imgMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);

        // Extract og:video
        const videoMatch = html.match(/<meta\s+property="og:video"\s+content="([^"]+)"/i) ||
                           html.match(/<meta\s+property="og:video:secure_url"\s+content="([^"]+)"/i);

        if (imgMatch && imgMatch[1]) {
          thumbnailUrl = imgMatch[1].replace(/&amp;/g, "&");
        }

        if (videoMatch && videoMatch[1]) {
          mediaUrl = videoMatch[1].replace(/&amp;/g, "&");
        }

        if (titleMatch && titleMatch[1]) {
          const rawTitle = titleMatch[1];
          // Try to extract handle @username
          const handleMatch = rawTitle.match(/@([A-Za-z0-9_.]+)/);
          if (handleMatch) {
            creatorUsername = handleMatch[1];
          } else {
            const parts = rawTitle.split("on Instagram");
            if (parts[0]) creatorUsername = parts[0].trim().toLowerCase().replace(/\s+/g, "_");
          }

          // Extract caption snippet from title or description
          if (rawTitle.includes(": “") || rawTitle.includes(': "')) {
            const cap = rawTitle.split(/: [“"]/)[1];
            if (cap) caption = cap.replace(/[”"]$/, "").trim();
          }
        }

        if (descMatch && descMatch[1] && caption === "Instagram Reel") {
          caption = descMatch[1].trim();
        }
      }
    } catch (fetchErr) {
      console.warn("Direct metadata fetch failed, using fallback extraction:", fetchErr);
    }

    // Fallback creator extraction if handle still default
    if (creatorUsername === "instagram_creator" && url.includes("instagram.com/")) {
      const pathParts = url.split("instagram.com/")[1]?.split("/");
      if (pathParts && pathParts[0] && pathParts[0] !== "reel" && pathParts[0] !== "p") {
        creatorUsername = pathParts[0];
      }
    }

    // AI Categorization engine based on caption text analysis
    const lowerCaption = caption.toLowerCase();
    if (lowerCaption.includes("workout") || lowerCaption.includes("exercise") || lowerCaption.includes("gym") || lowerCaption.includes("posture") || lowerCaption.includes("fitness") || lowerCaption.includes("health")) {
      category = "Health & Fitness";
    } else if (lowerCaption.includes("recipe") || lowerCaption.includes("cook") || lowerCaption.includes("food") || lowerCaption.includes("paneer") || lowerCaption.includes("dinner") || lowerCaption.includes("taste")) {
      category = "Food & Cooking";
    } else if (lowerCaption.includes("ai") || lowerCaption.includes("code") || lowerCaption.includes("python") || lowerCaption.includes("tech") || lowerCaption.includes("software") || lowerCaption.includes("agent")) {
      category = "AI & Tech";
    } else if (lowerCaption.includes("design") || lowerCaption.includes("ui") || lowerCaption.includes("figma") || lowerCaption.includes("ux") || lowerCaption.includes("spacing")) {
      category = "Design";
    } else if (lowerCaption.includes("productivity") || lowerCaption.includes("system") || lowerCaption.includes("habit") || lowerCaption.includes("time") || lowerCaption.includes("notion")) {
      category = "Productivity";
    } else {
      category = "General";
    }

    return NextResponse.json({
      shortcode,
      creatorUsername,
      caption: caption || `Instagram Reel (${shortcode || "saved"})`,
      thumbnailUrl: thumbnailUrl || (shortcode ? `https://www.instagram.com/p/${shortcode}/media/?size=l` : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"),
      mediaUrl: mediaUrl || "",
      category,
      embedUrl: shortcode ? `https://www.instagram.com/p/${shortcode}/embed/` : null,
    });
  } catch (error) {
    console.error("Reel metadata extraction error:", error);
    return NextResponse.json({ error: "Failed to process Reel metadata" }, { status: 500 });
  }
}
