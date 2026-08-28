async function extractAvatarFromCreator(username) {
  try {
    const rssRes = await fetch(`https://rss.trom.tf/?action=display&bridge=InstagramBridge&u=${username}&format=Json`);
    if (!rssRes.ok) throw new Error("rss failed");
    const data = await rssRes.json();
    const firstUrl = data.items[0]?.url;
    const shortcode = firstUrl?.match(/\/(reel|p)\/([A-Za-z0-9_-]+)/)?.[2];
    if (!shortcode) throw new Error("no shortcode");

    const embedRes = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
    });
    if (!embedRes.ok) throw new Error("embed failed");
    const html = await embedRes.text();
    const unescaped = html.replace(/\\u0026/gi, "&").replace(/\\u00253D/gi, "%3D").replace(/\\\//g, "/").replace(/\\/g, "").replace(/&amp;/g, "&");
    const matches = unescaped.match(/https:\/\/[a-zA-Z0-9.\-_]*scontent[a-zA-Z0-9.\-_]*\.cdninstagram\.com\/[^\s"'<>]+/g) || [];
    for (const m of matches) {
      if (m.includes("t51.82787-19") || m.includes("t51.2885-19") || m.includes("s150x150") || m.includes("profile_pic")) {
        return m;
      }
    }
  } catch (e) {
    console.error(e.message);
  }
  return null;
}

async function run() {
  console.log("Marvel DP:", await extractAvatarFromCreator('marvel'));
  console.log("Romana DP:", await extractAvatarFromCreator('lifeof.romana'));
}

run();
