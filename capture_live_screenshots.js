const puppeteer = require('puppeteer-core');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Piyush\\.gemini\\antigravity\\brain\\4edee984-3a2a-4850-bac5-a8b8c19f522c';

async function capture() {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 850 });

  // 1. Log in
  console.log("Navigating to login...");
  await page.goto('https://reeldash-nine.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'demo@reeldash.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 3000));

  // 2. Search Page with lifeof.romana
  console.log("Navigating to /search for lifeof.romana...");
  await page.goto('https://reeldash-nine.vercel.app/search', { waitUntil: 'networkidle2' });
  const searchInput = await page.$('input[placeholder*="Search"]');
  if (searchInput) {
    await searchInput.type('lifeof.romana');
    await new Promise(r => setTimeout(r, 4000));
  }
  const sPath = path.join(artifactDir, 'screenshot_live_search_romana.png');
  await page.screenshot({ path: sPath });
  console.log("Saved:", sPath);

  // 3. Creator page for marvel
  console.log("Navigating to /creator/marvel...");
  await page.goto('https://reeldash-nine.vercel.app/creator/marvel', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));
  const mPath = path.join(artifactDir, 'screenshot_live_creator_marvel.png');
  await page.screenshot({ path: mPath });
  console.log("Saved:", mPath);

  // 4. Creator page for lifeof.romana
  console.log("Navigating to /creator/lifeof.romana...");
  await page.goto('https://reeldash-nine.vercel.app/creator/lifeof.romana', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));
  const rPath = path.join(artifactDir, 'screenshot_live_creator_romana.png');
  await page.screenshot({ path: rPath });
  console.log("Saved:", rPath);

  await browser.close();
  console.log("Screenshots captured successfully!");
}

capture().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
