import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://knlcmaoazqadlwrqypbo.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubGNtYW9henFhZGx3cnF5cGJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3OTQ0MTQsImV4cCI6MjEwMjM3MDQxNH0.D23IgSG7NcTtaiRiXQPLMlLlym4Lxvv-wnGbrzKmcx4";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Determine host safely to prevent redirecting to localhost in Vercel/serverless environments
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const host = forwardedHost || request.headers.get("host");
  const baseUrl = host
    ? `${forwardedProto}://${host}`
    : (process.env.NEXT_PUBLIC_APP_URL || "https://reeldash-nine.vercel.app");

  // Construct target redirect URL safely
  let safeNext = next;
  if (!safeNext.startsWith("/") && !safeNext.startsWith("http")) {
    safeNext = `/${safeNext}`;
  }

  let redirectTarget: string;
  try {
    const targetUrl = safeNext.startsWith("http")
      ? new URL(safeNext)
      : new URL(safeNext, baseUrl);

    // Prevent open redirect to arbitrary external domains
    const baseOrigin = new URL(baseUrl).origin;
    if (targetUrl.origin === baseOrigin) {
      redirectTarget = targetUrl.toString();
    } else {
      redirectTarget = new URL("/dashboard", baseUrl).toString();
    }
  } catch {
    redirectTarget = new URL("/dashboard", baseUrl).toString();
  }

  const response = NextResponse.redirect(redirectTarget);

  if (code) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("[Auth Callback] Code exchange error:", error.message);
      }
    } catch (e: any) {
      console.error("[Auth Callback] Exception during code exchange:", e?.message || e);
    }
  }

  return response;
}
