import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

const PLAN_LIMITS: Record<string, number> = {
  "Free Plan": 1,
  "Pro Plan": 5,
  "Power Plan": 15,
  "Creator Plan": 15,
};

/**
 * 1. GET: List all connected Instagram accounts for the authenticated user.
 *
 * Prefers session-based auth. Falls back to query param userId for backward
 * compatibility during the transition period.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const plan = searchParams.get("plan") || "Pro Plan";

  // Session-based auth ONLY — no query param fallback
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = authUser.id;

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ accounts: [], maxLimit: 5 });
    }

    const { data: accounts, error } = await supabase
      .from("instagram_accounts")
      .select("*")
      .eq("reeldash_user_id", userId)
      .neq("status", "inactive")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const maxLimit = PLAN_LIMITS[plan] || 5;

    return NextResponse.json({
      accounts: accounts || [],
      count: accounts?.length || 0,
      maxLimit,
      canAddMore: (accounts?.length || 0) < maxLimit,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}

/**
 * 2. POST: DISABLED — Username-only linking removed.
 *
 * Instagram accounts must be connected via DM challenge code verification.
 * Use POST /api/instagram/link-code to generate a challenge code,
 * then send it to @ReelDash on Instagram DM.
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      error:
        "Username-only linking has been disabled for security. Use DM verification to connect your Instagram account. Go to Settings → Instagram Accounts → Connect Instagram.",
      requiresVerification: true,
    },
    { status: 403 }
  );
}

/**
 * 3. DELETE: Soft-delete (deactivate) an Instagram account.
 *
 * Sets status = 'inactive' instead of hard deleting.
 * Uses session-based auth with query param fallback.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");

    // Session-based auth ONLY
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = authUser.id;

    if (!accountId) {
      return NextResponse.json(
        { error: "Missing accountId" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Soft-delete: set status to inactive instead of hard delete
    const { error } = await supabase
      .from("instagram_accounts")
      .update({
        status: "inactive",
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", accountId)
      .eq("reeldash_user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Instagram account disconnected. You can reconnect it anytime via DM verification.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to disconnect account" },
      { status: 500 }
    );
  }
}
