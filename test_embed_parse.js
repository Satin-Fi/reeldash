const https = require('https');

async function testEmbedParse(username) {
  return new Promise((resolve) => {
    https.get(`https://www.instagram.com/${username}/embed/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        // Find avatar / profile pic
        const avatarMatches = data.match(/https:\\\/\\\/[^"]+cdninstagram\.com\\\/[^"]+/g) ||
                              data.match(/https:\/\/[^"]+cdninstagram\.com\/[^"]+/g) || [];
        
        const decodedUrls = avatarMatches.map(u => u.replace(/\\\//g, '/').replace(/\\u0026/g, '&').replace(/&amp;/g, '&'));
        
        // Find avatar image specifically (usually contains _n.jpg or 150x150 or s150x150)
        const profilePic = decodedUrls.find(u => u.includes('s150x150') || u.includes('profile_pic') || u.includes('t51.2885-19') || u.includes('t51.82787-19'));

        // Find display name / text
        const titleMatch = data.match(/<title>([^<]+)<\/title>/i);

        resolve({
          username,
          status: res.statusCode,
          title: titleMatch ? titleMatch[1] : null,
          profilePic: profilePic || decodedUrls[0] || null,
          allUrlsCount: decodedUrls.length,
          allUrlsSample: decodedUrls.slice(0, 3)
        });
      });
    }).on('error', e => resolve({ username, error: e.message }));
  });
}

async function run() {
  console.log("Romana Embed:", await testEmbedParse('lifeof.romana'));
  console.log("\nMarvel Embed:", await testEmbedParse('marvel'));
}

run();
