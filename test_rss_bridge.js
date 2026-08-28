const https = require('https');

async function testRssBridge(username) {
  const url = `https://rss-bridge.org/bridge01/?action=display&bridge=InstagramBridge&u=${encodeURIComponent(username)}&format=Json`;
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          resolve({
            status: res.statusCode,
            title: j.title,
            icon: j.icon,
            author: j.author,
            items: j.items ? j.items.length : 0
          });
        } catch (e) {
          resolve({ status: res.statusCode, error: e.message });
        }
      });
    }).on('error', e => resolve({ error: e.message }));
  });
}

async function run() {
  console.log("Marvel on RSS Bridge:", await testRssBridge('marvel'));
  console.log("Romana on RSS Bridge:", await testRssBridge('lifeof.romana'));
}

run();
