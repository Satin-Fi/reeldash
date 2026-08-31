import { getSupabaseAdmin } from "./supabase";
import { parseCategoryCommand } from "./parseCategory";
export { parseCategoryCommand };

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
  status: "follow_required" | "profile_created" | "reel_saved" | "category_assigned" | "message_received" | "error";
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
    const preliminaryParsed = parseCategoryCommand(messageText || "");
    const preliminaryMediaUrl = extractInstagramMediaUrl(
      preliminaryParsed.cleanUrl || preliminaryParsed.cleanText || messageText,
      attachments
    );
    if (preliminaryMediaUrl && !activeReelIngestStore.has(senderIgId)) {
      activeReelIngestStore.set(senderIgId, {
        userId: "",
        senderIgId,
        shortcode: "",
        creatorText: "Reel",
        formattedReel: null,
        assignedCategories: preliminaryParsed.categories.length > 0 ? preliminaryParsed.categories : undefined,
        note: preliminaryParsed.note || undefined,
        messageSent: false,
      });
    }

    const isFollowCheckClick =
      postbackPayload === "CHECK_FOLLOW_STATUS" ||
      messageText?.trim().toLowerCase().includes("i followed you");

    // 1. Fetch user info & strictly check follower status with Meta
    const igUser = await fetchInstagramUserProfile(senderIgId, customUsername);
    let isFollowing = forceFollowingStatus !== undefined ? forceFollowingStatus : igUser.isFollowing;

    // If user clicked "I followed you!", strictly query Meta API again
    if (isFollowCheckClick) {
      if (forceFollowingStatus !== undefined) {
        isFollowing = forceFollowingStatus;
      } else {
        const liveCheck = await checkLiveFollowerStatus(senderIgId);
        isFollowing = liveCheck;
      }
    }

    // 2. Message 1: If user is NOT following (Strict Guard)
    if (!isFollowing) {
      const followPrompt = `You are not following yet, so ReelDash sync cannot activate.\n\nPlease follow to automatically save any Reel or post you send.`;

      const buttons: BotButton[] = [
        {
          type: "postback",
          title: "I followed you",
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

    // 4. Check if message contains /<category> commands or a Reel / Post / Audio link
    const parsedCmd = parseCategoryCommand(messageText || "");
    const mediaUrl = extractInstagramMediaUrl(
      parsedCmd.cleanUrl || parsedCmd.cleanText || messageText,
      attachments
    );

    if (mediaUrl) {
      const primaryCategory = parsedCmd.primaryCategory;
      const allCategories = parsedCmd.categories;
      const note = parsedCmd.note;

      // Register active ingest immediately before any network/async delays
      activeReelIngestStore.set(senderIgId, {
        userId: userProfile.id,
        senderIgId,
        shortcode: "",
        creatorText: "Reel",
        formattedReel: null,
        assignedCategories: allCategories.length > 0 ? allCategories : undefined,
        note: note || undefined,
        messageSent: false,
      });

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
          thumbnailUrl: `/api/proxy-image?shortcode=${shortcode}`,
          video_url: mediaUrl,
          caption: `Instagram ${isAudio ? "Audio" : "Reel"} shared via Direct Message`,
          creatorUsername: "creator",
          creator_name: "Instagram Creator",
          creatorAvatar: `/api/proxy-image?username=instagram`,
          mediaType: isAudio ? "audio" : "reel",
          duration: isAudio ? "0:30" : "0:15",
          category: primaryCategory || (isAudio ? "Music" : "General"),
          hashtags: ["instagram-dm", isAudio ? "audio" : "reel", "auto-save"],
        };
      }

      const creatorText = reelData.creatorUsername && !reelData.creatorUsername.startsWith("ig_") && reelData.creatorUsername !== "creator"
        ? `@${reelData.creatorUsername}'s Reel`
        : reelData.creator_handle && !reelData.creator_handle.startsWith("ig_") && reelData.creator_handle !== "creator"
        ? `@${reelData.creator_handle}'s Reel`
        : "Reel";

      // If user provided NO category with the reel (e.g. native Instagram share sheet),
      // wait a short window (1.8s) in case the user immediately types /<category>
      if (allCategories.length === 0) {
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, 1800);
          const entry = activeReelIngestStore.get(senderIgId);
          if (entry) {
            entry.timerResolver = () => {
              clearTimeout(timer);
              resolve(true);
            };
          }
        });
      }

      const activeEntry = activeReelIngestStore.get(senderIgId);
      const finalCategories = activeEntry?.assignedCategories && activeEntry.assignedCategories.length > 0
        ? activeEntry.assignedCategories
        : allCategories;
      const finalNote = activeEntry?.note || note || reelData.note || undefined;

      const effectiveCategory = finalCategories.length > 0 ? finalCategories[0] : (reelData.category || "General");
      const tags = [...(reelData.hashtags || reelData.tags || ["instagram-dm", "auto-save"])];
      for (const cat of finalCategories) {
        if (!tags.includes(cat.toLowerCase())) {
          tags.push(cat.toLowerCase());
        }
      }

      const formattedReel = {
        shortcode: reelData.shortcode,
        url: reelData.url || mediaUrl,
        thumbnail_url: reelData.thumbnailUrl || reelData.thumbnail_url || `/api/proxy-image?shortcode=${reelData.shortcode}`,
        video_url: reelData.mediaUrl || reelData.video_url || mediaUrl,
        caption: reelData.caption || "Saved Instagram Reel",
        creator_handle: reelData.creatorUsername || reelData.creator_handle || "creator",
        creator_name: reelData.creatorFullName || reelData.creator_name || "Instagram Creator",
        creator_avatar: reelData.creatorAvatar || reelData.creator_avatar || `/api/proxy-image?username=${encodeURIComponent(reelData.creatorUsername || "creator")}`,
        media_type: reelData.mediaType || reelData.media_type || "reel",
        duration: reelData.duration || "0:15",
        category: effectiveCategory,
        tags,
        note: finalNote,
      };

      // Save Reel to user's library and Supabase database
      const saveResult = await saveReelForUser(userProfile.id, formattedReel, finalCategories);
      userProfile.savedReelsCount += 1;
      userProfile.lastActiveAt = new Date().toISOString();

      // Accurately determine if categories are new via Database check
      const newCategories: string[] = [];
      for (const cat of finalCategories) {
        const exists = await checkUserCategoryExists(userProfile.id, cat);
        if (!exists) {
          newCategories.push(cat);
          if (!igUserCategoriesStore.has(userProfile.id)) {
            igUserCategoriesStore.set(userProfile.id, new Set());
          }
          igUserCategoriesStore.get(userProfile.id)!.add(cat);
        }
      }

      let categoryLines = "";
      if (finalCategories.length > 0) {
        const catLabel = finalCategories.length > 1 ? "Categories" : "Category";
        categoryLines = `📁 ${catLabel}: ${finalCategories.join(", ")}`;
        if (newCategories.length > 0) {
          if (finalCategories.length === 1) {
            categoryLines += `\n✨ New category created`;
          } else {
            categoryLines += `\n✨ New category created: ${newCategories.join(", ")}`;
          }
        }
      } else {
        categoryLines = `📁 Category: ${formattedReel.category || "General"}`;
      }

      const successReply = `⚡ Saved to your ReelDash Library.\n\n🎬 ${creatorText}\n${categoryLines}`;

      const buttons: BotButton[] = [
        {
          type: "web_url",
          title: "Open in ReelDash",
          url: "https://reeldash-nine.vercel.app/dashboard",
        },
      ];

      await sendDMReply(senderIgId, successReply, buttons);

      if (activeEntry) {
        activeEntry.messageSent = true;
        activeReelIngestStore.delete(senderIgId);
      }

      return {
        status: "reel_saved",
        replyMessage: successReply,
        buttons,
        senderIgId,
        username: userProfile.username,
        isFollowing: true,
        savedReel: saveResult.savedItem,
      };
    }

    // 5. If NO media URL but user sent /<category> command (e.g. follow-up /Saree, /yoga, /fitness)
    if (!mediaUrl && parsedCmd.categories.length > 0) {
      const primaryCategory = parsedCmd.primaryCategory!;
      const allCategories = parsedCmd.categories;
      const note = parsedCmd.note;

      // Check if an active reel ingest is currently waiting for this user
      const activeIngest = activeReelIngestStore.get(senderIgId);
      if (activeIngest && !activeIngest.messageSent) {
        activeIngest.assignedCategories = allCategories;
        if (note) activeIngest.note = note;

        // Wake up the pending ingest timer so it sends the single combined confirmation now
        activeIngest.timerResolver?.();

        return {
          status: "category_assigned",
          replyMessage: "Assigned category to incoming reel",
          senderIgId,
          username: userProfile.username,
          isFollowing: true,
        };
      }

      // Otherwise, the initial reel confirmation was already sent earlier.
      // Update user's most recent saved reel with this category.
      const updateResult = await updateRecentReelCategoryForUser(
        userProfile.id,
        allCategories,
        note
      );

      const creatorText = updateResult.reel?.creator_handle && !updateResult.reel.creator_handle.startsWith("ig_user_") && updateResult.reel.creator_handle !== "creator"
        ? `@${updateResult.reel.creator_handle}'s Reel`
        : null;

      let categoryLines = "";
      const catLabel = allCategories.length > 1 ? "Categories" : "Category";
      categoryLines = `📁 ${catLabel}: ${allCategories.join(", ")}`;
      if (updateResult.newCategories.length > 0) {
        if (allCategories.length === 1) {
          categoryLines += `\n✨ New category created`;
        } else {
          categoryLines += `\n✨ New category created: ${updateResult.newCategories.join(", ")}`;
        }
      }

      const updateReply = creatorText
        ? `📁 Category updated: ${allCategories.join(", ")}${updateResult.newCategories.length > 0 ? "\n✨ New category created" : ""}`
        : `📁 ${catLabel}: ${allCategories.join(", ")}${updateResult.newCategories.length > 0 ? "\n✨ New category created" : ""}\n\nWhenever you send a Reel, you can type /${primaryCategory.toLowerCase()} to save it here.`;

      const buttons: BotButton[] = [
        {
          type: "web_url",
          title: "Open in ReelDash",
          url: "https://reeldash-nine.vercel.app/dashboard",
        },
      ];

      await sendDMReply(senderIgId, updateReply, buttons);

      return {
        status: "category_assigned",
        replyMessage: updateReply,
        buttons,
        senderIgId,
        username: userProfile.username,
        isFollowing: true,
        savedReel: updateResult.reel,
      };
    }

    // 6. Generic Text Message (e.g. greeting or general query)
    const greetingReply = `Your ReelDash sync is active. Whenever you see an Instagram Reel, Post, or Audio, send or share it here to save it to your library.\n\n💡 Tip: Type /<category> (e.g. /yoga, /saree, /recipes) to categorize your saves instantly!`;

    const buttons: BotButton[] = [
      {
        type: "web_url",
        title: "Open in ReelDash",
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
 * Strict Live Meta Follower Status Verification
 */
async function checkLiveFollowerStatus(senderIgId: string): Promise<boolean> {
  if (!IG_PAGE_ACCESS_TOKEN) return false;

  // 1. Check graph.facebook.com for is_user_follow_business
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${senderIgId}?fields=is_user_follow_business&access_token=${IG_PAGE_ACCESS_TOKEN}`
    );
    if (res.ok) {
      const data = await res.json();
      if (typeof data.is_user_follow_business === "boolean") {
        return data.is_user_follow_business;
      }
    }
  } catch {}

  // 2. Check graph.instagram.com
  try {
    const res = await fetch(
      `https://graph.instagram.com/v21.0/${senderIgId}?fields=is_user_follow_business&access_token=${IG_PAGE_ACCESS_TOKEN}`
    );
    if (res.ok) {
      const data = await res.json();
      if (typeof data.is_user_follow_business === "boolean") {
        return data.is_user_follow_business;
      }
    }
  } catch {}

  // Default to false if Meta cannot confirm they follow
  return false;
}

