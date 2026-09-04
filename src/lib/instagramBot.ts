import { getSupabaseAdmin } from "./supabase";
import { parseCategoryCommand, formatCategoryDisplayName } from "./parseCategory";
import { isLinkCode, normalizeLinkCode, generateLinkCode, MAX_CODE_ATTEMPTS, CODE_EXPIRY_SECONDS } from "./serverAuth";
import { extractCreatorFromPost } from "./extractCreator";
export { parseCategoryCommand, formatCategoryDisplayName };

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BotButton {
  type: "postback" | "web_url";
  title: string;
  payload?: string;
  url?: string;
}

export interface ProcessedDMResult {
  status:
    | "follow_required"
    | "needs_signup"
    | "needs_link"
    | "needs_reverification"
    | "account_inactive"
    | "link_code_success"
    | "link_code_failed"
    | "reel_saved"
    | "reel_pending"
    | "category_assigned"
    | "message_received"
    | "error";
  replyMessage: string;
  buttons?: BotButton[];
  senderIgId: string;
  username?: string;
  isFollowing: boolean;
  savedReel?: any;
}

/**
 * Centralized Instagram user state.
 *
 * The SINGLE source of truth for whether an incoming DM sender
 * is authorized to save Reels.
 *
 * ONLY "READY" may save. Everything else → onboarding response.
 */
export type InstagramUserState =
  | "NOT_FOLLOWING"
  | "NEEDS_SIGNUP"
  | "NEEDS_REVERIFICATION"
  | "ACCOUNT_INACTIVE"
  | "READY"
  | "ERROR";

interface ResolvedState {
  state: InstagramUserState;
  reeldashUserId?: string;
  instagramAccountId?: string;
  username?: string;
}

// ─── In-memory runtime cache ──────────────────────────────────────────────────

interface CachedProfile {
  reeldashUserId: string;
  instagramAccountId: string;
  username: string;
  state: InstagramUserState;
  cachedAt: number;
}

const profileCache = new Map<string, CachedProfile>();
const CACHE_TTL_MS = 60_000; // 1 minute

const IG_PAGE_ACCESS_TOKEN = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://reeldash-nine.vercel.app";

// ─── Phase 4: Centralized State Resolver ──────────────────────────────────────

/**
 * Resolve the authorization state of an Instagram DM sender.
 *
 * Decision logic:
 *   1. Check follow status (if API available)
 *   2. Look up instagram_accounts by instagram_user_id = senderIgId
 *   3. If status = 'active' → READY
 *   4. If status = 'legacy_unverified' → NEEDS_REVERIFICATION (NOT READY)
 *   5. If status = 'inactive' → ACCOUNT_INACTIVE
 *   6. No match → NEEDS_SIGNUP (generic — bot can't distinguish signup vs link)
 */
async function resolveInstagramUserState(
  senderIgId: string,
  isFollowing: boolean
): Promise<ResolvedState> {
  // Gate 1: Follow check (if available)
  if (!isFollowing) {
    return { state: "NOT_FOLLOWING" };
  }

  // Gate 2: Check cache (short TTL to avoid stale auth decisions)
  const cached = profileCache.get(senderIgId);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return {
      state: cached.state,
      reeldashUserId: cached.reeldashUserId,
      instagramAccountId: cached.instagramAccountId,
      username: cached.username,
    };
  }

  // Gate 3: Database lookup
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return { state: "ERROR" };
    }

    const { data: account } = await supabase
      .from("instagram_accounts")
      .select("id, reeldash_user_id, username, status, linked_via")
      .eq("instagram_user_id", senderIgId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!account) {
      // No match at all — user needs to sign up and link
      return { state: "NEEDS_SIGNUP" };
    }

    // Determine state based on status
    let resolvedState: InstagramUserState;

    switch (account.status) {
      case "active":
        resolvedState = "READY";
        break;
      case "legacy_unverified":
        // CRITICAL FIX: Legacy accounts must NOT save new Reels.
        // They need DM verification first.
        resolvedState = "NEEDS_REVERIFICATION";
        break;
      case "inactive":
        resolvedState = "ACCOUNT_INACTIVE";
        break;
      default:
        resolvedState = "NEEDS_SIGNUP";
        break;
    }

    // Cache the result
    profileCache.set(senderIgId, {
      reeldashUserId: account.reeldash_user_id,
      instagramAccountId: account.id,
      username: account.username,
      state: resolvedState,
      cachedAt: Date.now(),
    });

    return {
      state: resolvedState,
      reeldashUserId: account.reeldash_user_id,
      instagramAccountId: account.id,
      username: account.username,
    };
  } catch (err) {
    console.error("[Instagram Bot] State resolution error:", err);
    return { state: "ERROR" };
  }
}

// ─── Verification Status Check Helpers ───────────────────────────────────────

export type VerificationCheckResult =
  | { status: "VERIFIED"; account: any }
  | {
      status: "NOT_VERIFIED";
      reason: "no_account" | "legacy_unverified" | "inactive" | "pending";
    }
  | { status: "CONFLICT"; message: string }
  | { status: "ERROR"; error: string };

/**
 * Check if an Instagram sender ID is verified and actively linked.
 *
 * Checks:
 *   1. Database query on instagram_accounts for instagram_user_id = senderIgId
 *   2. Conflict check (is senderIgId associated with multiple different users)
 *   3. Status check (active vs legacy_unverified vs inactive)
 *
 * MUST NEVER trust client-supplied userId or payload identity.
 */
export async function isInstagramVerified(
  senderIgId: string
): Promise<VerificationCheckResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { status: "ERROR", error: "Database not configured" };

  try {
    const { data: accounts, error } = await supabase
      .from("instagram_accounts")
      .select("*")
      .eq("instagram_user_id", senderIgId);

    if (error) return { status: "ERROR", error: error.message };

    if (!accounts || accounts.length === 0) {
      return { status: "NOT_VERIFIED", reason: "no_account" };
    }

    // Check for conflict: multiple different ReelDash users linked to this same IGSID
    const distinctUsers = Array.from(
      new Set(accounts.map((a: any) => a.reeldash_user_id).filter(Boolean))
    );
    if (distinctUsers.length > 1) {
      return {
        status: "CONFLICT",
        message:
          "This Instagram account is associated with multiple ReelDash accounts. Please disconnect it from other accounts first or contact support.",
      };
    }

    // Active verified account check
    const activeAccount = accounts.find((a: any) => a.status === "active");
    if (activeAccount) {
      return { status: "VERIFIED", account: activeAccount };
    }

    // Legacy unverified account
    const legacyAccount = accounts.find(
      (a: any) => a.status === "legacy_unverified"
    );
    if (legacyAccount) {
      return { status: "NOT_VERIFIED", reason: "legacy_unverified" };
    }

    // Inactive account
    const inactiveAccount = accounts.find((a: any) => a.status === "inactive");
    if (inactiveAccount) {
      return { status: "NOT_VERIFIED", reason: "inactive" };
    }

    return { status: "NOT_VERIFIED", reason: "pending" };
  } catch (err: any) {
    return { status: "ERROR", error: err?.message || "Internal error" };
  }
}

/**
 * Claim pending reels for a verified user and Instagram sender.
 *
 * Server-side only: claims only reels matching instagram_sender_id = senderIgId.
 * Never creates duplicate saves (upsert with conflict handling on user_id,shortcode).
 */
