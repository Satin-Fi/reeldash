"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useReels } from "@/context/ReelContext";
import { MediaTypeFilter } from "@/types/reel";
import { FilterToolbar } from "@/components/ui/FilterToolbar";
import { ReelGrid } from "@/components/reels/ReelGrid";

function ReelsContent() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type") as MediaTypeFilter | null;
  const categoryParam = searchParams.get("category");

  const {
    reels,
    activeCategory,
    setActiveCategory,
    activeCollection,
    activeMediaType,
    setActiveMediaType,
    searchQuery,
    sortOption,
    viewMode,
  } = useReels();

  // Sync activeMediaType & activeCategory with URL search parameters
  useEffect(() => {
    if (typeParam && ["all", "reel", "post", "audio", "story"].includes(typeParam)) {
      setActiveMediaType(typeParam);
    }
    if (categoryParam) {
      setActiveCategory(categoryParam);
      setActiveMediaType("all");
    }
  }, [typeParam, categoryParam, setActiveMediaType, setActiveCategory]);

  // Filter Reels based on mediaType, search, category, and collection
  let filteredReels = reels.filter((reel) => {
    // Category match (Case-insensitive)
    if (activeCategory) {
      const catLower = activeCategory.trim().toLowerCase();
      const allAssigned = reel.categories && reel.categories.length > 0 ? reel.categories : [reel.category || ""];
      const matchCat = allAssigned.some((c) => c.toLowerCase() === catLower);
      const matchTags =
        (Array.isArray(reel.tags) && reel.tags.some((t) => t.toLowerCase() === catLower)) ||
        (Array.isArray(reel.hashtags) && reel.hashtags.some((h) => h.toLowerCase() === catLower));
      const matchKeywords = Array.isArray(reel.aiKeywords) && reel.aiKeywords.some((k) => k.toLowerCase() === catLower);
      const matchSub = Array.isArray(reel.subcategories) && reel.subcategories.some((s) => s.toLowerCase() === catLower);
      if (!matchCat && !matchTags && !matchKeywords && !matchSub) {
        return false;
      }
    }
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
      const matchCaption = reel.caption?.toLowerCase().includes(q);
      const matchCreator = reel.creatorUsername?.toLowerCase().includes(q);
      const matchCategory = reel.category?.toLowerCase().includes(q);
      const matchAudio = reel.audioTitle?.toLowerCase().includes(q) || reel.audioArtist?.toLowerCase().includes(q);
      const matchKeywords = reel.aiKeywords?.some((k) => k.toLowerCase().includes(q));
      if (!matchCaption && !matchCreator && !matchCategory && !matchAudio && !matchKeywords) {
        return false;
      }
    }
    // Collection match
    if (activeCollection && !reel.collections?.includes(activeCollection)) {
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
    <div className="w-full space-y-5">
      {/* Payflow-Style Top Search & Action Bar */}
      <FilterToolbar />

      {/* Grid / Feed / Compact View */}
      <ReelGrid
        reels={filteredReels}
        viewMode={viewMode}
        emptyTitle="No reels found"
        emptySubtitle="Try adjusting your search query or filters."
      />
    </div>
  );
}

export default function AllReelsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-mutedText-light">Loading library…</div>}>
      <ReelsContent />
    </Suspense>
  );
}
