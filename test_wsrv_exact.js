const https = require('https');

async function testWsrv(rawUrl) {
  // Test 1: wsrv.nl with encodeURIComponent
  const url1 = `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}`;
  // Test 2: images.weserv.nl without default param
  const url2 = `https://images.weserv.nl/?url=${encodeURIComponent(rawUrl)}`;
  // Test 3: direct fetch with headers
  
  return new Promise((resolve) => {
    https.get(url1, (res) => {
      resolve({ status1: res.statusCode, type1: res.headers['content-type'] });
    }).on('error', e => resolve({ error: e.message }));
  });
}

async function run() {
  const rssRes = await fetch('https://rss.trom.tf/?action=display&bridge=InstagramBridge&u=marvel&format=Json');
  const data = await rssRes.json();
  const rawImg = data.items[0].content_html.match(/<img[^>]+src="([^"]+)"/i)[1];
  console.log("Raw img url:", rawImg.slice(0, 80));
  console.log("Wsrv test:", await testWsrv(rawImg));
}

run();
