/**
 * ReelDash Unauthenticated Edge Resolver Worker
 * Deployed on Cloudflare Workers (Global Edge Network)
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const shortcode = url.searchParams.get("shortcode");

    if (!shortcode) {
      return new Response(JSON.stringify({ error: "Missing shortcode parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Handle CORS preflight
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
      // 1. Unauthenticated GraphQL query with browser headers
      const targetUrl = `https://www.instagram.com/graphql/query/?doc_id=8845758582119845&variables=${encodeURIComponent(
        JSON.stringify({ shortcode })
      )}`;

      const igRes = await fetch(targetUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1",
          "X-IG-App-ID": "936619743392459",
          "X-ASBD-ID": "129477",
          "X-Requested-With": "XMLHttpRequest",
          "Referer": `https://www.instagram.com/reels/${shortcode}/`,
          "Accept": "*/*",
        },
      });

      if (igRes.ok) {
        const data = await igRes.json();
        const media = data?.data?.xdt_shortcode_media;
        if (media?.is_video && media?.video_url) {
          return new Response(
            JSON.stringify({
              status: "available",
              videoUrl: media.video_url,
              shortcode,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            }
          );
        }
      }

      return new Response(
        JSON.stringify({
          status: "unavailable",
          reason: "Instagram requires residential edge routing or session verification",
          shortcode,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ status: "error", message: err.message || String(err) }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }
  },
};
