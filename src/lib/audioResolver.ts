export interface ResolvedAudioTrack {
  streamUrl: string;
  artworkUrl?: string;
  duration?: string;
  trackTitle: string;
  artistName: string;
  source: "itunes" | "audius" | "fallback";
}

const audioCache = new Map<string, { data: ResolvedAudioTrack; expiresAt: number }>();

function cleanAudioString(str: string): string {
  if (!str) return "";
  return str
    .replace(/^@+/, "")
    .replace(/#\w+/g, "")
    .replace(/\s+on\s+Instagram$/i, "")
    .replace(/\s*\(?(?:original\s*audio|soundtrack|audio)\)?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function resolveAudioStream(params: {
  title?: string;
  artist?: string;
  shortcode?: string;
  url?: string;
}): Promise<ResolvedAudioTrack | null> {
  let { title = "", artist = "", url = "" } = params;

  // If url contains info or title has separators
  if (title.includes("|")) {
    const parts = title.split("|");
    if (!artist) artist = cleanAudioString(parts[0]);
    title = cleanAudioString(parts[1]);
  } else if (title.includes("•")) {
    const parts = title.split("•");
    if (!artist) artist = cleanAudioString(parts[0]);
    title = cleanAudioString(parts[1]);
  } else if (title.includes("·")) {
    const parts = title.split("·");
    if (!artist) artist = cleanAudioString(parts[0]);
    title = cleanAudioString(parts[1]);
  }

  const cleanTitle = cleanAudioString(title);
  const cleanArtist = cleanAudioString(artist);

  const cacheKey = `${cleanTitle}:::${cleanArtist}`.toLowerCase();
  const cached = audioCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  // 1. iTunes Search API (Free, high-speed AAC streams, official 30s studio preview)
  const queriesToTry: string[] = [];
  if (cleanTitle && cleanArtist) {
    queriesToTry.push(`${cleanTitle} ${cleanArtist}`);
    queriesToTry.push(`${cleanArtist} ${cleanTitle}`);
  }
  if (cleanTitle && cleanTitle.length > 2) {
    queriesToTry.push(cleanTitle);
  }
  if (cleanArtist && cleanArtist.length > 2 && !cleanArtist.toLowerCase().includes("instagram")) {
    queriesToTry.push(cleanArtist);
  }

  for (const q of queriesToTry) {
    try {
      const itunesRes = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=3`,
        { cache: "no-store" }
      );
      if (itunesRes.ok) {
        const data = await itunesRes.json();
        if (Array.isArray(data.results) && data.results.length > 0) {
          const match = data.results.find((r: any) => r.previewUrl) || data.results[0];
          if (match && match.previewUrl) {
            const totalSec = Math.min(30, Math.round((match.trackTimeMillis || 30000) / 1000));
            const duration = `0:${totalSec < 10 ? "0" : ""}${totalSec}`;

            const artwork = match.artworkUrl100
              ? match.artworkUrl100.replace("100x100bb", "600x600bb")
              : undefined;

            const resolved: ResolvedAudioTrack = {
              streamUrl: match.previewUrl,
              artworkUrl: artwork,
              duration,
              trackTitle: match.trackName || cleanTitle || "Original Audio",
              artistName: match.artistName || cleanArtist || "Artist",
              source: "itunes",
            };

            audioCache.set(cacheKey, { data: resolved, expiresAt: Date.now() + 60 * 60 * 1000 });
            return resolved;
          }
        }
      }
    } catch (err) {
      console.warn("[Audio Resolver] iTunes query failed:", q, err);
    }
  }

  // 2. Audius Search API (Free decentralized open music catalog)
  if (queriesToTry.length > 0) {
    try {
      const q = queriesToTry[0];
      const audiusRes = await fetch(
        `https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(q)}&app_name=reeldash`,
        { cache: "no-store" }
      );
      if (audiusRes.ok) {
        const data = await audiusRes.json();
        if (Array.isArray(data.data) && data.data.length > 0) {
          const track = data.data[0];
          if (track && track.id) {
            const streamUrl = `https://discoveryprovider.audius.co/v1/tracks/${track.id}/stream?app_name=reeldash`;
            const totalSec = Math.round(track.duration || 30);
            const m = Math.floor(totalSec / 60);
            const s = totalSec % 60;
            const duration = `${m}:${s < 10 ? "0" : ""}${s}`;

            const resolved: ResolvedAudioTrack = {
              streamUrl,
              artworkUrl: track.artwork?.["1000x1000"] || track.artwork?.["480x480"],
              duration,
              trackTitle: track.title || cleanTitle || "Original Audio",
              artistName: track.user?.name || cleanArtist || "Artist",
              source: "audius",
            };

            audioCache.set(cacheKey, { data: resolved, expiresAt: Date.now() + 60 * 60 * 1000 });
            return resolved;
          }
        }
      }
    } catch (err) {
      console.warn("[Audio Resolver] Audius query failed:", err);
    }
  }

  return null;
}
