const https = require('https');

async function testBridge(name, url) {
  return new Promise((resolve) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          resolve({ name, status: res.statusCode, itemsCount: j.items?.length || 0, title: j.title });
        } catch (e) {
          resolve({ name, status: res.statusCode, length: data.length, error: 'not json' });
        }
      });
    }).on('error', e => resolve({ name, error: e.message }));
  });
}

async function run() {
  const users = ['marvel', 'lifeof.romana'];
  for (const u of users) {
    console.log(`\n=== Testing ${u} ===`);
    console.log(await testBridge('rss-bridge.org', `https://rss-bridge.org/bridge01/?action=display&bridge=InstagramBridge&u=${u}&format=Json`));
    console.log(await testBridge('trom.tf', `https://rss.trom.tf/?action=display&bridge=InstagramBridge&u=${u}&format=Json`));
    console.log(await testBridge('tchncs.de', `https://feed.tchncs.de/?action=display&bridge=InstagramBridge&u=${u}&format=Json`));
    console.log(await testBridge('bloat.cat', `https://rss.bloat.cat/?action=display&bridge=InstagramBridge&u=${u}&format=Json`));
  }
}

run();
