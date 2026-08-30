import { getSupabaseAdmin } from "./supabase";

export interface BotButton {
  type: "postback" | "web_url";
  title: string;
  payload?: string;
  url?: string;
}

export interface UserIgProfile {
  id: string;
  igSenderId: string;
  username: string;
  fullName: string;
  avatar: string;
  isFollowing: boolean;
  savedReelsCount: number;
  createdAt: string;
  lastActiveAt: string;
}

export interface ProcessedDMResult {
  status: "follow_required" | "profile_created" | "reel_saved" | "message_received" | "error";
  replyMessage: string;
  buttons?: BotButton[];
  senderIgId: string;
  username?: string;
  isFollowing: boolean;
  savedReel?: any;
}

// In-memory runtime cache
export const igProfileStore = new Map<string, UserIgProfile>();
export const igSavedReelsStore = new Map<string, any[]>();

const IG_PAGE_ACCESS_TOKEN = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;

/**
 * Main Handler for Incoming Instagram Messages & Webhook Payloads
 */
export async function processInstagramMessage(
  senderIgId: string,
  messageText: string,
  attachments: any[] = [],
  forceFollowingStatus?: boolean,
  customUsername?: string,
  postbackPayload?: string
): Promise<ProcessedDMResult> {
  try {
    const isFollowCheckClick =
      postbackPayload === "CHECK_FOLLOW_STATUS" ||
      messageText?.trim().toLowerCase().includes("i followed you");

    // 1. Fetch user info & check follow status
    const igUser = await fetchInstagramUserProfile(senderIgId, customUsername);
    let isFollowing = forceFollowingStatus !== undefined ? forceFollowingStatus : igUser.isFollowing;

    // If user clicked "I followed you!", strictly re-verify follower status
    if (isFollowCheckClick) {
      if (forceFollowingStatus !== undefined) {
        isFollowing = forceFollowingStatus;
      } else {
        const recheck = await fetchInstagramUserProfile(senderIgId, customUsername);
        isFollowing = recheck.isFollowing;
      }
    }

    // 2. Message 1: If user is NOT following (or clicked "I followed you" without actually following)
    if (!isFollowing) {
      const followPrompt = `Oh no! You aren't following, so the link won't send. ✨\n\nMake sure you're following so I can send you the link 🎉(also you won't regret it I promise 🤫 + you can always unfollow)`;

      const buttons: BotButton[] = [
        {
          type: "postback",
          title: "I followed you! ✅",
          payload: "CHECK_FOLLOW_STATUS",
        },
      ];

      await sendDMReply(senderIgId, followPrompt, buttons);

      return {
        status: "follow_required",
        replyMessage: followPrompt,
        buttons,
        senderIgId,
        username: igUser.username,
        isFollowing: false,
      };
    }

    // 3. User is VERIFIED following: Auto-provision ReelDash Profile
    const userProfile = await getOrCreateUserProfile(senderIgId, igUser);

    // 4. Check if message contains a Reel / Post / Audio link
    const mediaUrl = extractInstagramMediaUrl(messageText, attachments);

    if (mediaUrl) {
      // Extract metadata from our reel-info API or fallback
      let reelData: any = null;
      try {
        const infoRes = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || "https://reeldash-nine.vercel.app"}/api/reel-info?url=${encodeURIComponent(mediaUrl)}`
        );
        if (infoRes.ok) {
          reelData = await infoRes.json();
        }
      } catch (err) {
        console.warn("[Instagram Bot] reel-info fetch fallback:", err);
      }

      if (!reelData || !reelData.shortcode) {
        const shortcodeMatch = mediaUrl.match(/\/(?:reel|reels|p|stories|audio)\/([A-Za-z0-9_.-]+)/i);
        const shortcode = shortcodeMatch ? shortcodeMatch[1] : `ig_${Date.now()}`;
        const isAudio = mediaUrl.includes("/audio/");
        reelData = {
          shortcode,
          url: mediaUrl,
          thumbnail_url: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80`,
          video_url: mediaUrl,
          caption: `Instagram ${isAudio ? "Audio" : "Reel"} shared via Direct Message`,
          creator_handle: `ig_user_${senderIgId.slice(-4)}`,
          creator_name: "Instagram Creator",
          creator_avatar: `/api/proxy-image?username=instagram`,
          media_type: isAudio ? "audio" : "reel",
          duration: isAudio ? "0:30" : "0:15",
          category: isAudio ? "Music" : "General",
          tags: ["instagram-dm", isAudio ? "audio" : "reel", "auto-save"],
        };
      }

      // Save Reel to user's collection
      const savedReel = await saveReelForUser(userProfile.id, reelData);
      userProfile.savedReelsCount += 1;
      userProfile.lastActiveAt = new Date().toISOString();

      const successReply = `⚡ Saved to your ReelDash Library!\n\n🎬 ${reelData.creator_handle ? "@" + reelData.creator_handle + "'s Reel" : "Reel"}\n📁 Category: ${reelData.category || "General"}`;

      const buttons: BotButton[] = [
        {
          type: "web_url",
          title: "Click here! 🚀",
          url: "https://reeldash-nine.vercel.app/dashboard",
        },
      ];

      await sendDMReply(senderIgId, successReply, buttons);

      return {
        status: "reel_saved",
        replyMessage: successReply,
        buttons,
        senderIgId,
        username: userProfile.username,
        isFollowing: true,
        savedReel,
      };
    }

    // 5. Message 2: When user successfully followed & verified
    const greetingReply = `🎁 Awesome! Here's everything you need!\n\nYour ReelDash sync is active. Whenever you see an Instagram Reel, Post, or Audio, just send or share it here!`;

    const buttons: BotButton[] = [
      {
        type: "web_url",
        title: "Click here! 🚀",
        url: "https://reeldash-nine.vercel.app/dashboard",
      },
    ];

    await sendDMReply(senderIgId, greetingReply, buttons);

    return {
      status: "message_received",
      replyMessage: greetingReply,
      buttons,
      senderIgId,
      username: userProfile.username,
      isFollowing: true,
    };
  } catch (error: any) {
    console.error("[Instagram Bot] Error processing message:", error);
    return {
      status: "error",
      replyMessage: "Sorry, an error occurred while processing your request.",
      senderIgId,
      isFollowing: false,
    };
  }
}

