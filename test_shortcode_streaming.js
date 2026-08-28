async function test() {
  const shortcode = "DcgK_-KkgYR";
  const embedRes = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  });
  const html = await embedRes.text();
  const unescaped = html
    .replace(/\\u0026/gi, "&")
    .replace(/\\u00253D/gi, "%3D")
    .replace(/\\\//g, "/")
    .replace(/\\/g, "")
    .replace(/&amp;/g, "&");

  const matches = unescaped.match(/https:\/\/[^"'\s<>]+\.jpg[^"'\s<>]*/g) || [];
  let coverUrl = null;
  for (const m of matches) {
    if (!m.includes("t51.82787-19") && !m.includes("profile_pic") && (m.includes("t51.82787-15") || m.includes("CLIPS") || m.includes("CAROUSEL_ITEM") || m.includes("dst-jpg") || m.includes("dst-jpegr"))) {
      coverUrl = m;
      break;
    }
  }

  console.log("Extracted Cover URL:", coverUrl);

  const wsrvUrl = `https://wsrv.nl/?url=${encodeURIComponent(coverUrl)}&output=jpg&q=85`;
  const imgRes = await fetch(wsrvUrl);
  console.log("Wsrv fetch status:", imgRes.status, "content-type:", imgRes.headers.get("content-type"));
  const buffer = await imgRes.arrayBuffer();
  console.log("Received buffer bytes:", buffer.byteLength);
}

test().catch(console.error);
