"use client";

import React, { useMemo } from "react";
import { useReels } from "@/context/ReelContext";
import { LibraryHeader } from "@/components/ui/LibraryHeader";
import { FilterToolbar } from "@/components/ui/FilterToolbar";
import { ReelGrid } from "@/components/reels/ReelGrid";
import { Heart } from "lucide-react";
import Link from "next/link";

export default function FavoritesPage() {
  const { favorites, searchQuery, sortOption, viewMode } = useReels();

  // Compute creators among favorites
  const favCreatorsCount = useMemo(() => {
    return new Set(favorites.map((r) => r.creatorUsername).filter(Boolean)).size;
  }, [favorites]);

  // Filter & Sort favorites
  const filteredFavorites = useMemo(() => {
    let result = favorites.filter((reel) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCaption = reel.caption?.toLowerCase().includes(q);
        const matchCreator = reel.creatorUsername?.toLowerCase().includes(q);
        const matchCategory = reel.category?.toLowerCase().includes(q);
        const matchAudio =
          reel.audioTitle?.toLowerCase().includes(q) ||
          reel.audioArtist?.toLowerCase().includes(q);
        const matchKeywords = reel.aiKeywords?.some((k) =>
          k.toLowerCase().includes(q)
        );
        if (
          !matchCaption &&
          !matchCreator &&
          !matchCategory &&
          !matchAudio &&
          !matchKeywords
        ) {
          return false;
        }
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortOption === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortOption === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortOption === "creator") {
        return a.creatorUsername.localeCompare(b.creatorUsername);
      }
      if (sortOption === "most_viewed") {
        return (b.viewCount || 0) - (a.viewCount || 0);
      }
      if (sortOption === "recently_viewed") {
        return (
          new Date(b.lastViewedAt || 0).getTime() -
          new Date(a.lastViewedAt || 0).getTime()
        );
      }
      return 0;
    });

    return result;
  }, [favorites, searchQuery, sortOption]);

  return (
    <div className="w-full">
      {/* Editorial Header */}
      <LibraryHeader
        title="Favorites"
        subtitle="Handpicked gems. Forever keepers. The media you return to again and again."
        stats={[
          { value: favorites.length, label: "FAVORITES" },
          { value: favCreatorsCount, label: "CREATORS" },
        ]}
      />

      {/* Controls: Search Pill + Sort & View Mode (Always visible, No New Category button) */}
      <FilterToolbar placeholder="Find a favorite…" />

      {favorites.length > 0 ? (
        <div className="mt-2">
          <ReelGrid
            reels={filteredFavorites}
            viewMode={viewMode}
            emptyTitle="No favorites found"
            emptySubtitle="Try adjusting your search query to find saved favorites."
          />
        </div>
      ) : (
        <div className="mt-6 sm:mt-8 flex min-h-[320px] sm:min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-dashed border-black/[0.1] px-6 py-12 text-center dark:border-white/[0.1]">
          <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 dark:bg-rose-500/20">
            <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-xl" />
            <Heart className="relative h-8 w-8 fill-rose-500/20 text-rose-500" strokeWidth={2} />
          </div>
          <h3 className="text-lg font-bold text-zinc-950 dark:text-white">
            No favorites yet
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
            Tap the heart icon on any Reel card to keep it permanently saved in your favorites.
          </p>
          <Link
            href="/reels"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Browse Reels
          </Link>
        </div>
      )}
    </div>
  );
}
