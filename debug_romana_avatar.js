async function debugRomanaAvatar() {
  const cleanUsername = 'lifeof.romana';
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
          signal: AbortSignal.timeout(4000),
        });
        if (!res.ok) throw new Error("bridge fail: " + res.status);
        const j = await res.json();
        if (!j.items || j.items.length === 0) throw new Error("no items");
        return { j, url };
      })
    );
    console.log("Bridge worked:", data.url);
    const firstUrl = data.j.items[0]?.url;
    const shortcode = firstUrl?.match(/\/(reel|p)\/([A-Za-z0-9_-]+)/)?.[2];
    console.log("First shortcode:", shortcode);

    if (shortcode) {
      const embedRes = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        signal: AbortSignal.timeout(4000),
      });
      console.log("Embed status:", embedRes.status);
      const html = await embedRes.text();
      const unescaped = html
        .replace(/\\u0026/gi, "&")
        .replace(/\\u00253D/gi, "%3D")
        .replace(/\\\//g, "/")
        .replace(/\\/g, "")
        .replace(/&amp;/g, "&");

      const matches = unescaped.match(/https:\/\/[^"'\s<>\\]+/g) || [];
      console.log("Matches found:", matches.length);
      for (const m of matches) {
        if (
          m.includes("t51.82787-19") ||
          m.includes("t51.2885-19") ||
          m.includes("s150x150") ||
          m.includes("s100x100") ||
          m.includes("profile_pic")
        ) {
          console.log("FOUND AVATAR:", m);
          return m;
        }
      }
    }
  } catch (e) {
    console.error("Error in debug:", e.message);
  }
}

debugRomanaAvatar();
