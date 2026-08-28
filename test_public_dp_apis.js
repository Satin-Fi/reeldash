const https = require('https');

async function testFetch(url, headers = {}) {
  return new Promise((resolve) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, length: data.length, body: data.slice(0, 1000) }));
    }).on('error', e => resolve({ error: e.message }));
  });
}

async function run() {
  console.log("Testing how Instagram profile viewers fetch Instagram DPs without being blocked by AWS/Vercel datacenter IPs:");

  // Test 1: Instagram public cdn profile pic direct URL structure:
  // Did you know Instagram has direct public image mirrors like:
  // https://instagram.com/${username}/media/?size=l or https://instasupersave.com / https://anonyig.com

  // Test 2: instastories.watch / anonviewer / snoopreport public CORS avatar APIs
  const apis = [
    `https://api.storiesig.info/api/ig/profile?username=marvel`,
    `https://imginn.net/marvel/`,
    `https://dumpoir.com/v/marvel`,
    `https://www.greatfon.com/v/marvel`,
    `https://picnob.com/profile/marvel/`,
    `https://inflact.com/downloader/instagram/avatar/`,
  ];

  for (const api of apis) {
    const res = await testFetch(api, { 'User-Agent': 'Mozilla/5.0' });
    console.log(api, '=>', res.status, res.length);
  }
}

run();
