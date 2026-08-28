async function testReelInfoEmbedExtraction(shortcode) {
  const embedRes = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
  });
  const html = await embedRes.text();
  const unescaped = html
    .replace(/\\u0026/gi, "&")
    .replace(/\\u00253D/gi, "%3D")
    .replace(/\\\//g, "/")
    .replace(/\\/g, "")
    .replace(/&amp;/g, "&");

  const matches = unescaped.match(/https:\/\/[^"'\s<>\\]+/g) || [];
  let avatar = null;
  let thumb = null;
  let creator = null;

  // Extract author
  const authorMatch = unescaped.match(/class="Avatar"[^>]*href="\/([^"/]+)\//i) || unescaped.match(/instagram\.com\/([^"/?]+)/i);
  if (authorMatch) creator = authorMatch[1];

  for (const m of matches) {
    if (m.includes("t51.82787-19") || m.includes("profile_pic")) {
      avatar = m;
    }
    if (m.includes("t51.82787-15") || m.includes("CLIPS") || m.includes("CAROUSEL_ITEM")) {
      thumb = m;
    }
  }

  console.log("Extracted creator:", creator);
  console.log("Extracted avatar:", avatar);
  console.log("Extracted thumb:", thumb);
}

testReelInfoEmbedExtraction("DcgK_-KkgYR");
