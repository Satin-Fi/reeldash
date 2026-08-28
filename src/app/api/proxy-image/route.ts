import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// In-memory cache for instant responses
const avatarCache = new Map<string, { url: string; expiresAt: number }>();
const thumbCache = new Map<string, { url: string; expiresAt: number }>();

async function serveImageBinary(imageUrl: string, fallbackUrl?: string): Promise<NextResponse> {
  try {
    const wsrvUrl = `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}`;
    const imgRes = await fetch(wsrvUrl, {
      signal: AbortSignal.timeout(4500),
    });
    if (imgRes.ok) {
      const buffer = await imgRes.arrayBuffer();
      const contentType = imgRes.headers.get("content-type") || "image/jpeg";
      return new NextResponse(Buffer.from(buffer), {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400",
        },
      });
    }
  } catch {
    // Continue
  }

  if (fallbackUrl) {
    try {
      const fbRes = await fetch(fallbackUrl, { signal: AbortSignal.timeout(3000) });
      if (fbRes.ok) {
        const buffer = await fbRes.arrayBuffer();
        const contentType = fbRes.headers.get("content-type") || "image/png";
        return new NextResponse(Buffer.from(buffer), {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
          },
        });
      }
    } catch {
      // Continue
    }
    return NextResponse.redirect(fallbackUrl, { status: 307 });
  }

  return new NextResponse(null, { status: 404 });
}

async function fetchRealAvatarUrl(username: string): Promise<string | null> {
  const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();
  if (!cleanUsername) return null;

  const cached = avatarCache.get(cleanUsername);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  // Strategy 1: Post Embed Scraper from recent public media
  try {
    const bridgeUrls = [
      `https://rss.trom.tf/?action=display&bridge=InstagramBridge&u=${encodeURIComponent(cleanUsername)}&format=Json`,
      `https://rss-bridge.org/bridge01/?action=display&bridge=InstagramBridge&u=${encodeURIComponent(cleanUsername)}&format=Json`,
      `https://rss.bloat.cat/?action=display&bridge=InstagramBridge&u=${encodeURIComponent(cleanUsername)}&format=Json`,
    ];

    const data = await Promise.any(
      bridgeUrls.map(async (url) => {
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
          cache: "no-store",
          signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) throw new Error("bridge fail");
        const j = await res.json();
        if (!j.items || j.items.length === 0) throw new Error("no items");
        return j;
      })
    );

    const firstUrl = data.items[0]?.url;
    const shortcode = firstUrl?.match(/\/(reel|p)\/([A-Za-z0-9_-]+)/)?.[2];

    if (shortcode) {
      const embedRes = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
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
          if (
            m.includes("t51.82787-19") ||
            m.includes("t51.2885-19") ||
            m.includes("s150x150") ||
            m.includes("s100x100") ||
            m.includes("profile_pic")
          ) {
            avatarCache.set(cleanUsername, {
              url: m,
              expiresAt: Date.now() + 1000 * 60 * 60 * 24,
            });
            return m;
          }
        }
      }
    }
  } catch {
    // Continue
  }

  // Strategy 2: Direct Instagram Profile Embed Engine
  try {
    const embedRes = await fetch(`https://www.instagram.com/${cleanUsername}/embed/`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });

    if (embedRes.ok) {
      const embedHtml = await embedRes.text();
      const unescaped = embedHtml
        .replace(/\\u0026/gi, "&")
        .replace(/\\u00253D/gi, "%3D")
        .replace(/\\\//g, "/")
        .replace(/\\/g, "")
        .replace(/&amp;/g, "&");

      const scontentMatches = unescaped.match(/https:\/\/[^"'\s<>\\]+/g) || [];

      for (const decoded of scontentMatches) {
        if (
          decoded.includes("t51.82787-19") ||
          decoded.includes("t51.2885-19") ||
          decoded.includes("s150x150") ||
          decoded.includes("s100x100") ||
          decoded.includes("profile_pic")
        ) {
          avatarCache.set(cleanUsername, {
            url: decoded,
            expiresAt: Date.now() + 1000 * 60 * 60 * 24,
          });
          return decoded;
        }
      }
    }
  } catch {
    // Continue
  }

  return null;
}

async function fetchRealPostThumbnail(shortcode: string): Promise<string | null> {
  const cleanCode = shortcode.trim();
  if (!cleanCode) return null;

  const cached = thumbCache.get(cleanCode);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  try {
    const embedRes = await fetch(`https://www.instagram.com/p/${cleanCode}/embed/captioned/`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
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

      for (const u of matches) {
        if (
          u.includes("t51.82787-15") ||
          u.includes("CLIPS") ||
          u.includes("CAROUSEL_ITEM") ||
          u.includes("video_default_cover") ||
          u.includes("dst-jpegr") ||
          u.includes("dst-jpg")
        ) {
          thumbCache.set(cleanCode, {
            url: u,
            expiresAt: Date.now() + 1000 * 60 * 60 * 24,
          });
          return u;
        }
      }
    }
  } catch {
    // Continue
  }

  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");
  const shortcode = searchParams.get("shortcode");
  const directUrl = searchParams.get("url");

  // 1. AVATAR PROXY BY USERNAME
  if (username) {
    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6366F1&color=fff&size=200&bold=true`;
    try {
      const realAvatarUrl = await fetchRealAvatarUrl(username);
      if (realAvatarUrl) {
        return await serveImageBinary(realAvatarUrl, fallbackAvatar);
      }
    } catch {
      // Continue to fallback
    }

    return await serveImageBinary(fallbackAvatar);
  }

  // 2. POST THUMBNAIL BY SHORTCODE
  if (shortcode) {
    const fallbackThumb = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80`;
    try {
      const realThumbUrl = await fetchRealPostThumbnail(shortcode);
      if (realThumbUrl) {
        return await serveImageBinary(realThumbUrl, fallbackThumb);
      }
    } catch {
      // Continue
    }

    return await serveImageBinary(fallbackThumb);
  }

  // 3. DIRECT IMAGE PROXY BY URL
  if (directUrl) {
    const fallbackThumb = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80`;
    return await serveImageBinary(directUrl, fallbackThumb);
  }

  return new NextResponse(null, { status: 400 });
}
