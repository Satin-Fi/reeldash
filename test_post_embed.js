async function testPostEmbed(shortcode) {
  const url = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    }
  });
  const html = await res.text();
  console.log("Post embed status:", res.status, "HTML length:", html.length);
  const unescaped = html.replace(/\\u0026/gi, "&").replace(/\\u00253D/gi, "%3D").replace(/\\\//g, "/").replace(/\\/g, "");
  const matches = unescaped.match(/https:\/\/[a-zA-Z0-9.\-_]*scontent[a-zA-Z0-9.\-_]*\.cdninstagram\.com\/[^\s"'<>]+/g) || [];
  console.log("Matches:", matches.length);
  for (const m of matches) {
    if (m.includes("t51.82787-19") || m.includes("t51.2885-19") || m.includes("s150x150") || m.includes("profile_pic")) {
      console.log("FOUND PROFILE PIC FROM POST EMBED:", m);
      return m;
    }
  }
}

async function run() {
  const res = await fetch(`https://rss.trom.tf/?action=display&bridge=InstagramBridge&u=marvel&format=Json`);
  const data = await res.json();
  const firstUrl = data.items[0].url;
  const shortcode = firstUrl.match(/\/(reel|p)\/([A-Za-z0-9_-]+)/)[2];
  console.log("Shortcode:", shortcode);
  await testPostEmbed(shortcode);
}

run();
