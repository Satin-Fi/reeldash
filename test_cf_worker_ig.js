const https = require('https');

async function testWorkerProxy(username) {
  const igUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;
  const workerUrl = `https://reeldash-ig-proxy.reeldash-ig-proxy.workers.dev/ig?path=${encodeURIComponent(igUrl)}`;

  return new Promise((resolve) => {
    https.get(workerUrl, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const u = json?.data?.user;
          resolve({
            username,
            status: res.statusCode,
            found: !!u,
            fullName: u?.full_name,
            profilePic: u?.profile_pic_url_hd || u?.profile_pic_url
          });
        } catch (e) {
          resolve({ username, status: res.statusCode, error: e.message, data: data.slice(0, 200) });
        }
      });
    }).on('error', e => resolve({ username, error: e.message }));
  });
}

async function run() {
  console.log(await testWorkerProxy('marvel'));
  console.log(await testWorkerProxy('lifeof.romana'));
  console.log(await testWorkerProxy('zuck'));
}

run();
