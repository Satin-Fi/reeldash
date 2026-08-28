async function testFetch(u) {
  const userAgents = [
    "WhatsApp/2.21.12.21 A",
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "Twitterbot/1.0",
  ];

  for (const ua of userAgents) {
    try {
      const res = await fetch(`https://www.instagram.com/${u}/`, {
        headers: {
          "User-Agent": ua,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "follow",
        cache: "no-store",
      });

      console.log(u, ua, '=> Status:', res.status);
      if (res.ok) {
        const html = await res.text();
        const ogMatch =
          html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
          html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
        console.log("Found OG:", ogMatch ? ogMatch[1].slice(0, 80) : "none");
        if (ogMatch) return ogMatch[1].replace(/&amp;/g, "&");
      }
    } catch (e) {
      console.error("Fetch error:", e.message);
    }
  }
  return null;
}

async function run() {
  console.log("Marvel:", await testFetch('marvel'));
  console.log("\nRomana:", await testFetch('lifeof.romana'));
}

run();
