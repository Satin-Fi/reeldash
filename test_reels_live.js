const https = require('https');

async function testReels(username) {
  return new Promise((resolve) => {
    https.get(`https://reeldash-nine.vercel.app/api/instagram/creator-reels?username=${username}`, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          resolve({
            status: res.statusCode,
            itemsCount: j.items ? j.items.length : 0,
            firstItem: j.items && j.items[0] ? {
              author: j.items[0].author,
              authorAvatar: j.items[0].authorAvatar,
              thumbnailUrl: j.items[0].thumbnailUrl
            } : null
          });
        } catch (e) {
          resolve({ status: res.statusCode, error: e.message });
        }
      });
    }).on('error', e => resolve({ error: e.message }));
  });
}

async function run() {
  console.log("Marvel creator reels on Vercel:");
  console.log(await testReels('marvel'));
  console.log("\nRomana creator reels on Vercel:");
  console.log(await testReels('lifeof.romana'));
}

run();
