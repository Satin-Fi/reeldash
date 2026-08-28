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

  // Strategy 1: Direct Instagram Web Profile Info API
  try {
    const igRes = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${cleanUsername}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
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
        avatarUrlCache.set(cleanUsername, { url: pic, expiresAt: Date.now() + 1000 * 60 * 60 * 24 });
        return pic;
      }
    }
  } catch (e) {
    // fall through
  }

  // Strategy 2: oginstagram mirror
  try {
    const ogRes = await fetch(`https://oginstagram.com/${cleanUsername}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discord.app)",
      },
      cache: "no-store",
    });
    if (ogRes.ok) {
      const html = await ogRes.text();
      const imgMatch = html.match(
        /<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i
      );
      if (imgMatch && imgMatch[1]) {
        const pic = imgMatch[1].replace(/&amp;/g, "&");
        avatarUrlCache.set(cleanUsername, { url: pic, expiresAt: Date.now() + 1000 * 60 * 60 * 24 });
        return pic;
      }
    }
  } catch (e) {
    // fall through
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
    try {
      const realAvatarUrl = await fetchRealAvatarUrl(username);
      if (realAvatarUrl) {
        const imgRes = await fetch(realAvatarUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Referer": "https://www.instagram.com/",
          },
          cache: "no-store",
        });

        if (imgRes.ok) {
          const contentType = imgRes.headers.get("content-type") || "image/jpeg";
          const buffer = await imgRes.arrayBuffer();
          return new NextResponse(buffer, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=86400, s-maxage=86400",
            },
          });
        }
      }
    } catch (e) {
      // Fall through to fallback
    }

    // Fallback if avatar couldn't be fetched
    const fallbackRes = await fetch(
      `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=18181b&color=fff&size=160`
    );
    const buffer = await fallbackRes.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // 2. MEDIA THUMBNAIL PROXY
  let targetUrl = directUrl;
  if (!targetUrl && shortcode) {
    targetUrl = `https://www.instagram.com/p/${shortcode}/media/?size=l`;
  }

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing username, shortcode, or url" }, { status: 400 });
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Referer": "https://www.instagram.com/",
      },
      redirect: "follow",
      cache: "no-store",
    });

    if (res.ok) {
      const contentType = res.headers.get("content-type") || "image/jpeg";
      const buffer = await res.arrayBuffer();

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    }

    // Strategy 2: Fetch via Meta oEmbed to get fresh signed CDN thumbnail
    if (shortcode) {
      try {
        const oembedRes = await fetch(
          `https://www.instagram.com/api/v1/oembed/?url=https://www.instagram.com/p/${shortcode}/`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15",
              "Accept": "application/json",
            },
            cache: "no-store",
          }
        );
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          if (oembedData?.thumbnail_url) {
            const thumbRes = await fetch(oembedData.thumbnail_url, {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15",
                "Referer": "https://www.instagram.com/",
              },
            });
            if (thumbRes.ok) {
              const contentType = thumbRes.headers.get("content-type") || "image/jpeg";
              const buffer = await thumbRes.arrayBuffer();
              return new NextResponse(buffer, {
                headers: {
                  "Content-Type": contentType,
                  "Cache-Control": "public, max-age=86400, s-maxage=86400",
                },
              });
            }
          }
        }
      } catch {
        // continue
      }
    }

    // Clean neutral SVG placeholder
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500" fill="#18181b">
      <rect width="400" height="500" fill="#18181b"/>
      <circle cx="200" cy="220" r="36" fill="#27272a"/>
      <path d="M188 210h24v20h-24z" fill="#71717a"/>
      <circle cx="200" cy="220" r="6" fill="#18181b"/>
      <text x="200" y="280" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="middle">Instagram Media</text>
    </svg>`;

    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to proxy image" }, { status: 500 });
  }
}
