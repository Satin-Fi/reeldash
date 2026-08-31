import { NextRequest, NextResponse } from "next/server";
import { processInstagramMessage } from "@/lib/instagramBot";

export const dynamic = "force-dynamic";

const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || "reeldash_webhook_2026";

/**
 * 1. GET: Meta Webhook Verification Challenge
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[Instagram Webhook] Challenge Verified Successfully ✓");
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

/**
 * 2. POST: Receive Instagram DM Events from Meta Messenger API
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entries = body?.entry ?? [];

    const results = [];

    for (const entry of entries) {
      const messaging = entry?.messaging ?? [];

      // Group messaging events by sender so reel attachment and slash command in the same payload merge into 1 call
      const senderEvents = new Map<string, { texts: string[]; attachments: any[]; postbackPayload?: string }>();

      for (const event of messaging) {
        if (!event?.message && !event?.postback) continue;
        if (event.message?.is_echo) continue;

        const senderIgId: string = event.sender?.id;
        if (!senderIgId) continue;

        const text = event.message?.text ?? event.postback?.title ?? "";
        const postbackPayload = event.postback?.payload;
        const attachments = event.message?.attachments ?? [];

        const existing = senderEvents.get(senderIgId) || { texts: [], attachments: [], postbackPayload: undefined };
        if (text) existing.texts.push(text);
        if (attachments.length > 0) existing.attachments.push(...attachments);
        if (postbackPayload) existing.postbackPayload = postbackPayload;
        senderEvents.set(senderIgId, existing);
      }

      for (const [senderIgId, data] of senderEvents) {
        const combinedText = data.texts.join(" ").trim();
        const processed = await processInstagramMessage(
          senderIgId,
          combinedText,
          data.attachments,
          undefined,
          undefined,
          data.postbackPayload
        );
        results.push(processed);
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (error: any) {
    console.error("[Instagram Webhook] Error processing event:", error);
    return NextResponse.json({ error: error.message || "Failed to process webhook" }, { status: 500 });
  }
}
