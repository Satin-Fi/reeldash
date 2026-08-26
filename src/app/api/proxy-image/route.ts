import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shortcode = searchParams.get("shortcode");
  const directUrl = searchParams.get("url");

  let targetUrl = directUrl;
  if (!targetUrl && shortcode) {
    targetUrl = `https://www.instagram.com/p/${shortcode}/media/?size=l`;
  }

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing shortcode or url" }, { status: 400 });
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Referer": "https://www.instagram.com/",
      },
      redirect: "follow",
      cache: "no-store",
    });

    if (res.ok) {
      const contentType = res.headers.get("content-type") || "image/jpeg";
      const buffer = await res.arrayBuffer();

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    }

    // Strategy 2: Fetch via Meta oEmbed to get fresh signed CDN thumbnail
    if (shortcode) {
      try {
        const oembedRes = await fetch(
          `https://www.instagram.com/api/v1/oembed/?url=https://www.instagram.com/p/${shortcode}/`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15",
              "Accept": "application/json",
            },
            cache: "no-store",
          }
        );
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          if (oembedData?.thumbnail_url) {
            const thumbRes = await fetch(oembedData.thumbnail_url, {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15",
                "Referer": "https://www.instagram.com/",
              },
            });
            if (thumbRes.ok) {
              const contentType = thumbRes.headers.get("content-type") || "image/jpeg";
              const buffer = await thumbRes.arrayBuffer();
              return new NextResponse(buffer, {
                headers: {
                  "Content-Type": contentType,
                  "Cache-Control": "public, max-age=86400, s-maxage=86400",
                },
              });
            }
          }
        }
      } catch {
        // continue
      }
    }

    // Clean neutral SVG placeholder (Never fake stock photos)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500" fill="#18181b">
      <rect width="400" height="500" fill="#18181b"/>
      <circle cx="200" cy="220" r="36" fill="#27272a"/>
      <path d="M188 210h24v20h-24z" fill="#71717a"/>
      <circle cx="200" cy="220" r="6" fill="#18181b"/>
      <text x="200" y="280" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="middle">Instagram Media</text>
    </svg>`;

    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return new NextResponse(null, { status: 404 });
  }
}
