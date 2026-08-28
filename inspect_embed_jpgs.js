async function test() {
  const shortcode = "DcgK_-KkgYR";
  const res = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  });
  const html = await res.text();
  const unescaped = html
    .replace(/\\u0026/gi, "&")
    .replace(/\\u00253D/gi, "%3D")
    .replace(/\\\//g, "/")
    .replace(/\\/g, "")
    .replace(/&amp;/g, "&");

  const matches = unescaped.match(/https:\/\/[^"'\s<>\\]+\.jpg[^"'\s<>\\]*/g) || [];
  for (let i = 0; i < 7; i++) {
    console.log(`[${i}] ${matches[i]}`);
  }
}

test().catch(console.error);
