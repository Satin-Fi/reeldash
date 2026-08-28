async function checkRssAvatar(u) {
  const res = await fetch(`https://rss.trom.tf/?action=display&bridge=InstagramBridge&u=${u}&format=Json`);
  const data = await res.json();
  console.log("JSON feed keys:", Object.keys(data));
  console.log("icon:", data.icon);
  console.log("favicon:", data.favicon);
  console.log("author:", data.author);
}

checkRssAvatar('marvel');
