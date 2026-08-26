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

    // Secondary fallback for shortcode size=m
    if (shortcode) {
      const retryRes = await fetch(`https://www.instagram.com/p/${shortcode}/media/?size=m`, {
        headers: {
          "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
          "Accept": "image/*",
        },
        redirect: "follow",
      });
      if (retryRes.ok) {
        const contentType = retryRes.headers.get("content-type") || "image/jpeg";
        const buffer = await retryRes.arrayBuffer();
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
          },
        });
      }
    }

    // High-res curated visual fallback based on shortcode hash
    const fallbacks = [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    ];

    let hash = 0;
    const str = shortcode || targetUrl || "default";
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const selectedFallback = fallbacks[Math.abs(hash) % fallbacks.length];

    const fbRes = await fetch(selectedFallback);
    if (fbRes.ok) {
      const buffer = await fbRes.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    return NextResponse.redirect(selectedFallback);
  } catch (err) {
    return NextResponse.redirect("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80");
  }
}