export async function claimPendingReelsForUser(
  senderIgId: string,
  userId: string,
  igAccountId: string | null,
  igUsername: string
): Promise<number> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return 0;

  const now = new Date().toISOString();
  let claimedCount = 0;

  try {
    const { data: pendingReels } = await supabase
      .from("pending_reels")
      .select("*")
      .eq("instagram_sender_id", senderIgId)
      .eq("status", "pending")
      .order("received_at", { ascending: true });

    if (!pendingReels || pendingReels.length === 0) return 0;

    for (const pending of pendingReels) {
      try {
        const reelData = pending.reel_data || {};
        const shortcode =
          pending.reel_shortcode || reelData.shortcode || `ig_${Date.now()}`;
        const pendingUrl = pending.reel_url || reelData.url || "";
        const isAudio =
          pendingUrl.includes("/audio/") ||
          pendingUrl.includes("/reels/audio/");
        const isPost =
          !isAudio &&
          (pendingUrl.includes("/p/") ||
            pendingUrl.includes("/share/p/") ||
            pendingUrl.includes("lookaside.fbsbx.com") ||
            pendingUrl.includes("cdninstagram.com") ||
            pendingUrl.includes("fbcdn.net") ||
            pendingUrl.match(/\.(jpg|jpeg|png|webp|gif)($|\?)/i) !== null ||
            reelData.mediaType === "post" ||
            reelData.media_type === "post");

        // Save to the user's real library
        await supabase.from("reels").upsert(
          {
            user_id: userId,
            instagram_account_id: igAccountId,
            instagram_username: igUsername,
            shortcode,
            url: pendingUrl,
            thumbnail_url:
              reelData.thumbnail_url ||
              reelData.thumbnailUrl ||
              `/api/proxy-image?shortcode=${shortcode}`,
            video_url: reelData.video_url || reelData.mediaUrl || pendingUrl,
            caption:
              reelData.caption ||
              (isPost
                ? "Saved Instagram Post"
                : isAudio
                ? "Saved Instagram Audio"
                : "Saved Instagram Reel"),
            creator_handle:
              reelData.creator_handle &&
              reelData.creator_handle !== "creator" &&
              (!igUsername || reelData.creator_handle.toLowerCase() !== igUsername.toLowerCase())
                ? reelData.creator_handle
                : reelData.creatorUsername &&
                  reelData.creatorUsername !== "creator" &&
                  (!igUsername || reelData.creatorUsername.toLowerCase() !== igUsername.toLowerCase())
                ? reelData.creatorUsername
                : "instagram",
            creator_name:
              reelData.creator_name ||
              reelData.creatorFullName ||
              "Instagram Creator",
            creator_avatar:
              reelData.creator_avatar ||
              reelData.creatorAvatar ||
              `/api/proxy-image?username=instagram`,
            media_type: isPost
              ? "post"
              : isAudio
              ? "audio"
              : reelData.media_type || reelData.mediaType || "reel",
            duration: isPost
              ? "Post"
              : reelData.duration || (isAudio ? "0:30" : "0:15"),
            category: reelData.category || "General",
            tags: reelData.tags || reelData.hashtags || [
              "instagram-dm",
              "auto-save",
            ],
            source: "dm",
          },
          { onConflict: "user_id,shortcode" }
        );

        // Mark as claimed
        await supabase
          .from("pending_reels")
          .update({
            status: "claimed",
            claimed_by_user_id: userId,
            claimed_at: now,
          })
          .eq("id", pending.id);

        claimedCount++;
      } catch (claimErr) {
        console.warn("[Instagram Bot] Failed to claim pending reel:", claimErr);
      }
    }
  } catch (err) {
    console.warn("[Instagram Bot] Error querying pending reels to claim:", err);
  }

  return claimedCount;
}

/**
 * Check if an incoming message is a user asking to check verification status.
 */
function isVerificationCheckText(text: string): boolean {
  if (!text) return false;
  const clean = text.trim().toLowerCase();
  return (
    clean === "i've verified" ||
    clean === "ive verified" ||
    clean === "i have verified" ||
    clean === "verified" ||
    clean === "check verification" ||
    clean === "i verified"
  );
}

/**
 * Handle "I've verified" quick-reply / postback action.
 *
 * Verifies ONLY against actual database state using senderIgId from Meta.
 * Does NOT mark anything verified on click.
 */
async function handleCheckVerification(
  senderIgId: string,
  username: string
): Promise<ProcessedDMResult> {
  const check = await isInstagramVerified(senderIgId);

  if (check.status === "VERIFIED") {
    // Claim any pending reels for this verified account
    const claimedCount = await claimPendingReelsForUser(
      senderIgId,
      check.account.reeldash_user_id,
      check.account.id,
      username || check.account.username
    );

    let reply: string;
    if (claimedCount > 0) {
      reply = `✅ You're verified!\n\nYour Instagram account is connected to ReelDash.\n\nI also saved ${claimedCount} Reel${claimedCount > 1 ? "s" : ""} you sent earlier.`;
    } else {
      reply = `✅ You're verified!\n\nYour Instagram account is connected to ReelDash.\n\nSend me any Reel and I'll save it to your library.`;
    }

    const buttons: BotButton[] = [
      {
        type: "web_url",
        title: "Open ReelDash",
        url: `${APP_URL}/dashboard`,
      },
    ];

    await sendDMReply(senderIgId, reply, buttons);

    return {
      status: "message_received",
      replyMessage: reply,
      buttons,
      senderIgId,
      username,
      isFollowing: true,
    };
  }

  if (check.status === "CONFLICT") {
    const reply = `⚠️ Account Conflict\n\n${check.message}`;
    const buttons: BotButton[] = [
      {
        type: "web_url",
        title: "Verify now",
        url: `${APP_URL}/connect-instagram`,
      },
    ];

    await sendDMReply(senderIgId, reply, buttons);

    return {
      status: "error",
      replyMessage: reply,
      buttons,
      senderIgId,
      username,
      isFollowing: true,
    };
  }

  if (check.status === "ERROR") {
    const reply =
      "Something went wrong checking your verification status. Please try again.";
    const buttons: BotButton[] = [
      {
        type: "web_url",
        title: "🔗 Connect Account",
        url: `${APP_URL}/connect-instagram`,
      },
    ];

    await sendDMReply(senderIgId, reply, buttons);

    return {
      status: "error",
      replyMessage: reply,
      buttons,
      senderIgId,
      username,
      isFollowing: true,
    };
  }

  // check.status === "NOT_VERIFIED"
  // Generate a fresh verification code for this Instagram sender
  const supabase = getSupabaseAdmin();
  const code = generateLinkCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CODE_EXPIRY_SECONDS * 1000); // 4 mins

  if (supabase) {
    try {
      // Invalidate previous pending codes for this Instagram sender
      await supabase
        .from("link_codes")
        .update({ status: "expired" })
        .eq("instagram_sender_id", senderIgId)
        .eq("status", "pending");

      // Insert new pending challenge code
      await supabase.from("link_codes").insert({
        code,
        instagram_sender_id: senderIgId,
        instagram_username: username || null,
        status: "pending",
        attempts: 0,
        expires_at: expiresAt.toISOString(),
      });
    } catch (dbErr) {
      console.error("[Instagram Bot] Error saving DM verification code:", dbErr);
    }
  }

  const reply = `🔒 Not connected yet!\n\nConnect in 2 easy steps:\n1️⃣ Tap '🔗 Connect Account' below\n2️⃣ Sign in with your Google account on ReelDash\n\nYour Instagram connects automatically!\n\n(Code: ${code} • expires in 4m)`;
  const buttons: BotButton[] = [
    {
      type: "web_url",
      title: "🔗 Connect Account",
      url: `${APP_URL}/connect-instagram?code=${code}`,
    },
  ];

  await sendDMReply(senderIgId, reply, buttons);

  return {
    status: "needs_link",
    replyMessage: reply,
    buttons,
    senderIgId,
    username,
    isFollowing: true,
  };
}

/**
 * Build the full welcome & features overview DM sent when a user successfully connects Instagram.
 */
function buildWelcomeFeaturesMessage(claimedCount: number = 0): string {
  let msg = `🎉 Welcome to ReelDash!\nYour Instagram is now connected.\n`;

  if (claimedCount > 0) {
    msg += `\n🚀 Saved ${claimedCount} Reel${claimedCount > 1 ? "s" : ""} you sent earlier!\n`;
  }

  msg +=
    `\n✨ What you can do:\n` +
    `📥 1-Tap Save: Share any Reel to this chat to save it instantly\n` +
    `🏷️ Tagging: Reply with /category (e.g. /tech, /recipes) to organize\n` +
    `🔍 Smart Search: Find reels by creator, audio, caption, or niche\n` +
    `📁 Collections: Group reels into custom folders & boards\n\n` +
    `Send me your next Reel anytime!`;

  return msg;
}

/**
 * Redeem a verification code that was generated in Instagram DM.
 *
 * Called from POST /api/instagram/link-code when an authenticated ReelDash user
 * enters the code received in their Instagram DM into the ReelDash website.
 */
