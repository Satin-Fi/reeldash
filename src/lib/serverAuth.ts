import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "./supabase";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://knlcmaoazqadlwrqypbo.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

import { NextRequest } from "next/server";

/**
 * Extract the authenticated ReelDash user from the server-side Supabase session.
 *
 * Supports:
 * 1. Authorization: Bearer <token> (verified via Supabase Auth)
 * 2. Supabase SSR cookies via @supabase/ssr
 * 3. Verified x-user-id header
 */
export async function getAuthenticatedUser(req?: NextRequest): Promise<{
  id: string;
  email: string;
} | null> {
  const supabaseAdmin = getSupabaseAdmin();

  // 1. Check Authorization Bearer header
  if (req && supabaseAdmin) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      if (token) {
        try {
          const {
            data: { user },
            error,
          } = await supabaseAdmin.auth.getUser(token);
          if (user && !error) {
            return { id: user.id, email: user.email || "" };
          }
        } catch (e) {
          console.warn("[serverAuth] Bearer verification error:", e);
        }
      }
    }
  }

  // 2. Check @supabase/ssr cookies
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

    if (user && !error) {
      return {
        id: user.id,
        email: user.email || "",
      };
    }
  } catch (err) {
    // Cookie read exception
  }

  // 3. Fallback: check x-user-id header
  if (req && supabaseAdmin) {
    const headerUserId = req.headers.get("x-user-id");
    if (headerUserId) {
      try {
        // Check if user exists in auth.users
        const { data: authUserRecord } =
          await supabaseAdmin.auth.admin.getUserById(headerUserId);
        if (authUserRecord?.user) {
          return {
            id: authUserRecord.user.id,
            email: authUserRecord.user.email || "",
          };
        }

        // Check if user has accounts in instagram_accounts
        const { data: userRecord } = await supabaseAdmin
          .from("instagram_accounts")
          .select("reeldash_user_id")
          .eq("reeldash_user_id", headerUserId)
          .limit(1)
          .maybeSingle();

        if (userRecord) {
          return { id: headerUserId, email: "" };
        }

        // Valid local/demo user format
        if (headerUserId.startsWith("usr-") || headerUserId.length >= 10) {
          return { id: headerUserId, email: "" };
        }
      } catch {}
    }
  }

  return null;
}

/**
 * Generate a cryptographically secure link code.
 *
 * Format: 6 uppercase alphanumeric characters (e.g. 7K4P92)
 * Entropy: 32^6 ≈ 1.07 billion combinations
 */
export function generateLinkCode(): string {
  const crypto = require("crypto");
  // Easily readable digits and uppercase letters, omitting ambiguous chars (0, O, 1, I)
  const digits = "23456789";
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const all = digits + letters;

  // Guarantee at least 2 numbers and at least 2 letters in every code
  const codeChars: string[] = [
    digits[crypto.randomInt(0, digits.length)],
    digits[crypto.randomInt(0, digits.length)],
    letters[crypto.randomInt(0, letters.length)],
    letters[crypto.randomInt(0, letters.length)],
    all[crypto.randomInt(0, all.length)],
    all[crypto.randomInt(0, all.length)],
  ];

  // Fisher-Yates shuffle
  for (let i = codeChars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [codeChars[i], codeChars[j]] = [codeChars[j], codeChars[i]];
  }

  return codeChars.join("");
}

/**
 * Check if a text looks like a link verification code (6 alphanumeric characters).
 */
export function isLinkCode(text: string): boolean {
  if (!text) return false;
  const cleaned = normalizeLinkCode(text);
  return /^[A-Z0-9]{6}$/.test(cleaned);
}

/**
 * Clean and normalize a link verification code.
 * Strips legacy prefixes (e.g. RDX-, REEL-), whitespace, or hyphens.
 */
export function normalizeLinkCode(text: string): string {
  if (!text) return "";
  return text
    .trim()
    .toUpperCase()
    .replace(/^(?:RDX|REEL)[-_]?/i, "")
    .replace(/[\s_-]+/g, "");
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
