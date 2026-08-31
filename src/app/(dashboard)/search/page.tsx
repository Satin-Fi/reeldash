"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useReels } from "@/context/ReelContext";
import { ReelGrid } from "@/components/reels/ReelGrid";
import { ReelPlayerModal } from "@/components/reels/ReelPlayerModal";
import Link from "next/link";
import { Reel } from "@/types/reel";
import {
  Search,
  X,
  Filter,
  Instagram,
  BadgeCheck,
  Loader2,
  ArrowRight,
  User,
  Film,
  Bookmark,
  Compass,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { extractInstagramUsername } from "@/lib/instagram";

interface AccountResult {
  username: string;
  displayName: string;
  profileUrl: string;
  avatarUrl: string;
  followers?: string | null;
  postsCount?: string | null;
  bio?: string;
  isVerified?: boolean;
}

type SearchTab = "all" | "library" | "instagram";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";

  const { reels, searchQuery, setSearchQuery, viewMode, smartCategories } = useReels();
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const [searchedAccount, setSearchedAccount] = useState<AccountResult | null>(null);
  const [isSearchingAccount, setIsSearchingAccount] = useState(false);
  const [activeModalReel, setActiveModalReel] = useState<Reel | null>(null);

  // Sync initial query parameter
  useEffect(() => {
    if (initialQ && initialQ !== searchQuery) {
      setSearchQuery(initialQ);
    }
  }, [initialQ, setSearchQuery]);

  // Debounced Instagram account search
  useEffect(() => {
    const cleanUsername = extractInstagramUsername(searchQuery);
    if (!cleanUsername || cleanUsername.length < 2) {
      setSearchedAccount(null);
      setIsSearchingAccount(false);
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
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter Reels based on query and selected facets
  const libraryResults = reels.filter((r) => {
    if (searchQuery.trim()) {
      const rawQ = searchQuery.toLowerCase().trim();
      const q = rawQ.replace(/^[@#]/, "");
      
      const matchCaption = r.caption.toLowerCase().includes(rawQ) || r.caption.toLowerCase().includes(q);
      const matchCreator = r.creatorUsername.toLowerCase().includes(q) || r.creatorFullName?.toLowerCase().includes(q);
      const matchCategory = (r.categories || [r.category || ""]).some((c) => c.toLowerCase().includes(q));
      const matchHashtags = (r.hashtags || r.tags || []).some((h) => h.toLowerCase().includes(q) || h.toLowerCase().includes(rawQ));
      const matchAiTopics = (r.aiTopics || []).some((t) => t.toLowerCase().includes(q));
      const matchKeywords = r.aiKeywords?.some((k) => k.toLowerCase().includes(q));
      const matchNotes = r.notes?.toLowerCase().includes(q);

      if (!matchCaption && !matchCreator && !matchCategory && !matchHashtags && !matchAiTopics && !matchNotes && !matchKeywords) {
        return false;
      }
    }
    if (selectedCategory) {
      const cats = r.categories || [r.category];
      if (!cats.some((c) => c.toLowerCase() === selectedCategory.toLowerCase())) return false;
    }
    if (selectedCollection && !r.collections.includes(selectedCollection)) return false;
    if (onlyFavorites && !r.isFavorite) return false;

    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primaryText-light dark:text-primaryText-dark">
          Search
        </h1>
        <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark mt-0.5">
          Find saved items in your library or look up any public Instagram creator (@username).
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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const handle = extractInstagramUsername(searchQuery);
              if (handle) router.push(`/creator/${handle}`);
            }
          }}
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

      {/* ─── TAB SWITCHER (Library vs Instagram Explore) ─── */}
      <div className="flex items-center space-x-2 border-b border-borderSubtle-light dark:border-borderSubtle-dark pb-2 text-xs">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3.5 py-1.5 rounded-rd-md font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === "all"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/25"
              : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark"
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>All Results</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-secondaryText-light dark:text-secondaryText-dark">
            {libraryResults.length + (searchedAccount ? 1 : 0)}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("library")}
          className={`px-3.5 py-1.5 rounded-rd-md font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === "library"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/25"
              : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark"
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Your Library</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-secondaryText-light dark:text-secondaryText-dark">
            {libraryResults.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("instagram")}
          className={`px-3.5 py-1.5 rounded-rd-md font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === "instagram"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/25"
              : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Instagram Creators</span>
          {searchedAccount && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-pink-500/20 text-pink-400 font-bold">
              1
            </span>
          )}
        </button>
      </div>

      {/* ─── INSTAGRAM CREATOR RESULT CARD (Clean, non-repetitive) ─── */}
      {(activeTab === "all" || activeTab === "instagram") && searchQuery.trim().length >= 2 && searchedAccount && (
        <div className="p-5 bg-surface-light dark:bg-surface-dark border border-brand-500/30 rounded-rd-xl shadow-rd-subtle space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-brand-500 uppercase tracking-wider">
              <Instagram className="w-4 h-4 text-pink-500" />
              <span>Instagram Profile Found</span>
            </div>
            <Link
              href={`/creator/${searchedAccount.username}`}
              className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-rd-md text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
            >
              <span>View Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Profile link */}
          <Link
            href={`/creator/${searchedAccount.username}`}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark rounded-rd-lg hover:bg-surfaceSecondary-light/80 transition-colors group cursor-pointer"
          >
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-900 border border-zinc-700/80 shrink-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={searchedAccount.avatarUrl || `/api/proxy-image?username=${encodeURIComponent(searchedAccount.username)}`}
                  alt={searchedAccount.username}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(searchedAccount.username)}&background=6366F1&color=fff&size=200&bold=true`;
                  }}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark group-hover:text-brand-500 transition-colors truncate">
                    @{searchedAccount.username}
                  </span>
                  {searchedAccount.isVerified && (
                    <BadgeCheck className="w-4 h-4 fill-[#0095F6] text-white shrink-0" />
                  )}
                </div>

                <p className="text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark truncate">
                  {searchedAccount.displayName}
                </p>

                <div className="flex items-center space-x-3 text-xs text-mutedText-light dark:text-mutedText-dark pt-0.5">
                  {searchedAccount.followers && (
                    <span className="font-semibold text-primaryText-light dark:text-primaryText-dark">
                      {searchedAccount.followers} <span className="font-normal text-mutedText-light">followers</span>
                    </span>
                  )}
                  {searchedAccount.postsCount && (
                    <span className="font-semibold text-primaryText-light dark:text-primaryText-dark">
                      {searchedAccount.postsCount} <span className="font-normal text-mutedText-light">posts</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-center text-xs font-semibold text-brand-500 group-hover:underline">
              <span>Open Feed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      )}

      {/* Suggested Search Terms & Facets (Only in Library / All tabs) */}
      {(activeTab === "all" || activeTab === "library") && (
        <div className="space-y-3 p-4 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md shadow-rd-subtle">
          <div className="flex items-center space-x-2 text-xs font-semibold text-secondaryText-light">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Library:</span>
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
                  : "bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-secondaryText-light hover:text-primaryText-light"
              }`}
            >
              All Library ({reels.length})
            </button>

            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                onlyFavorites
                  ? "bg-rose-500 text-white"
                  : "bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-secondaryText-light hover:text-primaryText-light"
              }`}
            >
              Favorites ({reels.filter((r) => r.isFavorite).length})
            </button>

            {smartCategories.map((c) => (
              <button
                key={c.name}
                onClick={() => setSelectedCategory(selectedCategory === c.name ? null : c.name)}
                className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                  selectedCategory === c.name
                    ? "bg-brand-500 text-white"
                    : "bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-secondaryText-light hover:text-primaryText-light"
                }`}
              >
                {c.name} ({c.count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── LIBRARY RESULTS SECTION ─── */}
      {(activeTab === "all" || activeTab === "library") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark">
              Library Items ({libraryResults.length})
            </h2>
          </div>

          {libraryResults.length > 0 ? (
            <ReelGrid
              reels={libraryResults}
              viewMode={viewMode}
            />
          ) : (
            <div className="p-10 text-center bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg space-y-2">
              <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark">
                {searchQuery ? `No saved Reels found matching "${searchQuery}".` : "No Reels in your library yet."}
              </p>
              {searchQuery && !searchedAccount && (
                <p className="text-xs text-mutedText-light dark:text-mutedText-dark">
                  Tip: Type an exact username (e.g. <span className="font-mono text-brand-400">@lifeof.romana</span>) to explore their Instagram feed.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Selected Reel Player Modal */}
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

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-mutedText-light">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