export async function redeemDMVerificationCode(
  userId: string,
  rawCode: string
): Promise<{
  success: boolean;
  error?: string;
  username?: string;
  claimedCount?: number;
}> {
  const code = normalizeLinkCode(rawCode);
  if (!isLinkCode(code)) {
    return {
      success: false,
      error: "Invalid code format. Expected a 6-character code (e.g. 7K4P92)",
    };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  try {
    // 1. Look up code
    const { data: codeRecord, error: codeErr } = await supabase
      .from("link_codes")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (codeErr || !codeRecord) {
      return {
        success: false,
        error: "Verification code not found. Please check and try again.",
      };
    }

    if (codeRecord.status === "used") {
      return {
        success: false,
        error: "This code has already been used.",
      };
    }

    if (
      codeRecord.status === "expired" ||
      new Date(codeRecord.expires_at) < new Date()
    ) {
      await supabase
        .from("link_codes")
        .update({ status: "expired" })
        .eq("id", codeRecord.id);
      return {
        success: false,
        error: "This code has expired. Send a Reel or message to @ReelDash on Instagram to get a new code.",
      };
    }

    if (codeRecord.attempts >= MAX_CODE_ATTEMPTS) {
      await supabase
        .from("link_codes")
        .update({ status: "expired" })
        .eq("id", codeRecord.id);
      return {
        success: false,
        error: "Too many attempts for this code. Send a message to @ReelDash on Instagram to get a new code.",
      };
    }

    // 2. Check if this code was generated in DM (has instagram_sender_id)
    const senderIgId = codeRecord.instagram_sender_id;
    if (!senderIgId) {
      // This code was generated on the web for web-to-DM flow
      return {
        success: false,
        error:
          "This code was generated on ReelDash. Send it as a DM to @ReelDash on Instagram to connect your account.",
      };
    }

    const igUsername = codeRecord.instagram_username || "instagram_user";

    // 3. Conflict check: Is this Instagram account linked to a DIFFERENT user?
    const { data: existingLink } = await supabase
      .from("instagram_accounts")
      .select("reeldash_user_id, username, status")
      .eq("instagram_user_id", senderIgId)
      .eq("status", "active")
      .maybeSingle();

    if (existingLink && existingLink.reeldash_user_id !== userId) {
      return {
        success: false,
        error:
          "This Instagram account is already connected to another ReelDash account. Please disconnect it first or contact support.",
      };
    }

    const now = new Date().toISOString();

    // 4. Create or update instagram_accounts record
    const { data: existingUserAccount } = await supabase
      .from("instagram_accounts")
      .select("id")
      .eq("reeldash_user_id", userId)
      .eq("instagram_user_id", senderIgId)
      .maybeSingle();

    let igAccountId: string | null = null;

    if (existingUserAccount) {
      await supabase
        .from("instagram_accounts")
        .update({
          status: "active",
          linked_at: now,
          linked_via: "dm_code",
          is_active: true,
          username: igUsername,
          updated_at: now,
        })
        .eq("id", existingUserAccount.id);
      igAccountId = existingUserAccount.id;
    } else {
      // Check for legacy unverified record to upgrade
      const { data: legacyAcc } = await supabase
        .from("instagram_accounts")
        .select("id")
        .eq("reeldash_user_id", userId)
        .ilike("username", igUsername)
        .maybeSingle();

      if (legacyAcc) {
        await supabase
          .from("instagram_accounts")
          .update({
            instagram_user_id: senderIgId,
            status: "active",
            linked_at: now,
            linked_via: "dm_code",
            is_active: true,
            username: igUsername,
            updated_at: now,
          })
          .eq("id", legacyAcc.id);
        igAccountId = legacyAcc.id;
      } else {
        const { data: newAcc } = await supabase
          .from("instagram_accounts")
          .upsert(
            {
              reeldash_user_id: userId,
              instagram_user_id: senderIgId,
              username: igUsername,
              display_name: igUsername,
              avatar_url: `/api/proxy-image?username=${encodeURIComponent(igUsername)}`,
              is_active: true,
              status: "active",
              linked_at: now,
              linked_via: "dm_code",
              updated_at: now,
            },
            { onConflict: "reeldash_user_id, username" }
          )
          .select("id")
          .maybeSingle();
        igAccountId = newAcc?.id || null;
      }
    }

    // 5. Mark code as used
    await supabase
      .from("link_codes")
      .update({
        status: "used",
        used_at: now,
        reeldash_user_id: userId,
        used_by_ig_id: senderIgId,
      })
      .eq("id", codeRecord.id);

    // 6. Invalidate profile cache
    profileCache.delete(senderIgId);

    // 7. Claim pending reels
    const claimedCount = await claimPendingReelsForUser(
      senderIgId,
      userId,
      igAccountId,
      igUsername
    );

    // 8. Send confirmation DM to user on Instagram with full feature guide
    const confirmMsg = buildWelcomeFeaturesMessage(claimedCount);

    await sendDMReply(senderIgId, confirmMsg, [
      {
        type: "web_url",
        title: "Open ReelDash",
        url: `${APP_URL}/dashboard`,
      },
    ]);

    return {
      success: true,
      username: igUsername,
      claimedCount,
    };
  } catch (err: any) {
    console.error("[Instagram Bot] redeemDMVerificationCode error:", err);
    return {
      success: false,
      error: err?.message || "Internal server error",
    };
  }
}

// ─── Phase 4: Main Message Handler ────────────────────────────────────────────

/**
 * Main Handler for Incoming Instagram Messages & Webhook Payloads.
 *
 * Processing order:
 * 1. Fetch sender profile + follow status
 * 2. Is message a challenge code? → process linking (Phase 5)
 * 3. Is message "DONE"? → verify follow → respond
 * 4. resolveInstagramUserState()
 * 5. Switch on state: READY → process reel, everything else → onboarding
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
    // ── Step 1: Fetch sender profile & follow status ──
    const igUser = await fetchInstagramUserProfile(senderIgId, customUsername);
    let isFollowing =
      forceFollowingStatus !== undefined
        ? forceFollowingStatus
        : igUser.isFollowing;

    const isFollowCheckClick =
      postbackPayload === "CHECK_FOLLOW_STATUS" ||
      (messageText || "").trim().toLowerCase() === "done";

    // If user clicked "I followed you!" / typed DONE, re-check with Meta
    if (isFollowCheckClick) {
      if (forceFollowingStatus !== undefined) {
        isFollowing = forceFollowingStatus;
      } else {
        isFollowing = await checkLiveFollowerStatus(senderIgId);
      }
    }

    // ── Step 2: Is this a challenge code? (Priority: before anything else) ──
    const trimmedText = (messageText || "").trim();
    if (isLinkCode(trimmedText)) {
      const normalizedCode = normalizeLinkCode(trimmedText);
      // Ensure it has numbers OR exists in link_codes to avoid intercepting regular 6-letter words like "THANKS"
      let isConfirmedCode = /\d/.test(normalizedCode);
      const supabase = getSupabaseAdmin();
      if (!isConfirmedCode && supabase) {
        const { data: codeExists } = await supabase
          .from("link_codes")
          .select("id")
          .eq("code", normalizedCode)
          .maybeSingle();
        if (codeExists) isConfirmedCode = true;
      }
      if (isConfirmedCode) {
        return await processLinkCode(senderIgId, normalizedCode, igUser.username);
      }
    }

    // ── Step 2.5: Verification Status Check ("I've verified" button or text) ──
    const isVerificationCheck =
      postbackPayload === "CHECK_VERIFICATION" ||
      isVerificationCheckText(messageText);

    if (isVerificationCheck) {
      return await handleCheckVerification(senderIgId, igUser.username);
    }

    // ── Step 3: Follow-check click response ──
    if (isFollowCheckClick && !isFollowing) {
      const msg =
        "I still can't see your follow. Please make sure you're following @ReelDash, then send DONE again.";
      const buttons: BotButton[] = [
        { type: "postback", title: "DONE", payload: "CHECK_FOLLOW_STATUS" },
      ];
      await sendDMReply(senderIgId, msg, buttons);
      return {
        status: "follow_required",
        replyMessage: msg,
        buttons,
        senderIgId,
        username: igUser.username,
        isFollowing: false,
      };
    }

    if (isFollowCheckClick && isFollowing) {
      // Follow confirmed! Proceed immediately to Google connect flow with code & claim any pending reels
      return await handleUnverifiedSender(
        senderIgId,
        igUser.username,
        messageText,
        attachments,
        true
      );
    }

    // ── Step 4: Resolve authorization state ──
    const resolved = await resolveInstagramUserState(senderIgId, isFollowing);

    // ── Step 5: Handle each state ──
    switch (resolved.state) {
      case "NOT_FOLLOWING":
        return await handleNotFollowing(
          senderIgId,
          igUser.username,
          messageText,
          attachments
        );

      case "NEEDS_SIGNUP":
      case "NEEDS_REVERIFICATION":
      case "ACCOUNT_INACTIVE":
        return await handleUnverifiedSender(
          senderIgId,
          igUser.username,
          messageText,
          attachments
        );

      case "READY":
        return await handleReady(
          senderIgId,
          igUser.username,
          resolved.reeldashUserId!,
          resolved.instagramAccountId!,
          messageText,
          attachments
        );

      case "ERROR":
      default:
        const errMsg =
          "Something went wrong on our end. Please try again in a moment.";
        await sendDMReply(senderIgId, errMsg);
        return {
          status: "error",
          replyMessage: errMsg,
          senderIgId,
          username: igUser.username,
          isFollowing,
        };
    }
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

// ─── State Handlers ───────────────────────────────────────────────────────────

async function handleNotFollowing(
  senderIgId: string,
  username: string,
  messageText?: string,
  attachments: any[] = []
): Promise<ProcessedDMResult> {
  // If user sent a reel, store it as pending so they never lose it
  const mediaUrl = messageText
    ? extractInstagramMediaUrl(messageText, attachments)
    : null;
  if (mediaUrl) {
    await storePendingReel(
      senderIgId,
      username,
      mediaUrl,
      messageText || "",
      attachments
    );
  }

  const isPost =
    mediaUrl && (mediaUrl.includes("/p/") || mediaUrl.includes("/share/p/"));
  const mediaLabel = isPost ? "Post" : "Reel";

  const msg = mediaUrl
    ? `👋 Welcome to ReelDash!\n\nI received your ${mediaLabel}! To save it, please follow @ReelDash on Instagram first.\n\nOnce you've followed, tap DONE below!`
    : `👋 Welcome to ReelDash!\n\nFirst follow @ReelDash on Instagram to use ReelDash.\n\nThen tap DONE below!`;

  const buttons: BotButton[] = [
    { type: "postback", title: "DONE", payload: "CHECK_FOLLOW_STATUS" },
  ];

  await sendDMReply(senderIgId, msg, buttons);

  return {
    status: "follow_required",
    replyMessage: msg,
    buttons,
    senderIgId,
    username,
    isFollowing: false,
  };
}

async function handleUnverifiedSender(
  senderIgId: string,
  username: string,
  messageText: string,
  attachments: any[],
  followJustConfirmed = false
): Promise<ProcessedDMResult> {
  const supabase = getSupabaseAdmin();
  // If user sent a reel or post, store it as pending so they never lose it
  const mediaUrl = extractInstagramMediaUrl(messageText, attachments);
  if (mediaUrl) {
    await storePendingReel(senderIgId, username, mediaUrl, messageText, attachments);
  }

  // Generate a fresh 6-character challenge code (guaranteed digits + letters)
  const code = generateLinkCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CODE_EXPIRY_SECONDS * 1000); // 4 mins

  if (supabase) {
    try {
      await supabase
        .from("link_codes")
        .update({ status: "expired" })
        .eq("instagram_sender_id", senderIgId)
        .eq("status", "pending");

      await supabase.from("link_codes").insert({
        code,
        instagram_sender_id: senderIgId,
        instagram_username: username || null,
        status: "pending",
        attempts: 0,
        expires_at: expiresAt.toISOString(),
      });
    } catch (dbErr) {
      console.error("[Instagram Bot] Error saving link code:", dbErr);
    }
  }

  const connectUrl = `${APP_URL}/connect-instagram?code=${code}`;

  const isPost =
    mediaUrl && (mediaUrl.includes("/p/") || mediaUrl.includes("/share/p/"));
  const mediaLabel = isPost ? "Post" : "Reel";

  const msg = followJustConfirmed
    ? `✅ Follow confirmed!\n\nNow connect your Instagram to ReelDash with your Google account to save ${mediaLabel}s:\n1️⃣ Tap '🔗 Connect Account' below\n2️⃣ Sign in with your Google account on ReelDash\n3️⃣ ${mediaLabel} saved automatically!\n\n(Code: ${code} • expires in 4m)`
    : mediaUrl
    ? `🔒 Almost there!\n\nI received your ${mediaLabel}! Connect your Instagram to save it:\n1️⃣ Tap '🔗 Connect Account' below\n2️⃣ Sign in with your Google account on ReelDash\n3️⃣ ${mediaLabel} saved automatically!\n\n(Code: ${code} • expires in 4m)`
    : `Welcome to ReelDash! 👋\n\nConnect your Instagram in 2 steps:\n1️⃣ Tap '🔗 Connect Account' below\n2️⃣ Sign in with your Google account on ReelDash\n\n(Code: ${code} • expires in 4m)`;

  const buttons: BotButton[] = [
    {
      type: "web_url",
      title: "🔗 Connect Account",
      url: connectUrl,
    },
  ];

  await sendDMReply(senderIgId, msg, buttons);

  return {
    status: mediaUrl ? "reel_pending" : "needs_signup",
    replyMessage: msg,
    buttons,
    senderIgId,
    username,
    isFollowing: true,
  };
}

async function handleReady(
  senderIgId: string,
  username: string,
  reeldashUserId: string,
  instagramAccountId: string,
  messageText: string,
  attachments: any[]
): Promise<ProcessedDMResult> {
  // Parse category commands
  const parsedCmd = parseCategoryCommand(messageText || "");
  const mediaUrl = extractInstagramMediaUrl(
    parsedCmd.cleanUrl || parsedCmd.cleanText || messageText,
    attachments
  );

  // ── Reel received ──
  if (mediaUrl) {
    const allCategories = parsedCmd.categories;
    const note = parsedCmd.note;

    // Fetch reel metadata if it's an Instagram web URL
    let reelData: any = null;
    if (mediaUrl.includes("instagram.com") || mediaUrl.includes("instagr.am")) {
      try {
        const infoRes = await fetch(
          `${APP_URL}/api/reel-info?url=${encodeURIComponent(mediaUrl)}`
        );
        if (infoRes.ok) {
          reelData = await infoRes.json();
        }
      } catch (err) {
        console.warn("[Instagram Bot] reel-info fetch fallback:", err);
      }
    }

    const isAudio =
      mediaUrl.includes("/audio/") || mediaUrl.includes("/reels/audio/");
    const isPost =
      !isAudio &&
      (mediaUrl.includes("/p/") ||
        mediaUrl.includes("/share/p/") ||
        mediaUrl.includes("lookaside.fbsbx.com") ||
        mediaUrl.includes("cdninstagram.com") ||
        mediaUrl.includes("fbcdn.net") ||
        mediaUrl.match(/\.(jpg|jpeg|png|webp|gif)($|\?)/i) !== null ||
        attachments?.some((a) =>
          ["image", "share", "ig_post"].includes(a?.type)
        ) ||
        reelData?.mediaType === "post" ||
        reelData?.media_type === "post");

    if (!reelData || !reelData.shortcode) {
      const shortcodeMatch = mediaUrl.match(
        /\/(?:share\/)?(?:reel|reels|p|stories|audio)\/([A-Za-z0-9_.-]+)/i
      );
      const shortcode = shortcodeMatch
        ? shortcodeMatch[1]
        : `${isPost ? "post" : isAudio ? "audio" : "reel"}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

      const isDirectCdn =
        mediaUrl.includes("lookaside.fbsbx.com") ||
        mediaUrl.includes("cdninstagram.com") ||
        mediaUrl.includes("fbcdn.net") ||
        mediaUrl.startsWith("http");

      // Check if attachment or message had title / notes
      const attTitle = attachments?.find(
        (a) => a?.payload?.title || a?.title
      )?.payload?.title || attachments?.find((a) => a?.title)?.title;

      const fallbackCaption =
        attTitle ||
        parsedCmd.note ||
        (parsedCmd.cleanText && !parsedCmd.cleanText.startsWith("/")
          ? parsedCmd.cleanText
          : `Instagram ${isAudio ? "Audio" : isPost ? "Post" : "Reel"} shared via Direct Message`);

      const thumb = isDirectCdn
        ? `/api/proxy-image?url=${encodeURIComponent(mediaUrl)}&shortcode=${shortcode}`
        : `/api/proxy-image?shortcode=${shortcode}`;

      const extracted = extractCreatorFromPost(
        fallbackCaption,
        mediaUrl,
        attachments,
        username
      );

      reelData = {
        shortcode,
        url: mediaUrl,
        thumbnailUrl: thumb,
        video_url: mediaUrl,
        caption: fallbackCaption,
        creatorUsername: extracted.handle,
        creator_name: extracted.name,
        creatorAvatar: `/api/proxy-image?username=${encodeURIComponent(extracted.handle)}`,
        mediaType: isAudio ? "audio" : isPost ? "post" : "reel",
        duration: isAudio ? "0:30" : isPost ? "Post" : "0:15",
        category: allCategories[0] || (isAudio ? "Music" : "General"),
        hashtags: [
          "instagram-dm",
          isAudio ? "audio" : isPost ? "post" : "reel",
          "auto-save",
        ],
      };
    }

    const effectiveCategory =
      allCategories.length > 0
        ? allCategories[0]
        : reelData.category || "General";
    const tags = [
      ...(reelData.hashtags || reelData.tags || ["instagram-dm", "auto-save"]),
    ];
    for (const cat of allCategories) {
      if (!tags.includes(cat.toLowerCase())) tags.push(cat.toLowerCase());
    }

    let creatorHandle =
      reelData.creatorUsername || reelData.creator_handle || "";

    let creatorName =
      reelData.creatorFullName || reelData.creator_name || "";

    // If creatorHandle fell back to an ig_ shortcode, "creator", "instagram", or matches the DM sender's handle:
    if (
      !creatorHandle ||
      creatorHandle === "creator" ||
      creatorHandle === "instagram" ||
      creatorHandle.startsWith("ig_") ||
      (username && creatorHandle.toLowerCase() === username.toLowerCase())
    ) {
      const extracted = extractCreatorFromPost(
        reelData.caption ||
          (isPost
            ? "Saved Instagram Post"
            : isAudio
            ? "Saved Instagram Audio"
            : "Saved Instagram Reel"),
        mediaUrl,
        attachments,
        username
      );
      creatorHandle = extracted.handle;
      creatorName = extracted.name;
    }

    let finalCaption =
      reelData.caption ||
      (isPost
        ? "Saved Instagram Post"
        : isAudio
        ? "Saved Instagram Audio"
        : "Saved Instagram Reel");
    const cleanQuote = finalCaption.match(/^[A-Za-z0-9_.]+\s+on\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}:\s*"([\s\S]*?)"(?:\.|\s*)$/);
    if (cleanQuote && cleanQuote[1]) {
      finalCaption = cleanQuote[1].trim();
    }

    const rawThumb =
      reelData.thumbnailUrl ||
      reelData.thumbnail_url ||
      "";
    let formattedThumbnailUrl = `/api/proxy-image?shortcode=${encodeURIComponent(reelData.shortcode)}&creator=${encodeURIComponent(creatorHandle)}`;
    if (rawThumb) {
      if (rawThumb.startsWith("/api/proxy-image")) {
        try {
          const parsed = new URL(rawThumb, "http://localhost");
          if (!parsed.searchParams.has("shortcode")) parsed.searchParams.set("shortcode", reelData.shortcode);
          if (!parsed.searchParams.has("creator")) parsed.searchParams.set("creator", creatorHandle);
          formattedThumbnailUrl = `${parsed.pathname}${parsed.search}`;
        } catch {
          formattedThumbnailUrl = rawThumb;
        }
      } else if (rawThumb.startsWith("http")) {
        formattedThumbnailUrl = `/api/proxy-image?shortcode=${encodeURIComponent(reelData.shortcode)}&creator=${encodeURIComponent(creatorHandle)}&url=${encodeURIComponent(rawThumb)}`;
      }
    }

    const formattedReel = {
      shortcode: reelData.shortcode,
      url: reelData.url || mediaUrl,
      thumbnail_url: formattedThumbnailUrl,
      video_url: reelData.mediaUrl || reelData.video_url || mediaUrl,
      caption: finalCaption,
      creator_handle: creatorHandle,
      creator_name:
        reelData.creatorFullName ||
        reelData.creator_name ||
        (creatorHandle && !creatorHandle.startsWith("ig_") && creatorHandle !== "creator"
          ? creatorHandle
          : "Instagram Creator"),
      creator_avatar:
        reelData.creatorAvatar ||
        reelData.creator_avatar ||
        `/api/proxy-image?username=${encodeURIComponent(creatorHandle)}`,
      media_type: isPost
        ? "post"
        : isAudio
        ? "audio"
        : reelData.mediaType || reelData.media_type || "reel",
      duration: (reelData.carouselImages && reelData.carouselImages.length > 1)
        ? `Carousel (${reelData.carouselImages.length})`
        : isPost
        ? "Post"
        : reelData.duration || (isAudio ? "0:30" : "0:15"),
      category: effectiveCategory,
      tags,
      note: note || reelData.note || undefined,
      is_carousel: reelData.isCarousel || reelData.is_carousel || (reelData.carouselImages && reelData.carouselImages.length > 1) || (reelData.duration && reelData.duration.includes("Carousel")) || false,
      carousel_images: reelData.carouselImages || reelData.carousel_images || null,
    };

    // Reel-level deduplication
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data: existingReel } = await supabase
        .from("reels")
        .select("id, category, tags, created_at, updated_at")
        .eq("user_id", reeldashUserId)
        .eq("shortcode", formattedReel.shortcode)
        .maybeSingle();

      if (existingReel) {
        const ageMs =
          Date.now() - new Date(existingReel.created_at).getTime();
        if (Math.abs(ageMs) < 25000) {
          // Duplicate webhook within 25s — merge categories if present
          if (allCategories.length > 0) {
            await supabase
              .from("reels")
              .update({
                category: allCategories[0],
                tags: [
                  ...(existingReel.tags || []),
                  ...allCategories.map((c) => c.toLowerCase()),
                ],
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingReel.id);
          }
          return {
            status: "reel_saved",
            replyMessage: "Duplicate webhook merged",
            senderIgId,
            username,
            isFollowing: true,
          };
        }
      }
    }

    // Save to library
    const saveResult = await saveReelForUser(
      reeldashUserId,
      instagramAccountId,
      username,
      formattedReel,
      allCategories
    );

    // Wait for follow-up category if no category was provided
    let finalCategories =
      allCategories.length > 0
        ? [...allCategories]
        : [formattedReel.category || "General"];

    if (allCategories.length === 0 && supabase) {
      for (let i = 0; i < 24; i++) {
        await new Promise((r) => setTimeout(r, 500));
        try {
          const { data: dbReel } = await supabase
            .from("reels")
            .select("category, tags, created_at, updated_at")
            .eq("user_id", reeldashUserId)
            .eq("shortcode", formattedReel.shortcode)
            .maybeSingle();

          if (dbReel) {
            const isCatChanged =
              dbReel.category &&
              dbReel.category !== (formattedReel.category || "General");
            const isUpdated =
              dbReel.updated_at &&
              dbReel.created_at &&
              new Date(dbReel.updated_at).getTime() >
                new Date(dbReel.created_at).getTime() + 150;

            if (isCatChanged || isUpdated) {
              finalCategories = dbReel.category
                ? [dbReel.category]
                : finalCategories;
              break;
            }
          }
        } catch {
          // Ignore polling errors
        }
      }
    }

    const mediaLabel = isPost ? "Post" : isAudio ? "Audio" : "Reel";
    const mediaIcon = isPost ? "📸" : isAudio ? "🎵" : "🎬";

    const creatorText =
      formattedReel.creator_handle &&
      formattedReel.creator_handle !== "creator" &&
      formattedReel.creator_handle !== "instagram" &&
      !formattedReel.creator_handle.startsWith("ig_") &&
      (!username || formattedReel.creator_handle.toLowerCase() !== username.toLowerCase())
        ? `@${formattedReel.creator_handle}'s ${mediaLabel}`
        : mediaLabel;

    const catLabel = finalCategories.length > 1 ? "Categories" : "Category";
    const categoryLine = `${catLabel}: ${finalCategories.join(", ")}`;

    const successReply = `✅ Saved to your ReelDash Library.\n\n${mediaIcon} ${creatorText}\n📁 ${categoryLine}`;
    const buttons: BotButton[] = [
      {
        type: "web_url",
        title: "Open in ReelDash",
        url: `${APP_URL}/dashboard`,
      },
    ];

    await sendDMReply(senderIgId, successReply, buttons);

    return {
      status: "reel_saved",
      replyMessage: successReply,
      buttons,
      senderIgId,
      username,
      isFollowing: true,
      savedReel: saveResult.savedItem,
    };
  }

  // ── Category-only command (follow-up) ──
  if (!mediaUrl && parsedCmd.categories.length > 0) {
    const allCategories = parsedCmd.categories;
    const note = parsedCmd.note;

    const updateResult = await updateRecentReelCategoryForUser(
      reeldashUserId,
      allCategories,
      note
    );

    if (updateResult.isWithinPendingWindow) {
      return {
        status: "category_assigned",
        replyMessage: "Category merged into incoming reel",
        senderIgId,
        username,
        isFollowing: true,
        savedReel: updateResult.reel,
      };
    }

    const catLabel = allCategories.length > 1 ? "Categories" : "Category";
    const updateReply = `📁 ${catLabel} updated: ${allCategories.join(", ")}`;
    const buttons: BotButton[] = [
      {
        type: "web_url",
        title: "Open in ReelDash",
        url: `${APP_URL}/dashboard`,
      },
    ];

    await sendDMReply(senderIgId, updateReply, buttons);

    return {
      status: "category_assigned",
      replyMessage: updateReply,
      buttons,
      senderIgId,
      username,
      isFollowing: true,
      savedReel: updateResult.reel,
    };
  }

  // ── Generic greeting ──
  const greetingReply = `Your ReelDash sync is active. Send or share any Instagram Reel, Post, or Audio here to save it.\n\n💡 Tip: Type /<category> to categorize saves instantly!`;
  const buttons: BotButton[] = [
    {
      type: "web_url",
      title: "Open in ReelDash",
      url: `${APP_URL}/dashboard`,
    },
  ];

  await sendDMReply(senderIgId, greetingReply, buttons);

  return {
    status: "message_received",
    replyMessage: greetingReply,
    buttons,
    senderIgId,
    username,
    isFollowing: true,
  };
}

// ─── Phase 5: Challenge Code Verification ─────────────────────────────────────

/**
 * Process a DM challenge code (e.g. 7K4P92).
 *
 * Atomic transaction:
 * 1. Validate code (exists, not expired, not used, not rate-limited)
 * 2. Check account conflict (IG ID already linked to different user)
 * 3. Create/update instagram_accounts with verified sender ID
 * 4. Mark code as used
 * 5. Claim pending reels
 */
async function processLinkCode(
  senderIgId: string,
  code: string,
  igUsername: string
): Promise<ProcessedDMResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const msg = "Something went wrong. Please try again.";
    await sendDMReply(senderIgId, msg);
    return {
      status: "error",
      replyMessage: msg,
      senderIgId,
      username: igUsername,
      isFollowing: true,
    };
  }

  try {
    // 1. Look up the code
    const { data: codeRecord } = await supabase
      .from("link_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("status", "pending")
      .maybeSingle();

    if (!codeRecord) {
      // Check if code exists but is already used or expired
      const { data: anyCode } = await supabase
        .from("link_codes")
        .select("status")
        .eq("code", code.toUpperCase())
        .maybeSingle();

      let msg: string;
      if (anyCode?.status === "used") {
        msg = "This code has already been used. Generate a new one at ReelDash.";
      } else if (anyCode?.status === "expired") {
        msg =
          "This code has expired. Generate a new one in your ReelDash settings.";
      } else {
        msg = "Invalid code. Please check and try again.";
      }

      await sendDMReply(senderIgId, msg);
      return {
        status: "link_code_failed",
        replyMessage: msg,
        senderIgId,
        username: igUsername,
        isFollowing: true,
      };
    }

    // 2. Rate limit check
    if (codeRecord.attempts >= MAX_CODE_ATTEMPTS) {
      const msg =
        "Too many failed attempts for this code. Generate a new one at ReelDash.";
      await supabase
        .from("link_codes")
        .update({ status: "expired" })
        .eq("id", codeRecord.id);
      await sendDMReply(senderIgId, msg);
      return {
        status: "link_code_failed",
        replyMessage: msg,
        senderIgId,
        username: igUsername,
        isFollowing: true,
      };
    }

    // 3. Check expiry
    if (new Date(codeRecord.expires_at) < new Date()) {
      await supabase
        .from("link_codes")
        .update({ status: "expired" })
        .eq("id", codeRecord.id);
      const msg =
        "This code has expired. Generate a new one in your ReelDash settings.";
      await sendDMReply(senderIgId, msg);
      return {
        status: "link_code_failed",
        replyMessage: msg,
        senderIgId,
        username: igUsername,
        isFollowing: true,
      };
    }

    // 4. Account conflict check — is this IG ID already linked to a DIFFERENT user?
    const { data: existingLink } = await supabase
      .from("instagram_accounts")
      .select("reeldash_user_id, username, status")
      .eq("instagram_user_id", senderIgId)
      .in("status", ["active"])
      .maybeSingle();

    if (
      existingLink &&
      existingLink.reeldash_user_id !== codeRecord.reeldash_user_id
    ) {
      // HARD BLOCK — do not reassign, do not overwrite
      const msg = `This Instagram account is already connected to another ReelDash account.\n\nIf you think this is an error, disconnect it from the other account first, or contact support.`;
      // Increment attempts
      await supabase
        .from("link_codes")
        .update({ attempts: codeRecord.attempts + 1 })
        .eq("id", codeRecord.id);
      await sendDMReply(senderIgId, msg);
      return {
        status: "link_code_failed",
        replyMessage: msg,
        senderIgId,
        username: igUsername,
        isFollowing: true,
      };
    }

    // ── Begin atomic linking ──

    const userId = codeRecord.reeldash_user_id;
    const now = new Date().toISOString();

    // 5. Create or update instagram_accounts
    // Check if there's an existing record for this user+IG combination
    const { data: existingAccount } = await supabase
      .from("instagram_accounts")
      .select("id")
      .eq("reeldash_user_id", userId)
      .eq("instagram_user_id", senderIgId)
      .maybeSingle();

    if (existingAccount) {
      // Update existing record to active
      await supabase
        .from("instagram_accounts")
        .update({
          status: "active",
          linked_at: now,
          linked_via: "dm_code",
          is_active: true,
          username: igUsername,
          updated_at: now,
        })
        .eq("id", existingAccount.id);
    } else {
      // Check for legacy_unverified record by username that we should upgrade
      const { data: legacyAccount } = await supabase
        .from("instagram_accounts")
        .select("id")
        .eq("reeldash_user_id", userId)
        .ilike("username", igUsername)
        .in("status", ["legacy_unverified", "inactive", "pending"])
        .maybeSingle();

      if (legacyAccount) {
        // Upgrade legacy record with verified IG ID
        await supabase
          .from("instagram_accounts")
          .update({
            instagram_user_id: senderIgId,
            status: "active",
            linked_at: now,
            linked_via: "dm_code",
            is_active: true,
            username: igUsername,
            updated_at: now,
          })
          .eq("id", legacyAccount.id);
      } else {
        // Create or update record
        await supabase.from("instagram_accounts").upsert(
          {
            reeldash_user_id: userId,
            instagram_user_id: senderIgId,
            username: igUsername,
            display_name: igUsername,
            avatar_url: `/api/proxy-image?username=${encodeURIComponent(igUsername)}`,
            is_active: true,
            status: "active",
            linked_at: now,
            linked_via: "dm_code",
            updated_at: now,
          },
          { onConflict: "reeldash_user_id, username" }
        );
      }
    }

    // 6. Mark code as used
    await supabase
      .from("link_codes")
      .update({
        status: "used",
        used_at: now,
        used_by_ig_id: senderIgId,
      })
      .eq("id", codeRecord.id);

    // 7. Claim pending reels — server-side only, tied to the verified sender ID
    const { data: igAccount } = await supabase
      .from("instagram_accounts")
      .select("id")
      .eq("reeldash_user_id", userId)
      .eq("instagram_user_id", senderIgId)
      .eq("status", "active")
      .maybeSingle();

    const igAccountId = igAccount?.id || null;
    const claimedCount = await claimPendingReelsForUser(
      senderIgId,
      userId,
      igAccountId,
      igUsername
    );

    // Invalidate cache
    profileCache.delete(senderIgId);

    // 8. Success reply with full feature guide
    const msg = buildWelcomeFeaturesMessage(claimedCount);

    const buttons: BotButton[] = [
      {
        type: "web_url",
        title: "Open ReelDash",
        url: `${APP_URL}/dashboard`,
      },
    ];

    await sendDMReply(senderIgId, msg, buttons);

    return {
      status: "link_code_success",
      replyMessage: msg,
      buttons,
      senderIgId,
      username: igUsername,
      isFollowing: true,
    };
  } catch (err: any) {
    console.error("[Instagram Bot] Link code processing error:", err);
    const msg = "Something went wrong verifying your code. Please try again.";
    await sendDMReply(senderIgId, msg);
    return {
      status: "error",
      replyMessage: msg,
      senderIgId,
      username: igUsername,
      isFollowing: true,
    };
  }
}

