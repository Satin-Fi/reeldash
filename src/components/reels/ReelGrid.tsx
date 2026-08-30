"use client";

import React from "react";
import { Reel, ViewMode } from "@/types/reel";
import { ReelCard } from "@/components/reels/ReelCard";

interface ReelGridProps {
  reels: Reel[];
  viewMode?: ViewMode;
  emptyTitle?: string;
  emptySubtitle?: string;
}

export function ReelGrid({
  reels,
  viewMode = "grid",
  emptyTitle = "No items found",
  emptySubtitle = "Save a link or adjust your filters.",
}: ReelGridProps) {
  if (reels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center border border-dashed border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg bg-surface-light/40 dark:bg-surface-dark/40">
        <h4 className="text-sm font-semibold tracking-tight text-primaryText-light dark:text-primaryText-dark">
          {emptyTitle}
        </h4>
        <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark max-w-sm mt-1.5 leading-relaxed">
          {emptySubtitle}
        </p>
      </div>
    );
  }

  if (viewMode === "compact") {
    return (
      <div className="flex flex-col space-y-2">
        {reels.map((reel) => (
          <ReelCard key={reel.id} reel={reel} viewMode="compact" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
      {reels.map((reel) => (
        <ReelCard key={reel.id} reel={reel} viewMode="grid" />
      ))}
    </div>
  );
}
