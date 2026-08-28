async function test() {
  const res = await fetch('https://rss.trom.tf/?action=display&bridge=InstagramBridge&u=lifeof.romana&format=Json');
  const data = await res.json();
  console.log(`Received ${data.items.length} items from RSS Bridge`);
  for (const item of data.items) {
    const url = item.url || "";
    const shortcode = url.match(/\/(reel|p)\/([A-Za-z0-9_-]+)/)?.[2];
    const displayUrl = item.attachments?.find(a => a.mime_type?.startsWith('image/') || a.url?.includes('.jpg'))?.url || item.image || item.attachments?.[0]?.url || "";
    const isVideo = item.title?.startsWith("▶") || url.includes("/reel/");
    const carouselImages = item.attachments?.map(a => a.url).filter(Boolean) || [];

    console.log(`- [${shortcode}] (${isVideo ? 'REEL' : 'POST'} / ${carouselImages.length} imgs):`, displayUrl.substring(0, 80) + '...');
  }
}

test().catch(console.error);
