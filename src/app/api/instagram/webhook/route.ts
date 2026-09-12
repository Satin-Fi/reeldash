import { NextRequest, NextResponse } from "next/server";
import { processInstagramMessage } from "@/lib/instagramBot";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createHmac, timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || "reeldash_webhook_2026";
const APP_SECRET = process.env.META_APP_SECRET || "";

/**
 * Verify the X-Hub-Signature-256 header sent by Meta on every webhook POST.
 * Returns true only if the HMAC-SHA256 of the raw body matches the header.
 */
function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!APP_SECRET) {
    // If META_APP_SECRET isn't configured, log a warning but allow (graceful degradation)
    console.warn("[Instagram Webhook] META_APP_SECRET not set — skipping signature verification");
    return true;
  }
  if (!signatureHeader) return false;

  const [algo, signature] = signatureHeader.split("=");
  if (algo !== "sha256" || !signature) return false;

  const expectedSignature = createHmac("sha256", APP_SECRET)
    .update(rawBody, "utf-8")
    .digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch {
    return false;
  }
}

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
 *
 * Now includes:
 * - HMAC-SHA256 signature verification via X-Hub-Signature-256
 * - Webhook idempotency via processed_webhook_events table
 * - Message ID extraction from Meta's message.mid field
 * - Per-event deduplication before processing
 */
export async function POST(req: NextRequest) {
  try {
    // Read raw body for signature verification, then parse as JSON
    const rawBody = await req.text();

    // Verify Meta's webhook signature
    const signatureHeader = req.headers.get("x-hub-signature-256");
    if (!verifyWebhookSignature(rawBody, signatureHeader)) {
      console.warn("[Instagram Webhook] Invalid signature — rejecting request");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const entries = body?.entry ?? [];

    const results = [];
    const supabase = getSupabaseAdmin();

    for (const entry of entries) {
      const messaging = entry?.messaging ?? [];

      // Group messaging events by sender so reel attachment and slash command
      // in the same payload merge into 1 call
      const senderEvents = new Map<
        string,
        {
          texts: string[];
          attachments: any[];
          postbackPayload?: string;
          messageIds: string[];
        }
      >();

      for (const event of messaging) {
        if (!event?.message && !event?.postback) continue;
        if (event.message?.is_echo) continue;

        const senderIgId: string = event.sender?.id;
        if (!senderIgId) continue;

        // Build a stable idempotency key from Meta's message ID
        const messageId =
          event.message?.mid ||
          `${senderIgId}_${event.timestamp || Date.now()}`;

        // Deduplicate: check if this event was already processed or is currently being processed
        if (supabase) {
          try {
            const { data: existing } = await supabase
              .from("processed_webhook_events")
              .select("id, result_status")
              .eq("event_id", messageId)
              .maybeSingle();

            if (existing) {
              console.log(
                `[Instagram Webhook] Skipping duplicate event (${existing.result_status}): ${messageId}`
              );
              continue;
            }

            // Immediately mark event as processing to block concurrent retries by Meta
            await supabase
              .from("processed_webhook_events")
              .insert({
                event_id: messageId,
                sender_ig_id: senderIgId,
                result_status: "processing",
              });
          } catch (checkErr) {
            // If unique constraint violation or error, check if duplicate
            console.warn(
              "[Instagram Webhook] Idempotency reservation notice:",
              checkErr
            );
          }
        }

        const text = event.message?.text ?? event.postback?.title ?? "";
        const postbackPayload =
          event.postback?.payload ?? event.message?.quick_reply?.payload;
        const attachments = [...(event.message?.attachments ?? [])];

        const extraLinks: string[] = [];
        if (event.message?.attachment) {
          attachments.push(event.message.attachment);
        }
        if (event.message?.share) {
          attachments.push({ type: "share", payload: event.message.share });
          if (event.message.share.link) {
            extraLinks.push(event.message.share.link);
          }
          if (event.message.share.url) {
            extraLinks.push(event.message.share.url);
          }
        }
        if (event.message?.shares) {
          const shares = Array.isArray(event.message.shares)
            ? event.message.shares
            : [event.message.shares];
          for (const s of shares) {
            attachments.push({ type: "share", payload: s });
            if (s?.link) extraLinks.push(s.link);
            if (s?.url) extraLinks.push(s.url);
          }
        }
        if (event.message?.story_share) {
          attachments.push({ type: "story_share", payload: event.message.story_share });
          if (event.message.story_share.link) {
            extraLinks.push(event.message.story_share.link);
          }
          if (event.message.story_share.url) {
            extraLinks.push(event.message.story_share.url);
          }
        }

        console.log(
          `[Instagram Webhook] Event from ${senderIgId}: text="${text}", attachments=${attachments.length}, extraLinks=${extraLinks.length}`
        );

        const existing =
          senderEvents.get(senderIgId) ||
          ({
            texts: [],
            attachments: [],
            postbackPayload: undefined,
            messageIds: [],
          } as any);
        if (text) existing.texts.push(text);
        if (extraLinks.length > 0) existing.texts.push(...extraLinks);
        if (attachments.length > 0) existing.attachments.push(...attachments);
        if (postbackPayload) existing.postbackPayload = postbackPayload;
        existing.messageIds.push(messageId);
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

        // Record all message IDs as processed
        if (supabase && data.messageIds.length > 0) {
          try {
            const rows = data.messageIds.map((mid: string) => ({
              event_id: mid,
              sender_ig_id: senderIgId,
              result_status: processed.status,
            }));
            await supabase
              .from("processed_webhook_events")
              .upsert(rows, { onConflict: "event_id" });
          } catch (recordErr) {
            console.warn(
              "[Instagram Webhook] Failed to record processed events:",
              recordErr
            );
          }
        }
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (error: any) {
    console.error("[Instagram Webhook] Error processing event:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process webhook" },
      { status: 500 }
    );
  }
}
