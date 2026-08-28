async function fetchFastRss(username) {
  const bridgeUrls = [
    `https://rss.trom.tf/?action=display&bridge=InstagramBridge&u=${encodeURIComponent(username)}&format=Json`,
    `https://rss-bridge.org/bridge01/?action=display&bridge=InstagramBridge&u=${encodeURIComponent(username)}&format=Json`,
    `https://rss.bloat.cat/?action=display&bridge=InstagramBridge&u=${encodeURIComponent(username)}&format=Json`,
  ];

  const startTime = Date.now();
  const results = await Promise.any(
    bridgeUrls.map(async (url) => {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.items || data.items.length === 0) throw new Error("No items");
      return { url, items: data.items };
    })
  );

  console.log(`Resolved ${results.items.length} items from ${results.url} in ${Date.now() - startTime}ms`);
  return results;
}

async function run() {
  console.log("Marvel:");
  await fetchFastRss('marvel');
  console.log("\nRomana:");
  await fetchFastRss('lifeof.romana');
}

run();
