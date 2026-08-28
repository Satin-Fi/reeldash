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
    let foundRealData = false;

    // Strategy 1: Direct Meta / Facebook OpenGraph Crawler (100% Reliable Official Instagram Meta Tags)
    try {
      const metaRes = await fetch(`https://www.instagram.com/${cleanUsername}/`, {
        headers: {
          "User-Agent":
            "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
          "Accept":
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
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

        if (titleMatch && titleMatch[1]) {
          const rawTitle = decodeHtmlEntities(titleMatch[1]);
          const namePart = rawTitle.split("(@")[0]?.trim();
          if (namePart && namePart.length > 0 && namePart.toLowerCase() !== cleanUsername) {
            displayName = namePart;
          }
          foundRealData = true;
        }

        if (descMatch && descMatch[1]) {
          const rawDesc = decodeHtmlEntities(descMatch[1]);
          // "65M Followers, 204 Following, 11K Posts - See Instagram photos and videos..."
          const followerMatch = rawDesc.match(/([0-9.,KMkm]+)\s+Followers/i);
          const postMatch = rawDesc.match(/([0-9.,KMkm]+)\s+Posts/i);
          if (followerMatch) followers = followerMatch[1];
          if (postMatch) postsCount = postMatch[1];
          bio = rawDesc;
          foundRealData = true;
        }
      }
    } catch {
      // Continue to next strategy
    }

    // Strategy 2: Web Profile Info API (Direct metadata check)
    if (!foundRealData) {
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
          const u = data?.data?.user;
          if (u) {
            if (u.full_name) displayName = u.full_name;
            if (u.biography) bio = u.biography;
            if (u.edge_followed_by?.count != null) {
              followers = Number(u.edge_followed_by.count).toLocaleString();
            }
            if (u.edge_owner_to_timeline_media?.count != null) {
              postsCount = Number(u.edge_owner_to_timeline_media.count).toLocaleString();
            }
            isVerified = !!u.is_verified;
            foundRealData = true;
          }
        }
      } catch {
        // Continue
      }
    }

    // Strategy 3: Cloudflare Edge Worker
    if (!foundRealData) {
      const workerUrl =
        process.env.REELDASH_CF_WORKER_URL ||
        "https://reeldash-ig-proxy.reeldash-ig-proxy.workers.dev";
      if (workerUrl) {
        try {
          const wRes = await fetch(
            `${workerUrl.replace(/\/$/, "")}/profile?username=${encodeURIComponent(cleanUsername)}`,
            { cache: "no-store" }
          );
          if (wRes.ok) {
            const w = await wRes.json();
            if (w) {
              if (w.displayName) displayName = w.displayName;
              if (w.followers != null) followers = String(w.followers);
              if (w.postsCount != null) postsCount = String(w.postsCount);
              if (w.bio) bio = w.bio;
              isVerified = !!w.isVerified;
              foundRealData = true;
            }
          }
        } catch {
          // fall through
        }
      }
    }

    // Always route avatar through our high-speed proxy endpoint
    const avatarUrl = `/api/proxy-image?username=${encodeURIComponent(cleanUsername)}`;

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
