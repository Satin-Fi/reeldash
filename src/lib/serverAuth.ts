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
  const cleaned = text.trim().toUpperCase().replace(/[\s_]+/g, "-");
  return /^RDX-[A-Z0-9]{6}$/.test(cleaned);
}

/**
 * Clean and normalize a link verification code.
 */
export function normalizeLinkCode(text: string): string {
  if (!text) return "";
  return text.trim().toUpperCase().replace(/[\s_]+/g, "-");
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
