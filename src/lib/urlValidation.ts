/**
 * Shared URL validation for proxy/download routes.
 * Prevents SSRF by restricting outbound requests to known CDN domains.
 */

/** Allowed hostname suffixes for media proxy/download routes */
const ALLOWED_MEDIA_DOMAINS = [
  "cdninstagram.com",
  "fbcdn.net",
  "fbsbx.com",
  "instagram.com",
  "fastdl.app",
  "rapidcdn.app",
  "ui-avatars.com",
  "wsrv.nl",
];

/**
 * Check if a URL points to an allowed media CDN domain.
 * Prevents SSRF attacks where an attacker could make the server
 * fetch internal network resources (cloud metadata, localhost, etc.).
 */
export function isAllowedMediaUrl(urlString: string): boolean {
  if (!urlString || !urlString.startsWith("http")) return false;

  try {
    const parsed = new URL(urlString);

    // Block non-HTTP(S) protocols
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;

    // Block obvious internal targets
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.") ||
      hostname.startsWith("192.168.") ||
      hostname === "[::1]" ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".local") ||
      hostname.includes("metadata.google") ||
      hostname.includes("169.254.")
    ) {
      return false;
    }

    // Check against allowed domain suffixes
    return ALLOWED_MEDIA_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/** Maximum allowed download size in bytes (100 MB) */
export const MAX_DOWNLOAD_BYTES = 100 * 1024 * 1024;

/** Maximum allowed image size in bytes (25 MB) */
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
