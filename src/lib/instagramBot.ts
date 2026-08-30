import { getSupabaseAdmin } from "@/lib/supabase";

const IG_PAGE_ACCESS_TOKEN = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;

// In-memory profiles & follower store for serverless environments
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

export const igProfileStore = new Map<string, UserIgProfile>();
export const igSavedReelsStore = new Map<string, any[]>();

/**
 * Core Instagram DM Engine: Follower Check -> Profile Auto-Creation -> Reel Extraction & Save -> Automated Reply
 */
export async function processInstagramMessage(
  senderIgId: string,
  messageText: string,
  attachments: any[] = [],
  forceFollowState?: boolean,
  customUsername?: string
) {
  if (!senderIgId) {
    return { status: "error", error: "Missing sender IG ID" };
  }

  // 1. Resolve User Details & Follower Status
  const igUser = await fetchInstagramUserProfile(senderIgId, customUsername);
  const isFollowing = forceFollowState !== undefined ? forceFollowState : igUser.isFollowing;

  // 2. If User Is NOT Following @reeldash: Send Follow Prompt
  if (!isFollowing) {
    const followReply =
      `👋 Welcome to ReelDash! ⚡\n\n` +
      `Please make sure you are following @reeldash to activate automatic Reel saving.\n\n` +
      `Once you follow us, simply DM or share any Reel, Post, or Audio link here and it will be saved directly into your ReelDash library! 🚀`;

    await sendDMReply(senderIgId, followReply);

    return {
      status: "awaiting_follow",
      senderIgId,
      username: igUser.username,
      replySent: followReply,
      profileCreated: false,
    };
  }

  // 3. User IS Following -> Auto-Create ReelDash Profile if not existing
  const profile = await getOrCreateUserProfile(senderIgId, igUser);

  // 4. Extract Reel URL from text or attachments
  const reelUrl = extractInstagramMediaUrl(messageText, attachments);

  // Case A: User sent a Reel link or share
  if (reelUrl) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://reeldash-nine.vercel.app";
    let reelData: any = {};

    try {
      const reelInfoRes = await fetch(`${baseUrl}/api/reel-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: reelUrl }),
      });
      if (reelInfoRes.ok) {
        reelData = await reelInfoRes.json();
      }
    } catch (e) {
      console.warn("[Webhook] Local reel-info fetch notice:", e);
    }

    const shortcodeMatch = reelUrl.match(/(?:reel|reels|p|stories|audio)\/([A-Za-z0-9_-]+)/);
    const shortcode = reelData.shortcode || (shortcodeMatch ? shortcodeMatch[1] : `ig_${Date.now().toString(36)}`);
    const mediaType = reelData.mediaType || (reelUrl.includes("/audio/") ? "audio" : reelUrl.includes("/stories/") ? "story" : reelUrl.includes("/p/") ? "post" : "reel");
    const creator = reelData.creatorUsername || "creator";
    const captionSnippet = reelData.caption ? `\n📌 "${reelData.caption.slice(0, 50)}..."` : "";
    const category = reelData.category || "General";

    // Save Reel in Database / Storage
    await saveReelForUser(profile.id, {
      shortcode,
      url: reelUrl,
      thumbnail_url: reelData.thumbnailUrl || (shortcode ? `/api/proxy-image?shortcode=${shortcode}` : ""),
      video_url: reelData.mediaUrl || "",
      caption: reelData.caption || `Instagram ${mediaType.toUpperCase()}`,
      creator_handle: creator,
      creator_name: reelData.creatorFullName || creator,
      creator_avatar: reelData.creatorAvatar || "",
      media_type: mediaType,
      duration: reelData.duration || "",
      category,
      tags: reelData.hashtags || [],
      source: "instagram_dm",
    });

    profile.savedReelsCount = (profile.savedReelsCount || 0) + 1;
    igProfileStore.set(senderIgId, profile);

    const savedReply =
      `⚡ Saved to your ReelDash library!\n\n` +
      `🎬 @${creator}'s ${mediaType.toUpperCase()}${captionSnippet}\n` +
      `📁 Category: ${category}\n\n` +
      `🔗 View your library:\nhttps://reeldash-nine.vercel.app/dashboard`;

    await sendDMReply(senderIgId, savedReply);

    return {
      status: "reel_saved",
      senderIgId,
      username: profile.username,
      reelUrl,
      mediaType,
      creator,
      replySent: savedReply,
      profileCreated: true,
      profile,
    };
  }

  // Case B: User sent a normal greeting / follow confirmation
  const welcomeReply =
    `✅ You're connected! ⚡\n\n` +
    `Your ReelDash library profile is active (@${profile.username}).\n\n` +
    `Whenever you see an Instagram Reel, Post, or Audio you like, just share or DM the link here and it will be saved directly into your ReelDash library! 🚀\n\n` +
    `🔗 https://reeldash-nine.vercel.app/dashboard`;

  await sendDMReply(senderIgId, welcomeReply);

  return {
    status: "connected",
    senderIgId,
    username: profile.username,
    replySent: welcomeReply,
    profileCreated: true,
    profile,
  };
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
    try {
      const res = await fetch(
        `https://graph.facebook.com/v20.0/${senderIgId}?fields=name,username,profile_pic,is_user_follow_business&access_token=${IG_PAGE_ACCESS_TOKEN}`
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
 * Send DM Reply via Meta Messenger API
 */
async function sendDMReply(recipientIgId: string, message: string): Promise<void> {
  if (!IG_PAGE_ACCESS_TOKEN) {
    console.log(`[Bot DM Reply to ${recipientIgId}]:\n${message}`);
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
        message: { text: message },
        messaging_type: "RESPONSE",
      }),
    });
  } catch (e) {
    console.error("[Instagram Webhook] DM reply failed:", e);
  }
}