// ─── Phase 6: Pending Reel Storage ────────────────────────────────────────────

/**
 * Store a reel from an unlinked sender in pending_reels.
 * The reel will be claimed server-side when the DM challenge linking completes.
 */
async function storePendingReel(
  senderIgId: string,
  username: string,
  mediaUrl: string,
  messageText: string,
  attachments: any[]
): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  try {
    const shortcodeMatch = mediaUrl.match(
      /\/(?:share\/)?(?:reel|reels|p|stories|audio)\/([A-Za-z0-9_.-]+)/i
    );
    const shortcode = shortcodeMatch ? shortcodeMatch[1] : null;

    // Check if this exact reel is already pending for this sender
    if (shortcode) {
      const { data: existing } = await supabase
        .from("pending_reels")
        .select("id")
        .eq("instagram_sender_id", senderIgId)
        .eq("reel_shortcode", shortcode)
        .eq("status", "pending")
        .maybeSingle();

      if (existing) return;
    }

    // Fetch basic reel info
    let reelData: any = {};
    try {
      const infoRes = await fetch(
        `${APP_URL}/api/reel-info?url=${encodeURIComponent(mediaUrl)}`
      );
      if (infoRes.ok) {
        reelData = await infoRes.json();
      }
    } catch {
      // Fallback — store URL-only
    }

    const isAudio =
      mediaUrl.includes("/audio/") || mediaUrl.includes("/reels/audio/");
    const isPost =
      !isAudio &&
      (mediaUrl.includes("/p/") ||
        mediaUrl.includes("/share/p/") ||
        mediaUrl.includes("lookaside.fbsbx.com") ||
        mediaUrl.includes("cdninstagram.com") ||
        mediaUrl.includes("fbcdn.net") ||
        mediaUrl.match(/\.(jpg|jpeg|png|webp|gif)($|\?)/i) !== null ||
        attachments?.some((a) =>
          ["image", "share", "ig_post"].includes(a?.type)
        ));

    if (!reelData || !reelData.shortcode) {
      const isDirectCdn =
        mediaUrl.includes("lookaside.fbsbx.com") ||
        mediaUrl.includes("cdninstagram.com") ||
        mediaUrl.includes("fbcdn.net") ||
        mediaUrl.startsWith("http");

      const generatedShortcode =
        shortcode ||
        `${isPost ? "post" : isAudio ? "audio" : "reel"}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

      const attTitle =
        attachments?.find((a) => a?.payload?.title || a?.title)?.payload?.title ||
        attachments?.find((a) => a?.title)?.title ||
        "";
      const fallbackCaption =
        attTitle ||
        messageText ||
        `Instagram ${isAudio ? "Audio" : isPost ? "Post" : "Reel"} shared via Direct Message`;

      const extracted = extractCreatorFromPost(
        fallbackCaption,
        mediaUrl,
        attachments,
        username
      );

      reelData = {
        shortcode: generatedShortcode,
        url: mediaUrl,
        thumbnailUrl: isDirectCdn
          ? `/api/proxy-image?url=${encodeURIComponent(mediaUrl)}&shortcode=${generatedShortcode}`
          : `/api/proxy-image?shortcode=${generatedShortcode}`,
        video_url: mediaUrl,
        caption: fallbackCaption,
        creatorUsername: extracted.handle,
        creator_name: extracted.name,
        creatorAvatar: `/api/proxy-image?username=${encodeURIComponent(extracted.handle)}`,
        mediaType: isAudio ? "audio" : isPost ? "post" : "reel",
        duration: isAudio ? "0:30" : isPost ? "Post" : "0:15",
        category: "General",
        hashtags: [
          "instagram-dm",
          isAudio ? "audio" : isPost ? "post" : "reel",
          "auto-save",
        ],
      };
    }

    await supabase.from("pending_reels").insert({
      instagram_sender_id: senderIgId,
      instagram_username: username,
      reel_url: mediaUrl,
      reel_shortcode: shortcode || reelData.shortcode || null,
      reel_data: reelData,
      message_text: messageText,
      attachments: attachments.length > 0 ? attachments : null,
    });
  } catch (err) {
    console.warn("[Instagram Bot] Failed to store pending reel:", err);
  }
}

// ─── Reel Save Logic ──────────────────────────────────────────────────────────

/**
 * Save a Reel to the user's library in Supabase.
 */
async function saveReelForUser(
  userId: string,
  instagramAccountId: string,
  igUsername: string,
  reel: any,
  requestedCategories: string[] = []
): Promise<{ savedItem: any; newCategories: string[]; assignedCategories: string[] }> {
  const newCategories: string[] = [];
  const assignedCategories: string[] = [];

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return { savedItem: reel, newCategories: [], assignedCategories: [] };
    }

    // Extract caption hashtags
    const extractedHashtags: string[] = [];
    if (reel.caption) {
      const hMatches = reel.caption.match(/#([a-zA-Z0-9_\u0080-\uFFFF]+)/g);
      if (hMatches) {
        hMatches.forEach((h: string) => {
          const lower = h.toLowerCase();
          if (!extractedHashtags.includes(lower)) extractedHashtags.push(lower);
        });
      }
    }
    if (Array.isArray(reel.tags)) {
      reel.tags.forEach((t: string) => {
        if (t && !extractedHashtags.includes(t.toLowerCase())) {
          extractedHashtags.push(t.toLowerCase());
        }
      });
    }

    // Upsert Reel
    const { data: savedDbReel } = await supabase
      .from("reels")
      .upsert(
        {
          user_id: userId,
          instagram_account_id: instagramAccountId || null,
          instagram_username: igUsername || null,
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
          tags: extractedHashtags,
          note: reel.note || null,
          is_carousel: reel.is_carousel || false,
          carousel_images: reel.carousel_images || null,
          source: "dm",
        },
        { onConflict: "user_id,shortcode" }
      )
      .select()
      .single();

    if (savedDbReel) {
      // Link categories
      for (const catName of requestedCategories) {
        assignedCategories.push(catName);
        const formatted = formatCategoryDisplayName(catName);
        const normalized = formatted.toLowerCase();
        const slug = normalized
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

        const { data: catRecord } = await supabase
          .from("categories")
          .upsert(
            {
              user_id: userId,
              name: formatted,
              normalized_name: normalized,
              slug,
              source: "dm",
            },
            { onConflict: "user_id,normalized_name" }
          )
          .select("id")
          .single();

        if (catRecord) {
          await supabase
            .from("reel_categories")
            .upsert(
              { reel_id: savedDbReel.id, category_id: catRecord.id },
              { onConflict: "reel_id,category_id" }
            );
        }
      }

      // Link hashtags
      for (const rawHash of extractedHashtags) {
        const normHash = rawHash.replace(/^#+/, "").toLowerCase();
        if (normHash) {
          const { data: hashRecord } = await supabase
            .from("hashtags")
            .upsert(
              { name: `#${normHash}`, normalized_name: normHash },
              { onConflict: "normalized_name" }
            )
            .select("id")
            .single();

          if (hashRecord) {
            await supabase
              .from("reel_hashtags")
              .upsert(
                { reel_id: savedDbReel.id, hashtag_id: hashRecord.id },
                { onConflict: "reel_id,hashtag_id" }
              );
          }
        }
      }

      return { savedItem: savedDbReel, newCategories, assignedCategories };
    }

    return { savedItem: reel, newCategories, assignedCategories };
  } catch (dbErr) {
    console.warn("[Instagram Bot] Supabase save error:", dbErr);
    return { savedItem: reel, newCategories: [], assignedCategories: [] };
  }
}

