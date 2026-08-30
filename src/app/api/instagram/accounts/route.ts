import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const PLAN_LIMITS: Record<string, number> = {
  "Free Plan": 1,
  "Pro Plan": 5,
  "Power Plan": 15,
  "Creator Plan": 15,
};

/**
 * 1. GET: List all connected Instagram accounts for a ReelDash user
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const plan = searchParams.get("plan") || "Pro Plan";

  if (!userId) {
    return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ accounts: [], maxLimit: 5 });
    }

    const { data: accounts, error } = await supabase
      .from("instagram_accounts")
      .select("*")
      .or(`reeldash_user_id.eq.${userId},reeldash_user_id.like.ig_usr_%`)
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
 * 2. POST: Link a new Instagram account to the ReelDash user
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, username, displayName, plan = "Pro Plan" } = body;

    if (!userId || !username) {
      return NextResponse.json({ error: "Missing userId or username" }, { status: 400 });
    }

    const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();
    if (!cleanUsername) {
      return NextResponse.json({ error: "Invalid Instagram username" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    // Check account limit by plan
    const { data: currentAccounts } = await supabase
      .from("instagram_accounts")
      .select("id")
      .eq("reeldash_user_id", userId);

    const maxLimit = PLAN_LIMITS[plan] || 5;
    if ((currentAccounts?.length || 0) >= maxLimit) {
      return NextResponse.json(
        {
          error: `Plan limit reached. Your ${plan} allows up to ${maxLimit} connected Instagram account(s). Please upgrade to connect more.`,
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    const avatarUrl = `/api/proxy-image?username=${encodeURIComponent(cleanUsername)}`;

    // Insert or update instagram account
    const { data: inserted, error: insertError } = await supabase
      .from("instagram_accounts")
      .upsert(
        {
          reeldash_user_id: userId,
          username: cleanUsername,
          display_name: displayName || cleanUsername,
          avatar_url: avatarUrl,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "reeldash_user_id,username" }
      )
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Also associate any previously saved DM reels from this username to this user_id
    await supabase
      .from("reels")
      .update({ user_id: userId, instagram_account_id: inserted.id })
      .ilike("instagram_username", cleanUsername);

    return NextResponse.json({
      success: true,
      account: inserted,
      message: `@${cleanUsername} connected successfully`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to link account" }, { status: 500 });
  }
}

/**
 * 3. DELETE: Unlink an Instagram account
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");
    const userId = searchParams.get("userId");

    if (!accountId || !userId) {
      return NextResponse.json({ error: "Missing accountId or userId" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const { error } = await supabase
      .from("instagram_accounts")
      .delete()
      .eq("id", accountId)
      .eq("reeldash_user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Account unlinked" });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to unlink account" }, { status: 500 });
  }
}
