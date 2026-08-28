// In-memory cache for instant avatar lookups
const avatarCache = new Map<string, { url: string; expiresAt: number }>();

export async function resolveRealInstagramAvatar(username: string): Promise<string | null> {
  const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();
  if (!cleanUsername || cleanUsername.length < 2) return null;

  const cached = avatarCache.get(cleanUsername);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  // Strategy 1: RSS-Bridge to recent post captioned embed (Fastest & 100% authentic Meta CDN)
  try {
    const bridgeUrls = [
      `https://rss.trom.tf/?action=display&bridge=InstagramBridge&u=${encodeURIComponent(cleanUsername)}&format=Json`,
      `https://rss-bridge.org/bridge01/?action=display&bridge=InstagramBridge&u=${encodeURIComponent(cleanUsername)}&format=Json`,
      `https://rss.bloat.cat/?action=display&bridge=InstagramBridge&u=${encodeURIComponent(cleanUsername)}&format=Json`,
    ];

    const data = await Promise.any(
      bridgeUrls.map(async (url) => {
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
          cache: "no-store",
          signal: AbortSignal.timeout(3500),
        });
        if (!res.ok) throw new Error("bridge fail");
        const j = await res.json();
        if (!j.items || j.items.length === 0) throw new Error("no items");
        return j;
      })
    );

    const firstUrl = data.items[0]?.url;
    const shortcode = firstUrl?.match(/\/(reel|p)\/([A-Za-z0-9_-]+)/)?.[2];
    if (shortcode) {
      const embedRes = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        cache: "no-store",
        signal: AbortSignal.timeout(3500),
      });
      if (embedRes.ok) {
        const html = await embedRes.text();
        const unescaped = html
          .replace(/\\u0026/gi, "&")
          .replace(/\\u00253D/gi, "%3D")
          .replace(/\\\//g, "/")
          .replace(/\\/g, "")
          .replace(/&amp;/g, "&");

        const matches = unescaped.match(/https:\/\/[^"'\s<>\\]+/g) || [];
        for (const m of matches) {
          if (
            m.includes("t51.82787-19") ||
            m.includes("t51.2885-19") ||
            m.includes("s150x150") ||
            m.includes("s100x100") ||
            m.includes("profile_pic")
          ) {
            avatarCache.set(cleanUsername, {
              url: m,
              expiresAt: Date.now() + 1000 * 60 * 60 * 24,
            });
            return m;
          }
        }
      }
    }
  } catch {
    // Continue
  }

  // Strategy 2: Instagram Web Topsearch
  try {
    const searchRes = await fetch(
      `https://www.instagram.com/web/search/topsearch/?context=blended&query=${encodeURIComponent(cleanUsername)}&include_reel=false`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "X-Requested-With": "XMLHttpRequest",
          "Accept": "*/*",
        },
        signal: AbortSignal.timeout(3000),
      }
    );
    if (searchRes.ok) {
      const data = await searchRes.json();
      const userObj = data.users?.find((u: { user: { username: string; profile_pic_url?: string } }) => u.user.username.toLowerCase() === cleanUsername)?.user;
      if (userObj?.profile_pic_url) {
        avatarCache.set(cleanUsername, {
          url: userObj.profile_pic_url,
          expiresAt: Date.now() + 1000 * 60 * 60 * 24,
        });
        return userObj.profile_pic_url;
      }
    }
  } catch {
    // Continue
  }

  // Strategy 3: Direct Profile Embed Scraper
  try {
    const embedRes = await fetch(`https://www.instagram.com/${cleanUsername}/embed/`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });

    if (embedRes.ok) {
      const embedHtml = await embedRes.text();
      const unescaped = embedHtml
        .replace(/\\u0026/gi, "&")
        .replace(/\\u00253D/gi, "%3D")
        .replace(/\\\//g, "/")
        .replace(/\\/g, "")
        .replace(/&amp;/g, "&");

      const scontentMatches = unescaped.match(/https:\/\/[^"'\s<>\\]+/g) || [];
      for (const decoded of scontentMatches) {
        if (
          decoded.includes("t51.82787-19") ||
          decoded.includes("t51.2885-19") ||
          decoded.includes("s150x150") ||
          decoded.includes("s100x100") ||
          decoded.includes("profile_pic")
        ) {
          avatarCache.set(cleanUsername, {
            url: decoded,
            expiresAt: Date.now() + 1000 * 60 * 60 * 24,
          });
          return decoded;
        }
      }
    }
  } catch {
    // Continue
  }

  return null;
}
