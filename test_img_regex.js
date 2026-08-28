async function testRegex(u) {
  const res = await fetch(`https://rss.trom.tf/?action=display&bridge=InstagramBridge&u=${u}&format=Json`);
  const data = await res.json();
  const first = data.items[0];
  const content = first.content_html || "";
  
  const oldMatch = content.match(/src="(https:\/\/[^"]+\.jpg[^"]*)"/);
  const newMatch = content.match(/<img[^>]+src="([^"]+)"/i);

  console.log("Old match:", oldMatch ? oldMatch[1].slice(0, 70) : "null");
  console.log("New match:", newMatch ? newMatch[1].slice(0, 70) : "null");
}

testRegex('marvel');
