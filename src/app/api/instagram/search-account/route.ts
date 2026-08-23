import { NextRequest, NextResponse } from "next/server";

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
    let followers = "";
    let postsCount = "";
    let avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanUsername)}&background=7c3aed&color=fff&size=128`;
    let isVerified = false;

    // Strategy 1: OGInstagram Profile & OpenGraph Resolver
    try {
      const ogRes = await fetch(`https://oginstagram.com/${cleanUsername}`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        next: { revalidate: 3600 },
      });

      if (ogRes.ok) {
        const html = await ogRes.text();
        const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
        const descMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
        const imageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);

        if (titleMatch && titleMatch[1]) {
          const rawTitle = titleMatch[1];
          const namePart = rawTitle.split("(@")[0]?.trim();
          if (namePart) displayName = namePart;
        }

        if (descMatch && descMatch[1]) {
          const rawDesc = descMatch[1];
          const followerMatch = rawDesc.match(/([0-9.,KMkm]+)\s+Followers/i);
          const postMatch = rawDesc.match(/([0-9.,KMkm]+)\s+Posts/i);
          if (followerMatch) followers = followerMatch[1];
          if (postMatch) postsCount = postMatch[1];
          bio = rawDesc;
        }

        if (imageMatch && imageMatch[1]) {
          avatarUrl = imageMatch[1];
        }
      }
    } catch {
      // Fallback to direct Instagram OpenGraph
    }

    // Strategy 2: Direct Instagram OpenGraph Fallback
    if (!followers && !bio) {
      try {
        const profileUrl = `https://www.instagram.com/${cleanUsername}/`;
        const response = await fetch(profileUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
          next: { revalidate: 3600 },
        });

        if (response.ok) {
          const html = await response.text();
          const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
          const descMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
          const imageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);

          if (titleMatch && titleMatch[1]) {
            const rawTitle = titleMatch[1];
            const namePart = rawTitle.split("(@")[0]?.trim();
            if (namePart) displayName = namePart;
          }

          if (descMatch && descMatch[1]) {
            const rawDesc = descMatch[1];
            const followerMatch = rawDesc.match(/([0-9.,KMkm]+)\s+Followers/i);
            const postMatch = rawDesc.match(/([0-9.,KMkm]+)\s+Posts/i);
            if (followerMatch) followers = followerMatch[1];
            if (postMatch) postsCount = postMatch[1];
            bio = rawDesc;
          }

          if (imageMatch && imageMatch[1]) {
            avatarUrl = imageMatch[1];
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
        bio: bio || `Public Instagram profile for @${cleanUsername}`,
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
