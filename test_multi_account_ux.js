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

  // 1. Visit Login to seed local storage session with multi-account profile
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
        },
        {
          id: "2b9fe527-724b-4b59-bbbf-2eaf1acf7e23",
          username: "_funnybone1",
          displayName: "FunnyBone",
          avatarUrl: "/api/proxy-image?username=_funnybone1",
          isActive: true
        }
      ],
      plan: "Pro Plan"
    };
    localStorage.setItem("reeldash_user", JSON.stringify(user));
  });

  // 2. Open Dashboard (All Accounts)
  await page.goto('https://reeldash-nine.vercel.app/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_dashboard_all_accounts.png') });
  console.log("Screenshot 1: All accounts saved!");

  // 3. Click @_funnybone1 account pill
  const funnyBoneButton = await page.$('button ::-p-text(@_funnybone1)');
  if (funnyBoneButton) {
    await funnyBoneButton.click();
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_dashboard_funnybone1_filtered.png') });
    console.log("Screenshot 2: Filtered to funnybone1 saved!");
  }

  // 4. Click @clumsy_asfuck account pill
  const clumsyButton = await page.$('button ::-p-text(@clumsy_asfuck)');
  if (clumsyButton) {
    await clumsyButton.click();
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_dashboard_clumsy_filtered.png') });
    console.log("Screenshot 3: Filtered to clumsy_asfuck saved!");
  }

  // 5. Open Settings (Instagram Accounts Tab)
  await page.goto('https://reeldash-nine.vercel.app/settings', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_live_settings_instagram_accounts.png') });
  console.log("Screenshot 4: Settings Instagram Accounts tab saved!");

  await browser.close();
}

run().catch(console.error);
