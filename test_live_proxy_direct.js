async function testLiveProxyEndpoint() {
  const urls = [
    'https://reeldash-nine.vercel.app/api/proxy-image?username=lifeof.romana',
    'https://reeldash-nine.vercel.app/api/proxy-image?username=marvel',
    'https://reeldash-nine.vercel.app/api/instagram/search-account?query=lifeof.romana',
    'https://reeldash-nine.vercel.app/api/instagram/creator-reels?username=lifeof.romana'
  ];

  for (const u of urls) {
    const res = await fetch(u);
    console.log("URL:", u);
    console.log("Status:", res.status);
    console.log("Content-Type:", res.headers.get("content-type"));
    console.log("Content-Length:", res.headers.get("content-length"));
    if (res.headers.get("content-type")?.includes("json")) {
      const j = await res.json();
      console.log("JSON response:", JSON.stringify(j).slice(0, 200));
    }
    console.log("------------------------");
  }
}

testLiveProxyEndpoint();
