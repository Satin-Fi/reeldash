async function testWsrv(u) {
  const wsrvUrl = `https://wsrv.nl/?url=${encodeURIComponent(u)}&default=1`;
  const res = await fetch(wsrvUrl);
  console.log("Wsrv HTTP status:", res.status, "content-type:", res.headers.get("content-type"), "content-length:", res.headers.get("content-length"));
}

async function run() {
  const { avatarUrl, postThumbUrl } = await extractPostAndAvatar('DcgK_-KkgYR');
  console.log("Testing avatar via wsrv:");
  await testWsrv(avatarUrl);
  console.log("Testing post thumb via wsrv:");
  await testWsrv(postThumbUrl);
}

async function extractPostAndAvatar(shortcode) {
  const embedRes = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
  });
  const html = await embedRes.text();
  const unescaped = html.replace(/\\u0026/gi, "&").replace(/\\u00253D/gi, "%3D").replace(/\\\//g, "/").replace(/\\/g, "").replace(/&amp;/g, "&");

  const urls = unescaped.match(/https:\/\/[^"'\s<>\\]+/g) || [];
  
  let avatarUrl = null;
  let postThumbUrl = null;

  for (const u of urls) {
    if (!avatarUrl && (u.includes("t51.82787-19") || u.includes("profile_pic"))) {
      avatarUrl = u;
    }
    if (!postThumbUrl && (u.includes("t51.82787-15") || u.includes("CLIPS") || u.includes("CAROUSEL_ITEM") || u.includes("video_default_cover"))) {
      postThumbUrl = u;
    }
  }

  return { avatarUrl, postThumbUrl };
}

run();
