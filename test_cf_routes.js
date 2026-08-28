const https = require('https');

async function testWorker(path) {
  return new Promise((resolve) => {
    https.get(`https://reeldash-ig-proxy.reeldash-ig-proxy.workers.dev${path}`, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ path, status: res.statusCode, body: data }));
    }).on('error', e => resolve({ path, error: e.message }));
  });
}

async function run() {
  console.log(await testWorker('/'));
  console.log(await testWorker('/profile?username=marvel'));
  console.log(await testWorker('/profile?username=lifeof.romana'));
  console.log(await testWorker('/avatar?username=marvel'));
}

run();
