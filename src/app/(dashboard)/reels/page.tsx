"use client";

import React from "react";
import { useReels } from "@/context/ReelContext";
import { FilterToolbar } from "@/components/ui/FilterToolbar";
import { ReelGrid } from "@/components/reels/ReelGrid";
import { Plus } from "lucide-react";

export default function AllReelsPage() {
  const {
    reels,
    activeCategory,
    activeCollection,
    activeMediaType,
    searchQuery,
    sortOption,
    viewMode,
    setIsSaveModalOpen,
  } = useReels();

  // Filter Reels based on mediaType, search, category, and collection
  let filteredReels = reels.filter((reel) => {
    // Media type filter
    if (activeMediaType && activeMediaType !== "all") {
      const type = reel.mediaType || "reel";
      if (type !== activeMediaType) {
        return false;
      }
    }
    // Search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCaption = reel.caption.toLowerCase().includes(q);
      const matchCreator = reel.creatorUsername.toLowerCase().includes(q);
      const matchCategory = reel.category.toLowerCase().includes(q);
      const matchAudio = reel.audioTitle?.toLowerCase().includes(q) || reel.audioArtist?.toLowerCase().includes(q);
      const matchKeywords = reel.aiKeywords?.some((k) => k.toLowerCase().includes(q));
      if (!matchCaption && !matchCreator && !matchCategory && !matchAudio && !matchKeywords) {
        return false;
      }
    }
    // Category match
    if (activeCategory && reel.category !== activeCategory) {
      return false;
    }
    // Collection match
    if (activeCollection && !reel.collections.includes(activeCollection)) {
      return false;
    }
    return true;
  });

  // Sort Reels
  filteredReels.sort((a, b) => {
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
      return new Date(b.lastViewedAt || 0).getTime() - new Date(a.lastViewedAt || 0).getTime();
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primaryText-light dark:text-primaryText-dark">
            All Reels
          </h1>
          <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark mt-0.5 font-mono">
            {reels.length} saved Reels
          </p>
        </div>
        <button
          onClick={() => setIsSaveModalOpen(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-xs font-semibold rounded-rd-md shadow-rd-subtle transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Save Reel</span>
        </button>
      </div>

      {/* Toolbar */}
      <FilterToolbar />

      {/* Grid / List View */}
      <ReelGrid reels={filteredReels} viewMode={viewMode} />
    </div>
  );
}
