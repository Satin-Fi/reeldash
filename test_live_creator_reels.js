const https = require('https');

async function testLiveCreatorReels(username) {
  return new Promise((resolve) => {
    https.get(`https://reeldash-nine.vercel.app/api/instagram/creator-reels?username=${username}`, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', e => resolve({ error: e.message }));
  });
}

async function run() {
  console.log("Marvel Creator Reels on Vercel:", await testLiveCreatorReels('marvel'));
  console.log("\nRomana Creator Reels on Vercel:", await testLiveCreatorReels('lifeof.romana'));
}

run();
