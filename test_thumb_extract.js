async function testExtraction() {
  const shortcodes = ['DFdK-b2vC-y', 'DFf8J9fv6-L', 'DFf1s3xvQvX', 'DbZkDwZsHgd'];
  for (const code of shortcodes) {
    console.log(`\n--- Testing shortcode: ${code} ---`);
    
    // Test 1: Instagram Embed HTML
    try {
      const res = await fetch(`https://www.instagram.com/p/${code}/embed/captioned/`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      const html = await res.text();
      const unescaped = html.replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/\\/g, '');
      const matches = unescaped.match(/https:\/\/[^"'\s<>\\]+/g) || [];
      const imageMatches = matches.filter(u => u.includes('scontent') || u.includes('cdninstagram'));
      console.log(`Embed HTML status: ${res.status}, image matches: ${imageMatches.length}`);
      if (imageMatches.length > 0) {
        console.log('Sample image URL:', imageMatches[0].substring(0, 100));
      }
    } catch (e) {
      console.error('Embed error:', e.message);
    }

    // Test 2: Instagram oEmbed
    try {
      const oembedRes = await fetch(`https://api.instagram.com/oembed/?url=https://www.instagram.com/p/${code}/`);
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        console.log('oEmbed thumbnail_url:', data.thumbnail_url?.substring(0, 100));
      } else {
        console.log('oEmbed status:', oembedRes.status);
      }
    } catch (e) {
      console.error('oEmbed error:', e.message);
    }

    // Test 3: SnapSave
    try {
      const params = new URLSearchParams();
      params.append('url', `https://www.instagram.com/p/${code}/`);
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
      console.log('SnapSave status:', snapRes.status, 'length:', text.length);
    } catch (e) {
      console.error('SnapSave error:', e.message);
    }
  }
}

testExtraction();
