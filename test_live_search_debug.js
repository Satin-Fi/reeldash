const https = require('https');

async function testSearch(query) {
  return new Promise((resolve) => {
    https.get(`https://reeldash-nine.vercel.app/api/instagram/search-account?query=${encodeURIComponent(query)}`, (res) => {
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
  console.log("Live Marvel Search API:", await testSearch('marvel'));
  console.log("\nLive Romana Search API:", await testSearch('lifeof.romana'));
}

run();
