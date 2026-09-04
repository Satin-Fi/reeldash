import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  getAuthenticatedUser,
  generateLinkCode,
  CODE_EXPIRY_SECONDS,
} from "@/lib/serverAuth";
import { redeemDMVerificationCode } from "@/lib/instagramBot";

export const dynamic = "force-dynamic";

/**
 * POST — Generate a new challenge code OR redeem a code received via Instagram DM.
 *
 * Case A (Redeem): If `req.body.code` is present, the authenticated user is entering
 * a verification code they received from @ReelDash in Instagram DM.
 *
 * Case B (Generate): If no code is passed in the body, generates a new code for the
 * user to send to @ReelDash on Instagram DM.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Derive user from session — NOT from request body
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { error: "Not authenticated. Please sign in first." },
        { status: 401 }
      );
    }

    const userId = authUser.id;

    // Check if client is submitting a verification code received from Instagram DM
    const body = await req.json().catch(() => null);
    if (body && typeof body.code === "string" && body.code.trim().length > 0) {
      const redeemResult = await redeemDMVerificationCode(userId, body.code.trim());
      if (redeemResult.success) {
        return NextResponse.json({
          success: true,
          linked: true,
          username: redeemResult.username,
          claimedCount: redeemResult.claimedCount || 0,
          message: `Successfully connected @${redeemResult.username}!`,
        });
      } else {
        return NextResponse.json(
          { error: redeemResult.error || "Failed to verify code." },
          { status: 400 }
        );
      }
    }

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
 *   { linked: false, code: "7K4P92", expiresAt: "...", expired: false }
 *   { linked: false, code: null, expired: true }
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Derive user from session
    const authUser = await getAuthenticatedUser(req);
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

    // 2. Check for the most recent link code for this user
    const { data: latestCode } = await supabase
      .from("link_codes")
      .select("code, expires_at, status, used_at, used_by_ig_id")
      .eq("reeldash_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 2a. If the code was just used (within the last 15 minutes), report successful linking
    if (latestCode && latestCode.status === "used") {
      const usedAtMs = latestCode.used_at
        ? new Date(latestCode.used_at).getTime()
        : 0;
      if (Date.now() - usedAtMs < 15 * 60 * 1000) {
        // Fetch the account that was linked
        const { data: linkedAccount } = await supabase
          .from("instagram_accounts")
          .select("id, username, linked_at, status")
          .eq("reeldash_user_id", userId)
          .eq("status", "active")
          .order("linked_at", { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle();

        if (linkedAccount) {
          return NextResponse.json({
            linked: true,
            username: `@${linkedAccount.username}`,
            linkedAt: linkedAccount.linked_at,
          });
        }
      }
    }

    // 2b. If the code is currently pending, check expiration
    if (latestCode && latestCode.status === "pending") {
      const expired = new Date(latestCode.expires_at) < new Date();
      if (expired) {
        await supabase
          .from("link_codes")
          .update({ status: "expired" })
          .eq("code", latestCode.code);

        return NextResponse.json({
          linked: false,
          code: null,
          expired: true,
        });
      }

      return NextResponse.json({
        linked: false,
        code: latestCode.code,
        expiresAt: latestCode.expires_at,
        expired: false,
      });
    }

    // 3. No active code: check if user already has an active verified account
    const { data: activeAccounts } = await supabase
      .from("instagram_accounts")
      .select("id, username, instagram_user_id, status, linked_at")
      .eq("reeldash_user_id", userId)
      .eq("status", "active")
      .order("linked_at", { ascending: false, nullsFirst: false });

    if (activeAccounts && activeAccounts.length > 0) {
      return NextResponse.json({
        linked: true,
        accounts: activeAccounts.map((a) => ({
          id: a.id,
          username: a.username,
          verified: true,
          linkedAt: a.linked_at,
        })),
        username: `@${activeAccounts[0].username}`,
        linkedAt: activeAccounts[0].linked_at,
      });
    }

    // 4. No code exists and no active accounts
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
