"use client";

import React from "react";
import { Reel, ViewMode } from "@/types/reel";
import { ReelCard } from "@/components/reels/ReelCard";

interface ReelGridProps {
  reels: Reel[];
  viewMode?: ViewMode;
  emptyTitle?: string;
  emptySubtitle?: string;
  /** Maximum number of reels to display */
  limit?: number;
}

export function ReelGrid({
  reels,
  viewMode = "grid",
  emptyTitle = "No items found",
  emptySubtitle = "Save a link or adjust your filters.",
  limit,
}: ReelGridProps) {
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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0">
      {displayReels.map((reel) => (
        <ReelCard key={reel.id} reel={reel} viewMode="grid" />
      ))}
    </div>
  );
}

/** Skeleton loader matching the zero-gap grid layout */
export function ReelGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-[9/16] w-full bg-zinc-800/50 animate-pulse"
        />
      ))}
    </div>
  );
}
