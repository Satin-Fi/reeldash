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

  // 2. Clear out any legacy mock reels and inject real reel
  await page.evaluate(() => {
    const userStr = localStorage.getItem('reeldash_user');
    const user = userStr ? JSON.parse(userStr) : { id: 'usr-123' };
    const reel = {
      id: 'ig-DcgK_-KkgYR',
      userId: user.id,
      mediaType: 'post',
      isCarousel: true,
      instagramUrl: 'https://www.instagram.com/p/DcgK_-KkgYR/',
      creatorUsername: 'lifeof.romana',
      creatorFullName: 'Romana Flowers',
      creatorProfileUrl: 'https://instagram.com/lifeof.romana',
      creatorAvatar: '/api/proxy-image?username=lifeof.romana',
      thumbnailUrl: '/api/proxy-image?shortcode=DcgK_-KkgYR',
      caption: 'Romana Flowers aesthetic post & carousel',
      category: 'General',
      isFavorite: false,
      duration: 'Carousel (6)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(`reeldash_reels_${user.id}`, JSON.stringify([reel]));
  });

  // 3. Go to /creator/lifeof.romana (shows live scraped media grid with REAL photos)
  console.log("Navigating to /creator/lifeof.romana...");
  await page.goto('https://reeldash-nine.vercel.app/creator/lifeof.romana', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6000));
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_creator_real_media_thumbnails.png') });

  // 4. Go to /reels library (shows saved reel card with REAL cover photo)
  console.log("Navigating to /reels...");
  await page.goto('https://reeldash-nine.vercel.app/reels', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6000));
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_library_real_card_thumbnail.png') });

  // 5. Click the card to open playback modal / detail page
  const card = await page.$('div.group.relative.flex.flex-col');
  if (card) {
    await card.click();
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_playback_real_thumbnail.png') });
  }

  await browser.close();
  console.log("All real thumbnail screenshots captured successfully!");
}

run().catch(console.error);
