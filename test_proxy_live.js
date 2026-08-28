const https = require('https');

async function testProxyLive(username) {
  return new Promise((resolve) => {
    https.get(`https://reeldash-nine.vercel.app/api/proxy-image?username=${username}`, (res) => {
      resolve({
        statusCode: res.statusCode,
        location: res.headers.location,
        headers: res.headers
      });
    }).on('error', e => resolve({ error: e.message }));
  });
}

async function run() {
  console.log("Live proxy-image for marvel:", await testProxyLive('marvel'));
  console.log("Live proxy-image for romana:", await testProxyLive('lifeof.romana'));
}

run();
