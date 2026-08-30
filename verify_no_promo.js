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

  await page.goto('https://reeldash-nine.vercel.app/login', { waitUntil: 'networkidle2' });

  await page.evaluate(() => {
    const user = {
      id: "ig_usr_2971654926559912",
      name: "Piyush",
      email: "piyush@example.com",
      handle: "@clumsy_asfuck",
      instagramUsername: "clumsy_asfuck",
      connectedAccounts: [
        {
          id: "786af2f8-82e5-4e80-9751-a29a463a0e5a",
          username: "clumsy_asfuck",
          displayName: "Piyush",
          avatarUrl: "/api/proxy-image?username=clumsy_asfuck",
          isActive: true
        }
      ],
      plan: "Free Plan"
    };
    localStorage.setItem("reeldash_user", JSON.stringify(user));
  });

  await page.goto('https://reeldash-nine.vercel.app/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_no_promo_card.png') });
  console.log("Screenshot: Removed Promo Card saved!");

  await browser.close();
}

run().catch(console.error);
