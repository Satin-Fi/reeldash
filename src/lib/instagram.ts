/**
 * Helper utilities for Instagram handles, URLs, and queries
 */

export function extractInstagramUsername(input: string): string {
  if (!input) return "";
  let clean = input.trim();

  // If full or partial URL
  if (clean.includes("instagram.com/")) {
    try {
      const parts = clean.split("instagram.com/")[1];
      if (parts) {
        const firstSegment = parts.split("?")[0].split("/")[0].replace(/^@/, "").trim();
        // Ignore Instagram non-user routes
        if (firstSegment && !["p", "reel", "reels", "stories", "explore", "tv", "accounts", "direct"].includes(firstSegment.toLowerCase())) {
          return firstSegment;
        }
      }
    } catch {
      // fallback
    }
  }

  // If standard handle or input
  return clean
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/^@/, "")
    .split("/")[0]
    .split("?")[0]
    .replace(/[^a-zA-Z0-9._]/g, "")
    .trim();
}

/**
 * Free online scraper engine using SnapSave obfuscated pipeline (Zero API key needed)
 */
export async function resolveViaSnapSave(urlOrShortcode: string): Promise<string | null> {
  const targetUrl = urlOrShortcode.startsWith("http")
    ? urlOrShortcode
    : `https://www.instagram.com/reel/${urlOrShortcode}/`;

  try {
    const res = await fetch("https://snapsave.app/action.php?lang=en", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://snapsave.app/",
      },
      body: `url=${encodeURIComponent(targetUrl)}`,
      cache: "no-store",
    });

    if (!res.ok) return null;
    const raw = await res.text();

    // Decode JS packing
    const match = raw.match(/eval\(function\(h,u,n,t,e,r\)\{[\s\S]*?\}\("([\s\S]*?)",\s*(\d+),\s*"([\s\S]*?)",\s*(\d+),\s*(\d+),\s*(\d+)\)\)/);
    if (!match) return null;

    const [_, h, u, n, t, e] = match;
    const _0xc50e = ["", "split", "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/", "slice", "indexOf", "", "", ".", "pow", "reduce", "reverse", "0"];
    
    function _0xe19c(d: string, eVal: number, f: number) {
      const g = _0xc50e[2].split("");
      const hStr = g.slice(0, eVal);
      const iStr = g.slice(0, f);
      const j = d.split("").reverse().reduce((a: number, b: string, c: number) => {
        if (hStr.indexOf(b) !== -1) return (a += hStr.indexOf(b) * Math.pow(eVal, c));
        return a;
      }, 0);
      let k = "";
      let jVal = j;
      while (jVal > 0) {
        k = iStr[jVal % f] + k;
        jVal = (jVal - (jVal % f)) / f;
      }
      return k || "0";
    }

    let decoded = "";
    const tNum = parseInt(t, 10);
    const eNum = parseInt(e, 10);
    for (let i = 0, len = h.length; i < len; i++) {
      let s = "";
      while (h[i] !== n[eNum] && i < len) {
        s += h[i];
        i++;
      }
      for (let j = 0; j < n.length; j++) {
        s = s.replace(new RegExp(n[j], "g"), String(j));
      }
      decoded += String.fromCharCode(parseInt(_0xe19c(s, eNum, 10), 10) - tNum);
    }
    const html = decodeURIComponent(escape(decoded));

    // Extract direct media link
    const hrefMatch = html.match(/href=\\"(https:\/\/d\.rapidcdn\.app\/[^\\"]+)\\"/) ||
                      html.match(/href="(https:\/\/d\.rapidcdn\.app\/[^"]+)"/) ||
                      html.match(/https:\/\/[^"'\s\\]+cdninstagram\.com[^"'\s\\]+\.mp4[^"'\s\\]*/i);

    if (hrefMatch && hrefMatch[1]) {
      return hrefMatch[1].replace(/\\/g, "");
    }
    if (hrefMatch && hrefMatch[0]) {
      return hrefMatch[0].replace(/\\/g, "");
    }
  } catch {
    // Fail silently to next scraper
  }

  return null;
}