/**
 * Update the user's most recent saved reel with category commands.
 */
async function updateRecentReelCategoryForUser(
  userId: string,
  categories: string[],
  note?: string | null
): Promise<{
  reel: any | null;
  newCategories: string[];
  isWithinPendingWindow: boolean;
}> {
  const primaryCategory = categories[0];
  let isWithinPendingWindow = false;

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return { reel: null, newCategories: [], isWithinPendingWindow: false };
    }

    const { data: latestDbReel } = await supabase
      .from("reels")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestDbReel) {
      const createdAtMs = new Date(latestDbReel.created_at).getTime();
      const ageMs = Date.now() - createdAtMs;
      if (Math.abs(ageMs) <= 25000) {
        isWithinPendingWindow = true;
      }

      const currentTags = Array.isArray(latestDbReel.tags)
        ? [...latestDbReel.tags]
        : [];
      for (const cat of categories) {
        if (!currentTags.includes(cat.toLowerCase())) {
          currentTags.push(cat.toLowerCase());
        }
      }

      const nowIso = new Date().toISOString();
      await supabase
        .from("reels")
        .update({
          category: primaryCategory,
          tags: currentTags,
          note: note || latestDbReel.note || null,
          updated_at: nowIso,
        })
        .eq("id", latestDbReel.id);

      // Link category records
      for (const catName of categories) {
        const formatted = formatCategoryDisplayName(catName);
        const normalized = formatted.toLowerCase();
        const slug = normalized
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

        const { data: catRecord } = await supabase
          .from("categories")
          .upsert(
            {
              user_id: userId,
              name: formatted,
              normalized_name: normalized,
              slug,
              source: "dm",
            },
            { onConflict: "user_id,normalized_name" }
          )
          .select("id")
          .single();

        if (catRecord) {
          await supabase
            .from("reel_categories")
            .upsert(
              { reel_id: latestDbReel.id, category_id: catRecord.id },
              { onConflict: "reel_id,category_id" }
            );
        }
      }

      return {
        reel: { ...latestDbReel, category: primaryCategory, tags: currentTags },
        newCategories: [],
        isWithinPendingWindow,
      };
    }

    return { reel: null, newCategories: [], isWithinPendingWindow: false };
  } catch (err) {
    console.warn("[Instagram Bot] Update recent reel error:", err);
    return { reel: null, newCategories: [], isWithinPendingWindow: false };
  }
}

