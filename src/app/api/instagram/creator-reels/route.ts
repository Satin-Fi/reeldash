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
  // Strategy 0: Apify Instagram Profile Scraper (100+ posts in single synchronous call)
  const apifyToken = process.env.APIFY_TOKEN || process.env.APIFY_API_KEY;
  if (apifyToken) {
    try {
      const res = await fetch(
        `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${apifyToken}&timeout=60`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usernames: [username],
            resultsLimit: 100,
          }),
          cache: "no-store",
        }
      );
      if (res.ok) {
        const items = await res.json();
        if (Array.isArray(items) && items.length > 0) {
          console.log(`[Apify Deep Scraper] Fetched ${items.length} items for @${username}`);
          return dedup(
            items.map((it: any) => ({
              shortcode:
                it.shortCode ||
                it.shortcode ||
                it.url?.match(/\/(p|reel)\/([A-Za-z0-9_-]+)/)?.[2] ||
                "",
              display_url: it.displayUrl || it.thumbnailUrl || it.imageUrl || "",
              video_url: it.videoUrl || "",
              is_video: !!(it.isVideo || it.type === "Video" || (it.url || "").includes("/reel/")),
              isReel: !!((it.url || "").includes("/reel/") || it.type === "Video"),
              __typename: it.isVideo ? "GraphVideo" : "GraphImage",
              edge_media_to_caption: {
                edges: it.caption ? [{ node: { text: it.caption } }] : [],
              },
              edge_media_preview_like: { count: it.likesCount ?? it.likes },
              edge_media_to_comment: { count: it.commentsCount ?? it.comments },
            }))
          );
        }
      }
    } catch {
      // Fall through to edge scraper
    }
  }

  // Strategy 0.5: RapidAPI Deep Scraper (if RAPIDAPI_KEY is configured)
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (rapidApiKey) {
    try {
      const res = await fetch(
        `https://rocketapi-for-instagram.p.rapidapi.com/instagram/user/get_media`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": rapidApiKey,
            "X-RapidAPI-Host": "rocketapi-for-instagram.p.rapidapi.com",
          },
          body: JSON.stringify({ username: username, count: 50 }),
          cache: "no-store",
        }
      );
      if (res.ok) {
        const data = await res.json();
        const rawItems = data?.response?.body?.items || [];
        if (rawItems.length > 0) {
          console.log(`[RapidAPI Scraper] Fetched ${rawItems.length} items for @${username}`);
          return dedup(
            rawItems.map((it: any) => ({
              shortcode: it.code || it.shortcode,
              display_url: it.image_versions2?.candidates?.[0]?.url || it.thumbnail_url || "",
              video_url: it.video_versions?.[0]?.url || "",
              is_video: it.media_type === 2,
              isReel: it.media_type === 2 && it.product_type === "clips",
              __typename: it.media_type === 2 ? "GraphVideo" : "GraphImage",
              edge_media_to_caption: {
                edges: it.caption?.text ? [{ node: { text: it.caption.text } }] : [],
              },
              edge_media_preview_like: { count: it.like_count },
              edge_media_to_comment: { count: it.comment_count },
            }))
          );
        }
      }
    } catch {
      // Fall through to edge scraper
    }
  }

  const nodeMap = new Map<string, any>();

  // 1. Direct Instagram Profile HTML: Extract all 12 preloaded shortcodes and CDN images
  try {
    const igRes = await fetch(`https://www.instagram.com/${encodeURIComponent(username)}/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
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

      // Extract preloaded CDN images
      const preloadImgRegex = /<link rel="preload" as="image" href="([^"]+)"/gi;
      const preloadImages: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = preloadImgRegex.exec(html)) !== null) {
        const rawUrl = m[1].replace(/&amp;/g, "&");
        if (rawUrl.includes("cdninstagram") || rawUrl.includes("fbcdn")) {
          preloadImages.push(rawUrl);
        }
      }

      // Extract shortcodes
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
          });
          imgIdx++;
        }
      }
    }
  } catch {
    // Continue to Cloudflare Worker and RSS Bridge
  }

  // 2. Cloudflare Edge Worker Proxy: Enrich and add edge-discovered items
  const workerUrl =
    process.env.REELDASH_CF_WORKER_URL ||
    "https://reeldash-ig-proxy.reeldash-ig-proxy.workers.dev";
  if (workerUrl) {
    try {
      const res = await fetch(
        `${workerUrl.replace(/\/$/, "")}/reels?username=${encodeURIComponent(username)}`,
        { cache: "no-store", signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items)) {
          for (const it of data.items) {
            const code = it.shortcode;
            if (!code) continue;
            if (nodeMap.has(code)) {
              const existing = nodeMap.get(code);
              if (it.caption && (!existing.edge_media_to_caption.edges.length || !existing.edge_media_to_caption.edges[0]?.node?.text)) {
                existing.edge_media_to_caption = { edges: [{ node: { text: it.caption } }] };
              }
              if (it.thumbnail && !existing.display_url) {
                existing.display_url = it.thumbnail;
              }
              if (it.isVideo) existing.is_video = true;
            } else {
              nodeMap.set(code, {
                shortcode: code,
                display_url: it.thumbnail || "",
                video_url: "",
                is_video: !!it.isVideo,
                isReel: !!it.isVideo,
                __typename: it.isVideo ? "GraphVideo" : "GraphImage",
                edge_media_to_caption: it.caption ? { edges: [{ node: { text: it.caption } }] } : { edges: [] },
                edge_media_preview_like: { count: it.likes },
                edge_media_to_comment: { count: it.comments },
              });
            }
          }
        }
      }
    } catch {
      // fall through
    }
  }

  // 3. RSS Bridge: Enrich with captions, titles, and additional items
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
            "Accept": "application/json",
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
              const existing = nodeMap.get(shortcode);
              if (caption && (!existing.edge_media_to_caption.edges.length || !existing.edge_media_to_caption.edges[0]?.node?.text)) {
                existing.edge_media_to_caption = { edges: [{ node: { text: caption } }] };
              }
              if (displayUrl && !existing.display_url) {
                existing.display_url = displayUrl;
              }
              if (videoMatch?.[1]) {
                existing.video_url = videoMatch[1];
              }
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

  // Strategy 3: SnapSave Profile Scraper
  try {
    const snapItems = await resolveProfileViaSnapSave(username);
    if (Array.isArray(snapItems) && snapItems.length > 0) {
      return snapItems;
    }
  } catch {
    // Fall through to next strategy
  }

  // Strategy 4: Direct unauthenticated fetch
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
