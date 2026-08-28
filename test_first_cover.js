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
  let firstCover = null;
  let creatorAvatar = null;
  for (const m of matches) {
    if (!creatorAvatar && (m.includes("t51.82787-19") || m.includes("profile_pic"))) {
      creatorAvatar = m;
    }
    if (!firstCover && !m.includes("t51.82787-19") && !m.includes("profile_pic") && (m.includes("t51.82787-15") || m.includes("CLIPS") || m.includes("CAROUSEL_ITEM") || m.includes("dst-jpg") || m.includes("dst-jpegr"))) {
      firstCover = m;
    }
  }
  console.log("FIRST COVER:", firstCover ? firstCover.substring(0, 100) : "none");
  console.log("CREATOR AVATAR:", creatorAvatar ? creatorAvatar.substring(0, 100) : "none");
}

test().catch(console.error);
