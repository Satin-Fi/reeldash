import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  getAuthenticatedUser,
  generateLinkCode,
  CODE_EXPIRY_SECONDS,
} from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

/**
 * POST — Generate a new challenge code for the authenticated user.
 *
 * The userId is derived from the authenticated Supabase session.
 * The client does NOT supply userId.
 *
 * Response: { code: "RDX-7K4P92", expiresAt: "...", expiresInSeconds: 900 }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Derive user from session — NOT from request body
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { error: "Not authenticated. Please sign in first." },
        { status: 401 }
      );
    }

    const userId = authUser.id;

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // 2. Invalidate any existing unused codes for this user
    await supabase
      .from("link_codes")
      .update({ status: "expired" })
      .eq("reeldash_user_id", userId)
      .eq("status", "pending");

    // 3. Generate new cryptographically secure code
    const code = generateLinkCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CODE_EXPIRY_SECONDS * 1000);

    // 4. Store in database
    const { error: insertError } = await supabase.from("link_codes").insert({
      code,
      reeldash_user_id: userId,
      expires_at: expiresAt.toISOString(),
      status: "pending",
      attempts: 0,
    });

    if (insertError) {
      console.error("[Link Code] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to generate code. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      code,
      expiresAt: expiresAt.toISOString(),
      expiresInSeconds: CODE_EXPIRY_SECONDS,
    });
  } catch (err: any) {
    console.error("[Link Code] POST error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}

/**
 * GET — Poll linking status for the authenticated user.
 *
 * The userId is derived from the authenticated Supabase session.
 *
 * Response:
 *   { linked: true, username: "@personal", linkedAt: "..." }
 *   { linked: false, code: "RDX-7K4P92", expiresAt: "...", expired: false }
 *   { linked: false, code: null, expired: true }
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Derive user from session
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const userId = authUser.id;

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ linked: false, code: null, expired: true });
    }

    // 2. Check if user already has an active linked Instagram account
    const { data: activeAccounts } = await supabase
      .from("instagram_accounts")
      .select("id, username, instagram_user_id, status, linked_at")
      .eq("reeldash_user_id", userId)
      .in("status", ["active", "legacy_unverified"])
      .order("linked_at", { ascending: false, nullsFirst: false });

    if (activeAccounts && activeAccounts.length > 0) {
      return NextResponse.json({
        linked: true,
        accounts: activeAccounts.map((a) => ({
          id: a.id,
          username: a.username,
          verified: a.status === "active",
          linkedAt: a.linked_at,
        })),
        username: `@${activeAccounts[0].username}`,
        linkedAt: activeAccounts[0].linked_at,
      });
    }

    // 3. Check for active pending code
    const { data: pendingCode } = await supabase
      .from("link_codes")
      .select("code, expires_at, status")
      .eq("reeldash_user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingCode) {
      const expired = new Date(pendingCode.expires_at) < new Date();
      if (expired) {
        // Mark as expired
        await supabase
          .from("link_codes")
          .update({ status: "expired" })
          .eq("code", pendingCode.code);

        return NextResponse.json({
          linked: false,
          code: null,
          expired: true,
        });
      }

      return NextResponse.json({
        linked: false,
        code: pendingCode.code,
        expiresAt: pendingCode.expires_at,
        expired: false,
      });
    }

    // 4. No code exists — user needs to generate one
    return NextResponse.json({
      linked: false,
      code: null,
      expired: true,
    });
  } catch (err: any) {
    console.error("[Link Code] GET error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}
