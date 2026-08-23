import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function formatCount(num: number | undefined | null): string {
  if (num === undefined || num === null) return "0";
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return num.toLocaleString();
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
    let discoveredReels: Array<{
      shortcode: string;
      caption: string;
      thumbnailUrl: string;
      category: string;
      likes: string;
      views: string;
      isVideo: boolean;
    }> = [];

    // Strategy 1: Direct Instagram Web Profile Info API (100% Real Live Data)
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
            "X-Requested-With": "XMLHttpRequest",
          },
          next: { revalidate: 300 },
        }
      );

      if (igRes.ok) {
        const data = await igRes.json();
        const user = data?.data?.user;

        if (user) {
          displayName = user.full_name || cleanUsername;
          bio = user.biography || "";
          followers = formatCount(user.edge_followed_by?.count);
          postsCount = formatCount(user.edge_owner_to_timeline_media?.count);
          isVerified = !!user.is_verified;

          const rawAvatar = user.profile_pic_url_hd || user.profile_pic_url;
          if (rawAvatar) {
            avatarUrl = `/api/proxy-image?url=${encodeURIComponent(rawAvatar)}`;
          }

          // Extract real timeline posts & reels
          const edges = user.edge_owner_to_timeline_media?.edges || [];
          for (const edge of edges) {
            const node = edge.node;
            if (!node || !node.shortcode) continue;

            const captionText =
              node.edge_media_to_caption?.edges?.[0]?.node?.text || "";
            const likesCount = formatCount(
              node.edge_liked_by?.count || node.edge_media_preview_like?.count || 0
            );
            const viewCount = node.video_view_count
              ? formatCount(node.video_view_count)
              : likesCount;

            const rawThumb =
              node.display_url || node.thumbnail_src || user.profile_pic_url;
            const thumbUrl = rawThumb
              ? `/api/proxy-image?url=${encodeURIComponent(rawThumb)}`
              : `/api/proxy-image?shortcode=${node.shortcode}`;

            // Automatic categorization from real caption
            const lower = captionText.toLowerCase();
            let category = "General";
            if (
              lower.includes("fitness") ||
              lower.includes("gym") ||
              lower.includes("workout") ||
              lower.includes("health") ||
              lower.includes("doctor") ||
              lower.includes("medicine")
            ) {
              category = "Health & Fitness";
            } else if (
              lower.includes("food") ||
              lower.includes("recipe") ||
              lower.includes("cook") ||
              lower.includes("diet")
            ) {
              category = "Food & Cooking";
            } else if (
              lower.includes("travel") ||
              lower.includes("vlog") ||
              lower.includes("trip") ||
              lower.includes("sunset") ||
              lower.includes("explore")
            ) {
              category = "Travel & Vlog";
            } else if (
              lower.includes("tech") ||
              lower.includes("code") ||
              lower.includes("ai") ||
              lower.includes("software")
            ) {
              category = "Tech & AI";
            } else if (
              lower.includes("design") ||
              lower.includes("fashion") ||
              lower.includes("outfit") ||
              lower.includes("style")
            ) {
              category = "Fashion & Design";
            }

            discoveredReels.push({
              shortcode: node.shortcode,
              caption: captionText || `Post by @${cleanUsername}`,
              thumbnailUrl: thumbUrl,
              category,
              likes: likesCount,
              views: viewCount,
              isVideo: !!node.is_video,
            });
          }
        }
      }
    } catch {
      // Continue to fallback
    }

    // Strategy 2: OGInstagram & Instagram OpenGraph Fallback
    if (!followers && !bio) {
      try {
        const ogRes = await fetch(`https://oginstagram.com/${cleanUsername}`, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          next: { revalidate: 300 },
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
            avatarUrl = `/api/proxy-image?url=${encodeURIComponent(imageMatch[1])}`;
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
        bio: bio || null,
        isVerified,
        discoveredReels,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to search account" },
      { status: 500 }
    );
  }
}
