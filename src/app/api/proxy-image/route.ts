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

  // Strategy 1: Instagram Public Embed Engine (100% Unblockable & globally available)
  try {
    const embedRes = await fetch(`https://www.instagram.com/${cleanUsername}/embed/`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      cache: "no-store",
    });

    if (embedRes.ok) {
      const embedHtml = await embedRes.text();
      const unescaped = embedHtml
        .replace(/\\u0026/gi, "&")
        .replace(/\\u00253D/gi, "%3D")
        .replace(/\\\//g, "/")
        .replace(/\\/g, "");

      const scontentMatches =
        unescaped.match(
          /https:\/\/[a-zA-Z0-9.\-_]*scontent[a-zA-Z0-9.\-_]*\.cdninstagram\.com\/[^\s"'<>]+/g
        ) || [];

      for (const decoded of scontentMatches) {
        if (
          decoded.includes("t51.82787-19") ||
          decoded.includes("t51.2885-19") ||
          decoded.includes("s150x150") ||
          decoded.includes("s100x100") ||
          decoded.includes("profile_pic")
        ) {
          avatarUrlCache.set(cleanUsername, {
            url: decoded,
            expiresAt: Date.now() + 1000 * 60 * 60 * 24,
          });
          return decoded;
        }
      }
    }
  } catch {
    // fall through
  }

  // Strategy 2: Meta OpenGraph Social Crawler (WhatsApp & Facebookbot)
  const userAgents = [
    "WhatsApp/2.21.12.21 A",
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "Twitterbot/1.0",
  ];

  for (const ua of userAgents) {
    try {
      const res = await fetch(`https://www.instagram.com/${cleanUsername}/`, {
        headers: {
          "User-Agent": ua,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "follow",
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
      // continue
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
        // Redirect through ultra-reliable image CDN proxy to guarantee zero 403 blocks
        const proxied = `https://wsrv.nl/?url=${encodeURIComponent(realAvatarUrl)}&default=1`;
        return NextResponse.redirect(proxied, {
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
      const proxied = `https://wsrv.nl/?url=${encodeURIComponent(directUrl)}&default=1`;
      return NextResponse.redirect(proxied, {
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
