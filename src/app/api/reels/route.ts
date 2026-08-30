import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// ─── GET /api/reels (Fetch user reels) ─────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const username = searchParams.get("username");
  const filterAccount = searchParams.get("account");

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ reels: [], fallback: true, message: "Supabase not configured" });
    }

    const userIds: string[] = [];
    if (userId) userIds.push(userId);

    // Also include any instagram_accounts linked to this user
    if (userId) {
      const { data: userIgAccounts } = await supabase
        .from("instagram_accounts")
        .select("reeldash_user_id, username")
        .or(`reeldash_user_id.eq.${userId},reeldash_user_id.like.ig_usr_%`);
      if (userIgAccounts) {
        userIgAccounts.forEach((acc) => {
          if (acc.reeldash_user_id && !userIds.includes(acc.reeldash_user_id)) {
            userIds.push(acc.reeldash_user_id);
          }
        });
      }
    }

    // If username(s) are provided in query param
    if (username) {
      const handles = username
        .split(",")
        .map((h) => h.replace(/^@/, "").trim().toLowerCase())
        .filter(Boolean);

      if (handles.length > 0) {
        const { data: matchedAccounts } = await supabase
          .from("instagram_accounts")
          .select("reeldash_user_id, username")
          .in("username", handles);

        if (matchedAccounts) {
          matchedAccounts.forEach((p) => {
            if (p.reeldash_user_id && !userIds.includes(p.reeldash_user_id)) {
              userIds.push(p.reeldash_user_id);
            }
          });
        }
      }
    }

    if (filterAccount && filterAccount !== "all") {
      const cleanFilter = filterAccount.replace(/^@/, "").trim().toLowerCase();
      const { data: reels, error } = await supabase
        .from("reels")
        .select("*")
        .ilike("instagram_username", cleanFilter)
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ reels: [], fallback: true, message: error.message });
      }
      return NextResponse.json({ reels: reels || [] });
    }

    if (userIds.length === 0) {
      return NextResponse.json({ reels: [] });
    }

    const { data: reels, error } = await supabase
      .from("reels")
      .select("*")
      .in("user_id", userIds)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ reels: [], fallback: true, message: error.message });
    }

    return NextResponse.json({ reels: reels || [] });
  } catch (err: any) {
    return NextResponse.json({ reels: [], fallback: true, error: err?.message });
  }
}

// ─── POST /api/reels (Save a new reel) ────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, userId = "user-default", category, notes, isFavorite } = body;

    if (!url) {
      return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 });
    }

    // Call internal reel-info extractor
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://reeldash-nine.vercel.app";
    const infoRes = await fetch(`${baseUrl}/api/reel-info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const infoData = infoRes.ok ? await infoRes.json() : {};

    const shortcodeMatch = url.match(/(?:reel|p|audio|stories)\/([A-Za-z0-9_-]+)/);
    const shortcode = infoData.shortcode || (shortcodeMatch ? shortcodeMatch[1] : `sc_${Date.now()}`);
    const mediaType = infoData.mediaType || (url.includes("/audio/") ? "audio" : url.includes("/stories/") ? "story" : url.includes("/p/") ? "post" : "reel");

    const reelPayload = {
      shortcode,
      url,
      thumbnail_url: infoData.thumbnailUrl || (shortcode ? `/api/proxy-image?shortcode=${shortcode}` : ""),
      video_url: infoData.mediaUrl || "",
      caption: infoData.caption || `Instagram ${mediaType.toUpperCase()}`,
      creator_handle: infoData.creatorUsername || "creator",
      creator_name: infoData.creatorFullName || infoData.creatorUsername || "Creator",
      creator_avatar: infoData.creatorAvatar || "",
      media_type: mediaType,
      duration: infoData.duration || "",
      likes_count: infoData.likes || "",
      plays_count: infoData.views || "",
      category: category || infoData.category || "General",
      tags: infoData.hashtags || [],
      note: notes || "",
      is_favorite: !!isFavorite,
      ai_summary: infoData.aiSummary || "",
      source: "manual",
    };

    // If Supabase is connected, persist to DB
    try {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data, error } = await supabase
          .from("reels")
          .upsert(
            { ...reelPayload, user_id: userId },
            { onConflict: "user_id,shortcode" }
          )
          .select()
          .single();

        if (!error && data) {
          return NextResponse.json({ success: true, reel: data, source: "database" });
        }
      }
    } catch {
      // Continue to local response
    }

    return NextResponse.json({
      success: true,
      reel: {
        id: `${mediaType}-${Date.now()}`,
        userId,
        ...reelPayload,
        instagramUrl: url,
        creatorUsername: reelPayload.creator_handle,
        creatorFullName: reelPayload.creator_name,
        thumbnailUrl: reelPayload.thumbnail_url,
        mediaUrl: reelPayload.video_url,
        likes: reelPayload.likes_count,
        hashtags: reelPayload.tags,
        createdAt: new Date().toISOString(),
      },
      source: "client_sync",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/reels ────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing reel id parameter" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ success: true, localOnly: true });
    }

    const { error } = await supabase.from("reels").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: true, localOnly: true });
  }
}
