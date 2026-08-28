async function test() {
  const coverUrl = "https://instagram.fdel93-2.fna.fbcdn.net/v/t51.82787-15/786971364_17964787548170609_4520022136954914242_n.jpg?stp=dst-jpegr_e35_tt6&_nc_cat=100&ig_cache_key=Mzk3MjE1NDIxNjcxODQ2Mzc1MA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMzAyNC5oZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=hRcF4oeqlogQ7kNvwHTJrub&_nc_oc=AdphEJGEgnoGQDaLYcE1cEA0uV4Eccu3-dEmgBspbV4lf7hes8XNrsD2g-3kDkmeI6_YPonaQ0EsHqxW_7aAmhZP&_nc_zt=23&se=-1&_nc_ht=instagram.fdel93-2.fna&_nc_gid=tJujilXy3fbNrMC9tJR_2w&_nc_ss=7c689&oh=00_AQKbhD2UJc_S-kk91KilV1x1zDEEiI_Osfp6ssldk6ujcA&oe=6A97CCA2";

  console.log("Testing wsrv.nl without &output=jpg...");
  const wsrv1 = `https://wsrv.nl/?url=${encodeURIComponent(coverUrl)}`;
  const res1 = await fetch(wsrv1);
  console.log("wsrv1 status:", res1.status, "content-type:", res1.headers.get("content-type"), "content-length:", res1.headers.get("content-length"));

  console.log("Testing direct fetch with Referer...");
  const res2 = await fetch(coverUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Referer": "https://www.instagram.com/",
    }
  });
  console.log("direct status:", res2.status, "content-type:", res2.headers.get("content-type"));
}

test().catch(console.error);
