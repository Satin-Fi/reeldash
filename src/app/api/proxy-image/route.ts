import { NextRequest, NextResponse } from "next/server";
import { resolveRealInstagramAvatar } from "@/lib/instagramAvatar";

export const dynamic = "force-dynamic";

// In-memory cache for shortcode cover images
const coverCache = new Map<string, { url: string; expiresAt: number }>();

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
        signal: AbortSignal.timeout(4500),
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
      signal: AbortSignal.timeout(3000),
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

async function extractCoverByShortcode(shortcode: string): Promise<string | null> {
  const clean = shortcode.replace(/[^\w-]/g, "").trim();
  if (!clean) return null;

  const cached = coverCache.get(clean);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  try {
    const embedRes = await fetch(`https://www.instagram.com/p/${clean}/embed/captioned/`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
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

      const matches = unescaped.match(/https:\/\/[^"'\s<>]+\.jpg[^"'\s<>]*/g) || [];
      for (const m of matches) {
        if (
          !m.includes("t51.82787-19") &&
          !m.includes("profile_pic") &&
          (m.includes("t51.82787-15") ||
            m.includes("CLIPS") ||
            m.includes("CAROUSEL_ITEM") ||
            m.includes("dst-jpg") ||
            m.includes("dst-jpegr"))
        ) {
          coverCache.set(clean, {
            url: m,
            expiresAt: Date.now() + 1000 * 60 * 60 * 24, // 24 hours
          });
          return m;
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
  const shortcode = searchParams.get("shortcode");

  // 1. AVATAR PROXY BY USERNAME
  if (username) {
    const cleanUser = username.replace(/^@/, "").trim().toLowerCase();
    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanUser)}&background=6366F1&color=fff&size=200&bold=true`;

    // Check Supabase first for authentic stored Meta CDN avatar
    try {
      const { getSupabaseAdmin } = await import("@/lib/supabase");
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data: acc } = await supabase
          .from("instagram_accounts")
          .select("avatar_url")
          .ilike("username", cleanUser)
          .limit(1)
          .single();

        if (acc?.avatar_url && acc.avatar_url.startsWith("http") && !acc.avatar_url.includes("proxy-image")) {
          return await serveImageBinary(acc.avatar_url, fallbackAvatar);
        }

        const { data: prof } = await supabase
          .from("profiles")
          .select("avatar_url")
          .ilike("username", cleanUser)
          .limit(1)
          .single();

        if (prof?.avatar_url && prof.avatar_url.startsWith("http") && !prof.avatar_url.includes("proxy-image")) {
          return await serveImageBinary(prof.avatar_url, fallbackAvatar);
        }
      }
    } catch {
      // Continue
    }

    try {
      const realAvatarUrl = await resolveRealInstagramAvatar(username);
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

  // 3. REEL / POST COVER BY SHORTCODE
  if (shortcode) {
    try {
      const coverUrl = await extractCoverByShortcode(shortcode);
      if (coverUrl) {
        return await serveImageBinary(coverUrl);
      }
    } catch {
      // Continue
    }
  }

  return serveCleanPlaceholderSvg();
}
