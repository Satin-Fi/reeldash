import { NextRequest, NextResponse } from "next/server";
import { resolveRealInstagramAvatar } from "@/lib/instagramAvatar";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const username = params.username?.replace(/^@/, "").trim().toLowerCase();
  if (!username) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  const avatarUrl = await resolveRealInstagramAvatar(username);
  if (avatarUrl) {
    return NextResponse.json({
      success: true,
      username,
      avatarUrl: `/api/proxy-image?url=${encodeURIComponent(avatarUrl)}`,
      rawCdnUrl: avatarUrl,
    });
  }

  return NextResponse.json({
    success: false,
    username,
    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6366F1&color=fff&size=200&bold=true`,
  });
}
