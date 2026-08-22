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
  emptyTitle = "No Reels found",
  emptySubtitle = "Save a Reel or change your filter criteria.",
}: ReelGridProps) {
  if (reels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg bg-surface-light/50 dark:bg-surface-dark/50">
        <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 mb-3 text-xl font-bold">
          🎬
        </div>
        <h4 className="text-sm font-semibold text-primaryText-light dark:text-primaryText-dark">
          {emptyTitle}
        </h4>
        <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark max-w-sm mt-1">
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
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {reels.map((reel) => (
        <ReelCard key={reel.id} reel={reel} viewMode="grid" />
      ))}
    </div>
  );
}
