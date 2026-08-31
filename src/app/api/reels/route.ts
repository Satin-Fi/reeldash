import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { parseCategoryCommand, formatCategoryDisplayName } from "@/lib/parseCategory";

export const dynamic = "force-dynamic";

// ─── GET /api/reels (Fetch user reels with categories and hashtags) ─────
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

    let query = supabase.from("reels").select(`
      *,
      reel_categories (
        category_id,
        categories (
          id,
          name,
          slug,
          icon
        )
      ),
      reel_hashtags (
        hashtag_id,
        hashtags (
          id,
          name,
          normalized_name
        )
      )
    `);

    if (filterAccount && filterAccount !== "all") {
      const cleanFilter = filterAccount.replace(/^@/, "").trim().toLowerCase();
      query = query.ilike("instagram_username", cleanFilter);
    } else if (userIds.length > 0) {
      query = query.in("user_id", userIds);
    } else {
      return NextResponse.json({ reels: [] });
    }

    const { data: rawReels, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.warn("[API Reels GET query error]:", error);
      // Fallback simple query if joins fail
      const { data: simpleReels } = await supabase
        .from("reels")
        .select("*")
        .in("user_id", userIds)
        .order("created_at", { ascending: false });
      return NextResponse.json({ reels: simpleReels || [] });
    }

    // Enrich and transform reels
    const enrichedReels = (rawReels || []).map((row: any) => {
      const categoryList: string[] = [];
      const categoryIdList: string[] = [];

      if (Array.isArray(row.reel_categories)) {
        row.reel_categories.forEach((rc: any) => {
          if (rc.categories?.name) {
            categoryList.push(rc.categories.name);
            categoryIdList.push(rc.categories.id);
          }
        });
      }

      // If categoryList is empty, fallback to row.category
      if (categoryList.length === 0 && row.category && !row.category.startsWith("#")) {
        categoryList.push(row.category);
      }

      const hashtagList: string[] = [];
      if (Array.isArray(row.reel_hashtags)) {
        row.reel_hashtags.forEach((rh: any) => {
          if (rh.hashtags?.name) {
            hashtagList.push(rh.hashtags.name);
          }
        });
      }

      // If hashtagList is empty, extract from tags or caption
      if (hashtagList.length === 0 && Array.isArray(row.tags)) {
        row.tags.forEach((t: string) => {
          if (t) {
            const h = t.startsWith("#") ? t : `#${t}`;
            if (!hashtagList.includes(h)) hashtagList.push(h);
          }
        });
      }

      return {
        ...row,
        category: categoryList[0] || row.category || "General",
        categories: categoryList.length > 0 ? categoryList : [row.category || "General"],
        categoryIds: categoryIdList,
        hashtags: hashtagList,
        aiTopics: Array.isArray(row.ai_topics) ? row.ai_topics : [],
        // Clean out raw join artifacts
        reel_categories: undefined,
        reel_hashtags: undefined,
      };
    });

    return NextResponse.json({ reels: enrichedReels });
  } catch (err: any) {
    return NextResponse.json({ reels: [], fallback: true, error: err?.message });
  }
}

