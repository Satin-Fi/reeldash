const fs = require('fs');

async function getExactInstagramVideo(shortcode) {
  const url = `https://www.instagram.com/reel/${shortcode}/`;
  console.log('Testing extraction for:', shortcode);

  // Method 1: Instagram public embed JS unpacking
  try {
    const res = await fetch(`https://www.instagram.com/p/${shortcode}/embed/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    const html = await res.text();
    fs.writeFileSync('scratch/embed_raw.html', html);
    
    // Look for video_url or mp4 in embed HTML
    const videoUrlMatches = [...html.matchAll(/\"video_url\":\"([^\"]+)\"/g)].map(m => m[1].replace(/\\u0026/g, '&').replace(/\\/g, ''));
    console.log('Embed JSON video_url matches:', videoUrlMatches);

    const mp4Matches = [...html.matchAll(/https:\/\/[^"'\s\\]+cdninstagram\.com[^"'\s\\]+\.mp4[^"'\s\\]*/g)].map(m => m[0].replace(/\\u0026/g, '&').replace(/\\/g, ''));
    console.log('Embed mp4 regex matches:', mp4Matches);
  } catch (e) {
    console.log('Method 1 err:', e.message);
  }

  // Method 2: Instagram direct shortcode query with headers
  try {
    const res = await fetch(`https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 275.0.0.27.98',
        'X-IG-App-ID': '936619743392459',
      }
    });
    console.log('Method 2 status:', res.status);
    if (res.ok) {
      const json = await res.json();
      console.log('Method 2 json items:', json?.items?.[0]?.video_versions);
    }
  } catch (e) {
    console.log('Method 2 err:', e.message);
  }

  // Method 3: Instagram GraphQL doc_id: 8845758582119845
  try {
    const res = await fetch(`https://www.instagram.com/graphql/query/?doc_id=8845758582119845&variables={"shortcode":"${shortcode}"}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'X-IG-App-ID': '936619743392459',
        'X-Requested-With': 'XMLHttpRequest',
      }
    });
    console.log('Method 3 status:', res.status);
    if (res.ok) {
      const json = await res.json();
      const media = json?.data?.xdt_shortcode_media;
      console.log('Method 3 video_url:', media?.video_url);
    }
  } catch (e) {
    console.log('Method 3 err:', e.message);
  }
}

getExactInstagramVideo('Db-NPN0h9xi');
