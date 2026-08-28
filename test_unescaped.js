async function testWorkingDecode(username) {
  const embedRes = await fetch(`https://www.instagram.com/${username}/embed/`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    }
  });
  const html = await embedRes.text();
  const unescaped = html.replace(/\\u0026/gi, "&").replace(/\\u00253D/gi, "%3D").replace(/\\\//g, "/").replace(/\\/g, "");
  const matches = unescaped.match(/https:\/\/[a-zA-Z0-9.\-_]*scontent[a-zA-Z0-9.\-_]*\.cdninstagram\.com\/[^\s"'<>]+/g) || [];
  
  console.log("Unescaped matches count:", matches.length);
  for (const url of matches) {
    if (url.includes("t51.82787-19") || url.includes("t51.2885-19") || url.includes("s150x150") || url.includes("profile_pic")) {
      console.log("FOUND PROFILE PIC:", url);
      return url;
    }
  }
}

testWorkingDecode('marvel');
testWorkingDecode('lifeof.romana');
