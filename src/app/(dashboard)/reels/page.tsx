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

  const {
    reels,
    activeCategory,
    activeCollection,
    activeMediaType,
    setActiveMediaType,
    searchQuery,
    sortOption,
    viewMode,
    setIsSaveModalOpen,
  } = useReels();

  // Sync activeMediaType with URL search parameter if present
  useEffect(() => {
    if (typeParam && ["all", "reel", "post", "audio", "story"].includes(typeParam)) {
      setActiveMediaType(typeParam);
    }
  }, [typeParam, setActiveMediaType]);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <HeaderIcon className="w-6 h-6 text-brand-500" />
            <h1 className="text-2xl font-bold tracking-tight text-primaryText-light dark:text-primaryText-dark">
              {headerInfo.title}
            </h1>
          </div>
          <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark mt-1 font-mono">
            {headerInfo.description}
          </p>
        </div>
        <button
          onClick={() => setIsSaveModalOpen(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-xs font-semibold rounded-rd-md shadow-rd-subtle transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{headerInfo.saveBtnText}</span>
        </button>
      </div>

      {/* Toolbar */}
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
