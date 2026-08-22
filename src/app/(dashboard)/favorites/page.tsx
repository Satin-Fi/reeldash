"use client";

import React from "react";
import { useReels } from "@/context/ReelContext";
import { ReelGrid } from "@/components/reels/ReelGrid";
import { Heart } from "lucide-react";
import Link from "next/link";

export default function FavoritesPage() {
  const { favorites, viewMode } = useReels();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primaryText-light dark:text-primaryText-dark">
          Favorites
        </h1>
        <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark mt-0.5">
          The Reels you don&apos;t want to lose.
        </p>
      </div>

      {favorites.length > 0 ? (
        <ReelGrid reels={favorites} viewMode={viewMode} />
      ) : (
        <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg bg-surface-light/50 dark:bg-surface-dark/50 space-y-3">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
            <Heart className="w-7 h-7 fill-rose-500/20 text-rose-500" />
          </div>
          <h3 className="text-base font-bold text-primaryText-light dark:text-primaryText-dark">
            No favorites yet
          </h3>
          <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark max-w-sm">
            Tap the heart icon on any Reel card to keep it saved here.
          </p>
          <Link
            href="/reels"
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-rd-md text-xs font-semibold shadow-rd-subtle transition-all"
          >
            Browse Reels
          </Link>
        </div>
      )}
    </div>
  );
}
