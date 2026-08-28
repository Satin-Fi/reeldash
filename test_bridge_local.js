async function test() {
  const cleanUsername = "lifeof.romana";
  const bridgeUrls = [
    `https://rss.trom.tf/?action=display&bridge=InstagramBridge&u=${encodeURIComponent(cleanUsername)}&format=Json`,
    `https://rss-bridge.org/bridge01/?action=display&bridge=InstagramBridge&u=${encodeURIComponent(cleanUsername)}&format=Json`,
    `https://rss.bloat.cat/?action=display&bridge=InstagramBridge&u=${encodeURIComponent(cleanUsername)}&format=Json`,
  ];

  console.log("Fetching bridges...");
  const t0 = Date.now();
  const data = await Promise.any(
    bridgeUrls.map(async (url) => {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) throw new Error("bridge fail: " + res.status);
      const j = await res.json();
      if (!j.items || j.items.length === 0) throw new Error("no items");
      return j;
    })
  );
  console.log("Bridge resolved in", Date.now() - t0, "ms");
  const firstUrl = data.items[0]?.url;
  const shortcode = firstUrl?.match(/\/(reel|p)\/([A-Za-z0-9_-]+)/)?.[2];
  console.log("Shortcode:", shortcode);

  const embedRes = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    cache: "no-store",
    signal: AbortSignal.timeout(3000),
  });
  console.log("Embed status:", embedRes.status);
  const html = await embedRes.text();
  const unescaped = html
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
      console.log("Found real avatar:", decoded);
      break;
    }
  }
}

test().catch(console.error);
