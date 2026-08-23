"use client";

import React, { useState, useEffect } from "react";
import { useReels } from "@/context/ReelContext";
import { ReelGrid } from "@/components/reels/ReelGrid";
import { ReelPlayerModal } from "@/components/reels/ReelPlayerModal";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Reel } from "@/types/reel";
import {
  Search,
  X,
  Filter,
  Instagram,
  ExternalLink,
  BadgeCheck,
  Loader2,
  User,
  ArrowRight,
  Film,
  Play,
  Eye,
  Heart,
  Bookmark,
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

interface AccountResult {
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

export default function SearchPage() {
  const router = useRouter();
  const { reels, searchQuery, setSearchQuery, viewMode, smartCategories, saveReel, showToast } = useReels();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const [searchedAccount, setSearchedAccount] = useState<AccountResult | null>(null);
  const [isSearchingAccount, setIsSearchingAccount] = useState(false);
  const [activeModalReel, setActiveModalReel] = useState<Reel | null>(null);
  const [savedShortcodes, setSavedShortcodes] = useState<Set<string>>(new Set());

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

  // Debounced Instagram account search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) {
      setSearchedAccount(null);
      setIsSearchingAccount(false);
      return;
    }

    const cleanUsername = trimmed.replace(/^@/, "").split("/")[0].trim();
    if (!cleanUsername || cleanUsername.length < 2) {
      setSearchedAccount(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingAccount(true);
      try {
        const res = await fetch(`/api/instagram/search-account?query=${encodeURIComponent(cleanUsername)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.account) {
            setSearchedAccount(data.account);
          }
        }
      } catch {
        // Silently catch
      } finally {
        setIsSearchingAccount(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePlayDiscoveredReel = (dReel: DiscoveredReel, username: string, displayName: string) => {
    const tempReel: Reel = {
      id: `temp-${dReel.shortcode}`,
      userId: "guest",
      instagramUrl: `https://www.instagram.com/reel/${dReel.shortcode}/`,
      creatorUsername: username,
      creatorFullName: displayName || username,
      creatorProfileUrl: `https://instagram.com/${username}`,
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

  const handleSaveDiscovered = async (dReel: DiscoveredReel, username: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://www.instagram.com/reel/${dReel.shortcode}/`;
    try {
      await saveReel(url, { creator: username, caption: dReel.caption, category: dReel.category });
      showToast(`Saved Reel to your library!`);
    } catch {
      showToast("Could not save Reel.");
    }
  };

  // Filter Reels based on query and selected facets
  const results = reels.filter((r) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().replace(/^@/, "");
      const matchCaption = r.caption.toLowerCase().includes(q);
      const matchCreator = r.creatorUsername.toLowerCase().includes(q);
      const matchCategory = r.category.toLowerCase().includes(q);
      const matchNotes = r.notes?.toLowerCase().includes(q);
      const matchKeywords = r.aiKeywords?.some((k) => k.toLowerCase().includes(q));

      if (!matchCaption && !matchCreator && !matchCategory && !matchNotes && !matchKeywords) {
        return false;
      }
    }
    if (selectedCategory && r.category !== selectedCategory) return false;
    if (selectedCollection && !r.collections.includes(selectedCollection)) return false;
    if (onlyFavorites && !r.isFavorite) return false;

    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primaryText-light dark:text-primaryText-dark">
          Search Library & Instagram Creators
        </h1>
        <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark mt-0.5">
          Find saved Reels by topic or search any public Instagram account (@username) to view and play directly inside ReelDash.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="w-5 h-5 text-mutedText-light absolute left-4 pointer-events-none" />
        <input
          type="text"
          placeholder="Search captions, categories, notes, or any Instagram account (@username)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
          className="w-full pl-12 pr-10 py-3.5 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg text-sm text-primaryText-light dark:text-primaryText-dark focus:outline-none focus:border-brand-500 shadow-rd-subtle transition-all"
        />
        {isSearchingAccount && (
          <Loader2 className="w-4 h-4 animate-spin text-brand-500 absolute right-12 pointer-events-none" />
        )}
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 text-mutedText-light hover:text-primaryText-light cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* INSTAGRAM ACCOUNT SEARCH CARD - Opens inside ReelDash */}
      {searchQuery.trim().length >= 2 && searchedAccount && (
        <div className="p-5 bg-surface-light dark:bg-surface-dark border-2 border-brand-500/30 dark:border-brand-500/40 rounded-rd-xl shadow-rd-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-brand-500 uppercase tracking-wider">
              <Instagram className="w-4 h-4 text-pink-500" />
              <span>Instagram Creator Found</span>
            </div>
            <div className="flex items-center space-x-2">
              <Link
                href={`/creator/${searchedAccount.username}`}
                className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-rd-md text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <span>Full Profile & Reels</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Profile row */}
          <Link
            href={`/creator/${searchedAccount.username}`}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark rounded-rd-lg hover:bg-surfaceSecondary-light/80 transition-colors group cursor-pointer"
          >
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={searchedAccount.avatarUrl}
                  alt={searchedAccount.username}
                  className="w-12 h-12 rounded-full object-cover bg-zinc-800"
                />
              </div>

              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark group-hover:text-brand-500 transition-colors truncate">
                    @{searchedAccount.username}
                  </span>
                  <BadgeCheck className="w-4 h-4 fill-[#0095F6] text-white shrink-0" />
                </div>

                <p className="text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark truncate">
                  {searchedAccount.displayName}
                </p>

                {searchedAccount.followers && (
                  <div className="flex items-center space-x-3 text-xs text-mutedText-light dark:text-mutedText-dark pt-0.5">
                    <span className="font-semibold text-primaryText-light dark:text-primaryText-dark">
                      {searchedAccount.followers} <span className="font-normal text-mutedText-light">followers</span>
                    </span>
                    {searchedAccount.postsCount && (
                      <span className="font-semibold text-primaryText-light dark:text-primaryText-dark">
                        {searchedAccount.postsCount} <span className="font-normal text-mutedText-light">posts</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
              <span className="text-xs font-medium text-brand-500 group-hover:underline">
                View on ReelDash &rarr;
              </span>
            </div>
          </Link>

          {/* Quick Reel Feed for this Creator */}
          {searchedAccount.discoveredReels && searchedAccount.discoveredReels.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-secondaryText-light uppercase tracking-wider">
                  Reels by @{searchedAccount.username} (Click to Play)
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {searchedAccount.discoveredReels.slice(0, 4).map((dReel) => {
                  const isSaved = savedShortcodes.has(dReel.shortcode);
                  return (
                    <div
                      key={dReel.shortcode}
                      onClick={() =>
                        handlePlayDiscoveredReel(
                          dReel,
                          searchedAccount.username,
                          searchedAccount.displayName
                        )
                      }
                      className="group relative aspect-[9/16] bg-zinc-950 rounded-rd-md overflow-hidden border border-borderSubtle-light dark:border-borderSubtle-dark shadow-sm cursor-pointer flex flex-col justify-between"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={dReel.thumbnailUrl}
                        alt={dReel.caption}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30 pointer-events-none" />

                      <div className="relative z-10 p-2 flex items-center justify-between">
                        <span className="px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-semibold text-white">
                          {dReel.category}
                        </span>
                        <button
                          onClick={(e) => handleSaveDiscovered(dReel, searchedAccount.username, e)}
                          className={`p-1 rounded-full backdrop-blur-md transition-colors ${
                            isSaved
                              ? "bg-brand-500 text-white"
                              : "bg-black/60 text-white hover:bg-black/80"
                          }`}
                          title={isSaved ? "Saved" : "Save to ReelDash"}
                        >
                          {isSaved ? <Check className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
                        </button>
                      </div>

                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <div className="w-9 h-9 rounded-full bg-brand-500/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </div>
                      </div>

                      <div className="relative z-10 p-2 space-y-0.5 text-white">
                        <div className="flex items-center space-x-2 text-[10px] font-medium text-white/90">
                          <span>{dReel.views}</span>
                          <span>•</span>
                          <span>{dReel.likes}</span>
                        </div>
                        <p className="text-[11px] text-white/90 line-clamp-1">
                          {dReel.caption}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suggested Search Terms & Facets */}
      <div className="space-y-3 p-4 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md shadow-rd-subtle">
        <div className="flex items-center space-x-2 text-xs font-semibold text-secondaryText-light">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter Facets:</span>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSelectedCollection(null);
              setOnlyFavorites(false);
            }}
            className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
              !selectedCategory && !selectedCollection && !onlyFavorites
                ? "bg-brand-500 text-white"
                : "bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-secondaryText-light"
            }`}
          >
            All Results
          </button>

          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
              onlyFavorites
                ? "bg-rose-500 text-white"
                : "bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-secondaryText-light"
            }`}
          >
            ♥ Favorites Only
          </button>

          {smartCategories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
              className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                selectedCategory === cat.name
                  ? "bg-brand-500 text-white"
                  : "bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-secondaryText-light"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs font-semibold text-secondaryText-light uppercase tracking-wider">
          Saved Reels Results ({results.length})
        </span>
      </div>

      {/* Results Grid */}
      <ReelGrid reels={results} viewMode={viewMode} />

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
