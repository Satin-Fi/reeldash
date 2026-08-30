import { NextRequest, NextResponse } from "next/server";
import { processInstagramMessage, igProfileStore, igSavedReelsStore } from "@/lib/instagramBot";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      username = "new_user",
      senderIgId = `ig_${Date.now().toString(36)}`,
      message = "https://www.instagram.com/reel/DbZkDwZsHgd/",
      isFollowing = false,
    } = body;

    const result = await processInstagramMessage(
      senderIgId,
      message,
      [],
      isFollowing,
      username
    );

    return NextResponse.json({
      success: true,
      senderIgId,
      username,
      isFollowing,
      result,
      allProfilesCount: igProfileStore.size,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Simulation failed" }, { status: 500 });
  }
}

export async function GET() {
  const profiles = Array.from(igProfileStore.values());
  return NextResponse.json({
    activeProfilesCount: profiles.length,
    profiles,
  });
}
