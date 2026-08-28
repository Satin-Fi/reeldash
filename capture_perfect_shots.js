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

  // Log in
  await page.goto('https://reeldash-nine.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'demo@reeldash.com');
  await page.type('input[type="password"]', 'pass');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  // 1. Marvel Creator Page
  console.log("1. Capturing Marvel Creator Page...");
  await page.goto('https://reeldash-nine.vercel.app/creator/marvel', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_creator_marvel_final.png') });

  // 2. Romana Creator Page
  console.log("2. Capturing Romana Creator Page...");
  await page.goto('https://reeldash-nine.vercel.app/creator/lifeof.romana', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_creator_romana_final.png') });

  // 3. Search Page
  console.log("3. Capturing Search Page for Marvel...");
  await page.goto('https://reeldash-nine.vercel.app/search', { waitUntil: 'networkidle2' });
  const input = await page.$('input[placeholder*="Search"]');
  if (input) {
    await input.click();
    await input.type('marvel', { delay: 50 });
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_search_marvel_final.png') });

    // Clear and type Romana
    console.log("4. Capturing Search Page for Romana...");
    await page.evaluate(() => {
      const el = document.querySelector('input[placeholder*="Search"]');
      if (el) {
        el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await input.type('lifeof.romana', { delay: 50 });
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_search_romana_final.png') });
  }

  await browser.close();
  console.log("Done!");
}

run().catch(console.error);
