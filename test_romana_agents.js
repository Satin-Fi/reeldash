const https = require('https');

async function testAgent(ua) {
  return new Promise((resolve) => {
    https.get(`https://www.instagram.com/lifeof.romana/`, {
      headers: {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const og = data.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                   data.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
        resolve({ ua, status: res.statusCode, og: og ? og[1] : null, length: data.length });
      });
    }).on('error', e => resolve({ ua, error: e.message }));
  });
}

async function run() {
  console.log(await testAgent("WhatsApp/2.21.12.21 A"));
  console.log(await testAgent("facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"));
  console.log(await testAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"));
  console.log(await testAgent("Twitterbot/1.0"));
  console.log(await testAgent("TelegramBot (like TwitterBot)"));
}

run();
