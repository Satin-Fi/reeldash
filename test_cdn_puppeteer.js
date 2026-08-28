const puppeteer = require('puppeteer-core');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Piyush\\.gemini\\antigravity\\brain\\4edee984-3a2a-4850-bac5-a8b8c19f522c';

async function test() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
  });
  const page = await browser.newPage();
  const filePath = 'file:///' + path.resolve('test_cdn_img.html').replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle2' });
  const sPath = path.join(artifactDir, 'screenshot_cdn_test.png');
  await page.screenshot({ path: sPath });
  console.log("Saved:", sPath);
  await browser.close();
}

test();
