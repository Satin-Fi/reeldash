import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { formatCategoryDisplayName } from "@/lib/parseCategory";

export const dynamic = "force-dynamic";

/**
 * GET /api/categories
 * Returns all user-scoped categories with their associated reel counts.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ categories: [] });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ categories: [] });
    }

    // 1. Fetch all user categories
    const { data: categories, error: catError } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (catError) {
      console.warn("[API Categories GET error]:", catError);
      return NextResponse.json({ categories: [] });
    }

    // 2. Fetch reel counts for each category
    const { data: counts, error: countError } = await supabase
      .from("reel_categories")
      .select("category_id");

    const countMap: Record<string, number> = {};
    if (counts) {
      counts.forEach((row: { category_id: string }) => {
        countMap[row.category_id] = (countMap[row.category_id] || 0) + 1;
      });
    }

    const enriched = (categories || []).map((cat) => ({
      id: cat.id,
      userId: cat.user_id,
      name: cat.name,
      normalizedName: cat.normalized_name,
      slug: cat.slug,
      icon: cat.icon || "📁",
      description: cat.description || "",
      source: cat.source || "user",
      reelCount: countMap[cat.id] || 0,
      createdAt: cat.created_at,
      updatedAt: cat.updated_at,
    }));

    return NextResponse.json({ categories: enriched });
  } catch (err: any) {
    console.error("[API Categories GET uncaught]:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch categories" }, { status: 500 });
  }
}

/**
 * POST /api/categories
 * Creates a new user category (or returns existing if duplicate normalized name).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, icon, description, source } = body;

    if (!userId || !name || !name.trim()) {
      return NextResponse.json({ error: "userId and name are required" }, { status: 400 });
    }

    const formattedName = formatCategoryDisplayName(name.trim());
    const normalizedName = formattedName.toLowerCase();
    const slug = normalizedName.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({
        category: {
          id: `local_${Date.now()}`,
          userId,
          name: formattedName,
          normalizedName,
          slug,
          icon: icon || "📁",
          description: description || "",
          source: source || "user",
          reelCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    const { data: newCat, error } = await supabase
      .from("categories")
      .upsert(
        {
          user_id: userId,
          name: formattedName,
          normalized_name: normalizedName,
          slug,
          icon: icon || "📁",
          description: description || null,
          source: source || "user",
        },
        { onConflict: "user_id,normalized_name" }
      )
      .select()
      .single();

    if (error) {
      console.warn("[API Categories POST error]:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      category: {
        id: newCat.id,
        userId: newCat.user_id,
        name: newCat.name,
        normalizedName: newCat.normalized_name,
        slug: newCat.slug,
        icon: newCat.icon || "📁",
        description: newCat.description || "",
        source: newCat.source || "user",
        reelCount: 0,
        createdAt: newCat.created_at,
        updatedAt: newCat.updated_at,
      },
    });
  } catch (err: any) {
    console.error("[API Categories POST uncaught]:", err);
    return NextResponse.json({ error: err.message || "Failed to create category" }, { status: 500 });
  }
}

/**
 * PATCH /api/categories
 * Updates or renames a category.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, icon, description } = body;

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (name && name.trim()) {
      const formattedName = formatCategoryDisplayName(name.trim());
      updates.name = formattedName;
      updates.normalized_name = formattedName.toLowerCase();
      updates.slug = formattedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }
    if (icon !== undefined) updates.icon = icon;
    if (description !== undefined) updates.description = description;

    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ category: data });
    }

    return NextResponse.json({ success: true, updates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update category" }, { status: 500 });
  }
}

/**
 * DELETE /api/categories
 * Deletes a category and its associations (does NOT delete reels).
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete category" }, { status: 500 });
  }
}
