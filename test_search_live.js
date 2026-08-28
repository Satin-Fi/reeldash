async function run() {
  const res = await fetch('https://reeldash-nine.vercel.app/api/instagram/search-account?query=marvel');
  const data = await res.json();
  console.log("Search-account live data:", JSON.stringify(data, null, 2));
}

run();
