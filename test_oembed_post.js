const https = require('https');

async function testOembedPost(url) {
  const oUrl = `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(url)}`;
  return new Promise((resolve) => {
    https.get(oUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', e => resolve({ error: e.message }));
  });
}

async function run() {
  console.log("Marvel Reel oEmbed:", await testOembedPost('https://www.instagram.com/reel/DFy9tM2I3vR/'));
}

run();
