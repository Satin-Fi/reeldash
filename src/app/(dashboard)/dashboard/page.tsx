"use client";

import React from "react";
import { useReels } from "@/context/ReelContext";
import { useAuth } from "@/context/AuthContext";
import { ReelGrid } from "@/components/reels/ReelGrid";
import { Plus, Film, Folder, Heart, Sparkles, ArrowRight, Bookmark } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { reels, favorites, collections, setIsSaveModalOpen } = useReels();
  const { user } = useAuth();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const recentlySaved = [...reels].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-8">
      {/* 13. Dashboard Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg shadow-rd-subtle">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primaryText-light dark:text-primaryText-dark">
            {greeting}, {user?.name || "there"}
          </h1>
          <p className="text-xs sm:text-sm text-secondaryText-light dark:text-secondaryText-dark mt-1">
            Your Reel library is automatically organized and ready to explore.
          </p>
        </div>
        <button
          onClick={() => setIsSaveModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-medium text-xs rounded-rd-md shadow-rd-subtle transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Save Reel</span>
        </button>
      </div>

      {/* 14. Dashboard Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Saved Reels */}
        <div className="p-4 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md shadow-rd-subtle flex items-center space-x-3">
          <div className="p-2.5 rounded-rd-sm bg-brand-500/10 text-brand-500">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-secondaryText-light dark:text-secondaryText-dark">
              Saved Reels
            </p>
            <p className="text-lg font-bold font-mono text-primaryText-light dark:text-primaryText-dark mt-0.5">
              {reels.length}
            </p>
          </div>
        </div>

        {/* Collections */}
        <div className="p-4 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md shadow-rd-subtle flex items-center space-x-3">
          <div className="p-2.5 rounded-rd-sm bg-indigo-500/10 text-indigo-500">
            <Folder className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-secondaryText-light dark:text-secondaryText-dark">
              Collections
            </p>
            <p className="text-lg font-bold font-mono text-primaryText-light dark:text-primaryText-dark mt-0.5">
              {collections.length}
            </p>
          </div>
        </div>

        {/* Favorites */}
        <div className="p-4 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md shadow-rd-subtle flex items-center space-x-3">
          <div className="p-2.5 rounded-rd-sm bg-rose-500/10 text-rose-500">
            <Heart className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-secondaryText-light dark:text-secondaryText-dark">
              Favorites
            </p>
            <p className="text-lg font-bold font-mono text-primaryText-light dark:text-primaryText-dark mt-0.5">
              {favorites.length}
            </p>
          </div>
        </div>

        {/* Saved This Week */}
        <div className="p-4 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md shadow-rd-subtle flex items-center space-x-3">
          <div className="p-2.5 rounded-rd-sm bg-emerald-500/10 text-emerald-500">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-secondaryText-light dark:text-secondaryText-dark">
              Saved This Week
            </p>
            <p className="text-lg font-bold font-mono text-primaryText-light dark:text-primaryText-dark mt-0.5">
              {reels.filter((r) => new Date(r.createdAt).getTime() > Date.now() - 7 * 24 * 3600 * 1000).length}
            </p>
          </div>
        </div>
      </div>

      {/* 15. Recently Saved / Zero Data Empty State */}
      <div className="space-y-4">
        {reels.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-primaryText-light dark:text-primaryText-dark">
                Recently Saved
              </h2>
              <Link
                href="/reels"
                className="flex items-center space-x-1 text-xs font-medium text-brand-500 hover:underline"
              >
                <span>View all reels</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <ReelGrid reels={recentlySaved} />
          </>
        ) : (
          /* SECTION 6: NEW USER ZERO-DATA STATE */
          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg bg-surface-light/50 dark:bg-surface-dark/50 space-y-4">
            <div className="w-14 h-14 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 text-2xl font-bold">
              ⚡
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">Your Reel memory starts here</h3>
              <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark max-w-sm mx-auto">
                Save your first Reel and we&apos;ll automatically organize, categorize, and make it searchable for you.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => setIsSaveModalOpen(true)}
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-rd-md text-xs shadow-rd-subtle flex items-center space-x-2 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Save Your First Reel</span>
              </button>
              <Link
                href="/demo"
                className="px-4 py-2.5 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark text-secondaryText-light hover:text-primaryText-light text-xs font-medium rounded-rd-md"
              >
                Explore Demo Mode
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
