async function checkDecode(username) {
  const embedRes = await fetch(`https://www.instagram.com/${username}/embed/`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    }
  });
  const html = await embedRes.text();
  const matches = html.match(/https:[\\\/]+[a-zA-Z0-9.\-_]*scontent[a-zA-Z0-9.\-_]*\.cdninstagram\.com[\\\/][^"'\s<>\\]+/g) || [];
  console.log("Total matches:", matches.length);
  for (const m of matches) {
    const clean = m.replace(/\\+/g, "");
    console.log("Cleaned URL:", clean);
    break;
  }
}

checkDecode('marvel');
