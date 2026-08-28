const https = require('https');

async function testScontent(username) {
  return new Promise((resolve) => {
    https.get(`https://www.instagram.com/${username}/embed/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const matches = data.match(/https:[\\\/]+[a-zA-Z0-9.\-_]*scontent[a-zA-Z0-9.\-_]*\.cdninstagram\.com[\\\/][^"'\s<>]+/g) || [];
        const decoded = matches.map(m => m.replace(/\\\//g, '/').replace(/\\u0026/g, '&').replace(/&amp;/g, '&'));
        resolve({
          username,
          count: decoded.length,
          matches: decoded.slice(0, 5)
        });
      });
    }).on('error', e => resolve({ username, error: e.message }));
  });
}

async function run() {
  console.log(await testScontent('lifeof.romana'));
  console.log(await testScontent('marvel'));
}

run();
