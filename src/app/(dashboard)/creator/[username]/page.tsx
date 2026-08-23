"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useReels } from "@/context/ReelContext";
import { ReelPlayerModal } from "@/components/reels/ReelPlayerModal";
import { Reel } from "@/types/reel";
import {
  Instagram,
  ArrowLeft,
  BadgeCheck,
  Film,
  Plus,
  ExternalLink,
  Copy,
  Share2,
  Bookmark,
  Sparkles,
  Loader2,
  Heart,
  Play,
  Eye,
  Check,
} from "lucide-react";

interface DiscoveredReel {
  shortcode: string;
  caption: string;
  thumbnailUrl: string;
  category: string;
  likes: string;
  views: string;
}

interface AccountData {
  username: string;
  displayName: string;
  profileUrl: string;
  avatarUrl: string;
  followers?: string | null;
  postsCount?: string | null;
  bio?: string;
  isVerified?: boolean;
  discoveredReels?: DiscoveredReel[];
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
  const [savedShortcodes, setSavedShortcodes] = useState<Set<string>>(new Set());

  // 1. Fetch Creator Info & Public Reels from API
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
    if (username) {
      loadProfile();
    }
  }, [username]);

  // Track which reels are already in user library
  useEffect(() => {
    const saved = new Set<string>();
    reels.forEach((r) => {
      if (r.instagramUrl) {
        const match = r.instagramUrl.match(/(?:reel|p)\/([A-Za-z0-9_-]+)/);
        if (match) saved.add(match[1]);
      }
    });
    setSavedShortcodes(saved);
  }, [reels]);

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

  const handlePlayDiscoveredReel = (dReel: DiscoveredReel) => {
    const tempReel: Reel = {
      id: `temp-${dReel.shortcode}`,
      userId: "guest",
      instagramUrl: `https://www.instagram.com/reel/${dReel.shortcode}/`,
      creatorUsername: username,
      creatorFullName: account?.displayName || username,
      creatorProfileUrl: `https://instagram.com/${username}`,
      creatorAvatar: account?.avatarUrl,
      caption: dReel.caption,
      thumbnailUrl: dReel.thumbnailUrl,
      category: dReel.category || "General",
      subcategories: [],
      collections: [],
      hashtags: [],
      notes: "",
      isFavorite: false,
      duration: "0:30",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: dReel.likes,
      viewCount: 100,
    };
    setActiveModalReel(tempReel);
  };

  const handleSaveDiscovered = async (dReel: DiscoveredReel, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://www.instagram.com/reel/${dReel.shortcode}/`;
    try {
      await saveReel(url, { creator: username, caption: dReel.caption, category: dReel.category });
      showToast(`Saved Reel to your library!`);
    } catch {
      showToast("Could not save Reel.");
    }
  };

  const allFeedReels = account?.discoveredReels || [];

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
                src={
                  account?.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=7c3aed&color=fff&size=160`
                }
                alt={username}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover bg-zinc-900 border-2 border-white dark:border-zinc-900"
              />
            </div>

            {/* Handle & Name */}
            <div className="space-y-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-primaryText-light dark:text-primaryText-dark truncate">
                  @{username}
                </h1>
                <BadgeCheck className="w-5 h-5 fill-[#0095F6] text-white shrink-0" />
              </div>

              <p className="text-sm font-medium text-secondaryText-light dark:text-secondaryText-dark">
                {account?.displayName || username}
              </p>

              {/* Followers & Posts stats */}
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

        {/* Bio */}
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

      {/* 2. REELS FEED SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Film className="w-4 h-4 text-brand-500" />
            <h2 className="text-base font-bold text-primaryText-light dark:text-primaryText-dark">
              Reels by @{username} on ReelDash
            </h2>
          </div>
          <span className="text-xs text-mutedText-light font-medium">
            {allFeedReels.length} Reels Available
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-xl">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500 mx-auto mb-2" />
            <p className="text-xs text-secondaryText-light">Loading @{username}&apos;s Reels...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {allFeedReels.map((item) => {
              const isSaved = savedShortcodes.has(item.shortcode);
              return (
                <div
                  key={item.shortcode}
                  onClick={() => handlePlayDiscoveredReel(item)}
                  className="group relative aspect-[9/16] bg-zinc-950 rounded-rd-lg overflow-hidden border border-borderSubtle-light dark:border-borderSubtle-dark shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  {/* Poster Image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumbnailUrl}
                    alt={item.caption}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30 pointer-events-none" />

                  {/* Top Bar: Category & Save button */}
                  <div className="relative z-10 p-2.5 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-semibold text-white">
                      {item.category}
                    </span>
                    <button
                      onClick={(e) => handleSaveDiscovered(item, e)}
                      className={`p-1.5 rounded-full backdrop-blur-md transition-colors ${
                        isSaved
                          ? "bg-brand-500 text-white"
                          : "bg-black/60 text-white hover:bg-black/80"
                      }`}
                      title={isSaved ? "Saved to your library" : "Save to ReelDash"}
                    >
                      {isSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Center Play Icon on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="w-11 h-11 rounded-full bg-brand-500/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Bottom Stats & Caption */}
                  <div className="relative z-10 p-2.5 space-y-1 text-white">
                    <div className="flex items-center space-x-2 text-[11px] font-medium text-white/90">
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3 text-white/70" />
                        <span>{item.views}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="w-3 h-3 text-white/70 fill-white/50" />
                        <span>{item.likes}</span>
                      </div>
                    </div>
                    <p className="text-xs text-white/90 line-clamp-2 leading-snug">
                      {item.caption}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
