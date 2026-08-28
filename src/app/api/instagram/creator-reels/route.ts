import { NextRequest, NextResponse } from "next/server";

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
  const nodeMap = new Map<string, any>();

  const workerUrl =
    process.env.REELDASH_CF_WORKER_URL ||
    "https://reeldash-ig-proxy.reeldash-ig-proxy.workers.dev";
  const workerBase = workerUrl.replace(/\/$/, "");

  // Step 1: Get user ID + first 12 posts via web_profile_info
  let userId: string | null = null;
  try {
    const res = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
      {
        headers: igHeaders({
          Referer: `https://www.instagram.com/${username}/`,
          "Sec-Fetch-Site": "same-origin",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Dest": "empty",
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      }
    );
    if (res.ok) {
      const data = await res.json();
      const user = data?.data?.user;
      if (user) {
        userId = user.id;
        // Add first 12 posts
        for (const edge of user.edge_owner_to_timeline_media?.edges || []) {
          const node = edge.node;
          if (!node?.shortcode) continue;
          const isVideo = node.is_video;
          const isSidecar = node.__typename === "GraphSidecar";
          nodeMap.set(node.shortcode, {
            shortcode: node.shortcode,
            display_url: node.display_url || node.thumbnail_src || "",
            video_url: "",
            is_video: isVideo,
            isReel: isVideo,
            __typename: node.__typename || (isVideo ? "GraphVideo" : isSidecar ? "GraphSidecar" : "GraphImage"),
            edge_media_to_caption: node.edge_media_to_caption || { edges: [] },
            edge_media_preview_like: node.edge_media_preview_like || { count: null },
            edge_media_to_comment: node.edge_media_to_comment || { count: null },
            edge_sidecar_to_children: node.edge_sidecar_to_children || null,
          });
        }
      }
    }
  } catch {
    // Continue
  }

  // Step 2: Full cursor pagination via Cloudflare Worker /ig proxy
  // The Worker's edge IPs can paginate past page 1 where our Vercel server IP gets blocked.
  if (userId) {
    let maxId: string | null = null;
    let hasMore = true;
    let page = 0;
    const MAX_PAGES = 10; // up to 120 posts (10 pages × 12)

    while (hasMore && page < MAX_PAGES) {
      page++;
      const igUrl: string = "https://www.instagram.com/api/v1/feed/user/" + userId + "/?count=12" + (maxId ? "&max_id=" + encodeURIComponent(maxId) : "");
      const proxyUrl: string = workerBase + "/ig?path=" + encodeURIComponent(igUrl);

      try {
        const res = await fetch(proxyUrl, {
          cache: "no-store",
          signal: AbortSignal.timeout(12000),
        });

        if (!res.ok) break;

        const data = await res.json();

        if (data.require_login || data.message?.includes("login")) break;

        const items: any[] = data.items || [];
        hasMore = data.more_available || false;
        maxId = data.next_max_id || null;

        for (const item of items) {
          const code: string = item.code;
          if (!code) continue;
          const mediaType: number = item.media_type; // 1=photo, 2=video, 8=carousel
          const isVideo = mediaType === 2;
          const isCarousel = mediaType === 8;

          const displayUrl =
            item.image_versions2?.candidates?.[0]?.url ||
            item.carousel_media?.[0]?.image_versions2?.candidates?.[0]?.url ||
            "";

          const carouselChildren = (item.carousel_media || []).map((c: any) =>
            c.image_versions2?.candidates?.[0]?.url || ""
          ).filter(Boolean);

          if (nodeMap.has(code)) {
            // Enrich existing entry
            const existing = nodeMap.get(code)!;
            if (!existing.display_url && displayUrl) existing.display_url = displayUrl;
            if (!existing.edge_media_to_caption?.edges?.length && item.caption?.text) {
              existing.edge_media_to_caption = { edges: [{ node: { text: item.caption.text } }] };
            }
            if (item.like_count != null && existing.edge_media_preview_like.count == null) {
              existing.edge_media_preview_like = { count: item.like_count };
            }
          } else {
            nodeMap.set(code, {
              shortcode: code,
              display_url: displayUrl,
              video_url: "",
              is_video: isVideo,
              isReel: isVideo,
              __typename: isVideo ? "GraphVideo" : isCarousel ? "GraphSidecar" : "GraphImage",
              edge_media_to_caption: item.caption?.text
                ? { edges: [{ node: { text: item.caption.text } }] }
                : { edges: [] },
              edge_media_preview_like: { count: item.like_count || null },
              edge_media_to_comment: { count: item.comment_count || null },
              edge_sidecar_to_children: carouselChildren.length > 0
                ? { edges: carouselChildren.map((url: string) => ({ node: { display_url: url, thumbnail_src: url } })) }
                : null,
            });
          }
        }

        console.log(`[PaginatedScraper] @${username} page=${page} items=${items.length} total=${nodeMap.size} hasMore=${hasMore}`);

        if (!maxId || !hasMore) break;
        // Small delay to avoid hammering Instagram
        await new Promise((r) => setTimeout(r, 200));
      } catch {
        break;
      }
    }
  }

  // Step 3: RSS Bridge for caption enrichment + additional items
  try {
    const rssBridgeUrls = [
      `https://rss-bridge.org/bridge01/?action=display&bridge=InstagramBridge&u=${encodeURIComponent(username)}&format=Json`,
      `https://rss.rss-bridge.org/bridge01/?action=display&bridge=InstagramBridge&u=${encodeURIComponent(username)}&format=Json`,
    ];
    for (const bridgeUrl of rssBridgeUrls) {
      try {
        const res = await fetch(bridgeUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "application/json",
          },
          cache: "no-store",
          signal: AbortSignal.timeout(6000),
        });
        if (res.ok) {
          const json = await res.json();
          const items: any[] = json.items || [];
          for (const item of items) {
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

            if (nodeMap.has(shortcode)) {
              const existing = nodeMap.get(shortcode)!;
              if (caption && !existing.edge_media_to_caption?.edges?.length) {
                existing.edge_media_to_caption = { edges: [{ node: { text: caption } }] };
              }
              if (displayUrl && !existing.display_url) existing.display_url = displayUrl;
              if (videoMatch?.[1]) existing.video_url = videoMatch[1];
              if (isVideo) {
                existing.is_video = true;
                existing.isReel = isReel;
                existing.__typename = "GraphVideo";
              }
            } else {
              nodeMap.set(shortcode, {
                shortcode,
                display_url: displayUrl,
                video_url: videoMatch?.[1] || "",
                is_video: isVideo,
                isReel,
                __typename: isVideo ? "GraphVideo" : "GraphImage",
                edge_media_to_caption: { edges: caption ? [{ node: { text: caption } }] : [] },
                edge_media_preview_like: { count: null },
                edge_media_to_comment: { count: null },
                edge_sidecar_to_children: null,
              });
            }
          }
          if (items.length > 0) break;
        }
      } catch {
        // try next bridge URL
      }
    }
  } catch {
    // Continue with what we have in nodeMap
  }

  if (nodeMap.size > 0) {
    const combinedNodes = Array.from(nodeMap.values());
    console.log(`[Multi-Strategy Scraper] Fetched ${combinedNodes.length} items for @${username}`);
    return dedup(combinedNodes);
  }

  // Final fallback: Direct profile HTML SSR scrape (returns 6-12)
  try {
    const igRes = await fetch(`https://www.instagram.com/${encodeURIComponent(username)}/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });

    if (igRes.ok) {
      const html = await igRes.text();
      const preloadImgRegex = /<link rel="preload" as="image" href="([^"]+)"/gi;
      const preloadImages: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = preloadImgRegex.exec(html)) !== null) {
        const rawUrl = m[1].replace(/&amp;/g, "&");
        if (rawUrl.includes("cdninstagram") || rawUrl.includes("fbcdn")) {
          preloadImages.push(rawUrl);
        }
      }
      const shortcodeRegex = /\/(p|reel)\/([A-Za-z0-9_-]{9,13})/g;
      let imgIdx = 0;
      while ((m = shortcodeRegex.exec(html)) !== null) {
        const type = m[1];
        const code = m[2];
        if (!nodeMap.has(code)) {
          const displayUrl = preloadImages[imgIdx] || "";
          const isVideo = type === "reel";
          nodeMap.set(code, {
            shortcode: code,
            display_url: displayUrl,
            video_url: "",
            is_video: isVideo,
            isReel: isVideo,
            __typename: isVideo ? "GraphVideo" : "GraphImage",
            edge_media_to_caption: { edges: [] },
            edge_media_preview_like: { count: null },
            edge_media_to_comment: { count: null },
            edge_sidecar_to_children: null,
          });
          imgIdx++;
        }
      }
    }
  } catch {
    // Return empty
  }

  return dedup(Array.from(nodeMap.values()));
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

  // Scrape public account media (Option B Cloudflare Edge Worker -> Hybrid Scraper -> SnapSave)
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
