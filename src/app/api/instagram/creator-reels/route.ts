import { NextRequest, NextResponse } from "next/server";
import { resolveProfileViaSnapSave } from "@/lib/instagram";

export const dynamic = "force-dynamic";

/**
 * Scrapes a public Instagram account's media (Reels + posts) from any username.
 * Data source: SnapSave profile scraper + Cloudflare Edge Worker + Instagram web_profile_info
 */

const cache = new Map<string, { items: any[]; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000;

function igHeaders(extra: Record<string, string> = {}): HeadersInit {
  return {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "X-IG-App-ID": "936619743392459",
    "X-Requested-With": "XMLHttpRequest",
    Accept: "*/*",
    ...extra,
  };
}

function cleanCode(code: string): string {
  return code.replace(/[^\w-]/g, "");
}

async function fetchAllMedia(username: string): Promise<any[]> {
  // Strategy 1: SnapSave Profile Scraper (Bypasses Cloud 429/401 rate-limits, zero credentials)
  try {
    const snapItems = await resolveProfileViaSnapSave(username);
    if (Array.isArray(snapItems) && snapItems.length > 0) {
      return snapItems;
    }
  } catch {
    // Fall through to next strategy
  }

  const workerUrl = process.env.REELDASH_CF_WORKER_URL;

  // Strategy 2: Proxy through Cloudflare Worker edge (free, no login).
  if (workerUrl) {
    try {
      const res = await fetch(
        `${workerUrl.replace(/\/$/, "")}/reels?username=${encodeURIComponent(username)}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items) && data.items.length > 0) {
          return data.items.map((it: any) => ({
            shortcode: it.shortcode,
            display_url: it.thumbnail,
            is_video: it.isVideo,
            edge_media_to_caption: it.caption
              ? { edges: [{ node: { text: it.caption } }] }
              : { edges: [] },
            edge_media_preview_like: { count: it.likes },
            edge_media_to_comment: { count: it.comments },
          }));
        }
      }
    } catch {
      // fall through to direct fetch
    }
  }

  // Strategy 3: Direct unauthenticated fetch from this server (Vercel).
  try {
    const res = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
      { headers: igHeaders(), cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      const user = data?.data?.user;
      if (user) {
        const firstConn = user.edge_owner_to_timeline_media;
        const nodes = (firstConn?.edges || []).map((e: any) => e.node);
        if (nodes.length > 0) {
          return dedup(nodes);
        }
      }
    }
  } catch {
    // Return empty array
  }

  return [];
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
    rawThumbnailUrl: displayUrl,
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
    return NextResponse.json({ username, items: cached.items, cached: true });
  }

  let items: any[] = [];

  // Unauthenticated scrape of any public account's media (no login, no OAuth)
  try {
    items = await fetchAllMedia(username);
  } catch {
    // continue
  }

  let normalized = items.map(normalize).filter((n) => n.shortcode);

  // Cache successful responses if any
  if (normalized.length > 0) {
    cache.set(username.toLowerCase(), { items: normalized, ts: Date.now() });
  }

  const response = NextResponse.json(
    {
      username,
      items: normalized,
      count: normalized.length,
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
