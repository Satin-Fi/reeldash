"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

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

export default function SearchPage() {
  const { reels, searchQuery, setSearchQuery, viewMode, smartCategories } = useReels();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const [searchedAccount, setSearchedAccount] = useState<AccountResult | null>(null);
  const [isSearchingAccount, setIsSearchingAccount] = useState(false);
  const [activeModalReel, setActiveModalReel] = useState<Reel | null>(null);

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
          Find saved Reels by topic or search any public Instagram account (@username) to view directly on ReelDash.
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
              <span>View Profile on ReelDash</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Profile link */}
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

            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
              <span className="text-xs font-medium text-brand-500 group-hover:underline">
                Explore on ReelDash &rarr;
              </span>
            </div>
          </Link>
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