// ─── Instagram API Helpers ────────────────────────────────────────────────────

/**
 * Strict Live Meta Follower Status Verification
 */
async function checkLiveFollowerStatus(senderIgId: string): Promise<boolean> {
  if (!IG_PAGE_ACCESS_TOKEN) return false;

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

  // If Meta doesn't provide follow data, don't fake it.
  // Return true to avoid blocking users when the API is unavailable.
  // The DM challenge code is the real security gate, not the follow check.
  return true;
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
  let username =
    typeof customUsername === "string"
      ? customUsername.replace(/^@/, "")
      : typeof customUsername === "object" && customUsername?.username
        ? customUsername.username.replace(/^@/, "")
        : `ig_user_${senderIgId.slice(-4)}`;
  let fullName =
    typeof customUsername === "object" && customUsername?.fullName
      ? customUsername.fullName
      : "Instagram User";
  let avatar =
    typeof customUsername === "object" && customUsername?.avatar
      ? customUsername.avatar
      : `/api/proxy-image?username=${encodeURIComponent(username)}`;

  if (IG_PAGE_ACCESS_TOKEN) {
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
    } catch {}

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

  return { username, fullName, avatar, isFollowing };
}

// ─── Utility Functions ────────────────────────────────────────────────────────

/**
/**
 * Extract canonical Instagram media URL from text string
 */
