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

  page.on('requestfailed', req => {
    console.log('REQUEST FAILED:', req.url().slice(0, 80), req.failure()?.errorText);
  });

  page.on('response', res => {
    if (res.url().includes('proxy-image') || res.url().includes('wsrv') || res.url().includes('cdninstagram')) {
      console.log('RESPONSE:', res.url().slice(0, 80), 'Status:', res.status());
    }
  });

  await page.goto('https://reeldash-nine.vercel.app/creator/marvel', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6000));
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_creator_marvel_final.png') });

  await page.goto('https://reeldash-nine.vercel.app/creator/lifeof.romana', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6000));
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_creator_romana_final.png') });

  await browser.close();
  console.log("Debug screenshots taken!");
}

run().catch(console.error);
