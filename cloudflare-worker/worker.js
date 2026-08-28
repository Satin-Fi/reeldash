/**
 * ReelDash Edge Proxy Worker (Option B)
 * Deployed on Cloudflare Workers (Global Edge Network — 300+ cities).
 * 
 * Features:
 * - Zero Login / Zero Session ID: Pure edge proxy & scraping pipeline.
 * - Full pagination via /api/v1/feed/user/{id}/ endpoint (60-96+ posts).
 * - SnapSave single-post video resolver directly on the edge.
 * - CORS headers enabled for all Reeldash domains.
 *
 * Routes:
 *   GET /reels?username=X          -> Fetches ALL creator posts via paginated user feed
 *   GET /reel?shortcode=X          -> Resolves direct 1080p MP4 / image via SnapSave
 *   GET /profile?username=X        -> Fetches creator avatar, bio, follower stats
 *   GET /ig?path=<encoded_url>     -> Proxies raw Instagram requests through Cloudflare Edge
 */

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
];

function getRandomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getHeaders(extra = {}) {
  return {
    "User-Agent": getRandomUA(),
    "X-IG-App-ID": "936619743392459",
    "X-Requested-With": "XMLHttpRequest",
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    ...extra,
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Cache-Control": "public, max-age=300",
    },
  });
}

/**
 * Fetch ALL posts for a user via /api/v1/feed/user/{id}/ with next_max_id pagination.
 * Cloudflare's global edge IPs bypass Instagram's unauthenticated pagination wall.
 * Returns up to maxPages * 12 posts (default: 10 pages = up to 120 posts).
 */
