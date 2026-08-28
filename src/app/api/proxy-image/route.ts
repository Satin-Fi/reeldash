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

  // Strategy 1: WhatsApp / Meta Social OpenGraph Crawler
  try {
    const res = await fetch(`https://www.instagram.com/${cleanUsername}/`, {
      headers: {
        "User-Agent": "WhatsApp/2.21.12.21 A",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
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
    // fall through
  }

  // Strategy 2: Facebook External Hit Crawler
  try {
    const metaRes = await fetch(`https://www.instagram.com/${cleanUsername}/`, {
      headers: {
        "User-Agent":
          "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      cache: "no-store",
    });

    if (metaRes.ok) {
      const html = await metaRes.text();
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
    // fall through
  }

  // Strategy 3: Web Profile Info API
  try {
    const igRes = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${cleanUsername}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "x-ig-app-id": "936619743392459",
          "Accept": "*/*",
        },
        cache: "no-store",
      }
    );
    if (igRes.ok) {
      const data = await igRes.json();
      const pic = data?.data?.user?.profile_pic_url_hd || data?.data?.user?.profile_pic_url;
      if (pic && typeof pic === "string" && pic.startsWith("http")) {
        avatarUrlCache.set(cleanUsername, {
          url: pic,
          expiresAt: Date.now() + 1000 * 60 * 60 * 24,
        });
        return pic;
      }
    }
  } catch {
    // fall through
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
        // Direct redirect to CDN (with no-referrer, browser renders official Instagram CDN image)
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
      // If client requests direct image proxy, redirect directly to CDN
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
