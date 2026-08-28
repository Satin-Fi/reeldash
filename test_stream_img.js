async function testStreamImage(u) {
  const wsrvUrl = `https://wsrv.nl/?url=${encodeURIComponent(u)}`;
  const res = await fetch(wsrvUrl);
  console.log("Status:", res.status);
  const buffer = await res.arrayBuffer();
  console.log("Buffer byte length:", buffer.byteLength);
  console.log("Content-Type:", res.headers.get("content-type"));
}

testStreamImage('https://scontent.cdninstagram.com/v/t51.82787-19/768844313_17961855246170609_4052321426556814184_n.jpg?stp=dst-jpg_s100x100_tt6&_nc_cat=107&ccb=7-5&_nc_sid=bf7eb4&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLnd3dy4xMDgwLkMzIn0%3D&_nc_ohc=HYbJFR6QAYAQ7kNvwFfTmX4&_nc_oc=AdqKpwagvcjD1AAZ4mHhtFCtioD2v1-ES-Nyllp49d5k-D0lGvvtCAeS0nNn8jeV_SAX0tnWlTmBMKG5N6YDlHYN&_nc_zt=24&_nc_ht=scontent.cdninstagram.com&_nc_gid=UzOOXkgTKrCtGWz6UXqlSA&_nc_ss=7c689&oh=00_AQGHW0uxneEkl8yZxA8fJOxmjqY5sGbdKSF9NbtG-npjwQ&oe=6A97AA66');
