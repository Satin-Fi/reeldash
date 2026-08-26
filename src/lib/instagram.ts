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
