const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testDom() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
  });
  const page = await browser.newPage();
  await page.goto('https://www.instagram.com/marvel/', { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(() => {
    const meta = document.querySelector('meta[property="og:image"]');
    const title = document.querySelector('meta[property="og:title"]');
    return {
      ogImage: meta ? meta.content : null,
      title: title ? title.content : null
    };
  });

  console.log("DOM evaluation result for marvel:", result);
  await browser.close();
}

testDom();
