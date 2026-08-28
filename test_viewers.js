const https = require('https');

async function testWithRedirects(url, headers = {}) {
  return new Promise((resolve) => {
    https.get(url, { headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const nextUrl = res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, url).href;
        return resolve(testWithRedirects(nextUrl, headers));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ url, status: res.statusCode, length: data.length, body: data }));
    }).on('error', e => resolve({ url, error: e.message }));
  });
}

async function run() {
  const users = ['marvel', 'lifeof.romana'];
  for (const u of users) {
    console.log(`\n=== Testing ${u} ===`);
    // 1. Picnob
    const p = await testWithRedirects(`https://www.picnob.com/profile/${u}/`, {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    });
    console.log("Picnob status:", p.status, "len:", p.length);
    const pImg = p.body ? p.body.match(/<img[^>]+class="[^"]*ava[^"]*"[^>]+src="([^"]+)"/i) || p.body.match(/<img[^>]+src="([^"]+)"[^>]+class="[^"]*ava/i) || p.body.match(/<div class="pic">[\s\S]*?<img[^>]+src="([^"]+)"/i) : null;
    console.log("Picnob img:", pImg ? pImg[1] : "none");

    // 2. Picuki
    const p2 = await testWithRedirects(`https://www.picuki.com/profile/${u}`, {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    console.log("Picuki status:", p2.status);
    const p2Img = p2.body ? p2.body.match(/<img[^>]+class="profile-avatar"[^>]+src="([^"]+)"/i) : null;
    console.log("Picuki img:", p2Img ? p2Img[1] : "none");
  }
}

run();
