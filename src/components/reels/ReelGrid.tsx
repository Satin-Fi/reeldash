"use client";

import React from "react";
import { Reel, ViewMode } from "@/types/reel";
import { ReelCard } from "@/components/reels/ReelCard";
import { useOptionalReels } from "@/context/ReelContext";

interface ReelGridProps {
  reels: Reel[];
  viewMode?: ViewMode;
  gridCols?: number;
  emptyTitle?: string;
  emptySubtitle?: string;
  /** Maximum number of reels to display */
  limit?: number;
  aspectRatio?: "reel" | "square" | "auto";
}

const getGridColsClass = (count: number) => {
  switch (count) {
    case 1:
      return "grid-cols-1";
    case 2:
      return "grid-cols-2";
    case 3:
      return "grid-cols-3";
    case 4:
      return "grid-cols-4";
    case 5:
      return "grid-cols-5";
    case 6:
      return "grid-cols-6";
    default:
      return "grid-cols-3";
  }
};

export function ReelGrid({
  reels,
  viewMode = "grid",
  gridCols: propGridCols,
  emptyTitle = "No items found",
  emptySubtitle = "Save a link or adjust your filters.",
  limit,
  aspectRatio = "auto",
}: ReelGridProps) {
  const reelContext = useOptionalReels();
  const cols = propGridCols || reelContext?.gridCols || 4;
  const displayReels = limit ? reels.slice(0, limit) : reels;

  const isAllPosts =
    displayReels.length > 0 &&
    displayReels.every(
      (r) => r.mediaType === "post" || (r.instagramUrl?.includes("/p/") && !r.mediaUrl?.includes(".mp4"))
    );
  const computedRatio: "reel" | "square" | "auto" =
    aspectRatio === "square" ? "square" : aspectRatio === "reel" ? "reel" : isAllPosts ? "square" : "auto";

  if (displayReels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <p className="text-sm font-semibold text-primaryText-light dark:text-primaryText-dark">
          {emptyTitle}
        </p>
        <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark max-w-xs mt-2 leading-relaxed">
          {emptySubtitle}
        </p>
      </div>
    );
  }

  if (viewMode === "compact") {
    return (
      <div className="flex flex-col space-y-2">
        {displayReels.map((reel) => (
          <ReelCard key={reel.id} reel={reel} viewMode="compact" aspectRatio={computedRatio} />
        ))}
      </div>
    );
  }

  if (viewMode === "feed") {
    return (
      <div className="flex flex-col space-y-5 max-w-xl mx-auto py-2">
        {displayReels.map((reel) => (
          <ReelCard key={reel.id} reel={reel} viewMode="feed" aspectRatio={computedRatio} />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${getGridColsClass(cols)} gap-[1.5px] bg-borderSubtle-light dark:bg-black/80`}>
      {displayReels.map((reel) => (
        <ReelCard key={reel.id} reel={reel} viewMode="grid" aspectRatio={computedRatio} />
      ))}
    </div>
  );
}

/** Skeleton loader matching the dynamic grid columns layout */
export function ReelGridSkeleton({
  count = 12,
  gridCols: propGridCols,
  aspectRatio = "reel",
}: {
  count?: number;
  gridCols?: number;
  aspectRatio?: "reel" | "square" | "auto";
}) {
  const reelContext = useOptionalReels();
  const cols = propGridCols || reelContext?.gridCols || 4;

  return (
    <div className={`grid ${getGridColsClass(cols)} gap-[1.5px] bg-borderSubtle-light dark:bg-black/80`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${aspectRatio === "square" ? "aspect-square" : "aspect-[9/16]"} w-full bg-zinc-800/50 animate-pulse`}
        />
      ))}
    </div>
  );
}
