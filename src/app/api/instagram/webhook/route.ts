import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || "reeldash_webhook_2026";
const IG_PAGE_ACCESS_TOKEN = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;

// ─── GET: Meta webhook verification challenge ─────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[Webhook] Verified ✓");
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// ─── POST: Receive DM events from Meta ───────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Only process messaging events
  const entries = body?.entry ?? [];
  for (const entry of entries) {
    const messaging = entry?.messaging ?? [];
    for (const event of messaging) {
      if (!event?.message) continue;

      const senderIgId: string = event.sender?.id;
      const messageText: string = event.message?.text ?? "";

      // Skip echo messages (our own replies)
      if (event.message?.is_echo) continue;

      // Extract Instagram Reel/post URL from message
      const shortcode = extractShortcode(messageText);
      if (!shortcode) {
        // If no reel link, send friendly help message
        await sendDMReply(senderIgId, "👋 Send me an Instagram Reel link and I'll save it to your ReelDash library! Visit reeldash-nine.vercel.app to connect your account.");
        continue;
      }

      // Log the event first
      const supabase = getSupabaseAdmin();
      const { data: dmEvent } = await supabase
        .from("ig_dm_events")
        .insert({
          ig_sender_id: senderIgId,
          message_text: messageText,
          shortcode,
          status: "pending",
        })
        .select()
        .single();

      // Find which Reeldash user has this Instagram sender ID linked
      // Users link by going to Settings → enter their Instagram username
      // Then we resolve their IG username → IG user ID via IG API
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("ig_sender_id", senderIgId)
        .maybeSingle();

      if (!profile) {
        // No account linked — send setup instructions
        await sendDMReply(
          senderIgId,
          `✅ I got your Reel! To save it to your library, connect your Instagram account at:\n\n👉 reeldash-nine.vercel.app/integrations/instagram\n\nThen DM me again and it'll be saved instantly!`
        );
        // Update dm event status
        if (dmEvent?.id) {
          await supabase.from("ig_dm_events").update({ status: "no_match" }).eq("id", dmEvent.id);
        }
        continue;
      }

      // Fetch reel metadata from our existing reel-info API
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://reeldash-nine.vercel.app";
        const reelInfoRes = await fetch(`${baseUrl}/api/reel-info`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: `https://www.instagram.com/reel/${shortcode}/` }),
        });

        if (!reelInfoRes.ok) throw new Error(`reel-info returned ${reelInfoRes.status}`);
        const reelData = await reelInfoRes.json();

        // Save reel to Supabase
        const { data: savedReel, error } = await supabase
          .from("reels")
          .upsert(
            {
              user_id:        profile.id,
              shortcode,
              url:            reelData.url || `https://www.instagram.com/reel/${shortcode}/`,
              thumbnail_url:  reelData.thumbnailUrl,
              caption:        reelData.caption,
              creator_handle: reelData.creatorHandle,
              creator_name:   reelData.creatorName,
              creator_avatar: reelData.creatorAvatar,
              media_type:     reelData.mediaType || "reel",
              duration:       reelData.duration,
              likes_count:    reelData.likesCount,
              category:       reelData.category,
              tags:           reelData.tags || [],
              ai_summary:     reelData.aiSummary,
              source:         "dm",
            },
            { onConflict: "user_id,shortcode", ignoreDuplicates: false }
          )
          .select()
          .single();

        if (error) throw error;

        // Update dm event record
        if (dmEvent?.id) {
          await supabase.from("ig_dm_events").update({
            status: "saved",
            reel_id: savedReel?.id,
            matched_user_id: profile.id,
          }).eq("id", dmEvent.id);
        }

        // Send success confirmation DM
        await sendDMReply(
          senderIgId,
          `✅ Reel saved to your ReelDash library!\n\n📌 "${reelData.caption?.slice(0, 60) || shortcode}..."\n\nView it at: reeldash-nine.vercel.app/dashboard`
        );
      } catch (err) {
        console.error("[Webhook] Failed to save reel:", err);
        if (dmEvent?.id) {
          await supabase.from("ig_dm_events").update({
            status: "error",
            error_message: String(err),
          }).eq("id", dmEvent.id);
        }
        await sendDMReply(senderIgId, "❌ Oops! I couldn't fetch that Reel. Please check the link and try again.");
      }
    }
  }

  return NextResponse.json({ ok: true });
}

// ─── Helpers ─────────────────────────────────────────────────────────

function extractShortcode(text: string): string | null {
  // Matches: /reel/ABC123, /p/ABC123, reels?id=ABC123, instagram.com/reel/ABC123
  const patterns = [
    /instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]{9,13})/i,
    /instagram\.com\/reels\/([A-Za-z0-9_-]{9,13})/i,
    /\/(?:reel|p)\/([A-Za-z0-9_-]{9,13})/i,
  ];
  for (const pattern of patterns) {
    const m = text.match(pattern);
    if (m?.[1]) return m[1];
  }
  return null;
}

async function sendDMReply(recipientIgId: string, message: string): Promise<void> {
  if (!IG_PAGE_ACCESS_TOKEN) {
    console.warn("[Webhook] INSTAGRAM_PAGE_ACCESS_TOKEN not set — skipping DM reply");
    return;
  }
  try {
    await fetch(`https://graph.facebook.com/v20.0/me/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${IG_PAGE_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        recipient: { id: recipientIgId },
        message:   { text: message },
        messaging_type: "RESPONSE",
      }),
    });
  } catch (e) {
    console.error("[Webhook] DM reply failed:", e);
  }
}
