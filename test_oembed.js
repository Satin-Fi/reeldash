const https = require('https');

async function testOembed(username) {
  const url = `https://www.instagram.com/api/v1/oembed/?url=https://www.instagram.com/${encodeURIComponent(username)}/`;
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data.slice(0, 300) }));
    }).on('error', e => resolve({ error: e.message }));
  });
}

async function run() {
  console.log("Marvel oembed:", await testOembed('marvel'));
}

run();
