const https = require('https');

async function testFetch(url, headers = {}) {
  return new Promise((resolve) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, length: data.length, body: data.slice(0, 500) }));
    }).on('error', e => resolve({ error: e.message }));
  });
}

async function run() {
  const users = ['marvel', 'lifeof.romana'];
  for (const u of users) {
    console.log(`\n=== Testing ${u} ===`);
    // Test Twitterbot / Googlebot / WhatsApp
    const uaTests = [
      { name: 'Twitterbot', ua: 'Twitterbot/1.0' },
      { name: 'Googlebot', ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
      { name: 'WhatsApp', ua: 'WhatsApp/2.21.12.21 A' },
      { name: 'TelegramBot', ua: 'TelegramBot (like TwitterBot)' },
      { name: 'LinkedInBot', ua: 'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)' }
    ];

    for (const { name, ua } of uaTests) {
      const res = await testFetch(`https://www.instagram.com/${u}/`, {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      });
      const og = res.body ? res.body.match(/property="og:image"\s+content="([^"]+)"/i) || res.body.match(/content="([^"]+)"\s+property="og:image"/i) : null;
      console.log(name, '=> Status:', res.status, 'OG image:', !!og, 'Len:', res.length);
    }
  }
}

run();
