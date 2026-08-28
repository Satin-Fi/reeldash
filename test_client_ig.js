const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testClientFetch() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
  });
  const page = await browser.newPage();
  await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(async () => {
    try {
      const res = await fetch('https://www.instagram.com/api/v1/users/web_profile_info/?username=marvel', {
        headers: {
          'x-ig-app-id': '936619743392459',
        }
      });
      const data = await res.json();
      return {
        status: res.status,
        pic: data?.data?.user?.profile_pic_url_hd || data?.data?.user?.profile_pic_url,
        name: data?.data?.user?.full_name
      };
    } catch (e) {
      return { error: e.message };
    }
  });

  console.log("Client JS fetch result from instagram.com domain:", result);
  await browser.close();
}

testClientFetch();
