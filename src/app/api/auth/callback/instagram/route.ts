import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorReason = searchParams.get("error_reason");
  const errorDescription = searchParams.get("error_description");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://reeldash-nine.vercel.app";

  if (error) {
    console.warn("[Instagram OAuth] Error:", error, errorReason, errorDescription);
    return NextResponse.redirect(`${baseUrl}/settings?error=${encodeURIComponent(errorDescription || error)}`);
  }

  if (code) {
    console.log("[Instagram OAuth] Received auth code (length:", code.length, ")");
    // Redirect without exposing the OAuth code in the URL.
    // The code was a one-time-use token from Meta that has already been
    // delivered to this server endpoint. Passing it to the client via
    // query params leaked it into browser history, Referer headers, and logs.
    return NextResponse.redirect(`${baseUrl}/settings?connected=true`);
  }

  return NextResponse.redirect(`${baseUrl}/settings`);
}
