async function testItems(u) {
  const res = await fetch(`https://rss.trom.tf/?action=display&bridge=InstagramBridge&u=${u}&format=Json`);
  const data = await res.json();
  data.items.forEach(i => {
    const isVideo = i.title?.startsWith("▶") || i.url?.includes("/reel/");
    const isReel = i.url?.includes("/reel/");
    console.log(u, "title:", i.title?.slice(0, 30), "url:", i.url, "isVideo:", isVideo, "isReel:", isReel);
  });
}

async function run() {
  await testItems('marvel');
  console.log("----");
  await testItems('lifeof.romana');
}

run();
