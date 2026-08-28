async function inspectEmbedImg(shortcode) {
  const embedRes = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
  });
  const html = await embedRes.text();
  console.log("HTML length:", html.length);
  const imgTags = html.match(/<img[^>]+>/g) || [];
  console.log("img tags count:", imgTags.length);
  imgTags.forEach((t, i) => console.log(`Img ${i}:`, t));

  const allUrls = html.match(/https:\/\/[^"'\s<>\\]+/g) || [];
  const jpgUrls = allUrls.filter(u => u.includes('.jpg') || u.includes('.webp') || u.includes('scontent'));
  console.log("All JPG/scontent URLs in embed:", jpgUrls);
}

inspectEmbedImg('DcgK_-KkgYR');