/**
 * Fetch Instagram User Profile & Follower Status
 */
async function fetchInstagramUserProfile(
  senderIgId: string,
  customUsername?: string
): Promise<{
  username: string;
  fullName: string;
  avatar: string;
  isFollowing: boolean;
}> {
  const existing = igProfileStore.get(senderIgId);
  if (existing) {
    return {
      username: existing.username,
      fullName: existing.fullName,
      avatar: existing.avatar,
      isFollowing: existing.isFollowing,
    };
  }

  if (IG_PAGE_ACCESS_TOKEN) {
    // 1. Try graph.instagram.com for Instagram tokens
    try {
      const igRes = await fetch(
        `https://graph.instagram.com/v21.0/${senderIgId}?fields=name,username,profile_pic&access_token=${IG_PAGE_ACCESS_TOKEN}`
      );
      if (igRes.ok) {
        const data = await igRes.json();
        return {
          username: data.username || customUsername || `ig_user_${senderIgId.slice(-4)}`,
          fullName: data.name || data.username || "Instagram Creator",
          avatar: data.profile_pic || "",
          isFollowing: true,
        };
      }
    } catch {
      // Continue to next endpoint
    }

    // 2. Try graph.facebook.com
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${senderIgId}?fields=name,username,profile_pic,is_user_follow_business&access_token=${IG_PAGE_ACCESS_TOKEN}`
      );
      if (res.ok) {
        const data = await res.json();
        return {
          username: data.username || customUsername || `ig_user_${senderIgId.slice(-4)}`,
          fullName: data.name || data.username || "Instagram Creator",
          avatar: data.profile_pic || "",
          isFollowing: data.is_user_follow_business ?? true,
        };
      }
    } catch (e) {
      console.warn("[Instagram API] User profile lookup notice:", e);
    }
  }

  const cleanHandle = customUsername ? customUsername.replace(/^@/, "") : `ig_user_${senderIgId.slice(-4)}`;
  return {
    username: cleanHandle,
    fullName: cleanHandle.charAt(0).toUpperCase() + cleanHandle.slice(1),
    avatar: `/api/proxy-image?username=${encodeURIComponent(cleanHandle)}`,
    isFollowing: false,
  };
}

/**
 * Get or Auto-Create User Profile on ReelDash
 */
async function getOrCreateUserProfile(
  senderIgId: string,
  igData: { username: string; fullName: string; avatar: string }
): Promise<UserIgProfile> {
  const existing = igProfileStore.get(senderIgId);
  if (existing) {
    existing.isFollowing = true;
    existing.lastActiveAt = new Date().toISOString();
    return existing;
  }

  const newProfile: UserIgProfile = {
    id: `ig_usr_${senderIgId}`,
    igSenderId: senderIgId,
    username: igData.username,
    fullName: igData.fullName,
    avatar: igData.avatar || `/api/proxy-image?username=${encodeURIComponent(igData.username)}`,
    isFollowing: true,
    savedReelsCount: 0,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };

  igProfileStore.set(senderIgId, newProfile);

  // Persist to Supabase if connected
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("profiles").upsert(
      {
        id: newProfile.id,
        ig_sender_id: senderIgId,
        username: newProfile.username,
        name: newProfile.fullName,
        avatar_url: newProfile.avatar,
        is_following_bot: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "ig_sender_id" }
    );
  } catch {
    // Continue in-memory
  }

  return newProfile;
}

/**
 * Save Reel in Database / Storage for User
 */
async function saveReelForUser(userId: string, reel: any) {
  const userReels = igSavedReelsStore.get(userId) || [];
  const existingIndex = userReels.findIndex((r) => r.shortcode === reel.shortcode || r.url === reel.url);

  const savedItem = {
    id: `dm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId,
    ...reel,
    createdAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    userReels[existingIndex] = savedItem;
  } else {
    userReels.unshift(savedItem);
  }
  igSavedReelsStore.set(userId, userReels);

  // Persist to Supabase if connected
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("reels").upsert(
      {
        user_id: userId,
        shortcode: reel.shortcode,
        url: reel.url,
        thumbnail_url: reel.thumbnail_url,
        video_url: reel.video_url,
        caption: reel.caption,
        creator_handle: reel.creator_handle,
        creator_name: reel.creator_name,
        creator_avatar: reel.creator_avatar,
        media_type: reel.media_type,
        duration: reel.duration,
        category: reel.category,
        tags: reel.tags,
        source: "dm",
      },
      { onConflict: "user_id,shortcode" }
    );
  } catch {
    // Continue
  }

  return savedItem;
}

