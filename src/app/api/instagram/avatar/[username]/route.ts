import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// In-memory avatar URL cache to prevent repetitive scraping
const avatarCache = new Map<string, { url: string; expiresAt: number }>();

async function fetchRealAvatarUrl(username: string): Promise<string | null> {
  const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();
  if (!cleanUsername) return null;

  const cached = avatarCache.get(cleanUsername);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  // Strategy 1: Instagram Web Profile Info API (Direct & Official HD DP)
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
        avatarCache.set(cleanUsername, { url: pic, expiresAt: Date.now() + 1000 * 60 * 60 * 24 });
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
        avatarCache.set(cleanUsername, { url: pic, expiresAt: Date.now() + 1000 * 60 * 60 * 24 });
        return pic;
      }
    }
  } catch (e) {
    // fall through
  }

  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  const username = params.username;
  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  try {
    const realAvatarUrl = await fetchRealAvatarUrl(username);

    if (realAvatarUrl) {
      // Fetch the image data directly and stream it with caching headers
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

    // Fallback if user doesn't exist or rate-limited
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
  } catch (err: any) {
    return NextResponse.redirect(
      `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=18181b&color=fff&size=160`
    );
  }
}
