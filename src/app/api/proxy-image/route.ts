import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// In-memory cache for instant responses
const avatarCache = new Map<string, { url: string; expiresAt: number }>();

function serveCleanPlaceholderSvg() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="100%" height="100%">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#8b5cf6;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)"/>
    <g fill="#ffffff" opacity="0.9" transform="translate(160, 260) scale(3.3)">
      <path d="M8 5v14l11-7z"/>
    </g>
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
  if (!imageUrl) return serveCleanPlaceholderSvg();

  // 1. If Meta CDN, wsrv.nl proxy is the most reliable (bypasses IP blocks)
  const isMetaCdn = imageUrl.includes("cdninstagram.com") || imageUrl.includes("fbcdn.net");

  if (isMetaCdn) {
    try {
      const wsrvUrl = `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&output=jpg&q=85`;
      const imgRes = await fetch(wsrvUrl, {
        signal: AbortSignal.timeout(3500),
      });
      if (imgRes.ok) {
        const buffer = await imgRes.arrayBuffer();
        if (buffer.byteLength > 200) {
          return new NextResponse(Buffer.from(buffer), {
            status: 200,
            headers: {
              "Content-Type": "image/jpeg",
              "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400",
            },
          });
        }
      }
    } catch {
      // Continue to direct fetch
    }
  }

  // 2. Direct fetch with Meta referer
  try {
    const directRes = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://www.instagram.com/",
      },
      signal: AbortSignal.timeout(2500),
    });
    if (directRes.ok) {
      const buffer = await directRes.arrayBuffer();
      const contentType = directRes.headers.get("content-type") || "image/jpeg";
      if (contentType.startsWith("image/") && buffer.byteLength > 200) {
        return new NextResponse(Buffer.from(buffer), {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400",
          },
        });
      }
    }
  } catch {
    // Continue
  }

  // 3. Fallback avatar if supplied
  if (fallbackAvatarUrl) {
    try {
      const fbRes = await fetch(fallbackAvatarUrl, { signal: AbortSignal.timeout(2500) });
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

  // Strategy 1: RSS-Bridge to recent post embed
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
          signal: AbortSignal.timeout(2500),
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
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        cache: "no-store",
        signal: AbortSignal.timeout(2500),
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
  } catch {
    // Continue
  }

  // Strategy 2: Instagram Topsearch API
  try {
    const searchRes = await fetch(
      `https://www.instagram.com/web/search/topsearch/?context=blended&query=${encodeURIComponent(cleanUsername)}&include_reel=false`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "X-Requested-With": "XMLHttpRequest",
          "Accept": "*/*",
        },
        signal: AbortSignal.timeout(2500),
      }
    );
    if (searchRes.ok) {
      const data = await searchRes.json();
      const userObj = data.users?.find((u: { user: { username: string; profile_pic_url?: string } }) => u.user.username.toLowerCase() === cleanUsername)?.user;
      if (userObj?.profile_pic_url) {
        avatarCache.set(cleanUsername, {
          url: userObj.profile_pic_url,
          expiresAt: Date.now() + 1000 * 60 * 60 * 24,
        });
        return userObj.profile_pic_url;
      }
    }
  } catch {
    // Continue
  }

  // Strategy 3: Direct Instagram Profile Embed
  try {
    const embedRes = await fetch(`https://www.instagram.com/${cleanUsername}/embed/`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
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