/**
 * Fetch Instagram User Profile & Follower Status
 */
async function fetchInstagramUserProfile(
  senderIgId: string,
  customUsername?: string | { username?: string; fullName?: string; avatar?: string }
): Promise<{
  username: string;
  fullName: string;
  avatar: string;
  isFollowing: boolean;
}> {
  let isFollowing = false;
  let username = typeof customUsername === "string"
    ? customUsername.replace(/^@/, "")
    : typeof customUsername === "object" && customUsername?.username
    ? customUsername.username.replace(/^@/, "")
    : `ig_user_${senderIgId.slice(-4)}`;
  let fullName = typeof customUsername === "object" && customUsername?.fullName ? customUsername.fullName : "Instagram User";
  let avatar = typeof customUsername === "object" && customUsername?.avatar ? customUsername.avatar : `/api/proxy-image?username=${encodeURIComponent(username)}`;

  if (IG_PAGE_ACCESS_TOKEN) {
    // 1. Try graph.facebook.com
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${senderIgId}?fields=name,username,profile_pic,is_user_follow_business&access_token=${IG_PAGE_ACCESS_TOKEN}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.username) username = data.username;
        if (data.name) fullName = data.name;
        if (data.profile_pic) avatar = data.profile_pic;
        if (data.is_user_follow_business === true) isFollowing = true;
      }
    } catch (e) {
      console.warn("[Instagram API] User profile lookup notice:", e);
    }

    // 2. Try graph.instagram.com if not already resolved
    if (!isFollowing) {
      try {
        const igRes = await fetch(
          `https://graph.instagram.com/v21.0/${senderIgId}?fields=name,username,profile_pic,is_user_follow_business&access_token=${IG_PAGE_ACCESS_TOKEN}`
        );
        if (igRes.ok) {
          const data = await igRes.json();
          if (data.username) username = data.username;
          if (data.name) fullName = data.name;
          if (data.profile_pic) avatar = data.profile_pic;
          if (data.is_user_follow_business === true) isFollowing = true;
        }
      } catch {}
    }
  }

  return {
    username,
    fullName,
    avatar,
    isFollowing, // STRICT: only true if Meta returned true!
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

  let matchedUserId = `ig_usr_${senderIgId}`;

  // Check Supabase instagram_accounts table to map to real ReelDash user
  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data: matchedAccount } = await supabase
        .from("instagram_accounts")
        .select("reeldash_user_id, id, username")
        .or(`instagram_user_id.eq.${senderIgId},username.ilike.${igData.username}`)
        .limit(1)
        .single();

      if (matchedAccount?.reeldash_user_id) {
        matchedUserId = matchedAccount.reeldash_user_id;

        // Update the account record with the verified senderIgId
        await supabase
          .from("instagram_accounts")
          .update({
            instagram_user_id: senderIgId,
            display_name: igData.fullName || igData.username,
            avatar_url: igData.avatar,
            updated_at: new Date().toISOString(),
          })
          .eq("id", matchedAccount.id);
      } else {
        // Create provisional connected account record
        await supabase.from("instagram_accounts").upsert(
          {
            reeldash_user_id: matchedUserId,
            instagram_user_id: senderIgId,
            username: igData.username.toLowerCase(),
            display_name: igData.fullName || igData.username,
            avatar_url: igData.avatar,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "reeldash_user_id,username" }
        );
      }

      await supabase.from("profiles").upsert(
        {
          id: matchedUserId,
          ig_sender_id: senderIgId,
          username: igData.username,
          name: igData.fullName,
          avatar_url: igData.avatar,
          is_following_bot: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "ig_sender_id" }
      );
    }
  } catch {
    // Continue in-memory
  }

  const newProfile: UserIgProfile = {
    id: matchedUserId,
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
  return newProfile;
}

