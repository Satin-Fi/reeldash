import { NextRequest, NextResponse } from "next/server";
import { resolveRealInstagramAvatar } from "@/lib/instagramAvatar";

export const dynamic = "force-dynamic";

// In-memory cache for live shortcode cover images (24-hour TTL)
const coverCache = new Map<string, { url: string; expiresAt: number }>();

function serveCleanEditorialCardSvg(creator?: string | null, shortcode?: string | null): NextResponse {
  const cleanCreator = (creator || "").replace(/^@/, "").trim();
  const displayName = cleanCreator
    ? `@${cleanCreator}`
    : shortcode
    ? `Reel #${shortcode.slice(0, 8)}`
    : "Saved Reel";
  const initial = cleanCreator ? cleanCreator.charAt(0).toUpperCase() : "R";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="100%" height="100%">
    <defs>
      <radialGradient id="bgGlow" cx="50%" cy="35%" r="75%">
        <stop offset="0%" style="stop-color:#1e2330;stop-opacity:1" />
        <stop offset="60%" style="stop-color:#10131a;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#08090d;stop-opacity:1" />
      </radialGradient>
      <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#8b5cf6;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bgGlow)"/>

    <!-- Subtle framing geometry -->
    <circle cx="200" cy="265" r="130" fill="none" stroke="#ffffff" stroke-opacity="0.04" stroke-width="1.5" />
    <circle cx="200" cy="265" r="85" fill="none" stroke="#ffffff" stroke-opacity="0.06" stroke-width="1.5" />

    <!-- Creator Avatar Badge -->
    <circle cx="200" cy="250" r="44" fill="url(#badgeGrad)"/>
    <text x="200" y="264" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="32" font-weight="700" text-anchor="middle" dominant-baseline="middle">${initial}</text>

    <!-- Handle text -->
    <text x="200" y="325" fill="#f8fafc" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" text-anchor="middle">${displayName}</text>

    <!-- Bottom Play indicator -->
    <rect x="165" y="500" width="70" height="26" rx="13" fill="#ffffff" fill-opacity="0.08" />
    <polygon points="196,507 208,513 196,519" fill="#ffffff" fill-opacity="0.85" />
  </svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

async function serveImageBinary(imageUrl: string, shortcode?: string | null): Promise<NextResponse | null> {
  if (!imageUrl) return null;

  let finalBuffer: Buffer | null = null;
  let contentType = "image/jpeg";

  // 1. If Meta CDN, wsrv.nl proxy bypasses IP geoblocks & rate limits
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
          finalBuffer = Buffer.from(buffer);
        }
      }
    } catch {
      // Continue to direct fetch
    }
  }

  // 2. Direct fetch with Meta referer and mobile UA
  if (!finalBuffer) {
    try {
      const directRes = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "https://www.instagram.com/",
        },
        signal: AbortSignal.timeout(3500),
      });
      if (directRes.ok) {
        const buffer = await directRes.arrayBuffer();
        const ct = directRes.headers.get("content-type") || "image/jpeg";
        if (ct.startsWith("image/") && buffer.byteLength > 200) {
          finalBuffer = Buffer.from(buffer);
          contentType = ct;
        }
      }
    } catch {
      // Return null to trigger self-healing recovery
    }
  }

  if (!finalBuffer) return null;

  // Asynchronously save to Supabase Storage bucket for permanent cloud hosting
  if (shortcode) {
    (async () => {
      try {
        const { getSupabaseAdmin } = await import("@/lib/supabase");
        const supabase = getSupabaseAdmin();
        if (supabase) {
          const filename = `${shortcode}.jpg`;
          const { error } = await supabase.storage.from("reel-thumbnails").upload(filename, finalBuffer, {
            contentType: "image/jpeg",
            upsert: true,
          });
          if (!error) {
            const { data } = supabase.storage.from("reel-thumbnails").getPublicUrl(filename);
            if (data?.publicUrl) {
              await supabase.from("reels").update({ thumbnail_url: data.publicUrl }).eq("shortcode", shortcode);
            }
          }
        }
      } catch {
        // Non-blocking
      }
    })();
  }

  return new NextResponse(finalBuffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
    },
  });
}

/**
 * Extracts live fresh cover image directly from Instagram via Facebook OpenGraph crawler.
 * Bypasses login walls, requires no API tokens, and never expires.
 */
