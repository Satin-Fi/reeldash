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

async function run() {
  console.log("Romana post DcgK_-KkgYR:", await extractPostAndAvatar('DcgK_-KkgYR'));
  console.log("Marvel post Dcl3LCYFKPx:", await extractPostAndAvatar('Dcl3LCYFKPx'));
}

run();
