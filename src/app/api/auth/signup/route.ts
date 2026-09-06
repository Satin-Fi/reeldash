import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 }
      );
    }

    const { email, password, name } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = typeof name === "string" && name.trim()
      ? name.trim()
      : cleanEmail.split("@")[0];

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database authentication is not configured on this server." },
        { status: 500 }
      );
    }

    // Create user with email auto-confirmed so they can immediately sign in
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: password.trim(),
      email_confirm: true,
      user_metadata: {
        name: cleanName,
        full_name: cleanName,
      },
    });

    if (error) {
      const isDuplicate =
        error.message?.toLowerCase().includes("already registered") ||
        error.message?.toLowerCase().includes("already been registered") ||
        error.status === 422;

      if (isDuplicate) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in instead." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: error.message || "Failed to create account." },
        { status: 400 }
      );
    }

    if (!data?.user) {
      return NextResponse.json(
        { error: "Failed to generate user record." },
        { status: 500 }
      );
    }

    // Ensure profile row exists
    try {
      await supabaseAdmin.from("profiles").upsert(
        {
          id: data.user.id,
          name: cleanName,
        },
        { onConflict: "id" }
      );
    } catch {
      // Handled by trigger if present
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: cleanName,
      },
      message: "Account created successfully.",
    });
  } catch (err: any) {
    console.error("[API Auth Signup] Unhandled error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
