const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testImgLoad() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  
  page.on('response', async (res) => {
    if (res.url().includes('cdninstagram') || res.url().includes('proxy-image')) {
      console.log('Image response:', res.url().slice(0, 60), 'Status:', res.status());
    }
  });

  await page.goto('https://reeldash-nine.vercel.app/creator/marvel', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));
  await browser.close();
}

testImgLoad();
