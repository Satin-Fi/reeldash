import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "./supabase";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://knlcmaoazqadlwrqypbo.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Extract the authenticated ReelDash user from the server-side Supabase session.
 *
 * Uses `@supabase/ssr` to read the auth cookie set by Supabase Auth.
 * This is the ONLY way API routes should determine who the caller is.
 *
 * NEVER trust a `userId` supplied by the client request body or query params
 * for security-sensitive operations.
 */
export async function getAuthenticatedUser(): Promise<{
  id: string;
  email: string;
} | null> {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || "",
    };
  } catch (err) {
    console.warn("[serverAuth] Failed to extract authenticated user:", err);
    return null;
  }
}

/**
 * Generate a cryptographically secure link code.
 *
 * Format: RDX-XXXXXX (6 uppercase alphanumeric characters)
 * Entropy: 36^6 ≈ 2.2 billion combinations
 */
export function generateLinkCode(): string {
  const crypto = require("crypto");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(6);
  let code = "RDX-";
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

/**
 * Check if a message text looks like a link verification code.
 */
export function isLinkCode(text: string): boolean {
  if (!text) return false;
  const cleaned = text.trim().toUpperCase();
  return /^RDX-[A-Z0-9]{6}$/.test(cleaned);
}

/**
 * Rate-limit constant: max failed attempts per code before it's locked.
 */
export const MAX_CODE_ATTEMPTS = 5;

/**
 * Code expiration in seconds (15 minutes).
 */
export const CODE_EXPIRY_SECONDS = 900;

/**
 * Pending reel TTL in hours (default 72).
 */
export const PENDING_REEL_TTL_HOURS = parseInt(
  process.env.PENDING_REEL_TTL_HOURS || "72",
  10
);
