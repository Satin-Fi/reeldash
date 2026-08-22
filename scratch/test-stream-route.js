async function testStreamRoute() {
  const directCdnUrl = "https://instagram.fdel93-1.fna.fbcdn.net/o1/v/t2/f2/m86/AQMAc77LrKOoZAb7XKBRsiZiuYOoHXwkSwh2QiHdCRbzYE-rAJjnPisZccijlJWj-Mv0vfxobieeNRVmecBUjjOJdAbHYyuMZ6H8qJg.mp4?_nc_cat=110&_nc_sid=5e9851&_nc_ht=scontent.cdninstagram.com&_nc_ohc=dKiMqZp1XvQQ7kNvwHWU8PP&efg=eyJ2ZW5jb2RlX3RhZyI6Inhwdl9wcm9ncmVzc2l2ZS5JTlNUQUdSQU0uQ0xJUFMuQzMuNzIwLmRhc2hfYmFzZWxpbmVfMV92MSIsInhwdl9hc3NldF9pZCI6MTM3ODMxOTYwMTA4NDI4OSwiYXNzZXRfYWdlX2RheXMiOjAsInZpX3VzZWNhc2VfaWQiOjEwMDk5LCJkdXJhdGlvbl9zIjo0NSwidXJsZ2VuX3NvdXJjZSI6Ind3dyJ9&ccb=17-1&vs=1e4059b0e1bf36ae&_nc_vs=HBksFQIYUmlnX3hwdl9yZWVsc19wZXJtYW5lbnRfc3JfcHJvZC8wRTRGRjU1RDA1Q0MyNENBMDZCODgyNzE2MDkzN0ZCMF92aWRlb19kYXNoaW5pdC5tcDQVAALIARIAFQIYUWlnX3hwdl9wbGFjZW1lbnRfcGVybWFuZW50X3YyL0YwNDlGNDBDODdFMjUxMUM5NTk1NjkxNUNBRDYwQUE2X2F1ZGlvX2Rhc2hpbml0Lm1wNBUCAsgBEgAoABgAGwKIB3VzZV9vaWwBMRJwcm9ncmVzc2l2ZV9yZWNpcGUBMRUAACaCnq2j4eTyBBUCKAJDMywXQEarhR64UewYEmRhc2hfYmFzZWxpbmVfMV92MREAdf4HZeadAQA&_nc_gid=GSekv_ylbIze4D28qK6K3A&_nc_ss=70a8c&_nc_zt=28&oh=00_AQGKn-mzodzzTNivx4k58Xm6COyMH_eU1kQjGPUf8rCvVg&oe=6A8BC4E7";

  console.log("1. Testing direct streaming fetch on Live Vercel Proxy Endpoint...");
  const proxyEndpoint = `https://reeldash-nine.vercel.app/api/proxy-video?url=${encodeURIComponent(directCdnUrl)}`;
  console.log("Calling:", proxyEndpoint.substring(0, 100) + '...');

  const res = await fetch(proxyEndpoint, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
      "Range": "bytes=0-1024",
    }
  });

  console.log("Proxy Status:", res.status);
  console.log("Content-Type:", res.headers.get("content-type"));
  console.log("Content-Length:", res.headers.get("content-length"));
  console.log("Content-Range:", res.headers.get("content-range"));
  console.log("Accept-Ranges:", res.headers.get("accept-ranges"));
}

testStreamRoute();
