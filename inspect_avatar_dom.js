const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function inspectAvatarImg() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  
  page.on('response', res => {
    if (res.url().includes('search-account') || res.url().includes('proxy-image')) {
      console.log('RES URL:', res.url(), 'STATUS:', res.status());
    }
  });

  await page.goto('https://reeldash-nine.vercel.app/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'demo@reeldash.com');
  await page.type('input[type="password"]', 'pass');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  await page.goto('https://reeldash-nine.vercel.app/search?q=lifeof.romana', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));

  const imgInfo = await page.evaluate(() => {
    const img = document.querySelector('img[alt="lifeof.romana"]');
    return {
      src: img ? img.src : null,
      currentSrc: img ? img.currentSrc : null,
      naturalWidth: img ? img.naturalWidth : null,
      complete: img ? img.complete : null
    };
  });

  console.log("Avatar DOM img info:", imgInfo);
  await browser.close();
}

inspectAvatarImg();
