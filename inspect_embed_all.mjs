async function inspectEmbedUrls() {
  const code = 'DFdK-b2vC-y';
  const embedRes = await fetch(`https://www.instagram.com/p/${code}/embed/captioned/`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  const html = await embedRes.text();
  console.log('HTML length:', html.length);
  const unescaped = html
    .replace(/\\u0026/gi, "&")
    .replace(/\\u00253D/gi, "%3D")
    .replace(/\\\//g, "/")
    .replace(/\\/g, "")
    .replace(/&amp;/g, "&");

  const matches = unescaped.match(/https:\/\/[^"'\s<>\\]+/g) || [];
  const scontent = matches.filter(u => u.includes('scontent') || u.includes('cdninstagram') || u.includes('.jpg') || u.includes('.webp') || u.includes('.png'));
  console.log('Found scontent/image URLs count:', scontent.length);
  for (const u of scontent.slice(0, 15)) {
    console.log(' - ', u);
  }
}

inspectEmbedUrls();
