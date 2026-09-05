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
}

const getGridColsClass = (count: number) => {
  switch (count) {
    case 3:
      return "grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3";
    case 4:
      return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4";
    case 5:
      return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5";
    case 6:
      return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";
    default:
      return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4";
  }
};

export function ReelGrid({
  reels,
  viewMode = "grid",
  gridCols: propGridCols,
  emptyTitle = "No items found",
  emptySubtitle = "Save a link or adjust your filters.",
  limit,
}: ReelGridProps) {
  const reelContext = useOptionalReels();
  const cols = propGridCols || reelContext?.gridCols || 4;
  const displayReels = limit ? reels.slice(0, limit) : reels;

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
          <ReelCard key={reel.id} reel={reel} viewMode="compact" />
        ))}
      </div>
    );
  }

  if (viewMode === "feed") {
    return (
      <div className="flex flex-col space-y-5 max-w-xl mx-auto py-2">
        {displayReels.map((reel) => (
          <ReelCard key={reel.id} reel={reel} viewMode="feed" />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${getGridColsClass(cols)} gap-[1.5px] bg-borderSubtle-light dark:bg-black/80`}>
      {displayReels.map((reel) => (
        <ReelCard key={reel.id} reel={reel} viewMode="grid" />
      ))}
    </div>
  );
}

/** Skeleton loader matching the dynamic grid columns layout */
export function ReelGridSkeleton({ count = 12, gridCols: propGridCols }: { count?: number; gridCols?: number }) {
  const reelContext = useOptionalReels();
  const cols = propGridCols || reelContext?.gridCols || 4;

  return (
    <div className={`grid ${getGridColsClass(cols)} gap-[1.5px] bg-borderSubtle-light dark:bg-black/80`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-[9/16] w-full bg-zinc-800/50 animate-pulse"
        />
      ))}
    </div>
  );
}