function extractCanonicalInstagramUrl(text: string): string | null {
  if (!text || typeof text !== "string") return null;

  const fullUrlMatch = text.match(
    /https?:\/\/(?:www\.)?(?:instagram\.com|instagr\.am)\/(?:share\/)?(?:[A-Za-z0-9_.]+\/)?(reel|reels|p|stories|audio)\/([A-Za-z0-9_.-]+)\/?/i
  );

  if (fullUrlMatch) {
    const type = fullUrlMatch[1].toLowerCase();
    const shortcode = fullUrlMatch[2];
    if (type === "p") {
      return `https://www.instagram.com/p/${shortcode}/`;
    }
    if (type === "audio") {
      return `https://www.instagram.com/reels/audio/${shortcode}/`;
    }
    if (type === "stories") {
      return fullUrlMatch[0];
    }
    return `https://www.instagram.com/reel/${shortcode}/`;
  }

  const shortcodeMatch = text.match(
    /\/(?:share\/)?(reel|reels|p|stories|audio)\/([A-Za-z0-9_.-]+)/i
  );
  if (shortcodeMatch) {
    const type = shortcodeMatch[1].toLowerCase();
    const shortcode = shortcodeMatch[2];
    if (type === "p") {
      return `https://www.instagram.com/p/${shortcode}/`;
    }
    if (type === "audio") {
      return `https://www.instagram.com/reels/audio/${shortcode}/`;
    }
    return `https://www.instagram.com/reel/${shortcode}/`;
  }

  return null;
}

