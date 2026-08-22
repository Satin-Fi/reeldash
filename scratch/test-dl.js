async function testDownloaderAPIs() {
  const shortcode = 'Db-NPN0h9xi';
  const url = `https://www.instagram.com/reel/${shortcode}/`;

  // 1. SaveIG / Snapinsta ajax API
  try {
    const res = await fetch("https://saveig.app/api/ajaxSearch", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: new URLSearchParams({
        q: url,
        t: "media",
        lang: "en"
      })
    });
    console.log("SaveIG status:", res.status);
    const data = await res.json();
    console.log("SaveIG data:", data?.data ? data.data.substring(0, 300) : data);
    // Parse download link from HTML in data.data
    if (data?.data) {
      const match = data.data.match(/href="([^"]+)"\s+class="btn\s+download-media/i) ||
                    data.data.match(/href="([^"]+)"[^>]*download/i);
      console.log("SaveIG extracted video URL:", match ? match[1] : null);
    }
  } catch (e) {
    console.log("SaveIG err:", e.message);
  }

  // 2. Open Cobalt instances
  const cobaltInstances = [
    "https://co.wuk.sh/api/json",
    "https://api.cobalt.tools/api/json",
    "https://cobalt.api.scip.link/api/json",
    "https://api.streamcobalt.com/api/json"
  ];

  for (const instance of cobaltInstances) {
    try {
      const res = await fetch(instance, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ url })
      });
      console.log(`${instance} status:`, res.status);
      if (res.ok) {
        const data = await res.json();
        console.log(`${instance} data:`, data);
      }
    } catch (e) {
      console.log(`${instance} err:`, e.message);
    }
  }
}

testDownloaderAPIs();