export interface BotCollection {
  id: string;
  userId: string;
  name: string;
  icon?: string;
  reelIds: string[];
  createdAt: string;
}

export const igCollectionsStore = new Map<string, BotCollection[]>();

export const igUserCategoriesStore = new Map<string, Set<string>>();

export interface ActiveReelIngest {
  userId: string;
  senderIgId: string;
  shortcode: string;
  creatorText: string;
  formattedReel: any;
  assignedCategories?: string[];
  note?: string;
  timerResolver?: (value?: any) => void;
  messageSent: boolean;
}

export const activeReelIngestStore = new Map<string, ActiveReelIngest>();

/**
 * Check if a category already exists for the user in Supabase or Memory
 */
export async function checkUserCategoryExists(userId: string, categoryName: string): Promise<boolean> {
  const normalized = categoryName.trim().toLowerCase();
  if (!normalized) return true;

  // 1. Check in-memory cache
  const userCats = igUserCategoriesStore.get(userId);
  if (userCats) {
    for (const c of userCats) {
      if (c.toLowerCase() === normalized) {
        return true;
      }
    }
  }

  // 2. Query Supabase Database (reels table)
  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data: matchingReel } = await supabase
        .from("reels")
        .select("id")
        .eq("user_id", userId)
        .ilike("category", categoryName.trim())
        .limit(1)
        .maybeSingle();

      if (matchingReel) {
        if (!userCats) {
          igUserCategoriesStore.set(userId, new Set());
        }
        igUserCategoriesStore.get(userId)!.add(categoryName.trim());
        return true;
      }

      // Also check collections table if any
      const { data: matchingCol } = await supabase
        .from("collections")
        .select("id")
        .eq("user_id", userId)
        .ilike("name", categoryName.trim())
        .limit(1)
        .maybeSingle();

      if (matchingCol) {
        if (!userCats) {
          igUserCategoriesStore.set(userId, new Set());
        }
        igUserCategoriesStore.get(userId)!.add(categoryName.trim());
        return true;
      }
    }
  } catch (err) {
    console.warn("[Instagram Bot] Database category check error:", err);
  }

  return false;
}

