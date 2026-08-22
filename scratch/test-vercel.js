async function testVercelEndpoint() {
  const shortcode = "DcWUdHOyewM";
  const url = `https://www.instagram.com/reel/${shortcode}/`;
  const endpoint = `https://reeldash-nine.vercel.app/api/reels/${shortcode}/playback?url=${encodeURIComponent(url)}`;

  console.log("Calling:", endpoint);
  const res = await fetch(endpoint);
  console.log("Status:", res.status);
  const json = await res.json();
  console.log("JSON:", json);
}

testVercelEndpoint();
