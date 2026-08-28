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

    // Preferred path: proxy through Cloudflare Worker edge (free, no login).
    // Avoids Vercel's cloud-IP rate-limit so followers/bio/avatar actually return.
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
          if (w && (w.followers != null || w.displayName)) {
            return NextResponse.json({
              success: true,
              account: {
                username: w.username || cleanUsername,
                displayName: w.displayName || cleanUsername,
                profileUrl: `https://instagram.com/${w.username || cleanUsername}`,
                avatarUrl: w.avatarUrl
                  ? `/api/proxy-image?url=${encodeURIComponent(w.avatarUrl)}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanUsername)}&background=7c3aed&color=fff&size=160`,
                followers: w.followers != null ? String(w.followers) : null,
                postsCount: w.postsCount != null ? String(w.postsCount) : null,
                bio: w.bio || null,
                isVerified: !!w.isVerified,
              },
            });
          }
        }
      } catch {
        // fall through to direct strategies
      }
    }

    let displayName = cleanUsername;
    let bio: string | null = null;
    let followers: string | null = null;
    let postsCount: string | null = null;
    let avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanUsername)}&background=7c3aed&color=fff&size=160`;
    let isVerified = false;

    // Strategy 0: InstagAPI (High-Reliability Direct Instagram Engine)
    const instagapiKey = process.env.INSTAGAPI_KEY;
    if (instagapiKey) {
      try {
        const iRes = await fetch(
          `https://api.instagapi.com/api/user/info?username_or_id=${encodeURIComponent(cleanUsername)}`,
          { headers: { "X-Api-Key": instagapiKey }, cache: "no-store" }
        );
        if (iRes.ok) {
          const resJson = await iRes.json();
          const u = resJson?.data;
          if (u && (u.username || u.full_name)) {
            const rawAvatar = u.profile_pic_url_hd || u.profile_pic_url;
            return NextResponse.json({
              success: true,
              account: {
                username: u.username || cleanUsername,
                displayName: u.full_name || u.username || cleanUsername,
                profileUrl: `https://instagram.com/${u.username || cleanUsername}`,
                avatarUrl: rawAvatar
                  ? `/api/proxy-image?url=${encodeURIComponent(rawAvatar)}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanUsername)}&background=7c3aed&color=fff&size=160`,
                followers: u.follower_count != null ? Number(u.follower_count).toLocaleString() : null,
                postsCount: u.media_count != null ? Number(u.media_count).toLocaleString() : null,
                bio: u.biography || null,
                isVerified: !!u.is_verified,
              },
            });
          }
        }
      } catch {
        // Fallback to next strategy
      }
    }
    try {
      const ogRes = await fetch(`https://oginstagram.com/${cleanUsername}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discord.app)",
          "Accept": "text/html,application/xhtml+xml",
        },
        cache: "no-store",
      });

      if (ogRes.ok) {
        const html = await ogRes.text();
        const titleMatch = html.match(/<meta[^>]+(?:property|name)=["']og:title["'][^>]+content=["']([^"']+)["']/i);
        const descMatch = html.match(/<meta[^>]+(?:property|name)=["'](?:og:description|description)["'][^>]+content=["']([^"']+)["']/i);
        const imgMatch = html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i);

        if (titleMatch && titleMatch[1]) {
          const rawTitle = decodeHtmlEntities(titleMatch[1]);
          const namePart = rawTitle.split("(@")[0]?.trim();
          if (namePart && namePart.length > 0 && namePart !== cleanUsername) {
            displayName = namePart;
          }
        }

        if (descMatch && descMatch[1]) {
          const rawDesc = decodeHtmlEntities(descMatch[1]);
          // Format 1: "📝 95 👤 1,312"
          const pMatch = rawDesc.match(/📝\s*([0-9.,KMkm]+)/);
          const fMatch = rawDesc.match(/👤\s*([0-9.,KMkm]+)/);
          if (fMatch) followers = fMatch[1];
          if (pMatch) postsCount = pMatch[1];

          // Format 2: "1,312 Followers, 95 Posts..."
          if (!followers) {
            const fMatch2 = rawDesc.match(/([0-9.,KMkm]+)\s+Followers/i);
            const pMatch2 = rawDesc.match(/([0-9.,KMkm]+)\s+Posts/i);
            if (fMatch2) followers = fMatch2[1];
            if (pMatch2) postsCount = pMatch2[1];
          }
          bio = rawDesc;
        }

        if (imgMatch && imgMatch[1]) {
          const rawImg = decodeHtmlEntities(imgMatch[1]);
          if (rawImg && !rawImg.includes("favicon")) {
            avatarUrl = `/api/proxy-image?url=${encodeURIComponent(rawImg)}`;
          }
        }
      }
    } catch {
      // Continue to next strategy
    }

    // Strategy 2: Direct Instagram OpenGraph
    if (!followers) {
      try {
        const profileUrl = `https://www.instagram.com/${cleanUsername}/`;
        const response = await fetch(profileUrl, {
          headers: {
            "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
          cache: "no-store",
        });

        if (response.ok) {
          const html = await response.text();

          const titleMatch =
            html.match(/<meta[^>]+(?:property|name)=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:title["']/i);

          const descMatch =
            html.match(/<meta[^>]+(?:property|name)=["'](?:og:description|description)["'][^>]+content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:description|description)["']/i);

          const imageMatch =
            html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i);

          if (titleMatch && titleMatch[1]) {
            const rawTitle = decodeHtmlEntities(titleMatch[1]);
            const namePart = rawTitle.split("(@")[0]?.trim();
            if (namePart) displayName = namePart;
          }

          if (descMatch && descMatch[1]) {
            const rawDesc = decodeHtmlEntities(descMatch[1]);
            const followerMatch = rawDesc.match(/([0-9.,KMkm]+)\s+Followers/i);
            const postMatch = rawDesc.match(/([0-9.,KMkm]+)\s+Posts/i);
            if (followerMatch) followers = followerMatch[1];
            if (postMatch) postsCount = postMatch[1];
            bio = rawDesc;
          }

          if (imageMatch && imageMatch[1]) {
            const rawImg = decodeHtmlEntities(imageMatch[1]);
            avatarUrl = `/api/proxy-image?url=${encodeURIComponent(rawImg)}`;
          }
        }
      } catch {
        // Fallback
      }
    }

    // Strategy 3: Web Profile Info API
    if (!followers) {
      try {
        const igRes = await fetch(
          `https://www.instagram.com/api/v1/users/web_profile_info/?username=${cleanUsername}`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
              "X-IG-App-ID": "936619743392459",
              "Accept": "*/*",
              "Referer": `https://www.instagram.com/${cleanUsername}/`,
            },
            cache: "no-store",
          }
        );

        if (igRes.ok) {
          const data = await igRes.json();
          const user = data?.data?.user;
          if (user) {
            displayName = user.full_name || displayName;
            bio = user.biography || bio;
            followers = String(user.edge_followed_by?.count ?? followers);
            postsCount = String(user.edge_owner_to_timeline_media?.count ?? postsCount);
            isVerified = !!user.is_verified;
            const rawAvatar = user.profile_pic_url_hd || user.profile_pic_url;
            if (rawAvatar) {
              avatarUrl = `/api/proxy-image?url=${encodeURIComponent(rawAvatar)}`;
            }
          }
        }
      } catch {
        // Fallback
      }
    }

    // Filter out Instagram login challenge string from bio
    if (bio && (bio.includes("Welcome back to Instagram") || bio.includes("Sign in to check out") || bio.includes("Capture and share"))) {
      bio = null;
    }

    return NextResponse.json({
      success: true,
      account: {
        username: cleanUsername,
        displayName: displayName || cleanUsername,
        profileUrl: `https://instagram.com/${cleanUsername}`,
        avatarUrl,
        followers: followers || null,
        postsCount: postsCount || null,
        bio: bio || null,
        isVerified,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to search account" },
      { status: 500 }
    );
  }
}
