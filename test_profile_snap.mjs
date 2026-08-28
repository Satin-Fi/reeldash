function decodeSnapSave(h, u, n, t, e, r) {
  r = "";
  for (let i = 0, len = h.length; i < len; i++) {
    let s = "";
    while (h[i] !== n[e]) {
      s += h[i];
      i++;
    }
    for (let j = 0; j < n.length; j++) {
      s = s.replace(new RegExp(n[j], "g"), j.toString());
    }
    r += String.fromCharCode(parseInt(s, e) - t);
  }
  return decodeURIComponent(escape(r));
}

async function testProfileSnapSave() {
  const username = 'lifeof.romana';
  const params = new URLSearchParams();
  params.append('url', `https://www.instagram.com/${username}/`);
  const snapRes = await fetch('https://snapsave.app/action.php?lang=en', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://snapsave.app/',
      'Origin': 'https://snapsave.app',
    },
    body: params.toString(),
  });
  const text = await snapRes.text();
  const evalMatch = text.match(/\(\s*["']([^"']+)["']\s*,\s*(\d+|["'][^"']*["'])\s*,\s*["']([^"']+)["']\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (evalMatch) {
    const decodedHtml = decodeSnapSave(
      evalMatch[1],
      evalMatch[2],
      evalMatch[3],
      parseInt(evalMatch[4], 10),
      parseInt(evalMatch[5], 10),
      parseInt(evalMatch[6], 10)
    );
    console.log('Decoded profile HTML length:', decodedHtml.length);
    const imgMatches = [...decodedHtml.matchAll(/<img[^>]+src=["']([^"']+)["']/g)].map(m => m[1]);
    console.log('Found profile images count:', imgMatches.length);
    for (const img of imgMatches.slice(0, 8)) {
      console.log('Image:', img.substring(0, 120));
    }
  }
}

testProfileSnapSave();
