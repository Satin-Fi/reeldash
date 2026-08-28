async function resolveAvatar(username) {
  const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();

  // Strategy 1: Bridges
  const bridgeUrls = [
    `https://rss.trom.tf/?action=display&bridge=InstagramBridge&u=${encodeURIComponent(cleanUsername)}&format=Json`,
    `https://rss-bridge.org/bridge01/?action=display&bridge=InstagramBridge&u=${encodeURIComponent(cleanUsername)}&format=Json`,
    `https://rss.bloat.cat/?action=display&bridge=InstagramBridge&u=${encodeURIComponent(cleanUsername)}&format=Json`,
  ];

  try {
    const data = await Promise.any(
      bridgeUrls.map(async (url) => {
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
          cache: "no-store",
          signal: AbortSignal.timeout(3000),
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
        signal: AbortSignal.timeout(3000),
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
          if (m.includes("t51.82787-19") || m.includes("t51.2885-19") || m.includes("profile_pic")) {
            return m;
          }
        }
      }
    }
  } catch (e) {
    console.log("Bridge error:", e.message);
  }

  // Strategy 2: Topsearch
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
      const userObj = data.users?.find((u) => u.user.username.toLowerCase() === cleanUsername)?.user;
      if (userObj?.profile_pic_url) {
        return userObj.profile_pic_url;
      }
    }
  } catch (e) {
    console.log("Topsearch error:", e.message);
  }

  return null;
}

resolveAvatar("lifeof.romana").then(url => console.log("Resolved avatar URL:", url)).catch(console.error);
