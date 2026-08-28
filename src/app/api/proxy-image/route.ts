import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// In-memory cache for instant responses
const avatarCache = new Map<string, { url: string; expiresAt: number }>();
const thumbCache = new Map<string, { url: string; expiresAt: number }>();

function serveCleanPlaceholderSvg(): NextResponse {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="711" viewBox="0 0 400 711" fill="none">
    <rect width="400" height="711" fill="#111218"/>
    <circle cx="200" cy="355" r="48" fill="#1a1c24" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>
    <path d="M192 340L216 355L192 370V340Z" fill="#71717A"/>
  </svg>`;
  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

async function serveImageBinary(imageUrl: string, fallbackAvatarUrl?: string): Promise<NextResponse> {
  if (!imageUrl || imageUrl.includes("unsplash.com")) {
    return serveCleanPlaceholderSvg();
  }

  // 1. Try Direct Fetch with Instagram CDN headers
  try {
    const directRes = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": "https://www.instagram.com/",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(4000),
    });
    if (directRes.ok) {
      const buffer = await directRes.arrayBuffer();
      const contentType = directRes.headers.get("content-type") || "image/jpeg";
      return new NextResponse(Buffer.from(buffer), {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400",
        },
      });
    }
  } catch {
    // Continue to proxy
  }

  // 2. Try wsrv.nl CDN Proxy
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

  // 3. Try fallback avatar if provided (for profile pictures only)
  if (fallbackAvatarUrl) {
    try {
      const fbRes = await fetch(fallbackAvatarUrl, { signal: AbortSignal.timeout(3000) });
      if (fbRes.ok) {
        const buffer = await fbRes.arrayBuffer();
        const contentType = fbRes.headers.get("content-type") || "image/svg+xml";
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
  }

  return serveCleanPlaceholderSvg();
}

async function fetchRealAvatarUrl(username: string): Promise<string | null> {
  const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();
  if (!cleanUsername) return null;

  const cached = avatarCache.get(cleanUsername);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

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
    }
  // Strategy 2: Direct Instagram Profile Embed Scraper
  try {
    const embedRes = await fetch(`https://www.instagram.com/${cleanUsername}/embed/`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
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

  // Strategy 3: Bot Crawler OpenGraph Avatar
  try {
    const metaRes = await fetch(`https://www.instagram.com/${cleanUsername}/`, {
      headers: {
        "User-Agent": "WhatsApp/2.21.12.21 A",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });

    if (metaRes.ok) {
      const metaHtml = await metaRes.text();
      const ogImgMatch =
        metaHtml.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]*)"/i) ||
        metaHtml.match(/content="([^"]*)"\s+(?:property|name)="og:image"/i);

      if (ogImgMatch && ogImgMatch[1]) {
        const rawPic = ogImgMatch[1].replace(/&amp;/g, "&");
        if (rawPic && !rawPic.includes("instagram_profile.png") && !rawPic.includes("rsrc.php")) {
          avatarCache.set(cleanUsername, {
            url: rawPic,
            expiresAt: Date.now() + 1000 * 60 * 60 * 24,
          });
          return rawPic;
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

  // 2. DIRECT IMAGE PROXY BY URL
  if (directUrl) {
    return await serveImageBinary(directUrl);
  }

  return serveCleanPlaceholderSvg();
}