/**
 * Save Reel in Database / Storage for User and auto-manage Categories
 */
async function saveReelForUser(
  userId: string,
  reel: any,
  requestedCategories: string[] = []
): Promise<{
  savedItem: any;
  newCategories: string[];
  assignedCategories: string[];
}> {
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

  const newCategories: string[] = [];
  const assignedCategories: string[] = [];

  for (const cat of requestedCategories) {
    assignedCategories.push(cat);
    const exists = await checkUserCategoryExists(userId, cat);
    if (!exists) {
      newCategories.push(cat);
      if (!igUserCategoriesStore.has(userId)) {
        igUserCategoriesStore.set(userId, new Set());
      }
      igUserCategoriesStore.get(userId)!.add(cat);
    }
  }

  // Persist to Supabase Database
  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      // 1. Find or verify instagram_account_id
      const { data: acc } = await supabase
        .from("instagram_accounts")
        .select("id")
        .eq("reeldash_user_id", userId)
        .limit(1)
        .single();

      // 2. Upsert Reel Record
      await supabase.from("reels").upsert(
        {
          user_id: userId,
          instagram_account_id: acc?.id || null,
          instagram_username: reel.instagram_username || (igProfileStore.get(userId)?.username) || null,
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
          note: reel.note || null,
          source: "dm",
        },
        { onConflict: "user_id,shortcode" }
      );
    }
  } catch (dbErr) {
    console.warn("[Instagram Bot] Supabase persistence notice:", dbErr);
  }

  userLastSavedReelStore.set(userId, savedItem);
  return { savedItem, newCategories, assignedCategories };
}

