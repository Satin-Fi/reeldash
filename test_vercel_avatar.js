const https = require('https');

async function testVercel(path) {
  return new Promise((resolve) => {
    https.get(`https://reeldash-nine.vercel.app${path}`, (res) => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
          contentType: res.headers['content-type'],
          headers: res.headers,
          length: Buffer.concat(data).length,
          preview: Buffer.concat(data).slice(0, 300).toString('utf-8')
        });
      });
    }).on('error', e => resolve({ path, error: e.message }));
  });
}

async function run() {
  console.log("Testing live Vercel avatar endpoint...");
  console.log(await testVercel('/api/proxy-image?username=marvel'));
  console.log(await testVercel('/api/proxy-image?username=lifeof.romana'));
}
run();
