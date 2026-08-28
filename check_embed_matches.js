async function checkEmbed(username) {
  const embedRes = await fetch(`https://www.instagram.com/${username}/embed/`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    }
  });
  const html = await embedRes.text();
  console.log("Status:", embedRes.status, "HTML length:", html.length);
  const matches = html.match(/https:[\\\/]+[a-zA-Z0-9.\-_]*scontent[a-zA-Z0-9.\-_]*\.cdninstagram\.com[\\\/][^"'\s<>]+/g) || [];
  console.log("Found scontent matches:", matches.length);
  matches.forEach(m => console.log("Match:", m.slice(0, 100)));
}

checkEmbed('marvel');
