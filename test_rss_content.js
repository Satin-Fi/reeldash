async function testRssContent(u) {
  const res = await fetch(`https://rss.trom.tf/?action=display&bridge=InstagramBridge&u=${u}&format=Json`);
  const data = await res.json();
  const first = data.items[0];
  console.log("First item:", {
    title: first.title,
    url: first.url,
    content_html: first.content_html
  });
}

testRssContent('marvel');
