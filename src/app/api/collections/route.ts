import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/collections
 * Returns user collections along with associated reel IDs and counts.
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const userId = authUser?.id || searchParams.get("userId") || searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ collections: [] });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ collections: [] });
    }

    // 1. Fetch collections for user
    const { data: cols, error: colError } = await supabase
      .from("collections")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (colError) {
      console.warn("[API Collections GET error]:", colError);
      return NextResponse.json({ collections: [] });
    }

    if (!cols || cols.length === 0) {
      return NextResponse.json({ collections: [] });
    }

    const colIds = cols.map((c) => c.id);

    // 2. Fetch associated reel IDs
    const { data: colReels, error: reelError } = await supabase
      .from("collection_reels")
      .select("collection_id, reel_id")
      .in("collection_id", colIds);

    if (reelError) {
      console.warn("[API Collection Reels GET error]:", reelError);
    }

    const reelMap: Record<string, string[]> = {};
    (colReels || []).forEach((row: { collection_id: string; reel_id: string }) => {
      if (!reelMap[row.collection_id]) {
        reelMap[row.collection_id] = [];
      }
      reelMap[row.collection_id].push(row.reel_id);
    });

    const enriched = cols.map((col) => {
      const reelIds = reelMap[col.id] || [];
      const updatedDate = col.updated_at ? new Date(col.updated_at) : new Date();
      const timeStr = updatedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      return {
        id: col.id,
        name: col.name,
        description: col.description || "",
        icon: col.icon || "📁",
        reelIds,
        reelCount: reelIds.length,
        updatedAt: timeStr,
        createdAt: col.created_at,
      };
    });

    return NextResponse.json({ collections: enriched });
  } catch (err: any) {
    console.error("[API Collections GET uncaught]:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch collections" }, { status: 500 });
  }
}

/**
 * POST /api/collections
 * Creates a new collection for the authenticated user.
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const body = await req.json();
    const { name, description, icon } = body;
    const userId = authUser?.id || body.userId;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Collection name is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      const mockCol = {
        id: "col-" + Math.random().toString(36).substring(2, 9),
        name: name.trim(),
        description: description?.trim() || "",
        icon: icon || "📁",
        reelIds: [],
        reelCount: 0,
        updatedAt: "Just now",
        createdAt: new Date().toISOString(),
      };
      return NextResponse.json({ collection: mockCol });
    }

    const { data: newCol, error } = await supabase
      .from("collections")
      .insert({
        user_id: userId,
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon || "📁",
      })
      .select()
      .single();

    if (error || !newCol) {
      console.error("[API Collections POST error]:", error);
      return NextResponse.json({ error: error?.message || "Failed to create collection" }, { status: 500 });
    }

    return NextResponse.json({
      collection: {
        id: newCol.id,
        name: newCol.name,
        description: newCol.description || "",
        icon: newCol.icon || "📁",
        reelIds: [],
        reelCount: 0,
        updatedAt: "Just now",
        createdAt: newCol.created_at,
      },
    });
  } catch (err: any) {
    console.error("[API Collections POST uncaught]:", err);
    return NextResponse.json({ error: err.message || "Failed to create collection" }, { status: 500 });
  }
}

/**
 * PATCH /api/collections
 * Updates a collection name and/or description.
 */
export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const body = await req.json();
    const { id, name, description, icon } = body;
    const userId = authUser?.id || body.userId;

    if (!id) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ success: true });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (icon !== undefined) updates.icon = icon;

    let query = supabase.from("collections").update(updates).eq("id", id);
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query.select().single();
    if (error) {
      console.error("[API Collections PATCH error]:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, collection: data });
  } catch (err: any) {
    console.error("[API Collections PATCH uncaught]:", err);
    return NextResponse.json({ error: err.message || "Failed to update collection" }, { status: 500 });
  }
}

/**
 * DELETE /api/collections
 * Deletes a collection and its associations.
 */
export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");
    let userId = authUser?.id || searchParams.get("userId");

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
        if (body.userId && !userId) userId = body.userId;
      } catch {
        // Body was empty or already read
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ success: true });
    }

    // 1. Delete associated collection reels
    await supabase.from("collection_reels").delete().eq("collection_id", id);

    // 2. Delete the collection itself
    let deleteQuery = supabase.from("collections").delete().eq("id", id);
    if (userId) {
      deleteQuery = deleteQuery.eq("user_id", userId);
    }

    const { error } = await deleteQuery;
    if (error) {
      console.error("[API Collections DELETE error]:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[API Collections DELETE uncaught]:", err);
    return NextResponse.json({ error: err.message || "Failed to delete collection" }, { status: 500 });
  }
}

/**
 * PUT /api/collections
 * Adds or removes a reel to/from a collection.
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { collectionId, reelId, action } = body;

    if (!collectionId || !reelId || !action) {
      return NextResponse.json(
        { error: "collectionId, reelId, and action ('add' | 'remove') are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ success: true });
    }

    if (action === "add") {
      // Check if reelId is a valid UUID, otherwise check reels table
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reelId);
      if (isUuid) {
        await supabase
          .from("collection_reels")
          .upsert({ collection_id: collectionId, reel_id: reelId }, { onConflict: "collection_id,reel_id" });
      }
    } else if (action === "remove") {
      await supabase
        .from("collection_reels")
        .delete()
        .eq("collection_id", collectionId)
        .eq("reel_id", reelId);
    }

    // Touch collection updated_at
    await supabase
      .from("collections")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", collectionId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[API Collections PUT uncaught]:", err);
    return NextResponse.json({ error: err.message || "Failed to update collection reel" }, { status: 500 });
  }
}
