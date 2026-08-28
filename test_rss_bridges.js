const https = require('https');

async function testUrl(url) {
  return new Promise((resolve) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/html, */*'
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        resolve({ url: url.slice(0, 60), status: res.statusCode, length: data.length, preview: data.slice(0, 200) });
      });
    }).on('error', e => resolve({ url: url.slice(0, 60), error: e.message }));
  });
}

async function run() {
  const username = 'marvel';
  const bridges = [
    `https://rss-bridge.org/bridge01/?action=display&bridge=InstagramBridge&u=${username}&format=Json`,
    `https://rss.rss-bridge.org/bridge01/?action=display&bridge=InstagramBridge&u=${username}&format=Json`,
    `https://rss.trom.tf/?action=display&bridge=InstagramBridge&u=${username}&format=Json`,
    `https://bridge.suumitsu.eu/?action=display&bridge=InstagramBridge&u=${username}&format=Json`,
    `https://feed.eugenemoiseev.ru/?action=display&bridge=InstagramBridge&u=${username}&format=Json`,
    `https://rss.nodum.org/?action=display&bridge=InstagramBridge&u=${username}&format=Json`,
    `https://rss-bridge.snopyta.org/?action=display&bridge=InstagramBridge&u=${username}&format=Json`,
  ];

  for (const b of bridges) {
    console.log(await testUrl(b));
  }
}

run();
