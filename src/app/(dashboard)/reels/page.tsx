"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useReels } from "@/context/ReelContext";
import { MediaTypeFilter } from "@/types/reel";
import { FilterToolbar } from "@/components/ui/FilterToolbar";
import { ReelGrid } from "@/components/reels/ReelGrid";
import { Plus, Film, Image as ImageIcon, Music2, CircleDashed, Layers } from "lucide-react";

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
    setIsSaveModalOpen,
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
      if (!reel.category || reel.category.trim().toLowerCase() !== activeCategory.trim().toLowerCase()) {
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

  // Dynamic header info
  const getHeaderInfo = () => {
    switch (activeMediaType) {
      case "reel":
        return {
          title: "Reels",
          description: `${filteredReels.length} saved video Reels`,
          icon: Film,
          saveBtnText: "Save Reel",
        };
      case "post":
        return {
          title: "Posts & Carousels",
          description: `${filteredReels.length} saved photo posts & carousels`,
          icon: ImageIcon,
          saveBtnText: "Save Post",
        };
      case "audio":
        return {
          title: "Songs & Audio Tracks",
          description: `${filteredReels.length} saved soundtrack & audio tracks`,
          icon: Music2,
          saveBtnText: "Save Song",
        };
      case "story":
        return {
          title: "Stories & Highlights",
          description: `${filteredReels.length} saved 24h stories`,
          icon: CircleDashed,
          saveBtnText: "Save Story",
        };
      default:
        return {
          title: "All Library",
          description: `${filteredReels.length} total saved items across all media`,
          icon: Layers,
          saveBtnText: "Save Media",
        };
    }
  };

  const headerInfo = getHeaderInfo();
  const HeaderIcon = headerInfo.icon;

  return (
    <div className="space-y-4">
      {/* Sleek Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline space-x-2">
          <h1 className="text-xl font-semibold tracking-tight text-primaryText-light dark:text-primaryText-dark">
            {headerInfo.title}
          </h1>
          <span className="text-xs text-zinc-500 font-normal">
            · {filteredReels.length} {filteredReels.length === 1 ? "item" : "items"}
          </span>
        </div>
        <button
          onClick={() => setIsSaveModalOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#5B52E8] hover:bg-[#4E45D9] active:scale-95 text-white text-xs font-medium rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{headerInfo.saveBtnText}</span>
        </button>
      </div>

      {/* Modern Unified Toolbar */}
      <FilterToolbar />

      {/* Grid / List View */}
      <ReelGrid reels={filteredReels} viewMode={viewMode} />
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
