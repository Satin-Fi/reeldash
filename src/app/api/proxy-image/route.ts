import { NextRequest, NextResponse } from "next/server";
import { resolveRealInstagramAvatar } from "@/lib/instagramAvatar";

export const dynamic = "force-dynamic";

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
        signal: AbortSignal.timeout(4000),
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");
  const directUrl = searchParams.get("url");

  // 1. AVATAR PROXY BY USERNAME
  if (username) {
    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6366F1&color=fff&size=200&bold=true`;
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

  return serveCleanPlaceholderSvg();
}
