async function testProxyLogic(shortcode, username) {
  // Test shortcode extraction
  console.log("Testing shortcode extraction for:", shortcode);
  const embedRes = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
  });
  const html = await embedRes.text();
  const unescaped = html.replace(/\\u0026/gi, "&").replace(/\\u00253D/gi, "%3D").replace(/\\\//g, "/").replace(/\\/g, "").replace(/&amp;/g, "&");
  
  // Find post thumbnail
  const thumbMatches = unescaped.match(/https:\/\/[a-zA-Z0-9.\-_]*scontent[a-zA-Z0-9.\-_]*\.cdninstagram\.com\/[^\s"'<>]+/g) || [];
  console.log("Found matches in post embed:", thumbMatches.length);
  for (const m of thumbMatches) {
    console.log("Match:", m.slice(0, 100));
  }
}

testProxyLogic('DcgK_-KkgYR', 'lifeof.romana');
