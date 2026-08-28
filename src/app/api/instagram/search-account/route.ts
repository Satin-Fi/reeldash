import { NextRequest, NextResponse } from "next/server";
import { extractInstagramUsername } from "@/lib/instagram";

export const dynamic = "force-dynamic";

function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&#064;/g, "@")
    .replace(/&#x200d;/g, "")
    .replace(/&#x2022;/g, "•")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#([0-9]+);/g, (_, code) => {
      try {
        return String.fromCodePoint(parseInt(code, 10));
      } catch {
        return "";
      }
    });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || searchParams.get("username") || "";

    const cleanUsername = extractInstagramUsername(query).toLowerCase();

    if (!cleanUsername || cleanUsername.length < 2) {
      return NextResponse.json(
        { error: "Username query must be at least 2 characters" },
        { status: 400 }
      );
    }

    let displayName = cleanUsername;
    let bio: string | null = null;
    let followers: string | null = null;
    let postsCount: string | null = null;
    let isVerified = false;
    let realAvatarCdnUrl: string | null = null;

    // Strategy 1: Embed Scraper (100% Reliable & Global)
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
            realAvatarCdnUrl = decoded;
            break;
          }
        }
      }
    } catch {
      // continue
    }

    // Strategy 2: Multi-crawler OpenGraph extraction for Bio, Followers, Posts
    const userAgents = [
      "WhatsApp/2.21.12.21 A",
      "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
      "Twitterbot/1.0",
    ];

    for (const ua of userAgents) {
      try {
        const metaRes = await fetch(`https://www.instagram.com/${cleanUsername}/`, {
          headers: {
            "User-Agent": ua,
            "Accept":
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
          redirect: "follow",
          cache: "no-store",
        });

        if (metaRes.ok) {
          const html = await metaRes.text();

          const titleMatch =
            html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);

          const descMatch =
            html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);

          const ogImgMatch =
            html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

          if (titleMatch && titleMatch[1]) {
            const rawTitle = decodeHtmlEntities(titleMatch[1]);
            const namePart = rawTitle.split("(@")[0]?.trim();
            if (namePart && namePart.length > 0 && namePart.toLowerCase() !== cleanUsername) {
              displayName = namePart;
            }
          }

          if (descMatch && descMatch[1]) {
            const rawDesc = decodeHtmlEntities(descMatch[1]);
            const followerMatch = rawDesc.match(/([0-9.,KMkm]+)\s+Followers/i);
            const postMatch = rawDesc.match(/([0-9.,KMkm]+)\s+Posts/i);
            if (followerMatch) followers = followerMatch[1];
            if (postMatch) postsCount = postMatch[1];
            bio = rawDesc;
          }

          if (!realAvatarCdnUrl && ogImgMatch && ogImgMatch[1]) {
            const rawPic = ogImgMatch[1].replace(/&amp;/g, "&");
            if (rawPic.startsWith("http")) {
              realAvatarCdnUrl = rawPic;
            }
          }

          if (realAvatarCdnUrl && bio) break;
        }
      } catch {
        // continue
      }
    }

    const avatarUrl = realAvatarCdnUrl
      ? `/api/proxy-image?url=${encodeURIComponent(realAvatarCdnUrl)}`
      : `/api/proxy-image?username=${encodeURIComponent(cleanUsername)}`;

    return NextResponse.json({
      success: true,
      account: {
        username: cleanUsername,
        displayName: displayName || cleanUsername,
        profileUrl: `https://instagram.com/${cleanUsername}`,
        avatarUrl,
        followers,
        postsCount,
        bio,
        isVerified,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to search Instagram account" },
      { status: 500 }
    );
  }
}
