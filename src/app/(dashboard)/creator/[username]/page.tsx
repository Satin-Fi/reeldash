"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Plus,
  ExternalLink,
  Copy,
  Loader2,
  Sparkles,
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

export default function CreatorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const rawUsername = params.username as string;
  const username = decodeURIComponent(rawUsername).replace(/^@/, "").toLowerCase();

  const { reels, saveReel, showToast, viewMode } = useReels();

  const [account, setAccount] = useState<AccountData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reelUrlInput, setReelUrlInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeModalReel, setActiveModalReel] = useState<Reel | null>(null);

  // Discovered reels from Instagram (SociableKIT-style grid)
  const [discovered, setDiscovered] = useState<CreatorReelItem[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);

  // 1. Fetch authentic Creator Info + their Instagram reel grid
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

  // 2. Filter local Reels matching this creator
  const creatorReels = reels.filter(
    (r) => r.creatorUsername.toLowerCase() === username.toLowerCase()
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
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Back Navigation */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center space-x-2 text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to search</span>
      </button>

      {/* 1. CREATOR PROFILE HEADER CARD */}
      <div className="p-6 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-xl shadow-rd-subtle space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            {/* Avatar with Instagram Gradient Ring */}
            <div className="relative p-1 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 shrink-0 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={account?.avatarUrl || `https://instagram.com/${username}/media/?size=l`}
                alt={username}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                  const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = "flex";
                }}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover bg-zinc-900 border-2 border-white dark:border-zinc-900"
              />
              <div className="hidden w-16 h-16 md:w-20 md:h-20 rounded-full bg-zinc-900 border-2 border-white dark:border-zinc-900 items-center justify-center text-zinc-400">
                <User className="w-8 h-8" />
              </div>
            </div>

            {/* Handle & Real Name */}
            <div className="space-y-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-primaryText-light dark:text-primaryText-dark truncate">
                  @{username}
                </h1>
                {account?.isVerified && (
                  <BadgeCheck className="w-5 h-5 fill-[#0095F6] text-white shrink-0" />
                )}
              </div>

              <p className="text-sm font-medium text-secondaryText-light dark:text-secondaryText-dark">
                {account?.displayName || username}
              </p>

              {/* Real Followers & Posts stats */}
              <div className="flex items-center space-x-4 text-xs text-secondaryText-light dark:text-secondaryText-dark pt-1">
                {account?.followers && (
                  <div>
                    <span className="font-bold text-primaryText-light dark:text-primaryText-dark">
                      {account.followers}
                    </span>{" "}
                    <span>Followers</span>
                  </div>
                )}
                {account?.postsCount && (
                  <div>
                    <span className="font-bold text-primaryText-light dark:text-primaryText-dark">
                      {account.postsCount}
                    </span>{" "}
                    <span>Posts</span>
                  </div>
                )}
                <div>
                  <span className="font-bold text-primaryText-light dark:text-primaryText-dark">
                    {creatorReels.length}
                  </span>{" "}
                  <span>Saved in ReelDash</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleCopyProfile}
              className="p-2 border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light transition-colors cursor-pointer bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark"
              title="Copy Instagram Profile Link"
            >
              <Copy className="w-4 h-4" />
            </button>

            <a
              href={`https://instagram.com/${username}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark hover:bg-zinc-200 dark:hover:bg-zinc-800 text-primaryText-light dark:text-primaryText-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Instagram className="w-3.5 h-3.5 text-pink-500" />
              <span>Instagram</span>
              <ExternalLink className="w-3 h-3 text-mutedText-light" />
            </a>
          </div>
        </div>

        {/* Real Bio */}
        {account?.bio && (
          <div className="pt-2 border-t border-borderSubtle-light dark:border-borderSubtle-dark text-xs text-secondaryText-light dark:text-secondaryText-dark leading-relaxed whitespace-pre-line">
            {account.bio}
          </div>
        )}

        {/* Quick Ingest / Save Reel form for this creator */}
        <form
          onSubmit={handleQuickAdd}
          className="flex items-center gap-2 p-3 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark rounded-rd-lg border border-borderSubtle-light dark:border-borderSubtle-dark"
        >
          <input
            type="url"
            placeholder={`Paste any Reel link from @${username} (e.g. https://www.instagram.com/reel/...)`}
            value={reelUrlInput}
            onChange={(e) => setReelUrlInput(e.target.value)}
            className="flex-1 px-3 py-2 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md text-xs text-primaryText-light dark:text-primaryText-dark focus:outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={isSaving || !reelUrlInput.trim()}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-rd-md text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-sm shrink-0"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Save to ReelDash</span>
          </button>
        </form>
      </div>

      {/* 2. REELS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Film className="w-4 h-4 text-brand-500" />
            <h2 className="text-base font-bold text-primaryText-light dark:text-primaryText-dark">
              Reels by @{username} ({creatorReels.length})
            </h2>
          </div>
        </div>

        {creatorReels.length > 0 ? (
          <ReelGrid reels={creatorReels} viewMode={viewMode} />
        ) : (
          <div className="p-8 text-center bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto">
              <Film className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark">
                No saved Reels from @{username} in your library yet
              </h3>
              <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark max-w-md mx-auto">
                Paste any Reel link from @{username} in the input box above to instantly save and watch it in ReelDash.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. DISCOVER ON INSTAGRAM — SociableKIT-style grid of @username's public reels */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Instagram className="w-4 h-4 text-pink-500" />
            <h2 className="text-base font-bold text-primaryText-light dark:text-primaryText-dark">
              Discover on Instagram (@{username})
            </h2>
          </div>
          {discovering && (
            <span className="flex items-center space-x-1.5 text-xs text-mutedText-light">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Loading reels…</span>
            </span>
          )}
        </div>

        {discovering && discovered.length === 0 && (
          <div className="p-8 text-center bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-xl">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500 mx-auto" />
            <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark mt-3">
              Fetching @{username}'s public Reels from Instagram…
            </p>
          </div>
        )}

        {!discovering && discoverError && discovered.length === 0 && (
          <div className="p-6 text-center bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-xl space-y-3">
            <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark max-w-md mx-auto">
              {discoverError}
            </p>
            <a
              href={`https://instagram.com/${username}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md text-xs font-semibold hover:border-brand-500/40 transition-colors"
            >
              <Instagram className="w-3.5 h-3.5 text-pink-500" />
              <span>Open @{username} on Instagram</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {discovered.length > 0 && <CreatorReelGrid items={discovered} />}
      </div>

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
