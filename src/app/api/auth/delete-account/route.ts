import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/serverAuth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
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

    // 1. Fetch user's reels to clean up junction tables
    const { data: userReels } = await supabase
      .from("reels")
      .select("id")
      .eq("user_id", userId);

    const reelIds = (userReels || []).map((r: any) => r.id);
    if (reelIds.length > 0) {
      await supabase.from("reel_categories").delete().in("reel_id", reelIds);
      await supabase.from("reel_hashtags").delete().in("reel_id", reelIds);
      await supabase.from("collection_reels").delete().in("reel_id", reelIds);
    }

    // 2. Fetch user's collections to clean up collection_reels
    const { data: userCollections } = await supabase
      .from("collections")
      .select("id")
      .eq("user_id", userId);

    const collectionIds = (userCollections || []).map((c: any) => c.id);
    if (collectionIds.length > 0) {
      await supabase.from("collection_reels").delete().in("collection_id", collectionIds);
    }

    // 3. Delete user's collections, reels, categories
    await supabase.from("collections").delete().eq("user_id", userId);
    await supabase.from("reels").delete().eq("user_id", userId);
    await supabase.from("categories").delete().eq("user_id", userId);

    // 4. Delete link codes & instagram accounts
    await supabase.from("link_codes").delete().eq("reeldash_user_id", userId);
    await supabase.from("instagram_accounts").delete().eq("reeldash_user_id", userId);

    // 5. Unclaim pending reels
    await supabase
      .from("pending_reels")
      .update({ status: "pending", claimed_by_user_id: null, claimed_at: null })
      .eq("claimed_by_user_id", userId);

    // 6. Delete user from Supabase auth admin
    try {
      await supabase.auth.admin.deleteUser(userId);
    } catch (authErr) {
      console.warn("[Delete Account] Supabase Auth admin deleteUser notice:", authErr);
    }

    return NextResponse.json({
      success: true,
      message: "Account and associated data deleted successfully",
    });
  } catch (error: any) {
    console.error("[Delete Account] Error deleting account:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete account" },
      { status: 500 }
    );
  }
}