// ─── POST /api/reels (Save a new reel with categories & hashtags) ──────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url: rawUrl, userId = "user-default", category: bodyCategory, notes, isFavorite } = body;

    if (!rawUrl) {
      return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 });
    }

    // Parse /<category> shortcuts and notes from URL
    const parsedCmd = parseCategoryCommand(rawUrl);
    const url = (parsedCmd.cleanUrl || parsedCmd.cleanText || rawUrl).trim();
    const allCategories = parsedCmd.categories.length > 0 ? parsedCmd.categories : bodyCategory ? [bodyCategory] : [];
    const primaryCategory = allCategories.length > 0 ? allCategories[0] : (parsedCmd.primaryCategory || "General");

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

    const effectiveCategory = allCategories.length > 0 ? allCategories[0] : (infoData.category || (mediaType === "audio" ? "Music & Audio" : "General"));
    
    // Extract hashtags from caption and infoData
    const extractedHashtags: string[] = [];
    const captionText = infoData.caption || "";
    const hashMatches = captionText.match(/#([a-zA-Z0-9_\u0080-\uFFFF]+)/g);
    if (hashMatches) {
      hashMatches.forEach((h: string) => {
        const lower = h.toLowerCase();
        if (!extractedHashtags.includes(lower)) extractedHashtags.push(lower);
      });
    }
    if (Array.isArray(infoData.hashtags)) {
      infoData.hashtags.forEach((h: string) => {
        const tag = h.startsWith("#") ? h.toLowerCase() : `#${h.toLowerCase()}`;
        if (!extractedHashtags.includes(tag)) extractedHashtags.push(tag);
      });
    }

    const reelPayload = {
      user_id: userId,
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
      tags: extractedHashtags,
      note: parsedCmd.note || notes || "",
      is_favorite: !!isFavorite,
      ai_summary: infoData.aiSummary || "",
      ai_topics: Array.isArray(infoData.aiTopics) ? infoData.aiTopics : [],
      source: "manual",
    };

    // If Supabase is connected, persist to DB and associate categories & hashtags
    try {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data: savedRow, error } = await supabase
          .from("reels")
          .upsert(reelPayload, { onConflict: "user_id,shortcode" })
          .select()
          .single();

        if (!error && savedRow) {
          // Link categories
          for (const catName of allCategories) {
            const formatted = formatCategoryDisplayName(catName);
            const normalized = formatted.toLowerCase();
            const slug = normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

            const { data: catRecord } = await supabase
              .from("categories")
              .upsert(
                {
                  user_id: userId,
                  name: formatted,
                  normalized_name: normalized,
                  slug,
                  source: "user",
                },
                { onConflict: "user_id,normalized_name" }
              )
              .select("id")
              .single();

            if (catRecord) {
              await supabase
                .from("reel_categories")
                .upsert({ reel_id: savedRow.id, category_id: catRecord.id }, { onConflict: "reel_id,category_id" });
            }
          }

          // Link hashtags
          for (const rawHash of extractedHashtags) {
            const normHash = rawHash.replace(/^#+/, "").toLowerCase();
            if (normHash) {
              const { data: hashRecord } = await supabase
                .from("hashtags")
                .upsert({ name: `#${normHash}`, normalized_name: normHash }, { onConflict: "normalized_name" })
                .select("id")
                .single();

              if (hashRecord) {
                await supabase
                  .from("reel_hashtags")
                  .upsert({ reel_id: savedRow.id, hashtag_id: hashRecord.id }, { onConflict: "reel_id,hashtag_id" });
              }
            }
          }

          return NextResponse.json({
            reel: {
              ...savedRow,
              categories: allCategories.length > 0 ? allCategories : [savedRow.category || "General"],
              hashtags: extractedHashtags,
            },
          });
        }
      }
    } catch (dbErr) {
      console.warn("[POST /api/reels Supabase notice]:", dbErr);
    }

    return NextResponse.json({
      reel: {
        id: `reel_${Date.now()}`,
        ...reelPayload,
        categories: allCategories.length > 0 ? allCategories : [effectiveCategory],
        hashtags: extractedHashtags,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to save reel" }, { status: 500 });
  }
}

// ─── DELETE /api/reels (Delete a reel permanently) ────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const shortcode = searchParams.get("shortcode");

    if (!id && !shortcode) {
      return NextResponse.json({ error: "id or shortcode parameter is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (supabase) {
      let query = supabase.from("reels").delete();
      if (id) {
        query = query.eq("id", id);
      } else if (shortcode) {
        query = query.eq("shortcode", shortcode);
      }
      const { error } = await query;
      if (error) {
        console.warn("[DELETE /api/reels error]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, id, shortcode });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to delete reel" }, { status: 500 });
  }
}
