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

    // Also include any instagram_accounts linked to this user (by their real reeldash_user_id only)
    if (userId) {
      const { data: userIgAccounts } = await supabase
        .from("instagram_accounts")
        .select("reeldash_user_id, username")
        .eq("reeldash_user_id", userId);
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
      query = query
        .in("user_id", userIds)
        .or(`instagram_username.ilike.${cleanFilter},instagram_username.is.null,source.eq.manual`);
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
        shortcode: row.shortcode,
        isCarousel: row.is_carousel || row.duration?.toLowerCase().includes("carousel") || (Array.isArray(row.carousel_images) && row.carousel_images.length > 1),
        carouselImages: Array.isArray(row.carousel_images) && row.carousel_images.length > 0 ? row.carousel_images : undefined,
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
    const {
      url: rawUrl,
      userId,
      shortcode: clientShortcode,
      category: bodyCategory,
      categories: bodyCategories,
      notes,
      note,
      isFavorite,
      creator,
      creator_handle,
      creatorFullName,
      creator_name,
      creatorAvatar,
      creator_avatar,
      thumbnailUrl,
      thumbnail_url,
      videoUrl,
      video_url,
      caption: bodyCaption,
      mediaType: bodyMediaType,
      media_type,
      duration: bodyDuration,
      likes: bodyLikes,
      likes_count,
      plays_count,
      isCarousel,
      is_carousel,
      carouselImages,
      carousel_images,
      source: bodySource,
      instagram_username,
      instagram_account_id,
    } = body;

    if (!rawUrl) {
      return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse /<category> shortcuts and notes from URL
    const parsedCmd = parseCategoryCommand(rawUrl);
    const url = (parsedCmd.cleanUrl || parsedCmd.cleanText || rawUrl).trim();
    
    // Category consolidation
    let allCategories: string[] = [];
    if (Array.isArray(bodyCategories) && bodyCategories.length > 0) {
      allCategories = bodyCategories.filter(Boolean);
    } else if (parsedCmd.categories.length > 0) {
      allCategories = parsedCmd.categories;
    } else if (bodyCategory) {
      allCategories = [bodyCategory];
    }
    const primaryCategory = allCategories.length > 0 ? allCategories[0] : (parsedCmd.primaryCategory || "General");

    const shortcodeMatch = url.match(/(?:reel|p|audio|stories)\/([A-Za-z0-9_-]+)/);
    const shortcode = clientShortcode || (shortcodeMatch ? shortcodeMatch[1] : `sc_${Date.now()}`);
    
    const detectedMediaType = bodyMediaType || media_type || (url.includes("/audio/") ? "audio" : url.includes("/stories/") ? "story" : url.includes("/p/") ? "post" : "reel");

    const effectiveCreatorHandle = creator_handle || creator || "";
    const effectiveThumbnail = thumbnail_url || thumbnailUrl || "";
    const effectiveCaption = bodyCaption || "";

    // Only fetch external reel-info if critical fields (creator or thumbnail) are missing
    let enrichedData: any = {};
    if (!effectiveCreatorHandle || !effectiveThumbnail) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://reeldash-nine.vercel.app";
        const infoRes = await fetch(`${baseUrl}/api/reel-info`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        if (infoRes.ok) {
          enrichedData = await infoRes.json();
        }
      } catch (e) {
        console.warn("[POST /api/reels info fetch notice]:", e);
      }
    }

    const finalCreatorHandle = effectiveCreatorHandle || enrichedData.creatorUsername || "creator";
    const finalCreatorName = creator_name || creatorFullName || enrichedData.creatorFullName || finalCreatorHandle;
    const finalCreatorAvatar = creator_avatar || creatorAvatar || enrichedData.creatorAvatar || `/api/proxy-image?username=${encodeURIComponent(finalCreatorHandle)}`;
    const finalThumbnail = effectiveThumbnail || enrichedData.thumbnailUrl || (shortcode ? `/api/proxy-image?shortcode=${shortcode}` : "");
    const finalCaption = effectiveCaption || enrichedData.caption || `Instagram ${detectedMediaType.toUpperCase()}`;
    const finalCategory = allCategories.length > 0 ? allCategories[0] : (enrichedData.category || primaryCategory);
    if (allCategories.length === 0) allCategories = [finalCategory];

    // Check if this post is a carousel
    const finalCarouselImages: string[] | null =
      (Array.isArray(carouselImages) && carouselImages.length > 0)
        ? carouselImages
        : (Array.isArray(carousel_images) && carousel_images.length > 0)
        ? carousel_images
        : (Array.isArray(enrichedData.carouselImages) && enrichedData.carouselImages.length > 0)
        ? enrichedData.carouselImages
        : null;

    const isCarouselPost: boolean =
      !!isCarousel ||
      !!is_carousel ||
      (typeof bodyDuration === "string" && bodyDuration.toLowerCase().includes("carousel")) ||
      (Array.isArray(finalCarouselImages) && finalCarouselImages.length > 1) ||
      false;

    // Extract hashtags
    const extractedHashtags: string[] = [];
    const hashMatches = finalCaption.match(/#([a-zA-Z0-9_\u0080-\uFFFF]+)/g);
    if (hashMatches) {
      hashMatches.forEach((h: string) => {
        const lower = h.toLowerCase();
        if (!extractedHashtags.includes(lower)) extractedHashtags.push(lower);
      });
    }
    if (Array.isArray(enrichedData.hashtags)) {
      enrichedData.hashtags.forEach((h: string) => {
        const tag = h.startsWith("#") ? h.toLowerCase() : `#${h.toLowerCase()}`;
        if (!extractedHashtags.includes(tag)) extractedHashtags.push(tag);
      });
    }

    const reelPayload = {
      user_id: userId,
      shortcode,
      url,
      thumbnail_url: finalThumbnail,
      video_url: isCarouselPost ? "" : (video_url || videoUrl || enrichedData.mediaUrl || ""),
      caption: finalCaption,
      creator_handle: finalCreatorHandle,
      creator_name: finalCreatorName,
      creator_avatar: finalCreatorAvatar,
      media_type: isCarouselPost ? "post" : detectedMediaType,
      duration: bodyDuration || enrichedData.duration || (detectedMediaType === "audio" ? "" : isCarouselPost ? `Carousel (${finalCarouselImages?.length || ""})` : "0:30"),
      likes_count: likes_count || bodyLikes || enrichedData.likes || "",
      plays_count: plays_count || enrichedData.views || "",
      category: finalCategory,
      tags: extractedHashtags,
      note: parsedCmd.note || note || notes || "",
      is_favorite: !!isFavorite,
      ai_summary: enrichedData.aiSummary || "",
      ai_topics: Array.isArray(enrichedData.aiTopics) ? enrichedData.aiTopics : [],
      is_carousel: isCarouselPost,
      carousel_images: finalCarouselImages,
      source: bodySource || "manual",
      instagram_username: instagram_username || null,
      instagram_account_id: instagram_account_id || null,
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
        categories: allCategories.length > 0 ? allCategories : [finalCategory],
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
