const puppeteer = require('puppeteer-core');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Piyush\\.gemini\\antigravity\\brain\\4edee984-3a2a-4850-bac5-a8b8c19f522c';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Login
  await page.goto('https://reeldash-nine.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'demo@reeldash.com');
  await page.type('input[type="password"]', 'pass');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  // 2. Inject reel
  await page.evaluate(() => {
    const userStr = localStorage.getItem('reeldash_user');
    const user = userStr ? JSON.parse(userStr) : { id: 'usr-123' };
    const reel = {
      id: 'ig-DcgK_-KkgYR',
      userId: user.id,
      mediaType: 'reel',
      instagramUrl: 'https://www.instagram.com/reel/DcgK_-KkgYR/',
      creatorUsername: 'lifeof.romana',
      creatorFullName: 'Romana Flowers',
      creatorProfileUrl: 'https://instagram.com/lifeof.romana',
      creatorAvatar: '/api/proxy-image?username=lifeof.romana',
      thumbnailUrl: '/api/proxy-image?shortcode=DcgK_-KkgYR',
      caption: 'Romana Flowers aesthetic Reel',
      category: 'General',
      isFavorite: false,
      duration: '0:30',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(`reeldash_reels_${user.id}`, JSON.stringify([reel]));
  });

  // 3. Go directly to /reel/ig-DcgK_-KkgYR
  await page.goto('https://reeldash-nine.vercel.app/reel/ig-DcgK_-KkgYR', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_modal_playback_dp_verified.png') });

  await browser.close();
  console.log("Captured modal playback DP screenshot!");
}

run().catch(console.error);