async function extractCoverByShortcode(shortcode: string): Promise<string | null> {
  const clean = shortcode.replace(/[^\w-]/g, "").trim();
  if (!clean) return null;

  const cached = coverCache.get(clean);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  const urlsToTry = [
    `https://www.instagram.com/reel/${clean}/`,
    `https://www.instagram.com/p/${clean}/`,
  ];

  for (const targetUrl of urlsToTry) {
    try {
      const res = await fetch(targetUrl, {
        headers: {
          "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(3500),
      });

      if (res.ok) {
        const html = await res.text();
        const match = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']*)["']/i);
        if (match && match[1]) {
          const freshUrl = match[1].replace(/&amp;/g, "&");
          coverCache.set(clean, {
            url: freshUrl,
            expiresAt: Date.now() + 1000 * 60 * 60 * 24, // 24 hours
          });
          return freshUrl;
        }
      }
    } catch {
      // Continue to next URL
    }
  }

  return null;
}

async function handleAvatarRequest(username: string): Promise<NextResponse> {
  const cleanUser = username.replace(/^@/, "").trim().toLowerCase();
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanUser)}&background=111419&color=fff&size=300&bold=true`;

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
        .maybeSingle();

      if (acc?.avatar_url && acc.avatar_url.startsWith("http") && !acc.avatar_url.includes("proxy-image")) {
        const res = await serveImageBinary(acc.avatar_url);
        if (res) return res;
      }

      const { data: prof } = await supabase
        .from("profiles")
        .select("avatar_url")
        .ilike("username", cleanUser)
        .limit(1)
        .maybeSingle();

      if (prof?.avatar_url && prof.avatar_url.startsWith("http") && !prof.avatar_url.includes("proxy-image")) {
        const res = await serveImageBinary(prof.avatar_url);
        if (res) return res;
      }
    }
  } catch {
    // Continue
  }

  try {
    const realAvatarUrl = await resolveRealInstagramAvatar(cleanUser);
    if (realAvatarUrl) {
      const res = await serveImageBinary(realAvatarUrl);
      if (res) return res;
    }
  } catch {
    // Continue
  }

  // Fallback to styled UI avatar
  const fallbackRes = await serveImageBinary(fallbackAvatar);
  if (fallbackRes) return fallbackRes;

  return serveCleanEditorialCardSvg(cleanUser);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const usernameParam = searchParams.get("username") || searchParams.get("creator");
  const directUrl = searchParams.get("url");
  let shortcode = searchParams.get("shortcode");

  // 1. AVATAR PROXY BY USERNAME (when no directUrl and no shortcode)
  if (usernameParam && !directUrl && !shortcode) {
    return await handleAvatarRequest(usernameParam);
  }

  // 2. DIRECT IMAGE PROXY BY URL
  if (directUrl) {
    const directRes = await serveImageBinary(directUrl, shortcode);
    if (directRes) {
      return directRes;
    }
    // Direct fetch failed (e.g. Meta CDN URL expired or 403 Forbidden)!
    // Self-healing flow starts below:
  }

  // If shortcode wasn't provided, attempt fast lookup in Supabase reels table
  if (!shortcode && directUrl) {
    try {
      const { getSupabaseAdmin } = await import("@/lib/supabase");
      const supabase = getSupabaseAdmin();
      if (supabase) {
        // Query by matching URL snippet
        const snippet = directUrl.slice(0, 45);
        const { data: row } = await supabase
          .from("reels")
          .select("shortcode, creator_handle")
          .like("thumbnail_url", `%${snippet}%`)
          .limit(1)
          .maybeSingle();

        if (row?.shortcode) shortcode = row.shortcode;
      }
    } catch {
      // Continue
    }
  }

  // 3. REEL / POST COVER SELF-HEALING RECOVERY BY SHORTCODE
  if (shortcode) {
    try {
      const freshCoverUrl = await extractCoverByShortcode(shortcode);
      if (freshCoverUrl) {
        const coverRes = await serveImageBinary(freshCoverUrl, shortcode);
        if (coverRes) {
          return coverRes;
        }
      }
    } catch {
      // Continue to creator avatar fallback
    }
  }

  // 4. FALLBACK TO CREATOR AVATAR IF AVAILABLE
  if (usernameParam) {
    const avatarRes = await handleAvatarRequest(usernameParam);
    if (avatarRes) return avatarRes;
  }

  // 5. EDITORIAL SLEEK SVG AS FINAL FALLBACK
  return serveCleanEditorialCardSvg(usernameParam, shortcode);
}

