"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useReels } from "@/context/ReelContext";
import { ReelGrid } from "@/components/reels/ReelGrid";
import { ReelPlayerModal } from "@/components/reels/ReelPlayerModal";
import { CreatorReelGrid, CreatorReelItem } from "@/components/reels/CreatorReelGrid";
import { Reel } from "@/types/reel";
import {
  Instagram,
  ArrowLeft,
  BadgeCheck,
  Film,
  Grid,
  CircleDashed,
  Music2,
  Plus,
  ExternalLink,
  Copy,
  Loader2,
  User,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface AccountData {
  username: string;
  displayName: string;
  profileUrl: string;
  avatarUrl: string;
  followers?: string | null;
  postsCount?: string | null;
  bio?: string | null;
  isVerified?: boolean;
}

export type CreatorTab = "reels" | "posts" | "stories" | "audio";

function CreatorProfileContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as CreatorTab | null;

  const rawUsername = params.username as string;
  const username = decodeURIComponent(rawUsername).replace(/^@/, "").toLowerCase();

  const { reels, saveReel, showToast, viewMode } = useReels();

  const [account, setAccount] = useState<AccountData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reelUrlInput, setReelUrlInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeModalReel, setActiveModalReel] = useState<Reel | null>(null);
  const [activeTab, setActiveTab] = useState<CreatorTab>("reels");

  // Sync tab with URL query parameter
  useEffect(() => {
    if (tabParam && ["reels", "posts", "stories", "audio"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Discovered media, highlights, and stories from Instagram
  const [discovered, setDiscovered] = useState<CreatorReelItem[]>([]);
  const [highlights, setHighlights] = useState<Array<{ title: string; coverUrl: string }>>([]);
  const [discoveredStories, setDiscoveredStories] = useState<any[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);

  // 1. Fetch Creator Info + Instagram public media
  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/instagram/search-account?query=${encodeURIComponent(username)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.account) {
            setAccount(data.account);
          }
        }
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    }

    async function loadReels() {
      setDiscovering(true);
      setDiscoverError(null);
      try {
        const res = await fetch(`/api/instagram/creator-reels?username=${encodeURIComponent(username)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.items) && data.items.length > 0) {
            setDiscovered(data.items);
          }
          if (data.avatarUrl) {
            setAccount((prev) => ({
              ...prev,
              username: prev?.username || username,
              displayName: data.displayName || prev?.displayName || username,
              avatarUrl: data.avatarUrl,
              followers: data.followers || prev?.followers || null,
              postsCount: data.postsCount || prev?.postsCount || null,
              profileUrl: `https://instagram.com/${username}`,
              isVerified: prev?.isVerified || false,
              bio: prev?.bio || null,
            }));
          }
          if (Array.isArray(data.highlights)) {
            setHighlights(data.highlights);
          }
          if (Array.isArray(data.stories)) {
            setDiscoveredStories(data.stories);
          }
          if (data.reason) {
            setDiscoverError(data.reason);
          }
        }
      } catch {
        setDiscoverError("Could not reach Instagram right now. Try again shortly.");
      } finally {
        setDiscovering(false);
      }
    }

    if (username) {
      loadProfile();
      loadReels();
    }
  }, [username]);

  // 2. Real saved items belonging to this creator in library
  const creatorReels = reels.filter(
    (r) => r.creatorUsername?.toLowerCase() === username.toLowerCase() && (r.mediaType === "reel" || !r.mediaType)
  );

  const creatorPosts = reels.filter(
    (r) => r.creatorUsername?.toLowerCase() === username.toLowerCase() && r.mediaType === "post"
  );

  const creatorStories = reels.filter(
    (r) => r.creatorUsername?.toLowerCase() === username.toLowerCase() && r.mediaType === "story"
  );

  const creatorAudio = reels.filter(
    (r) => r.creatorUsername?.toLowerCase() === username.toLowerCase() && (r.mediaType === "audio" || !!r.audioTitle)
  );

  // 3. Discovered items split by media type
  const rawDiscoveredReels = discovered.filter(
    (d) => d.mediaType === "reel" || d.isVideo
  );

  const rawDiscoveredPosts = discovered.filter(
    (d) => d.mediaType === "post" || !d.isVideo || d.isCarousel
  );

  // 4. UN-SAVED discovered items (Prevents double counting and count inflation!)
  const isSavedUrl = (url: string, shortcode?: string) => {
    const cleanUrl = url.replace(/\/$/, "");
    return reels.some(
      (r) =>
        r.instagramUrl.replace(/\/$/, "") === cleanUrl ||
        (shortcode && r.shortcode === shortcode) ||
        (shortcode && r.instagramUrl.includes(shortcode))
    );
  };

  const unsavedDiscoveredReels = rawDiscoveredReels.filter(
    (d) => !isSavedUrl(d.instagramUrl, d.shortcode)
  );

  const unsavedDiscoveredPosts = rawDiscoveredPosts.filter(
    (d) => !isSavedUrl(d.instagramUrl, d.shortcode)
  );

  // Total unique counts (consistent and logically sound!)
  const totalReelsCount = creatorReels.length + unsavedDiscoveredReels.length;
  const totalPostsCount = creatorPosts.length + unsavedDiscoveredPosts.length;
  const totalStoriesCount = creatorStories.length + discoveredStories.length;
  const totalAudioCount = creatorAudio.length;

  const handleCopyProfile = () => {
    navigator.clipboard.writeText(`https://instagram.com/${username}`);
    showToast("Instagram profile link copied");
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reelUrlInput.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await saveReel(reelUrlInput.trim(), { creator: username });
      setReelUrlInput("");
      showToast(`Saved reel from @${username}`);
    } catch {
      showToast("Could not save reel");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light dark:hover:text-primaryText-dark transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to search</span>
      </button>

      {/* ─── CREATOR PROFILE CARD ─── */}
      <div className="p-6 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg shadow-rd-subtle space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-900 border border-zinc-700 shrink-0 flex items-center justify-center shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={account?.avatarUrl || `/api/proxy-image?username=${encodeURIComponent(username)}`}
                alt={username}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                  const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
              <div className="hidden w-full h-full bg-zinc-800 items-center justify-center text-zinc-400 font-bold text-lg">
                {username[0]?.toUpperCase()}
              </div>
            </div>

            {/* Handle & Name */}
            <div className="space-y-1 min-w-0">
              <div className="flex items-center space-x-1.5 flex-wrap">
                <h1 className="text-xl font-bold text-primaryText-light dark:text-primaryText-dark tracking-tight truncate">
                  @{username}
                </h1>
                {account?.isVerified && (
                  <BadgeCheck className="w-5 h-5 fill-[#0095F6] text-white shrink-0" />
                )}
              </div>

              {account?.displayName && (
                <p className="text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark">
                  {account.displayName}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center space-x-3 text-xs pt-0.5">
                {account?.followers && (
                  <span className="font-semibold text-primaryText-light dark:text-primaryText-dark">
                    {account.followers}{" "}
                    <span className="font-normal text-secondaryText-light dark:text-secondaryText-dark">followers</span>
                  </span>
                )}
                {account?.postsCount && (
                  <span className="font-semibold text-primaryText-light dark:text-primaryText-dark">
                    {account.postsCount}{" "}
                    <span className="font-normal text-secondaryText-light dark:text-secondaryText-dark">posts</span>
                  </span>
                )}
                <span className="font-semibold text-brand-600 dark:text-brand-400">
                  {creatorReels.length + creatorPosts.length + creatorAudio.length}{" "}
                  <span className="font-normal text-secondaryText-light dark:text-secondaryText-dark">saved in library</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleCopyProfile}
              className="p-2 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark hover:border-brand-500 text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light dark:hover:text-primaryText-dark rounded-rd-md transition-colors cursor-pointer"
              title="Copy Profile Link"
            >
              <Copy className="w-4 h-4" />
            </button>
            <a
              href={`https://instagram.com/${username}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1.5 px-3 py-2 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark hover:border-pink-500/50 text-secondaryText-light dark:text-secondaryText-dark hover:text-pink-500 rounded-rd-md text-xs font-semibold transition-colors"
            >
              <Instagram className="w-4 h-4 text-pink-500" />
              <span>Open on Instagram</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Bio */}
        {account?.bio && (
          <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark border-t border-borderSubtle-light dark:border-borderSubtle-dark pt-3 leading-relaxed">
            {account.bio}
          </p>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="border-t border-borderSubtle-light dark:border-borderSubtle-dark pt-4">
            <div className="flex items-center space-x-1.5 mb-3 text-xs font-bold text-secondaryText-light dark:text-secondaryText-dark uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Story Highlights</span>
            </div>
            <div className="flex items-center space-x-4 overflow-x-auto pb-2 scrollbar-none">
              {highlights.map((h, i) => (
                <div key={i} className="flex flex-col items-center space-y-1.5 shrink-0 cursor-pointer group">
                  <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 group-hover:scale-105 transition-transform shadow-sm">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-surface-light dark:border-surface-dark bg-zinc-800 flex items-center justify-center">
                      <img src={h.coverUrl} alt={h.title} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-primaryText-light dark:text-primaryText-dark truncate max-w-[70px] text-center">
                    {h.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick URL Input */}
        <form onSubmit={handleQuickAdd} className="flex items-center gap-2 pt-2 border-t border-borderSubtle-light dark:border-borderSubtle-dark">
          <input
            type="url"
            placeholder={`Paste any link from @${username} (e.g. https://www.instagram.com/reel/...)`}
            value={reelUrlInput}
            onChange={(e) => setReelUrlInput(e.target.value)}
            className="flex-1 px-3.5 py-2 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md text-xs text-primaryText-light dark:text-primaryText-dark focus:outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={isSaving || !reelUrlInput.trim()}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-semibold text-xs rounded-rd-md shadow-rd-subtle transition-all disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer shrink-0"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span>Save to Library</span>
          </button>
        </form>
      </div>

      {/* ─── MEDIA TYPE TABS (Clean High-Contrast Tabs) ─── */}
      <div className="flex items-center space-x-2 border-b border-borderSubtle-light dark:border-borderSubtle-dark pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab("reels")}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-rd-md font-semibold transition-all cursor-pointer shrink-0 ${
            activeTab === "reels"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/25"
              : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark hover:text-primaryText-light dark:hover:text-primaryText-dark"
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Reels</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-secondaryText-light dark:text-secondaryText-dark">
            {totalReelsCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("posts")}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-rd-md font-semibold transition-all cursor-pointer shrink-0 ${
            activeTab === "posts"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/25"
              : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark hover:text-primaryText-light dark:hover:text-primaryText-dark"
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Posts & Carousels</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-secondaryText-light dark:text-secondaryText-dark">
            {totalPostsCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("stories")}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-rd-md font-semibold transition-all cursor-pointer shrink-0 ${
            activeTab === "stories"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/25"
              : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark hover:text-primaryText-light dark:hover:text-primaryText-dark"
          }`}
        >
          <CircleDashed className="w-4 h-4" />
          <span>Stories</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-secondaryText-light dark:text-secondaryText-dark">
            {totalStoriesCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("audio")}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-rd-md font-semibold transition-all cursor-pointer shrink-0 ${
            activeTab === "audio"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/25"
              : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark hover:text-primaryText-light dark:hover:text-primaryText-dark"
          }`}
        >
          <Music2 className="w-4 h-4" />
          <span>Audio</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-secondaryText-light dark:text-secondaryText-dark">
            {totalAudioCount}
          </span>
        </button>
      </div>

      {/* ─── TAB CONTENT ─── */}

      {/* TAB 1: REELS */}
      {activeTab === "reels" && (
        <div className="space-y-6">
          {/* Saved in ReelDash */}
          {creatorReels.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-primaryText-light dark:text-primaryText-dark">
                  Saved in Your Library ({creatorReels.length})
                </h3>
              </div>
              <ReelGrid reels={creatorReels} viewMode={viewMode} />
            </div>
          )}

          {/* Public Feed (Unsaved items) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondaryText-light dark:text-secondaryText-dark">
                Instagram Public Reels Feed (@{username})
              </h3>
              {discovering && (
                <span className="flex items-center space-x-1.5 text-xs text-mutedText-light dark:text-mutedText-dark">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading feed…</span>
                </span>
              )}
            </div>

            {rawDiscoveredReels.length > 0 ? (
              <CreatorReelGrid items={rawDiscoveredReels} creatorUsername={username} />
            ) : discovering ? (
              <div className="p-12 text-center bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg">
                <Loader2 className="w-6 h-6 animate-spin text-brand-500 mx-auto mb-2" />
                <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark">Fetching @{username}&apos;s public reels…</p>
              </div>
            ) : (
              <div className="p-8 text-center bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg space-y-2">
                <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark">
                  {discoverError || `No public reels found for @${username}. Use the box above to save by link.`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: POSTS */}
      {activeTab === "posts" && (
        <div className="space-y-6">
          {creatorPosts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-primaryText-light dark:text-primaryText-dark">
                  Saved in Your Library ({creatorPosts.length})
                </h3>
              </div>
              <ReelGrid reels={creatorPosts} viewMode={viewMode} />
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-secondaryText-light dark:text-secondaryText-dark">
              Instagram Public Posts (@{username})
            </h3>
            {rawDiscoveredPosts.length > 0 ? (
              <CreatorReelGrid items={rawDiscoveredPosts} creatorUsername={username} />
            ) : discovering ? (
              <div className="p-12 text-center bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg">
                <Loader2 className="w-6 h-6 animate-spin text-brand-500 mx-auto mb-2" />
                <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark">Fetching posts…</p>
              </div>
            ) : (
              <div className="p-8 text-center bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg">
                <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark">
                  No public photo posts found. Paste any post link above to save.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STORIES */}
      {activeTab === "stories" && (
        <div className="space-y-6">
          {creatorStories.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primaryText-light dark:text-primaryText-dark">
                Saved in Your Library ({creatorStories.length})
              </h3>
              <ReelGrid reels={creatorStories} viewMode={viewMode} />
            </div>
          )}

          {discoveredStories.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondaryText-light dark:text-secondaryText-dark">
                Active 24h Stories (@{username})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {discoveredStories.map((s, i) => (
                  <div key={i} className="aspect-[9/16] rounded-rd-md bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark overflow-hidden relative group">
                    <img src={s.mediaUrl || s.thumbnailUrl} alt="Story" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg">
              <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark">
                No active 24h stories available right now for @{username}.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AUDIO */}
      {activeTab === "audio" && (
        <div className="space-y-4">
          {creatorAudio.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primaryText-light dark:text-primaryText-dark">
                Saved Audio Tracks ({creatorAudio.length})
              </h3>
              <ReelGrid reels={creatorAudio} viewMode={viewMode} />
            </div>
          ) : (
            <div className="p-8 text-center bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg">
              <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark">
                No audio tracks saved from @{username} yet.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CreatorPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-mutedText-light">Loading creator profile…</div>}>
      <CreatorProfileContent />
    </Suspense>
  );
}
