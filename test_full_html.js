const https = require('https');

async function testFullHtml(username) {
  return new Promise((resolve) => {
    https.get(`https://www.instagram.com/${username}/`, {
      headers: {
        'User-Agent': 'WhatsApp/2.21.12.21 A',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const ogImage = data.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                        data.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
        const profilePic = data.match(/https:\\\/\\\/[^"]+cdninstagram\.com\\\/[^"]+profile_pic[^"]+/i) ||
                           data.match(/https:\/\/[^"]+cdninstagram\.com\/[^"]+profile_pic[^"]+/i);
        resolve({
          username,
          status: res.statusCode,
          length: data.length,
          ogImage: ogImage ? ogImage[1] : null,
          profilePic: profilePic ? profilePic[0].replace(/\\\//g, '/') : null
        });
      });
    }).on('error', e => resolve({ username, error: e.message }));
  });
}

async function run() {
  console.log("Marvel WhatsApp test:", await testFullHtml('marvel'));
  console.log("Romana WhatsApp test:", await testFullHtml('lifeof.romana'));
}

run();
