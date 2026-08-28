async function test() {
  const shortcode = "DcgK_-KkgYR";
  console.log("Testing multiple cover extraction methods for:", shortcode);

  // Method 1: oEmbed
  try {
    const oembedRes = await fetch(`https://api.instagram.com/oembed/?url=https://www.instagram.com/p/${shortcode}/`);
    const oembedJson = await oembedRes.json();
    console.log("oEmbed thumbnail_url:", oembedJson.thumbnail_url);
  } catch (e) {
    console.log("oEmbed failed:", e.message);
  }

  // Method 2: direct embed
  try {
    const embedRes = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    console.log("Embed status:", embedRes.status);
    const html = await embedRes.text();
    console.log("Embed html length:", html.length);
  } catch (e) {
    console.log("Embed failed:", e.message);
  }

  // Method 3: Cloudflare Edge Worker
  try {
    const cfRes = await fetch(`https://instagram-video-downloader.api.subzero.workers.dev/?url=https://www.instagram.com/reel/${shortcode}/`);
    const cfJson = await cfRes.json();
    console.log("CF Worker thumbnail:", cfJson.thumbnail);
  } catch (e) {
    console.log("CF Worker failed:", e.message);
  }
}

test().catch(console.error);
