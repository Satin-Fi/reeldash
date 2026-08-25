/**
 * ReelDash Edge Proxy Worker
 * Deployed on Cloudflare Workers (global edge — NOT a flagged datacenter IP like
 * Vercel). Forwards Instagram web requests from Cloudflare's edge IPs, which
 * Instagram rate-limits far less aggressively than cloud functions. No login,
 * no session cookie, no OAuth — purely an egress-IP proxy hop.
 *
 * Routes:
 *   GET /ig?path=<urlencoded instagram path/query>  -> proxies to instagram.com
 *   GET /reels?username=X                            -> proxied web_profile_info
 *   GET /reel?shortcode=X                            -> proxied video_url GraphQL
 */

const IG_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "X-IG-App-ID": "936619743392459",
  "X-Requested-With": "XMLHttpRequest",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300",
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }

    try {
      // Generic proxy: /ig?path=https://www.instagram.com/...
      if (url.pathname === "/ig") {
        const target = url.searchParams.get("path");
        if (!target || !target.includes("instagram.com")) {
          return json({ error: "Missing or invalid ?path (must target instagram.com)" }, 400);
        }
        const igRes = await fetch(target, { headers: IG_HEADERS, redirect: "follow" });
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

      // Creator media: /reels?username=X  (proxied web_profile_info)
      if (url.pathname === "/reels") {
        const username = (url.searchParams.get("username") || "").trim().replace(/^@/, "");
        if (!username) return json({ error: "Missing ?username" }, 400);
        const target = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;
        const igRes = await fetch(target, { headers: IG_HEADERS });
        if (!igRes.ok) return json({ error: "Instagram upstream " + igRes.status, upstream: igRes.status }, igRes.status);
        const data = await igRes.json();
        const user = data?.data?.user;
        if (!user) return json({ error: "No user returned", raw: data }, 502);
        const edges = user.edge_owner_to_timeline_media?.edges || [];
        const items = edges.map((e) => {
          const n = e.node;
          return {
            shortcode: n.shortcode,
            thumbnail:
              n.display_url ||
              n.thumbnail_src ||
              (n.thumbnail_resources?.[n.thumbnail_resources.length - 1]?.src) ||
              "",
            caption: n.edge_media_to_caption?.edges?.[0]?.node?.text || "",
            isVideo: !!n.is_video,
            likes: n.edge_media_preview_like?.count ?? null,
            comments: n.edge_media_to_comment?.count ?? null,
          };
        });
        return json({
          username,
          displayName: user.full_name,
          followers: user.edge_followed_by?.count ?? null,
          posts: user.edge_owner_to_timeline_media?.count ?? null,
          items,
        });
      }

      // Single reel video URL: /reel?shortcode=X
      if (url.pathname === "/reel") {
        const shortcode = url.searchParams.get("shortcode");
        if (!shortcode) return json({ error: "Missing ?shortcode" }, 400);
        const target = `https://www.instagram.com/graphql/query/?doc_id=8845758582119845&variables=${encodeURIComponent(
          JSON.stringify({ shortcode })
        )}`;
        const igRes = await fetch(target, { headers: IG_HEADERS });
        if (!igRes.ok) return json({ error: "Instagram upstream " + igRes.status }, igRes.status);
        const data = await igRes.json();
        const media = data?.data?.xdt_shortcode_media;
        if (media?.is_video && media?.video_url) {
          return json({ status: "available", videoUrl: media.video_url, shortcode });
        }
        return json({ status: "unavailable", shortcode });
      }

      return json({ error: "Unknown route", routes: ["/ig", "/reels", "/reel"] }, 404);
    } catch (err) {
      return json({ error: err.message || String(err) }, 500);
    }
  },
};
