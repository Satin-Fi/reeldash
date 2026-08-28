import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Scrapes a public Instagram account's media (Reels + posts) from any username.
 * Data source: High-speed Parallel RSS Bridge + Instagram Embed & OpenGraph Metadata
 */

const cache = new Map<string, { items: any[]; userDetails: any; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 min cache

function cleanCode(code: string): string {
  return code.replace(/[^\w-]/g, "");
}

async function fetchAllMedia(username: string): Promise<any> {
  const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();
  const nodeMap = new Map<string, any>();

  let userAvatar: string | null = null;
  let userDisplayName: string | null = null;
  let userFollowers: string | null = null;
  let userPostsCount: string | null = null;

  // 1. FAST PRIMARY: Parallel RSS Bridge Fetch (< 800ms)
  const bridgeUrls = [
    `https://rss.trom.tf/?action=display&bridge=InstagramBridge&u=${encodeURIComponent(cleanUsername)}&format=Json`,
    `https://rss-bridge.org/bridge01/?action=display&bridge=InstagramBridge&u=${encodeURIComponent(cleanUsername)}&format=Json`,
    `https://rss.bloat.cat/?action=display&bridge=InstagramBridge&u=${encodeURIComponent(cleanUsername)}&format=Json`,
  ];

  try {
    const rssResult = await Promise.any(
      bridgeUrls.map(async (url) => {
        const res = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            Accept: "application/json",
          },
          cache: "no-store",
          signal: AbortSignal.timeout(4000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data.items || data.items.length === 0) throw new Error("No items");
        return data;
      })
    );

    if (rssResult?.items?.length) {
      const firstShortcode = rssResult.items[0]?.url?.match(/\/(reel|p)\/([A-Za-z0-9_-]+)/)?.[2];
      if (firstShortcode) {
        try {
          const embedRes = await fetch(`https://www.instagram.com/p/${firstShortcode}/embed/captioned/`, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
            cache: "no-store",
            signal: AbortSignal.timeout(2500),
          });
          if (embedRes.ok) {
            const html = await embedRes.text();
            const unescaped = html.replace(/\\u0026/gi, "&").replace(/\\u00253D/gi, "%3D").replace(/\\\//g, "/").replace(/\\/g, "").replace(/&amp;/g, "&");
            const matches = unescaped.match(/https:\/\/[a-zA-Z0-9.\-_]*scontent[a-zA-Z0-9.\-_]*\.cdninstagram\.com\/[^\s"'<>]+/g) || [];
            for (const m of matches) {
              if (m.includes("t51.82787-19") || m.includes("t51.2885-19") || m.includes("s150x150") || m.includes("profile_pic")) {
                userAvatar = m;
                break;
              }
            }
          }
        } catch {
          // Continue
        }
      }

      for (const item of rssResult.items) {
        const url = item.url || "";
        const shortcodeMatch = url.match(/\/(reel|p)\/([A-Za-z0-9_-]+)/);
        const shortcode = shortcodeMatch?.[2] || "";
        if (!shortcode) continue;

        const isVideo = item.title?.startsWith("▶") || url.includes("/reel/");
        const isReel = url.includes("/reel/");
        const content = item.content_html || "";
        const imgMatch = content.match(/src="(https:\/\/[^"]+\.jpg[^"]*)"/);
        const videoMatch = content.match(/src="(https:\/\/[^"]+\.mp4[^"]*)"/);
        const displayUrl = imgMatch?.[1] || "";
        const caption = item.title?.replace(/^▶\s*/, "") || "";

        nodeMap.set(shortcode, {
          shortcode,
          display_url: displayUrl,
          video_url: videoMatch?.[1] || "",
          is_video: isVideo,
          isReel,
          __typename: isVideo ? "GraphVideo" : "GraphImage",
          edge_media_to_caption: {
            edges: caption ? [{ node: { text: caption } }] : [],
          },
          edge_media_preview_like: { count: null },
          edge_media_to_comment: { count: null },
          edge_sidecar_to_children: null,
        });
      }
    }
  } catch {
    // Continue to next fallbacks
  }

  // 2. CREATOR PROFILE METADATA & AVATAR RESOLVER
  try {
    // Strategy A: Embed engine for avatar
    const embedRes = await fetch(`https://www.instagram.com/${cleanUsername}/embed/`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });

    if (embedRes.ok) {
      const embedHtml = await embedRes.text();
      const scontentMatches =
        embedHtml.match(
          /https:[\\\/]+[a-zA-Z0-9.\-_]*scontent[a-zA-Z0-9.\-_]*\.cdninstagram\.com[\\\/][^"'\s<>]+/g
        ) || [];

      for (const rawUrl of scontentMatches) {
        const decoded = rawUrl
          .replace(/\\\//g, "/")
          .replace(/\\u00253D/gi, "%3D")
          .replace(/\\u0026/gi, "&")
          .replace(/&amp;/g, "&")
          .replace(/\\+$/, "");

        if (
          decoded.includes("t51.82787-19") ||
          decoded.includes("t51.2885-19") ||
          decoded.includes("s150x150") ||
          decoded.includes("s100x100") ||
          decoded.includes("profile_pic")
        ) {
          userAvatar = decoded;
          break;
        }
      }
    }
  } catch {
    // Continue
  }

  // Strategy B: OpenGraph crawler for display name & follower count
  try {
    const metaRes = await fetch(`https://www.instagram.com/${cleanUsername}/`, {
      headers: {
        "User-Agent": "WhatsApp/2.21.12.21 A",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
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
        const namePart = titleMatch[1].split("(@")[0]?.trim();
        if (namePart && namePart.length > 0 && namePart.toLowerCase() !== cleanUsername) {
          userDisplayName = namePart;
        }
      }

      if (descMatch && descMatch[1]) {
        const followerMatch = descMatch[1].match(/([0-9.,KMkm]+)\s+Followers/i);
        const postMatch = descMatch[1].match(/([0-9.,KMkm]+)\s+Posts/i);
        if (followerMatch) userFollowers = followerMatch[1];
        if (postMatch) userPostsCount = postMatch[1];
      }
    }
  } catch {
    // Continue
  }

  return {
    items: dedup(Array.from(nodeMap.values())),
    userAvatar,
    userDisplayName,
    userFollowers,
    userPostsCount,
  };
}

function dedup(nodes: any[]): any[] {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const n of nodes) {
    const code = n?.shortcode || n?.id;
    if (!code || seen.has(code)) continue;
    seen.add(code);
    out.push(n);
  }
  return out;
}

function normalize(node: any) {
  const shortcode = node?.shortcode || "";
  const displayUrl =
    node?.display_url ||
    node?.thumbnail_src ||
    node?.thumbnail_resources?.[node.thumbnail_resources.length - 1]?.src ||
    "";
  const isVideo = !!node?.is_video;
  const isSidecar = node?.__typename === "GraphSidecar" || !!node?.edge_sidecar_to_children;
  const carouselChildren: string[] = (node?.edge_sidecar_to_children?.edges || [])
    .map((e: any) => e.node?.display_url || e.node?.thumbnail_src)
    .filter(Boolean);

  const carouselImages = carouselChildren.length > 0
    ? carouselChildren.map((u: string) => `/api/proxy-image?url=${encodeURIComponent(u)}`)
    : displayUrl
    ? [`/api/proxy-image?url=${encodeURIComponent(displayUrl)}`]
    : [];

  const caption =
    node?.edge_media_to_caption?.edges?.[0]?.node?.text ||
    node?.caption?.text ||
    "";
  const likesRaw =
    node?.edge_media_preview_like?.count ??
    node?.edge_liked_by?.count ??
    node?.like_count ??
    null;
  const commentsRaw =
    node?.edge_media_to_comment?.count ?? node?.comment_count ?? null;

  const mediaType: "reel" | "post" = isVideo ? "reel" : "post";

  return {
    id: `ig-${shortcode || node?.id}`,
    shortcode: cleanCode(shortcode),
    instagramUrl: isVideo
      ? `https://www.instagram.com/reel/${shortcode}/`
      : `https://www.instagram.com/p/${shortcode}/`,
    thumbnailUrl: displayUrl
      ? `/api/proxy-image?url=${encodeURIComponent(displayUrl)}`
      : "",
    rawThumbnailUrl: displayUrl || "",
    caption,
    isVideo,
    isCarousel: isSidecar || carouselChildren.length > 1,
    carouselImages,
    mediaType,
    likes: likesRaw != null ? String(likesRaw) : null,
    commentsCount: commentsRaw != null ? String(commentsRaw) : null,
    duration: isVideo ? "0:30" : isSidecar ? `Carousel (${carouselImages.length})` : "Post",
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = (searchParams.get("username") || "").trim().replace(/^@/, "");

  if (!username || username.length < 2) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  const cached = cache.get(username.toLowerCase());
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({
      username,
      items: cached.items,
      count: cached.items.length,
      avatarUrl: cached.userDetails.userAvatar
        ? `/api/proxy-image?url=${encodeURIComponent(cached.userDetails.userAvatar)}`
        : `/api/proxy-image?username=${encodeURIComponent(username)}`,
      displayName: cached.userDetails.userDisplayName || username,
      followers: cached.userDetails.userFollowers || null,
      postsCount: cached.userDetails.userPostsCount || null,
      cached: true,
    });
  }

  let mediaResult: {
    items: any[];
    userAvatar?: string | null;
    userDisplayName?: string | null;
    userFollowers?: string | null;
    userPostsCount?: string | null;
  } = { items: [] };

  try {
    mediaResult = await fetchAllMedia(username);
  } catch {
    // continue
  }

  const normalized = (mediaResult.items || []).map(normalize).filter((n) => n.shortcode);

  if (normalized.length > 0) {
    cache.set(username.toLowerCase(), {
      items: normalized,
      userDetails: mediaResult,
      ts: Date.now(),
    });
  }

  const response = NextResponse.json(
    {
      username,
      items: normalized,
      count: normalized.length,
      avatarUrl: mediaResult.userAvatar
        ? `/api/proxy-image?url=${encodeURIComponent(mediaResult.userAvatar)}`
        : `/api/proxy-image?username=${encodeURIComponent(username)}`,
      displayName: mediaResult.userDisplayName || username,
      followers: mediaResult.userFollowers || null,
      postsCount: mediaResult.userPostsCount || null,
      isLiveScraped: normalized.length > 0,
      reason: normalized.length === 0 ? "Instagram unauthenticated rate limit" : null,
    },
    { status: 200 }
  );

  response.headers.set(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=600"
  );

  return response;
}
