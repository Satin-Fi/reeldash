"use client";

import React, { useState } from "react";
import { useReels } from "@/context/ReelContext";
import { ReelGrid } from "@/components/reels/ReelGrid";
import { Search, X, Sparkles, Filter } from "lucide-react";

export default function SearchPage() {
  const { reels, searchQuery, setSearchQuery, viewMode, smartCategories, collections } = useReels();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Filter Reels based on query and selected facets
  const results = reels.filter((r) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primaryText-light dark:text-primaryText-dark">
          Search Library
        </h1>
        <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark mt-0.5">
          Find saved Reels by topic, creator, keyword, or personal notes.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="w-5 h-5 text-mutedText-light absolute left-4 pointer-events-none" />
        <input
          type="text"
          placeholder="Search captions, creators (@creator), categories, or notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
          className="w-full pl-12 pr-10 py-3.5 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg text-sm text-primaryText-light dark:text-primaryText-dark focus:outline-none focus:border-brand-500 shadow-rd-subtle transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 text-mutedText-light hover:text-primaryText-light cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

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
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* Search Results Count */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-semibold text-secondaryText-light dark:text-secondaryText-dark">
          {results.length} Reels found
        </span>
      </div>

      {/* Search Results Grid */}
      <ReelGrid
        reels={results}
        viewMode={viewMode}
        emptyTitle="Search your Reel memory"
        emptySubtitle="Try typing keywords like 'workout', 'python', 'paneer', or a creator username."
      />
    </div>
  );
}
