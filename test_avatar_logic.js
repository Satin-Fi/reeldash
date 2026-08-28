async function testFetchAvatar(cleanUsername) {
  try {
    const embedRes = await fetch(`https://www.instagram.com/${cleanUsername}/embed/`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      cache: "no-store",
    });

    if (embedRes.ok) {
      const embedHtml = await embedRes.text();
      const scontentMatches =
        embedHtml.match(
          /https:[\\\/]+[a-zA-Z0-9.\-_]*scontent[a-zA-Z0-9.\-_]*\.cdninstagram\.com[\\\/][^"'\s<>]+/g
        ) || [];

      for (const rawUrl of scontentMatches) {
        const decoded = rawUrl
          .replace(/\\\//g, "/")
          .replace(/\\u00253D/gi, "%3D")
          .replace(/\\u0026/gi, "&")
          .replace(/&amp;/g, "&")
          .replace(/\\+$/, "");

        if (
          decoded.includes("t51.82787-19") ||
          decoded.includes("t51.2885-19") ||
          decoded.includes("s150x150") ||
          decoded.includes("s100x100") ||
          decoded.includes("profile_pic")
        ) {
          return decoded;
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

async function run() {
  console.log("Marvel avatar:", await testFetchAvatar('marvel'));
  console.log("Romana avatar:", await testFetchAvatar('lifeof.romana'));
}

run();
