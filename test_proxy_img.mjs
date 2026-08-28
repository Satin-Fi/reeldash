async function testDirectFetch() {
  const url = "https://scontent-fra5-1.cdninstagram.com/v/t51.82787-15/786971364_17964787548170609_4520022136954914242_n.jpg?stp=dst-jpegr_e35_p1080x1080_tt6&_nc_cat=100&ig_cache_key=Mzk3MjE1NDIxNjcxODQ2Mzc1MA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMzAyNC5oZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=hRcF4oeqlogQ7kNvwHUtLXB&_nc_oc=AdoX2hH8-B2DMr0jSRRv4OgiT88O09hnM3WjUS6myXQ6URv8zqwXYh6KBwy6dQz3jq2hx_c_7e6ZgFwPX46Yo7E7&_nc_zt=23&se=-1&_nc_ht=scontent-fra5-1.cdninstagram.com&_nc_gid=fH1gftznJvJeraH9k4Anvg&_nc_ss=7060f&oh=00_AQF3pusX7Na9gytAMIFkAuETn9FzWfnz5VUvJnVk3Y8Wpg&oe=6A97CCA2";

  console.log('Testing direct fetch from Instagram CDN...');
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Referer": "https://www.instagram.com/",
      },
    });
    console.log('Direct status:', res.status, 'content-type:', res.headers.get('content-type'));
    const buf = await res.arrayBuffer();
    console.log('Buffer bytes:', buf.byteLength);
  } catch (e) {
    console.error('Direct fetch error:', e);
  }

  console.log('\nTesting wsrv.nl proxy...');
  try {
    const wsrvRes = await fetch(`https://wsrv.nl/?url=${encodeURIComponent(url)}`);
    console.log('wsrv status:', wsrvRes.status, 'content-type:', wsrvRes.headers.get('content-type'));
    const buf = await wsrvRes.arrayBuffer();
    console.log('wsrv Buffer bytes:', buf.byteLength);
  } catch (e) {
    console.error('wsrv error:', e);
  }
}

testDirectFetch();
