async function test() {
  const shortcode = "DcgK_-KkgYR";
  const res = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  });
  const html = await res.text();

  const cMatch1 = html.match(/class="Caption"[^>]*>([\s\S]*?)<\/div>/i);
  if (cMatch1) {
    const text = cMatch1[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log("Caption match 1:", text);
  }

  const cMatch2 = html.match(/class="CaptionComments"[^>]*>([\s\S]*?)<\/div>/i);
  if (cMatch2) {
    console.log("Caption match 2:", cMatch2[1]);
  }
}

test().catch(console.error);
