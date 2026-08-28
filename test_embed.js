const https = require('https');

async function testEmbed(username) {
  return new Promise((resolve) => {
    https.get(`https://www.instagram.com/${username}/embed/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        resolve({
          username,
          status: res.statusCode,
          length: data.length,
          preview: data.slice(0, 300)
        });
      });
    }).on('error', e => resolve({ username, error: e.message }));
  });
}

async function run() {
  console.log(await testEmbed('lifeof.romana'));
  console.log(await testEmbed('marvel'));
}

run();