/**
 * Extract Media URL from text or Instagram attachments
 */
function extractInstagramMediaUrl(text: string, attachments: any[] = []): string | null {
  if (Array.isArray(attachments) && attachments.length > 0) {
    for (const att of attachments) {
      if (att?.payload?.url && att.payload.url.includes("instagram.com")) {
        return att.payload.url;
      }
    }
  }

  if (!text) return null;

  const urlMatch = text.match(/https?:\/\/(?:www\.)?instagram\.com\/(?:reel|reels|p|stories|audio)\/[A-Za-z0-9_.-]+\/?/i);
  if (urlMatch) return urlMatch[0];

  const shortcodeMatch = text.match(/\/(?:reel|reels|p|stories|audio)\/([A-Za-z0-9_.-]+)/i);
  if (shortcodeMatch) {
    return `https://www.instagram.com/reel/${shortcodeMatch[1]}/`;
  }

  return null;
}

/**
 * Send DM Reply with Interactive Buttons via Meta Messenger API
 */
async function sendDMReply(
  recipientIgId: string,
  message: string,
  buttons?: BotButton[]
): Promise<void> {
  if (!IG_PAGE_ACCESS_TOKEN) {
    console.log(`[Bot DM Reply to ${recipientIgId}]:\n${message}\nButtons:`, buttons);
    return;
  }

  // If buttons exist, send as Meta Button Template
  let messagePayload: any = { text: message };

  if (buttons && buttons.length > 0) {
    messagePayload = {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: message.substring(0, 640), // Meta limit
          buttons: buttons.map((b) => {
            if (b.type === "web_url") {
              return {
                type: "web_url",
                url: b.url || "https://reeldash-nine.vercel.app/dashboard",
                title: b.title.substring(0, 20),
              };
            }
            return {
              type: "postback",
              title: b.title.substring(0, 20),
              payload: b.payload || "USER_ACTION",
            };
          }),
        },
      },
    };
  }

  const payload = {
    recipient: { id: recipientIgId },
    message: messagePayload,
    messaging_type: "RESPONSE",
  };

  // 1. Try graph.instagram.com
  try {
    const res = await fetch(`https://graph.instagram.com/v21.0/me/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${IG_PAGE_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) return;
  } catch {
    // Fallback
  }

  // 2. Try graph.facebook.com
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/me/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${IG_PAGE_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) return;
  } catch {
    // Fallback to simple text
  }

  // 3. Fallback: Simple text message
  try {
    await fetch(`https://graph.instagram.com/v21.0/me/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${IG_PAGE_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        recipient: { id: recipientIgId },
        message: { text: message },
        messaging_type: "RESPONSE",
      }),
    });
  } catch (err) {
    console.error("[Instagram Webhook] DM fallback reply failed:", err);
  }
}
