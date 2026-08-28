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

  // 1. Log in
  await page.goto('https://reeldash-nine.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'demo@reeldash.com');
  await page.type('input[type="password"]', 'pass');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  // 2. Search Romana
  console.log("Capturing search?q=lifeof.romana...");
  await page.goto('https://reeldash-nine.vercel.app/search?q=lifeof.romana', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_search_romana_verified.png') });

  // 3. Search Marvel
  console.log("Capturing search?q=marvel...");
  await page.goto('https://reeldash-nine.vercel.app/search?q=marvel', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_search_marvel_verified.png') });

  // 4. Creator Profile Romana
  console.log("Capturing creator/lifeof.romana...");
  await page.goto('https://reeldash-nine.vercel.app/creator/lifeof.romana', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_creator_romana_verified.png') });

  // 5. Creator Profile Marvel
  console.log("Capturing creator/marvel...");
  await page.goto('https://reeldash-nine.vercel.app/creator/marvel', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_creator_marvel_verified.png') });

  await browser.close();
  console.log("All verified screenshots captured!");
}

run().catch(console.error);
