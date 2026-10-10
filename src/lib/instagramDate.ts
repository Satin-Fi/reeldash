/**
 * Utility to extract the genuine date when a reel/post was originally uploaded
 * to Instagram by the creator, rather than when the user saved it to ReelDash.
 */

export function getInstagramShortcodeDate(shortcodeOrUrl?: string): Date | null {
  if (!shortcodeOrUrl || typeof shortcodeOrUrl !== "string") return null;

  const match = shortcodeOrUrl.match(/(?:reel|reels|p|stories)\/([A-Za-z0-9_-]+)/);
  const rawCandidate = match ? match[1] : shortcodeOrUrl.replace(/^https?:\/\/[^/]+\//, "");
  const shortcode = rawCandidate.split(/[?#/&]/)[0].replace(/^audio_/, "").trim();
  if (!shortcode) return null;

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let id = BigInt(0);
  for (let i = 0; i < shortcode.length; i++) {
    const idx = alphabet.indexOf(shortcode[i]);
    if (idx === -1) return null;
    id = id * BigInt(64) + BigInt(idx);
  }

  // Instagram Snowflake epoch = 1314220021721ms (August 24, 2011)
  const timestampMs = Number(id >> BigInt(23)) + 1314220021721;
  const date = new Date(timestampMs);
  const year = date.getFullYear();

  if (!isNaN(date.getTime()) && year >= 2010 && year <= 2030) {
    return date;
  }
  return null;
}

export function getOriginalUploadDate(reel?: any): Date | null {
  if (!reel) return null;

  // 1. Decode from Instagram Snowflake ID inside shortcode or Instagram URL (mathematical ground truth)
  const sc =
    reel.shortcode ||
    reel.instagramUrl ||
    reel.instagram_url ||
    reel.url ||
    reel.sourceUrl ||
    reel.source_url;
  const fromShortcode = getInstagramShortcodeDate(sc);
  if (fromShortcode) {
    return fromShortcode;
  }

  // 2. Explicit original upload fields if provided by scraper/metadata
  const explicit =
    reel.postedAt ??
    reel.publishedAt ??
    reel.takenAt ??
    reel.timestamp ??
    reel.posted_at ??
    reel.published_at;
  if (explicit) {
    const parsed = new Date(
      typeof explicit === "number" && explicit < 1e11 ? explicit * 1000 : explicit
    );
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2010 && parsed.getFullYear() <= 2030) {
      return parsed;
    }
  }

  // 3. Extract from caption string if scraped as "username on Month Day, Year"
  if (reel.caption && typeof reel.caption === "string") {
    const match = reel.caption.match(/\bon\s+([A-Za-z]+\s+\d{1,2}(?:,\s+\d{4})?)/i);
    if (match && match[1]) {
      const parsed = new Date(match[1]);
      if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2010 && parsed.getFullYear() <= 2030) {
        return parsed;
      }
    }
  }

  return null;
}

export function formatOriginalUploadDate(reel?: any, format: "short" | "long" = "short"): string {
  const date = getOriginalUploadDate(reel);
  if (!date) return "";

  if (format === "long") {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
