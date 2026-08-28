const https = require('https');

async function testSearch(username) {
  return new Promise((resolve) => {
    https.get(`https://reeldash-nine.vercel.app/api/instagram/search-account?query=${username}`, (res) => {
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
  console.log("Marvel on Vercel search-account:");
  console.log(await testSearch('marvel'));
  console.log("\nRomana on Vercel search-account:");
  console.log(await testSearch('lifeof.romana'));
}

run();
