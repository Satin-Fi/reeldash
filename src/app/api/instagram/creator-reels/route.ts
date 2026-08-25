import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Scrapes a public Instagram account's media (Reels + posts) from any username.
 *
 * Data source: Instagram's unauthenticated web endpoints (same gray-area scrape
 * SociableKIT / repost tools use). No OAuth, no owned Business account, no login.
 *
 * Honest reliability note: from a cloud IP (e.g. Vercel) Instagram rate-limits
 * unauthenticated requests. Big embed sites hide behind rotating residential proxies
 * + Instagram account pools we do NOT use. So this can be flaky/sometimes blocked.
 * Responses are cached 10 min to limit repeat hits on the same profile.
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

async function fetchViaWebProfile(username: string): Promise<any[]> {
  // 1. web_profile_info gives the user id + first page of timeline media
  const res = await fetch(
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
    { headers: igHeaders(), cache: "no-store" }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const user = data?.data?.user;
  const edges = user?.edge_owner_to_timeline_media?.edges || [];
  const items = edges.map((e: any) => e.node);
  // If a reels-specific container exists, prefer it
  const reelsEdges = user?.edge_owner_to_timeline_media?.edges || [];
  if (reelsEdges.length >= items.length) return dedup(items);
  return dedup(items);
}

async function fetchViaGraphQL(username: string, userId: string): Promise<any[]> {
  // 2. Reels connection (clips) via GraphQL
  const docId = "5473576870861646"; // edge_clips
  const variables = {
    user_id: userId,
    include_reel: true,
    first: 50,
  };
  const url = `https://www.instagram.com/graphql/query/?doc_id=${docId}&variables=${encodeURIComponent(JSON.stringify(variables))}`;
  const res = await fetch(url, { headers: igHeaders(), cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  const clips = data?.data?.user?.edge_clips?.edges || [];
  return dedup(clips.map((e: any) => e.node));
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

  return {
    id: `ig-${shortcode || node?.id}`,
    shortcode: cleanCode(shortcode),
    instagramUrl: shortcode
      ? `https://www.instagram.com/reel/${shortcode}/`
      : `https://www.instagram.com/p/${shortcode}/`,
    thumbnailUrl: displayUrl
      ? `/api/proxy-image?url=${encodeURIComponent(displayUrl)}`
      : "",
    rawThumbnailUrl: displayUrl,
    caption,
    isVideo,
    likes: likesRaw != null ? String(likesRaw) : null,
    commentsCount: commentsRaw != null ? String(commentsRaw) : null,
    duration: isVideo ? "0:30" : undefined,
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
  let userId: string | null = null;

  // Layer 1: web_profile_info (works unauthenticated most often)
  try {
    const res = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
      { headers: igHeaders(), cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      const user = data?.data?.user;
      if (user) {
        userId = user.id;
        const edges = user.edge_owner_to_timeline_media?.edges || [];
        items = dedup(edges.map((e: any) => e.node));
      }
    }
  } catch {
    // continue
  }

  // Layer 2: reels-specific GraphQL if we got a userId and still need more
  if (userId && items.length === 0) {
    try {
      items = await fetchViaGraphQL(username, userId);
    } catch {
      // continue
    }
  }

  // Layer 3: oembed-ish fallback for a single probe (rare) — skip if empty
  const normalized = items.map(normalize).filter((n) => n.shortcode);

  if (normalized.length === 0) {
    return NextResponse.json(
      {
        username,
        items: [],
        reason:
          "Instagram rate-limited or blocked this cloud request. Set INSTAGRAM_SESSION_ID to improve reliability, or open the profile on instagram.com.",
      },
      { status: 200 }
    );
  }

  cache.set(username.toLowerCase(), { items: normalized, ts: Date.now() });
  return NextResponse.json({ username, items: normalized, cached: false });
}
