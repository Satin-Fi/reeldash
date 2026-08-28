async function test() {
  const username = "lifeof.romana";
  console.log("Testing search-account route avatar extraction for:", username);
  const searchRes = await fetch(`https://reeldash-nine.vercel.app/api/instagram/search-account?q=${username}`);
  const searchData = await searchRes.json();
  console.log("Search account result:", searchData);

  console.log("Testing proxy-image route for:", username);
  const proxyRes = await fetch(`https://reeldash-nine.vercel.app/api/proxy-image?username=${username}`);
  console.log("Proxy response status:", proxyRes.status, "content-type:", proxyRes.headers.get("content-type"), "content-length:", proxyRes.headers.get("content-length"));
}

test().catch(console.error);