/**
 * Extract Media URL from text or Instagram attachments (handles posts, reels, audio, stories, and direct image/video shares)
 */
function extractInstagramMediaUrl(
  text: string,
  attachments: any[] = []
): string | null {
  // 1. Search all attachments for canonical Instagram URLs first
  if (Array.isArray(attachments) && attachments.length > 0) {
    for (const att of attachments) {
      if (!att) continue;
      const candidates = [
        att.payload?.url,
        att.payload?.link,
        att.payload?.target,
        att.payload?.share?.link,
        att.payload?.share?.url,
        att.url,
        att.payload?.title,
        att.title,
      ];
      for (const candidate of candidates) {
        if (typeof candidate === "string" && candidate.length > 0) {
          const canonical = extractCanonicalInstagramUrl(candidate);
          if (canonical) return canonical;
        }
      }
    }
  }

  // 2. Search message text for canonical Instagram URL
  if (text) {
    const canonicalFromText = extractCanonicalInstagramUrl(text);
    if (canonicalFromText) return canonicalFromText;
  }

  // 3. Fallback: Search attachments for direct media URLs
  // (Meta in-app share CDN URLs, lookaside.fbsbx.com, cdninstagram, or direct user-sent photos/images/videos)
  if (Array.isArray(attachments) && attachments.length > 0) {
    for (const att of attachments) {
      if (!att) continue;
      const directCandidates = [
        att.payload?.url,
        att.payload?.link,
        att.url,
        att.payload?.share?.url,
        att.payload?.share?.link,
      ];
      for (const candidate of directCandidates) {
        if (typeof candidate === "string" && candidate.startsWith("http")) {
          return candidate;
        }
      }
    }
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
    console.log(
      `[Bot DM Reply to ${recipientIgId}]:\n${message}\nButtons:`,
      buttons
    );
    return;
  }

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
                url: b.url || `${APP_URL}/dashboard`,
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

  // Try graph.instagram.com with query token & Bearer header
  try {
    const res = await fetch(
      `https://graph.instagram.com/v21.0/me/messages?access_token=${encodeURIComponent(IG_PAGE_ACCESS_TOKEN)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${IG_PAGE_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(payload),
      }
    );
    if (res.ok) {
      console.log(`[sendDMReply] DM sent successfully to ${recipientIgId}`);
      return;
    }
    const errText = await res.text().catch(() => "");
    console.warn(`[sendDMReply] graph.instagram.com returned ${res.status}:`, errText);
  } catch (err) {
    console.warn("[sendDMReply] graph.instagram.com error:", err);
  }

  // Fallback: graph.facebook.com
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/me/messages?access_token=${encodeURIComponent(IG_PAGE_ACCESS_TOKEN)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${IG_PAGE_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(payload),
      }
    );
    if (res.ok) {
      console.log(`[sendDMReply] DM sent via Facebook Graph to ${recipientIgId}`);
      return;
    }
    const errText = await res.text().catch(() => "");
    console.warn(`[sendDMReply] graph.facebook.com returned ${res.status}:`, errText);
  } catch (err) {
    console.warn("[sendDMReply] graph.facebook.com error:", err);
  }

  // Last fallback: simple plain text message (in case button template was rejected)
  try {
    const res = await fetch(
      `https://graph.instagram.com/v21.0/me/messages?access_token=${encodeURIComponent(IG_PAGE_ACCESS_TOKEN)}`,
      {
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
      }
    );
    if (res.ok) {
      console.log(`[sendDMReply] Plain text fallback succeeded for ${recipientIgId}`);
      return;
    }
    const errText = await res.text().catch(() => "");
    console.error("[sendDMReply] All DM attempts failed. Last error:", errText);
  } catch (err) {
    console.error("[Instagram Webhook] DM fallback reply failed:", err);
  }
}
