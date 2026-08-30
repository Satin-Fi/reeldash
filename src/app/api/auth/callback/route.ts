import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          return NextResponse.redirect(`${origin}${next}`);
        }
        console.error("[Auth Callback] Code exchange error:", error);
      }
    } catch (e) {
      console.error("[Auth Callback] Exception during code exchange:", e);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