async function fetchAllUserPosts(userId, username, maxPages = 10) {
  const allItems = [];
  let maxId = null;
  let hasMore = true;
  let page = 0;

  while (hasMore && page < maxPages) {
    page++;
    let igUrl = `https://www.instagram.com/api/v1/feed/user/${userId}/?count=12`;
    if (maxId) {
      igUrl += `&max_id=${encodeURIComponent(maxId)}`;
    }

    try {
      const res = await fetch(igUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "X-IG-App-ID": "936619743392459",
          "X-Requested-With": "XMLHttpRequest",
          Accept: "*/*",
          "Accept-Language": "en-US,en;q=0.9",
          Referer: `https://www.instagram.com/${username}/`,
          "Sec-Fetch-Site": "same-origin",
          "Sec-Fetch-Mode": "cors",
        },
      });

      if (!res.ok) break;

      const data = await res.json();

      if (data.require_login || data.message?.includes("login")) break;

      const items = data.items || [];
      hasMore = data.more_available || false;
      maxId = data.next_max_id || null;

      for (const item of items) {
        const mediaType = item.media_type; // 1=photo, 2=video/reel, 8=carousel
        const isVideo = mediaType === 2;
        const isCarousel = mediaType === 8;
        const code = item.code;
        if (!code) continue;

        const thumbnail =
          item.image_versions2?.candidates?.[0]?.url ||
          item.carousel_media?.[0]?.image_versions2?.candidates?.[0]?.url ||
          "";

        allItems.push({
          shortcode: code,
          thumbnail,
          caption: item.caption?.text || "",
          isVideo,
          isCarousel,
          mediaType,
          likes: item.like_count || null,
          comments: item.comment_count || null,
          takenAt: item.taken_at || null,
        });
      }

      if (!maxId || !hasMore) break;
      await new Promise((r) => setTimeout(r, 150));
    } catch (e) {
      break;
    }
  }

  return allItems;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }

    try {
      // 1. Single Reel Video / Image Resolver via SnapSave on the Edge
      if (url.pathname === "/reel") {
        const shortcode = (url.searchParams.get("shortcode") || "").trim().replace(/[^\w-]/g, "");
        if (!shortcode) return json({ error: "Missing ?shortcode" }, 400);

        try {
          const targetUrl = `https://www.instagram.com/reel/${shortcode}/`;
          const form = new URLSearchParams();
          form.append("url", targetUrl);

          const snapRes = await fetch("https://snapsave.app/action.php?lang=en", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "User-Agent": getRandomUA(),
              Referer: "https://snapsave.app/",
            },
            body: form.toString(),
          });

          if (snapRes.ok) {
            const raw = await snapRes.text();
            const match = raw.match(
              /eval\(function\(h,u,n,t,e,r\)\{[\s\S]*?\}\("([\s\S]*?)",\s*(\d+),\s*"([\s\S]*?)",\s*(\d+),\s*(\d+),\s*(\d+)\)\)/
            );

            if (match) {
              const [_, h, u, n, t, e] = match;
              const _0xc50e = ["", "split", "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/", "slice", "indexOf", "", "", ".", "pow", "reduce", "reverse", "0"];

              function _0xe19c(d, eVal, f) {
                const g = _0xc50e[2].split("");
                const hStr = g.slice(0, eVal);
                const iStr = g.slice(0, f);
                const j = d.split("").reverse().reduce((a, b, c) => {
                  if (hStr.indexOf(b) !== -1) return (a += hStr.indexOf(b) * Math.pow(eVal, c));
                  return a;
                }, 0);
                let k = "";
                let jVal = j;
                while (jVal > 0) {
                  k = iStr[jVal % f] + k;
                  jVal = (jVal - (jVal % f)) / f;
                }
                return k || "0";
              }

              let decoded = "";
              const tNum = parseInt(t, 10);
              const eNum = parseInt(e, 10);
              for (let i = 0, len = h.length; i < len; i++) {
                let s = "";
                while (h[i] !== n[eNum] && i < len) {
                  s += h[i];
                  i++;
                }
                for (let j = 0; j < n.length; j++) {
                  s = s.replace(new RegExp(n[j], "g"), String(j));
                }
                decoded += String.fromCharCode(parseInt(_0xe19c(s, eNum, 10), 10) - tNum);
              }

              const decodedHtml = decodeURIComponent(escape(decoded));
              const videoMatch = decodedHtml.match(/href=\\"(https:\/\/d\.rapidcdn\.app\/[^\\"]+)\\"/) ||
                                 decodedHtml.match(/href="(https:\/\/d\.rapidcdn\.app\/[^"]+)"/) ||
                                 decodedHtml.match(/https:\/\/[^"'\s\\]+cdninstagram\.com[^"'\s\\]+\.mp4[^"'\s\\]*/i);

              if (videoMatch) {
                const directUrl = (videoMatch[1] || videoMatch[0]).replace(/\\/g, "");
                return json({ status: "available", videoUrl: directUrl, shortcode, isVideo: true });
              }
            }
          }
        } catch (e) {
          // Continue to fallback
        }

        return json({ status: "unavailable", shortcode }, 200);
      }

      // 2. Creator Media & Timeline: /reels?username=X
      // Full pagination via /api/v1/feed/user/{id}/ - Cloudflare edge IPs bypass Instagram's 401 wall
      if (url.pathname === "/reels") {
        const username = (url.searchParams.get("username") || "").trim().replace(/^@/, "");
        if (!username) return json({ error: "Missing ?username" }, 400);

        let userInfo = {
          username,
          displayName: username,
          followers: null,
          posts: null,
          avatarUrl: null,
        };

        const itemsMap = new Map();

        // Step 1: Get user ID + first batch + metadata via web_profile_info
        let userId = null;
        try {
          const profileRes = await fetch(
            `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
            {
              headers: {
                "User-Agent": getRandomUA(),
                "X-IG-App-ID": "936619743392459",
                Accept: "*/*",
                Referer: `https://www.instagram.com/${username}/`,
                "X-Requested-With": "XMLHttpRequest",
              },
            }
          );

          if (profileRes.ok) {
            const profileData = await profileRes.json();
            const user = profileData?.data?.user;

            if (user) {
              userId = user.id;
              userInfo.displayName = user.full_name || username;
              userInfo.followers = user.edge_followed_by?.count?.toString() || null;
              userInfo.posts = user.edge_owner_to_timeline_media?.count?.toString() || null;
              userInfo.avatarUrl = user.profile_pic_url_hd || user.profile_pic_url || null;

              // Add first 12 posts
              const edges = user.edge_owner_to_timeline_media?.edges || [];
              for (const edge of edges) {
                const node = edge.node;
                if (!node?.shortcode) continue;
                const isVideo = node.is_video;
                itemsMap.set(node.shortcode, {
                  shortcode: node.shortcode,
                  thumbnail: node.display_url || node.thumbnail_src || "",
                  caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || "",
                  isVideo,
                  isCarousel: node.__typename === "GraphSidecar",
                  likes: node.edge_media_preview_like?.count || null,
                  comments: node.edge_media_to_comment?.count || null,
                });
              }
            }
          }
        } catch (e) {
          // Continue
        }

        // Step 2: Full pagination - fetches all remaining posts (page 2 to N)
        // This works because Cloudflare's edge IPs are not flagged as unauthenticated scrapers
        if (userId) {
          try {
            const feedItems = await fetchAllUserPosts(userId, username, 10);
            for (const item of feedItems) {
              if (!item.shortcode) continue;
              if (!itemsMap.has(item.shortcode)) {
                itemsMap.set(item.shortcode, item);
              } else {
                const existing = itemsMap.get(item.shortcode);
                if (item.caption && !existing.caption) existing.caption = item.caption;
                if (item.thumbnail && !existing.thumbnail) existing.thumbnail = item.thumbnail;
                if (item.likes != null && existing.likes == null) existing.likes = item.likes;
                if (item.comments != null && existing.comments == null) existing.comments = item.comments;
              }
            }
          } catch (e) {
            // Fall back to web_profile_info first 12
          }
        }

        // Step 3: HTML scrape fallback if still empty
        if (itemsMap.size === 0) {
          try {
            const profilePageRes = await fetch(`https://www.instagram.com/${encodeURIComponent(username)}/`, {
              headers: {
                "User-Agent": getRandomUA(),
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Site": "none",
                "Upgrade-Insecure-Requests": "1",
              },
            });

            if (profilePageRes.ok) {
              const html = await profilePageRes.text();
              const preloadImgRegex = /<link rel="preload" as="image" href="([^"]+)"/gi;
              const preloadImages = [];
              let m;
              while ((m = preloadImgRegex.exec(html)) !== null) {
                const rawUrl = m[1].replace(/&amp;/g, "&");
                if (rawUrl.includes("cdninstagram") || rawUrl.includes("fbcdn")) {
                  preloadImages.push(rawUrl);
                }
              }
              const ogDesc = html.match(/<meta property="og:description" content="([^"]+)"/i)?.[1] || "";
              if (ogDesc) {
                const followersMatch = ogDesc.match(/([\d,]+[KMkm]?)\s+Followers/i);
                const postsMatch = ogDesc.match(/([\d,]+[KMkm]?)\s+Posts/i);
                if (followersMatch) userInfo.followers = followersMatch[1];
                if (postsMatch) userInfo.posts = postsMatch[1];
              }
              const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/i)?.[1] || "";
              if (ogImage) userInfo.avatarUrl = ogImage.replace(/&amp;/g, "&");
              const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/i)?.[1] || "";
              if (ogTitle) userInfo.displayName = ogTitle.split("(")[0].trim() || username;

              const shortcodeRegex = /\/(p|reel)\/([A-Za-z0-9_-]{9,13})/g;
              let imgIdx = 0;
              while ((m = shortcodeRegex.exec(html)) !== null) {
                const type = m[1];
                const code = m[2];
                if (!itemsMap.has(code)) {
                  itemsMap.set(code, {
                    shortcode: code,
                    thumbnail: preloadImages[imgIdx] || "",
                    caption: "",
                    isVideo: type === "reel",
                    isCarousel: false,
                    likes: null,
                    comments: null,
                  });
                  imgIdx++;
                }
              }
            }
          } catch (e) {
            // Continue
          }
        }

        // Step 4: RSS Bridge for caption enrichment
        try {
          const rssRes = await fetch(
            `https://rss-bridge.org/bridge01/?action=display&bridge=InstagramBridge&u=${encodeURIComponent(username)}&format=Json`,
            { headers: { "User-Agent": getRandomUA(), Accept: "application/json" } }
          );
          if (rssRes.ok) {
            const rssJson = await rssRes.json();
            for (const item of rssJson.items || []) {
              const itemUrl = item.url || "";
              const scMatch = itemUrl.match(/\/(reel|p)\/([A-Za-z0-9_-]+)/);
              const code = scMatch?.[2];
              if (!code) continue;
              const isVideo = item.title?.startsWith("▶") || itemUrl.includes("/reel/");
              const content = item.content_html || "";
              const imgMatch = content.match(/src="(https:\/\/[^"]+\.jpg[^"]*)"/);
              const displayUrl = imgMatch?.[1] || "";
              const caption = item.title?.replace(/^▶\s*/, "") || "";
              if (itemsMap.has(code)) {
                const existing = itemsMap.get(code);
                if (caption && !existing.caption) existing.caption = caption;
                if (displayUrl && !existing.thumbnail) existing.thumbnail = displayUrl;
                if (isVideo) existing.isVideo = true;
              } else {
                itemsMap.set(code, {
                  shortcode: code,
                  thumbnail: displayUrl,
                  caption,
                  isVideo,
                  isCarousel: false,
                  likes: null,
                  comments: null,
                });
              }
            }
          }
        } catch (e) {
          // Ignore
        }

        const items = Array.from(itemsMap.values());
        return json({
          ...userInfo,
          items,
          count: items.length,
          source: "cloudflare-edge-paginated",
        });
      }

      // 3. Creator Profile Header: /profile?username=X
      if (url.pathname === "/profile") {
        const username = (url.searchParams.get("username") || "").trim().replace(/^@/, "");
        if (!username) return json({ error: "Missing ?username" }, 400);

        try {
          const profileRes = await fetch(`https://www.instagram.com/${encodeURIComponent(username)}/`, {
            headers: {
              "User-Agent": getRandomUA(),
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.9",
              "Sec-Fetch-Mode": "navigate",
            },
          });

          if (profileRes.ok) {
            const html = await profileRes.text();
            const ogDesc = html.match(/<meta property="og:description" content="([^"]+)"/i)?.[1] || "";
            const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/i)?.[1] || "";
            const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/i)?.[1] || "";

            const followersMatch = ogDesc.match(/([\d,]+[KMkm]?)\s+Followers/i);
            const postsMatch = ogDesc.match(/([\d,]+[KMkm]?)\s+Posts/i);

            return json({
              username,
              displayName: ogTitle ? ogTitle.split("(")[0].trim() : username,
              bio: null,
              followers: followersMatch ? followersMatch[1] : null,
              postsCount: postsMatch ? postsMatch[1] : null,
              avatarUrl: ogImage ? ogImage.replace(/&amp;/g, "&") : null,
              isVerified: false,
            });
          }
        } catch (e) {
          // Fallback
        }

        return json({ username, displayName: username, avatarUrl: null }, 200);
      }

      // 4. Raw Instagram Edge Proxy: /ig?path=<target_url>
      if (url.pathname === "/ig") {
        const target = url.searchParams.get("path");
        if (!target || !target.includes("instagram.com")) {
          return json({ error: "Missing or invalid ?path (must target instagram.com)" }, 400);
        }
        const igRes = await fetch(target, { headers: getHeaders(), redirect: "follow" });
        const text = await igRes.text();
        return new Response(text, {
          status: igRes.status,
          headers: {
            "Content-Type": igRes.headers.get("content-type") || "application/json",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=120",
          },
        });
      }

      return json({ error: "Unknown route", routes: ["/reels", "/reel", "/profile", "/ig"] }, 404);
    } catch (err) {
      return json({ error: err.message || String(err) }, 500);
    }
  },
};
