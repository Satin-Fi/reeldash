const https = require('https');

async function testEdge(name, url, headers = {}) {
  return new Promise((resolve) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const ogImage = data.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
          || data.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
        resolve({
          name,
          status: res.statusCode,
          ogImage: ogImage ? ogImage[1].replace(/&amp;/g, '&') : null,
          length: data.length
        });
      });
    }).on('error', e => resolve({ name, error: e.message }));
  });
}

async function run() {
  const username = "marvel";
  console.log("Testing proxy edges for username:", username);

  console.log(await testEdge("allorigins", `https://api.allorigins.win/raw?url=${encodeURIComponent('https://www.instagram.com/' + username + '/')}`));
  console.log(await testEdge("corsproxy.io", `https://corsproxy.io/?${encodeURIComponent('https://www.instagram.com/' + username + '/')}`, {
    'User-Agent': 'facebookexternalhit/1.1'
  }));
  console.log(await testEdge("codetabs", `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent('https://www.instagram.com/' + username + '/')}`));
}

run();
