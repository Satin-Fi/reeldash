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

  // 2. Intentionally inject an old corrupt state where thumbnailUrl was set to the DP avatar
  console.log("Simulating user browser with old DP-corrupted thumbnail in localStorage...");
  await page.evaluate(() => {
    const userStr = localStorage.getItem('reeldash_user');
    const user = userStr ? JSON.parse(userStr) : { id: 'usr-123' };
    const corruptReel = {
      id: "post-test-migration",
      userId: user.id,
      shortcode: "DcgK_-KkgYR",
      instagramUrl: "https://www.instagram.com/p/DcgK_-KkgYR/",
      creatorUsername: "lifeof.romana",
      creatorFullName: "Romana Flowers",
      creatorAvatar: "/api/proxy-image?username=lifeof.romana",
      thumbnailUrl: "/api/proxy-image?username=lifeof.romana", // Old bug: was set to creator DP!
      mediaType: "post",
      isCarousel: true,
      caption: "Bilkul civic sense nahi hai jahan bhi jati hu slay krdeti hu...",
      category: "Tech & Dev",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(`reeldash_reels_${user.id}`, JSON.stringify([corruptReel]));
  });

  // 3. Reload library to let migration and new ReelCard logic execute
  console.log("Navigating to /reels library to verify auto-repair...");
  await page.goto('https://reeldash-nine.vercel.app/reels', { waitUntil: 'networkidle2' });
  await page.waitForSelector('img[referrerpolicy="no-referrer"]', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 3000));

  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_corrupted_state_auto_repaired.png') });
  await browser.close();
  console.log("Auto-repair screenshot captured successfully!");
}

run().catch(console.error);