export const userLastSavedReelStore = new Map<string, any>();

/**
 * Update the user's most recent saved reel with category commands
 */
async function updateRecentReelCategoryForUser(
  userId: string,
  categories: string[],
  note?: string | null
): Promise<{ reel: any | null; newCategories: string[] }> {
  const userReels = igSavedReelsStore.get(userId) || [];
  let recentReel = userLastSavedReelStore.get(userId) || (userReels.length > 0 ? userReels[0] : null);

  const primaryCategory = categories[0];

  const newCategories: string[] = [];
  for (const cat of categories) {
    const exists = await checkUserCategoryExists(userId, cat);
    if (!exists) {
      newCategories.push(cat);
      if (!igUserCategoriesStore.has(userId)) {
        igUserCategoriesStore.set(userId, new Set());
      }
      igUserCategoriesStore.get(userId)!.add(cat);
    }
  }

  if (recentReel) {
    const currentTags = Array.isArray(recentReel.tags) ? [...recentReel.tags] : [];
    for (const cat of categories) {
      if (!currentTags.includes(cat.toLowerCase())) {
        currentTags.push(cat.toLowerCase());
      }
    }

    recentReel.category = primaryCategory;
    recentReel.tags = currentTags;
    if (note) recentReel.note = note;

    userLastSavedReelStore.set(userId, recentReel);

    // Update in igSavedReelsStore
    const idx = userReels.findIndex((r) => r.id === recentReel.id || r.shortcode === recentReel.shortcode);
    if (idx >= 0) {
      userReels[idx] = recentReel;
      igSavedReelsStore.set(userId, userReels);
    }

    // Persist category update to Supabase
    try {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        if (recentReel.shortcode) {
          await supabase
            .from("reels")
            .update({
              category: primaryCategory,
              tags: currentTags,
              note: recentReel.note || null,
            })
            .eq("user_id", userId)
            .eq("shortcode", recentReel.shortcode);
        }
      }
    } catch (err) {
      console.warn("[Instagram Bot] Supabase update recent reel notice:", err);
    }
  } else {
    // If no recent reel in memory, query Supabase for latest reel of this user
    try {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data: latestDbReel } = await supabase
          .from("reels")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestDbReel) {
          const currentTags = Array.isArray(latestDbReel.tags) ? [...latestDbReel.tags] : [];
          for (const cat of categories) {
            if (!currentTags.includes(cat.toLowerCase())) {
              currentTags.push(cat.toLowerCase());
            }
          }

          await supabase
            .from("reels")
            .update({
              category: primaryCategory,
              tags: currentTags,
              note: note || latestDbReel.note || null,
            })
            .eq("id", latestDbReel.id);

          recentReel = {
            ...latestDbReel,
            category: primaryCategory,
            tags: currentTags,
            note: note || latestDbReel.note,
          };
          userLastSavedReelStore.set(userId, recentReel);
        }
      }
    } catch (err) {
      console.warn("[Instagram Bot] Supabase lookup latest reel notice:", err);
    }
  }

  return { reel: recentReel, newCategories };
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
          text: message.substring(0, 640),
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
    // Fallback
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
