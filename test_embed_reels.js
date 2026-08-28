const https = require('https');

async function testEmbedReels(username) {
  return new Promise((resolve) => {
    https.get(`https://www.instagram.com/${username}/embed/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        // Look for shortcodes and media URLs in embed HTML
        const shortcodeMatches = data.match(/\/(reel|p)\/([A-Za-z0-9_-]{8,})/g) || [];
        const uniqueShortcodes = [...new Set(shortcodeMatches.map(m => m.split('/')[2]))];
        resolve({
          username,
          status: res.statusCode,
          shortcodeCount: uniqueShortcodes.length,
          shortcodes: uniqueShortcodes
        });
      });
    }).on('error', e => resolve({ username, error: e.message }));
  });
}

async function run() {
  console.log(await testEmbedReels('marvel'));
  console.log(await testEmbedReels('lifeof.romana'));
}

run();
