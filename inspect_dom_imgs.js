const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function inspectDom() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://reeldash-nine.vercel.app/creator/marvel', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));

  const imgInfo = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs.map(img => ({
      src: img.src,
      currentSrc: img.currentSrc,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete
    }));
  });

  console.log("Images on page:", JSON.stringify(imgInfo, null, 2));
  await browser.close();
}

inspectDom();
