import { NextRequest, NextResponse } from "next/server";
import { processInstagramMessage } from "@/lib/instagramBot";

export const dynamic = "force-dynamic";

/**
 * Bot simulation endpoint — restricted to development environments only.
 * Blocks access in production to prevent unauthorized bot command execution.
 */
export async function POST(req: NextRequest) {
  // Block in production — this endpoint is for local testing only
  const isDev =
    process.env.NODE_ENV === "development" ||
    req.headers.get("host")?.startsWith("localhost");

  if (!isDev) {
    return NextResponse.json(
      { error: "This endpoint is disabled in production" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      username = "new_user",
      senderIgId = `ig_${Date.now().toString(36)}`,
      message = "https://www.instagram.com/reel/DbZkDwZsHgd/",
      isFollowing = false,
      postbackPayload,
    } = body;

    const result = await processInstagramMessage(
      senderIgId,
      message,
      [],
      isFollowing,
      username,
      postbackPayload
    );

    return NextResponse.json({
      success: true,
      senderIgId,
      username,
      isFollowing: result.isFollowing,
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Simulation failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "This endpoint is disabled in production" },
    { status: 403 }
  );
}
