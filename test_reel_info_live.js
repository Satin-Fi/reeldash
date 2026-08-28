async function test() {
  const url = "https://www.instagram.com/p/DcgK_-KkgYR/";
  const res = await fetch("https://reeldash-nine.vercel.app/api/reel-info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })
  });
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("reel-info response:", JSON.stringify(data, null, 2));
}

test().catch(console.error);
