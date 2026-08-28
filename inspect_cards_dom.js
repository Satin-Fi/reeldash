const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function inspectCards() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('https://reeldash-nine.vercel.app/creator/marvel', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));

  const data = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('img'));
    return cards.map(c => ({
      src: c.src,
      alt: c.alt,
      naturalWidth: c.naturalWidth,
      complete: c.complete
    }));
  });

  console.log("Card images in DOM:", JSON.stringify(data, null, 2));
  await browser.close();
}

inspectCards();
