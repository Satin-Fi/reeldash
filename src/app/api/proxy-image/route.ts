import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// In-memory avatar cache for instant responses
const avatarUrlCache = new Map<string, { url: string; expiresAt: number }>();

async function fetchRealAvatarUrl(username: string): Promise<string | null> {
  const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();
  if (!cleanUsername) return null;

  const cached = avatarUrlCache.get(cleanUsername);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  const userAgents = [
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "WhatsApp/2.21.12.21 A",
    "Twitterbot/1.0",
    "TelegramBot (like TwitterBot)",
  ];

  for (const ua of userAgents) {
    try {
      const res = await fetch(`https://www.instagram.com/${cleanUsername}/`, {
        headers: {
          "User-Agent": ua,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        cache: "no-store",
      });

      if (res.ok) {
        const html = await res.text();
        const ogMatch =
          html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
          html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

        if (ogMatch && ogMatch[1]) {
          const pic = ogMatch[1].replace(/&amp;/g, "&");
          if (pic.startsWith("http")) {
            avatarUrlCache.set(cleanUsername, {
              url: pic,
              expiresAt: Date.now() + 1000 * 60 * 60 * 24,
            });
            return pic;
          }
        }
      }
    } catch {
      // try next user agent
    }
  }

  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");
  const directUrl = searchParams.get("url");

  // 1. AVATAR PROXY BY USERNAME
  if (username) {
    try {
      const realAvatarUrl = await fetchRealAvatarUrl(username);
      if (realAvatarUrl) {
        // Direct redirect to official CDN (renders perfectly in browser with referrerpolicy="no-referrer")
        return NextResponse.redirect(realAvatarUrl, {
          status: 307,
          headers: {
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
          },
        });
      }
    } catch {
      // Continue to fallback
    }

    return new NextResponse(null, { status: 404 });
  }

  // 2. DIRECT IMAGE PROXY BY URL
  if (directUrl) {
    try {
      return NextResponse.redirect(directUrl, {
        status: 307,
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    } catch {
      return new NextResponse(null, { status: 404 });
    }
  }

  return new NextResponse(null, { status: 400 });
}
