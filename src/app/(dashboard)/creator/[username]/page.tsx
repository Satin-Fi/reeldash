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
} from "lucide-react";

interface AccountData {
  username: string;
  displayName: string;
  profileUrl: string;
  avatarUrl: string;
  followers?: string | null;
  postsCount?: string | null;
  bio?: string;
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

  // Discovered media from Instagram
  const [discovered, setDiscovered] = useState<CreatorReelItem[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);

  // 1. Fetch authentic Creator Info + their Instagram media
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
          } else if (data.reason) {
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

  // 2. Real saved items belonging to this creator
  const creatorReels = reels.filter(
    (r) => r.creatorUsername.toLowerCase() === username.toLowerCase() && (r.mediaType === "reel" || !r.mediaType)
  );

  const creatorPosts = reels.filter(
    (r) => r.creatorUsername.toLowerCase() === username.toLowerCase() && r.mediaType === "post"
  );

  const creatorStories = reels.filter(
    (r) => r.creatorUsername.toLowerCase() === username.toLowerCase() && r.mediaType === "story"
  );

  const creatorAudio = reels.filter(
    (r) => r.creatorUsername.toLowerCase() === username.toLowerCase() && (r.mediaType === "audio" || !!r.audioTitle)
  );

  const discoveredReels = discovered.filter(
    (d) => d.mediaType === "reel" || (d.isVideo && !d.isCarousel)
  );

  const discoveredPosts = discovered.filter(
    (d) => d.mediaType === "post" || d.isCarousel || !d.isVideo
  );

  const handleCopyProfile = () => {
    navigator.clipboard.writeText(`https://instagram.com/${username}`);
    showToast("Instagram profile link copied");
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reelUrlInput.trim()) return;

    setIsSaving(true);
    try {
      await saveReel(reelUrlInput.trim(), { creator: username });
      setReelUrlInput("");
      showToast(`Saved Reel from @${username}`);
    } catch {
      showToast("Could not save Reel. Please check the URL.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Back Link */}
      <button
        onClick={() => router.back()}
        className="flex items-center space-x-1.5 text-xs font-semibold text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to search</span>
      </button>

      {/* 1. CREATOR PROFILE HEADER */}
      <div className="p-6 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-xl shadow-rd-subtle space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            {/* Avatar */}
            <div className="relative p-1 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 shrink-0 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  account?.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    username
                  )}&background=7c3aed&color=fff&size=160`
                }
                alt={username}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover bg-zinc-800"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                  const fallback = (e.target as HTMLElement)
                    .nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
              <div className="hidden w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-zinc-800 items-center justify-center text-zinc-400">
                <User className="w-8 h-8" />
              </div>
            </div>

            {/* Creator Names & Meta */}
            <div className="space-y-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primaryText-light dark:text-primaryText-dark truncate">
                  @{username}
                </h1>
                {account?.isVerified && (
                  <BadgeCheck className="w-5 h-5 fill-[#0095F6] text-white shrink-0" />
                )}
              </div>

              <p className="text-xs sm:text-sm font-medium text-secondaryText-light dark:text-secondaryText-dark truncate">
                {account?.displayName || username}
              </p>

              {/* Stats */}
              <div className="flex items-center space-x-4 text-xs pt-1">
                {account?.followers && (
                  <span>
                    <strong className="font-bold text-primaryText-light dark:text-primaryText-dark font-mono">
                      {account.followers}
                    </strong>{" "}
                    <span className="text-mutedText-light dark:text-mutedText-dark">
                      Followers
                    </span>
                  </span>
                )}
                {account?.postsCount && (
                  <span>
                    <strong className="font-bold text-primaryText-light dark:text-primaryText-dark font-mono">
                      {account.postsCount}
                    </strong>{" "}
                    <span className="text-mutedText-light dark:text-mutedText-dark">
                      Posts
                    </span>
                  </span>
                )}
                <span>
                  <strong className="font-bold text-brand-500 font-mono">
                    {creatorReels.length + creatorPosts.length + creatorStories.length + creatorAudio.length}
                  </strong>{" "}
                  <span className="text-mutedText-light dark:text-mutedText-dark">
                    Saved in ReelDash
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleCopyProfile}
              className="p-2 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark hover:border-brand-500 text-secondaryText-light hover:text-primaryText-light rounded-rd-md transition-colors cursor-pointer"
              title="Copy Profile Link"
            >
              <Copy className="w-4 h-4" />
            </button>
            <a
              href={`https://instagram.com/${username}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1.5 px-3 py-2 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark hover:border-pink-500/50 text-secondaryText-light hover:text-pink-500 rounded-rd-md text-xs font-semibold transition-colors"
            >
              <Instagram className="w-4 h-4 text-pink-500" />
              <span>Instagram</span>
              <ExternalLink className="w-3 h-3 text-mutedText-light" />
            </a>
          </div>
        </div>

        {/* Bio */}
        {account?.bio && (
          <p className="text-xs sm:text-sm text-secondaryText-light dark:text-secondaryText-dark border-t border-borderSubtle-light dark:border-borderSubtle-dark pt-3 leading-relaxed">
            {account.bio}
          </p>
        )}

        {/* Quick Save URL Box */}
        <form onSubmit={handleQuickAdd} className="flex items-center gap-2 pt-2">
          <input
            type="url"
            placeholder={`Paste any Reel link from @${username} (e.g. https://www.instagram.com/reel/...)`}
            value={reelUrlInput}
            onChange={(e) => setReelUrlInput(e.target.value)}
            className="flex-1 px-3.5 py-2 bg-background-light dark:bg-background-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md text-xs sm:text-sm text-primaryText-light dark:text-primaryText-dark focus:outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={isSaving || !reelUrlInput.trim()}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-semibold text-xs rounded-rd-md shadow-sm transition-all disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer shrink-0"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span>Save to ReelDash</span>
          </button>
        </form>
      </div>

      {/* 2. MEDIA TYPE TABS */}
      <div className="flex items-center space-x-2 border-b border-borderSubtle-light dark:border-borderSubtle-dark pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("reels")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-rd-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
            activeTab === "reels"
              ? "bg-brand-500 text-white shadow-sm"
              : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark"
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Reels ({creatorReels.length + discoveredReels.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("posts")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-rd-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
            activeTab === "posts"
              ? "bg-brand-500 text-white shadow-sm"
              : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark"
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Posts & Carousels ({creatorPosts.length + discoveredPosts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("stories")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-rd-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
            activeTab === "stories"
              ? "bg-brand-500 text-white shadow-sm"
              : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark"
          }`}
        >
          <CircleDashed className="w-4 h-4" />
          <span>Stories ({creatorStories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("audio")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-rd-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
            activeTab === "audio"
              ? "bg-brand-500 text-white shadow-sm"
              : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark"
          }`}
        >
          <Music2 className="w-4 h-4" />
          <span>Audio ({creatorAudio.length})</span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB A: REELS */}
      {activeTab === "reels" && (
        <div className="space-y-6">
          {/* Saved in ReelDash */}
          {creatorReels.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondaryText-light dark:text-secondaryText-dark">
                Saved in Your Library ({creatorReels.length})
              </h3>
              <ReelGrid reels={creatorReels} viewMode={viewMode} />
            </div>
          )}

          {/* Discover Feed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondaryText-light dark:text-secondaryText-dark">
                Public Instagram Reels Feed (@{username})
              </h3>
              {discovering && (
                <span className="flex items-center space-x-1.5 text-xs text-mutedText-light">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading…</span>
                </span>
              )}
            </div>

            {discovering && discoveredReels.length === 0 && (
              <div className="p-8 text-center bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-xl">
                <Loader2 className="w-6 h-6 animate-spin text-brand-500 mx-auto" />
                <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark mt-3">
                  Fetching @{username}&apos;s public Reels from Instagram…
                </p>
              </div>
            )}

            {!discovering && discoveredReels.length === 0 && creatorReels.length === 0 && (
              <div className="p-10 text-center bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-xl space-y-3">
                <div className="w-12 h-12 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto">
                  <Film className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark">
                  No Saved Reels from @{username} Yet
                </h3>
                <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark max-w-md mx-auto">
                  Paste any direct Reel link from @{username} in the save box above to extract and save it to your ReelDash library with full video playback and analytics.
                </p>
                <div className="pt-2">
                  <a
                    href={`https://instagram.com/${username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-rd-lg bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark hover:bg-brand-500 hover:text-white text-xs font-semibold transition-colors"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    <span>View @{username} on Instagram</span>
                  </a>
                </div>
              </div>
            )}

            {discoveredReels.length > 0 && (
              <CreatorReelGrid items={discoveredReels} username={username} />
            )}
          </div>
        </div>
      )}

      {/* TAB B: POSTS & CAROUSELS */}
      {activeTab === "posts" && (
        <div className="space-y-6">
          {creatorPosts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondaryText-light dark:text-secondaryText-dark">
                Saved in Your Library ({creatorPosts.length})
              </h3>
              <ReelGrid reels={creatorPosts} viewMode={viewMode} />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondaryText-light dark:text-secondaryText-dark">
                Public Instagram Posts & Sidecar Carousels (@{username})
              </h3>
            </div>

            {discoveredPosts.length > 0 ? (
              <CreatorReelGrid items={discoveredPosts} username={username} />
            ) : (
              <div className="p-12 text-center bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-xl space-y-3">
                <div className="w-12 h-12 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto">
                  <Grid className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark">
                  No Posts Discovered from @{username}
                </h3>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB C: STORIES */}
      {activeTab === "stories" && (
        <div className="space-y-4">
          {creatorStories.length > 0 ? (
            <ReelGrid reels={creatorStories} viewMode={viewMode} />
          ) : (
            <div className="p-12 text-center bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto">
                <CircleDashed className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark">
                No Stories Saved from @{username}
              </h3>
              <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark max-w-md mx-auto">
                Stories saved from @{username} will appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB D: AUDIO & SOUNDS */}
      {activeTab === "audio" && (
        <div className="space-y-4">
          {creatorAudio.length > 0 ? (
            <ReelGrid reels={creatorAudio} viewMode={viewMode} />
          ) : (
            <div className="p-12 text-center bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto">
                <Music2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark">
                No Audio Tracks Saved from @{username}
              </h3>
              <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark max-w-md mx-auto">
                Original audio tracks saved from @{username} will appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Reel Player Modal */}
      {activeModalReel && (
        <ReelPlayerModal
          reel={activeModalReel}
          isOpen={!!activeModalReel}
          onClose={() => setActiveModalReel(null)}
        />
      )}
    </div>
  );
}

export default function CreatorProfilePage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-mutedText-light">Loading creator profile…</div>}>
      <CreatorProfileContent />
    </Suspense>
  );
}
