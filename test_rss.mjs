async function testRss() {
  const username = 'lifeof.romana';
  const bridgeUrls = [
    `https://rss.trom.tf/?action=display&bridge=InstagramBridge&u=${encodeURIComponent(username)}&format=Json`,
    `https://rss-bridge.org/bridge01/?action=display&bridge=InstagramBridge&u=${encodeURIComponent(username)}&format=Json`,
    `https://rss.bloat.cat/?action=display&bridge=InstagramBridge&u=${encodeURIComponent(username)}&format=Json`,
  ];

  for (const u of bridgeUrls) {
    try {
      console.log('Fetching:', u);
      const res = await fetch(u, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        signal: AbortSignal.timeout(5000),
      });
      console.log('Status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('Items count:', data.items?.length);
        if (data.items && data.items.length > 0) {
          console.log('First item:', JSON.stringify(data.items[0], null, 2));
        }
        break;
      }
    } catch (e) {
      console.error('Error:', e.message);
    }
  }
}

testRss();
