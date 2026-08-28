const https = require('https');

async function testWsrv(igUrl) {
  return new Promise((resolve) => {
    const wsrvUrl = `https://wsrv.nl/?url=${encodeURIComponent(igUrl)}&default=1`;
    https.get(wsrvUrl, (res) => {
      resolve({ wsrvUrl: wsrvUrl.slice(0, 70), status: res.statusCode, contentType: res.headers['content-type'] });
    }).on('error', e => resolve({ error: e.message }));
  });
}

async function run() {
  const res = await fetch(`https://rss.trom.tf/?action=display&bridge=InstagramBridge&u=marvel&format=Json`);
  const data = await res.json();
  const first = data.items[0];
  const imgMatch = first.content_html.match(/<img[^>]+src="([^"]+)"/i);
  if (imgMatch) {
    console.log("Direct Wsrv test:", await testWsrv(imgMatch[1]));
  }
}

run();
