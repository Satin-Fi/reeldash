const https = require('https');

async function test(username) {
  return new Promise((resolve) => {
    https.get(`https://reeldash-nine.vercel.app/api/proxy-image?username=${encodeURIComponent(username)}`, (res) => {
      resolve({
        username,
        status: res.statusCode,
        location: res.headers.location,
        headers: res.headers
      });
    }).on('error', e => resolve({ error: e.message }));
  });
}

async function run() {
  console.log(await test('marvel'));
  console.log(await test('lifeof.romana'));
}
run();
