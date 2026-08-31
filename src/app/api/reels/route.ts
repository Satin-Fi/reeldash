import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { parseCategoryCommand } from "@/lib/parseCategory";

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
    const { url: rawUrl, userId = "user-default", category: bodyCategory, notes, isFavorite } = body;

    if (!rawUrl) {
      return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 });
    }

    // Parse /category <name> or /cat <name> commands from URL
    const { cleanText, category: urlCategory } = parseCategoryCommand(rawUrl);
    const url = (cleanText || rawUrl).trim();
    const requestedCategory = urlCategory || bodyCategory;

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

    const effectiveCategory = requestedCategory || infoData.category || "General";
    const tags = infoData.hashtags || [];
    if (requestedCategory && !tags.includes(requestedCategory.toLowerCase())) {
      tags.push(requestedCategory.toLowerCase());
    }

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
      category: effectiveCategory,
      tags,
      note: notes || "",
      is_favorite: !!isFavorite,
      ai_summary: infoData.aiSummary || "",
      source: "manual",
    };

    let isNewCategory = false;
    let collectionData: any = null;

    // If Supabase is connected, persist to DB with Collection auto-creation
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
          // Auto-create and link Collection if category specified
          if (requestedCategory) {
            const { data: existingCol } = await supabase
              .from("collections")
              .select("id, name")
              .eq("user_id", userId)
              .ilike("name", requestedCategory)
              .limit(1)
              .maybeSingle();

            let targetColId = existingCol?.id;

            if (!targetColId) {
              const { data: newCol } = await supabase
                .from("collections")
                .insert({
                  user_id: userId,
                  name: requestedCategory,
                  description: `Category created via ReelDash`,
                  icon: "📁",
                })
                .select()
                .single();

              targetColId = newCol?.id;
              collectionData = newCol;
              isNewCategory = true;
            } else {
              collectionData = existingCol;
            }

            if (targetColId) {
              await supabase.from("reel_collections").upsert(
                {
                  reel_id: data.id,
                  collection_id: targetColId,
                },
                { onConflict: "reel_id,collection_id" }
              );
            }
          }

          return NextResponse.json({
            success: true,
            reel: data,
            category: effectiveCategory,
            collection: collectionData,
            isNewCategory,
            source: "database",
          });
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
