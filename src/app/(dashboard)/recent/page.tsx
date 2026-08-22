"use client";

import React from "react";
import { useReels } from "@/context/ReelContext";
import { ReelGrid } from "@/components/reels/ReelGrid";
import { Clock } from "lucide-react";

export default function RecentlySavedPage() {
  const { reels, viewMode } = useReels();

  const now = Date.now();
  const oneDay = 24 * 3600 * 1000;

  const todayReels = reels.filter((r) => now - new Date(r.createdAt).getTime() < oneDay);
  const yesterdayReels = reels.filter((r) => {
    const diff = now - new Date(r.createdAt).getTime();
    return diff >= oneDay && diff < 2 * oneDay;
  });
  const earlierReels = reels.filter((r) => now - new Date(r.createdAt).getTime() >= 2 * oneDay);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-brand-500" />
          <h1 className="text-2xl font-bold tracking-tight text-primaryText-light dark:text-primaryText-dark">
            Recently Saved
          </h1>
        </div>
        <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark mt-0.5">
          Chronological feed of saved Instagram content.
        </p>
      </div>

      {/* Today Section */}
      {todayReels.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-mutedText-light dark:text-mutedText-dark border-b border-borderSubtle-light dark:border-borderSubtle-dark pb-1.5">
            Today
          </h2>
          <ReelGrid reels={todayReels} viewMode={viewMode} />
        </div>
      )}

      {/* Yesterday Section */}
      {yesterdayReels.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-mutedText-light dark:text-mutedText-dark border-b border-borderSubtle-light dark:border-borderSubtle-dark pb-1.5">
            Yesterday
          </h2>
          <ReelGrid reels={yesterdayReels} viewMode={viewMode} />
        </div>
      )}

      {/* Earlier Section */}
      {earlierReels.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-mutedText-light dark:text-mutedText-dark border-b border-borderSubtle-light dark:border-borderSubtle-dark pb-1.5">
            Earlier this week
          </h2>
          <ReelGrid reels={earlierReels} viewMode={viewMode} />
        </div>
      )}
    </div>
  );
}
