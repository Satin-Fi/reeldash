import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&#064;/g, "@")
    .replace(/&#x200d;/g, "")
    .replace(/&#x2022;/g, "•")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || searchParams.get("username") || "";

    const cleanUsername = query.trim().replace(/^@/, "").toLowerCase();

    if (!cleanUsername || cleanUsername.length < 2) {
      return NextResponse.json(
        { error: "Username query must be at least 2 characters" },
        { status: 400 }
      );
    }

    let displayName = cleanUsername;
    let bio = "";
    let followers: string | null = null;
    let postsCount: string | null = null;
    let avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanUsername)}&background=7c3aed&color=fff&size=160`;
    let isVerified = false;

    // Strategy 1: OpenGraph with facebookexternalhit (100% authentic, works on Vercel)
    try {
      const profileUrl = `https://www.instagram.com/${cleanUsername}/`;
      const response = await fetch(profileUrl, {
        headers: {
          "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        next: { revalidate: 300 },
      });

      if (response.ok) {
        const html = await response.text();
        const titleMatch =
          html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
          html.match(/content=["']([^"']+)["']\s+property=["']og:title["']/i);
        const descMatch =
          html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
          html.match(/content=["']([^"']+)["']\s+property=["']og:description["']/i);
        const imageMatch =
          html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
          html.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i);

        if (titleMatch && titleMatch[1]) {
          const rawTitle = decodeHtmlEntities(titleMatch[1]);
          // Pattern: "Romana Flowers (@lifeof.romana) • Instagram photos and videos"
          const namePart = rawTitle.split("(@")[0]?.trim();
          if (namePart) displayName = namePart;
        }

        if (descMatch && descMatch[1]) {
          const rawDesc = decodeHtmlEntities(descMatch[1]);
          // Pattern: "1,312 Followers, 952 Following, 95 Posts - See Instagram photos and videos from Romana Flowers (@lifeof.romana)"
          const followerMatch = rawDesc.match(/([0-9.,KMkm]+)\s+Followers/i);
          const postMatch = rawDesc.match(/([0-9.,KMkm]+)\s+Posts/i);
          if (followerMatch) followers = followerMatch[1];
          if (postMatch) postsCount = postMatch[1];
          bio = rawDesc;
        }

        if (imageMatch && imageMatch[1]) {
          avatarUrl = `/api/proxy-image?url=${encodeURIComponent(decodeHtmlEntities(imageMatch[1]))}`;
        }
      }
    } catch {
      // Fallback
    }

    // Strategy 2: Web Profile Info API
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
            next: { revalidate: 300 },
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

    return NextResponse.json({
      success: true,
      account: {
        username: cleanUsername,
        displayName: displayName || cleanUsername,
        profileUrl: `https://instagram.com/${cleanUsername}`,
        avatarUrl,
        followers: followers || null,
        postsCount: postsCount || null,
        bio: bio || `Instagram profile for @${cleanUsername}`,
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
