async function test() {
  const shortcode = "DcgK_-KkgYR";
  const res = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  });
  const html = await res.text();
  console.log("HTML length:", html.length);

  // Look for username patterns in embed
  const userMatch1 = html.match(/class="[^"]*Username[^"]*"[^>]*>([^<]+)<\/a>/i);
  console.log("Username match 1:", userMatch1?.[1]);

  const userMatch2 = html.match(/instagram\.com\/([a-zA-Z0-9_.]+)\/\?utm_source/i);
  console.log("Username match 2:", userMatch2?.[1]);

  const userMatch3 = html.match(/"username":"([^"]+)"/i);
  console.log("Username match 3:", userMatch3?.[1]);

  const userMatch4 = html.match(/class="[^"]*Caption[^"]*"[\s\S]*?<a\s+[^>]*href="[^"]*instagram\.com\/([a-zA-Z0-9_.]+)\/?"/i);
  console.log("Username match 4:", userMatch4?.[1]);

  const captionMatch = html.match(/class="CaptionText"[^>]*>([\s\S]*?)<\/div>/i);
  console.log("CaptionText match:", captionMatch?.[1]?.replace(/<[^>]+>/g, '').trim());
}

test().catch(console.error);
