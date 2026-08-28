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

  // 2. Exact user query on Search: lifeof.romana
  console.log("1. Capturing search?q=lifeof.romana...");
  await page.goto('https://reeldash-nine.vercel.app/search?q=lifeof.romana', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 7000));
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_search_romana_exact.png') });

  // 3. Creator Profile Romana
  console.log("2. Capturing creator/lifeof.romana...");
  await page.goto('https://reeldash-nine.vercel.app/creator/lifeof.romana', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 7000));
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_creator_romana_exact.png') });

  // 4. Creator Profile Marvel
  console.log("3. Capturing creator/marvel...");
  await page.goto('https://reeldash-nine.vercel.app/creator/marvel', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 7000));
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_creator_marvel_exact.png') });

  await browser.close();
  console.log("Exact verification complete!");
}

run().catch(console.error);
