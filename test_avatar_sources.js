async function testAvatarSources(username) {
  // Test CF worker
  try {
    const cfUrl = `https://reeldash-ig-proxy.reeldash-ig-proxy.workers.dev/ig?path=${encodeURIComponent(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`)}`;
    const res = await fetch(cfUrl, {
      headers: {
        "X-IG-App-ID": "936619743392459",
      }
    });
    console.log("CF Worker status:", res.status);
    if (res.ok) {
      const data = await res.json();
      const pic = data?.data?.user?.profile_pic_url_hd || data?.data?.user?.profile_pic_url;
      console.log("CF Worker avatar:", pic ? pic.slice(0, 70) : "null");
    }
  } catch (e) {
    console.error("CF worker err:", e.message);
  }

  // Test Picuki
  try {
    const res = await fetch(`https://www.picuki.com/profile/${username}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
    });
    console.log("Picuki status:", res.status);
    if (res.ok) {
      const html = await res.text();
      const match = html.match(/<img[^>]+class="profile-avatar"[^>]+src="([^"]+)"/i) || html.match(/<div class="profile-avatar">\s*<img[^>]+src="([^"]+)"/i);
      console.log("Picuki avatar:", match ? match[1].slice(0, 70) : "null");
    }
  } catch (e) {
    console.error("Picuki err:", e.message);
  }
}

testAvatarSources('marvel');
