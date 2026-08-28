"use client";

import React, { useState } from "react";
import { useReels } from "@/context/ReelContext";
import { useAuth } from "@/context/AuthContext";
import { ReelGrid } from "@/components/reels/ReelGrid";
import {
  Film,
  Heart,
  Bookmark,
  Music2,
  Sparkles,
  ArrowRight,
  MessageCircle,
  Plus,
  Loader2,
  CheckCircle2,
  Search,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { reels, favorites, saveReel, isSaveModalOpen, setIsSaveModalOpen } = useReels();
  const { user } = useAuth();

  const [inputUrl, setInputUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const displayName = user?.name ? user.name.split(" ")[0] : "there";

  const handleQuickSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await saveReel(inputUrl.trim());
      setInputUrl("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const reelsCount = reels.filter((r) => !r.mediaType || r.mediaType === "reel").length;
  const postsCount = reels.filter((r) => r.mediaType === "post").length;
  const audioCount = reels.filter((r) => r.mediaType === "audio").length;
  const favsCount = favorites.length;

  const recentlySaved = [...reels].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* ─── Hero Header & Quick Save Bar ─── */}
      <div className="p-6 md:p-8 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg shadow-rd-subtle space-y-6 transition-colors duration-200">
        
        {/* Welcome Text */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Visual Reel Library</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primaryText-light dark:text-primaryText-dark">
            {greeting}, {displayName}
          </h1>
          <p className="text-xs sm:text-sm text-secondaryText-light dark:text-secondaryText-dark max-w-xl">
            Save Instagram Reels, Posts, and Audio effortlessly. Paste any URL below or send directly via Instagram DM.
          </p>
        </div>

        {/* In-Dashboard Quick-Save Input Bar */}
        <form onSubmit={handleQuickSave} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Paste Instagram Reel or Post link (e.g. https://www.instagram.com/reel/...)"
              className="w-full pl-4 pr-10 py-3 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md text-xs sm:text-sm text-primaryText-light dark:text-primaryText-dark placeholder:text-mutedText-light dark:placeholder:text-mutedText-dark focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
            />
            {inputUrl && (
              <button
                type="button"
                onClick={() => setInputUrl("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mutedText-light dark:text-mutedText-dark hover:text-primaryText-light dark:hover:text-primaryText-dark text-xs"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!inputUrl.trim() || isSubmitting}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm rounded-rd-md shadow-rd-glow transition-all shrink-0 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                <span>Save to Library</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* ─── Metric Stat Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Reels */}
        <Link
          href="/reels?type=reel"
          className="p-4 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark hover:border-brand-500/40 rounded-rd-md shadow-rd-subtle flex items-center space-x-3.5 transition-all group cursor-pointer"
        >
          <div className="p-2.5 rounded-rd-sm bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-secondaryText-light dark:text-secondaryText-dark uppercase tracking-wider">
              Reels
            </p>
            <p className="text-xl font-bold font-mono text-primaryText-light dark:text-primaryText-dark">
              {reelsCount}
            </p>
          </div>
        </Link>

        {/* Posts & Photos */}
        <Link
          href="/reels?type=post"
          className="p-4 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark hover:border-brand-500/40 rounded-rd-md shadow-rd-subtle flex items-center space-x-3.5 transition-all group cursor-pointer"
        >
          <div className="p-2.5 rounded-rd-sm bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform shrink-0">
            <Bookmark className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-secondaryText-light dark:text-secondaryText-dark uppercase tracking-wider">
              Posts
            </p>
            <p className="text-xl font-bold font-mono text-primaryText-light dark:text-primaryText-dark">
              {postsCount}
            </p>
          </div>
        </Link>

        {/* Audio */}
        <Link
          href="/reels?type=audio"
          className="p-4 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark hover:border-brand-500/40 rounded-rd-md shadow-rd-subtle flex items-center space-x-3.5 transition-all group cursor-pointer"
        >
          <div className="p-2.5 rounded-rd-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
            <Music2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-secondaryText-light dark:text-secondaryText-dark uppercase tracking-wider">
              Audio
            </p>
            <p className="text-xl font-bold font-mono text-primaryText-light dark:text-primaryText-dark">
              {audioCount}
            </p>
          </div>
        </Link>

        {/* Favorites */}
        <Link
          href="/favorites"
          className="p-4 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark hover:border-brand-500/40 rounded-rd-md shadow-rd-subtle flex items-center space-x-3.5 transition-all group cursor-pointer"
        >
          <div className="p-2.5 rounded-rd-sm bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform shrink-0">
            <Heart className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-secondaryText-light dark:text-secondaryText-dark uppercase tracking-wider">
              Favorites
            </p>
            <p className="text-xl font-bold font-mono text-primaryText-light dark:text-primaryText-dark">
              {favsCount}
            </p>
          </div>
        </Link>
      </div>

      {/* ─── Content: Recently Saved or Actionable Empty State ─── */}
      <div className="space-y-4">
        {reels.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-primaryText-light dark:text-primaryText-dark tracking-tight">
                Recently Saved
              </h2>
              <Link
                href="/reels"
                className="flex items-center space-x-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                <span>View all library</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <ReelGrid reels={recentlySaved} />
          </>
        ) : (
          /* ─── Clean, Actionable Empty State (Zero Mock Data) ─── */
          <div className="p-8 sm:p-12 text-center bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg shadow-rd-subtle space-y-6">
            <div className="w-12 h-12 rounded-full bg-brand-500/10 text-brand-500 mx-auto flex items-center justify-center">
              <Film className="w-6 h-6" />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-primaryText-light dark:text-primaryText-dark">
                Your Reel library is ready
              </h3>
              <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark leading-relaxed">
                Save your first Instagram Reel or Post using the box above, or link your Instagram account to save reels seamlessly via DM.
              </p>
            </div>

            {/* Two clean onboarding action cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto pt-2 text-left">
              
              <div className="p-4 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md space-y-2">
                <div className="flex items-center space-x-2 text-brand-600 dark:text-brand-400 font-semibold text-xs">
                  <Plus className="w-4 h-4" />
                  <span>Option 1: Paste Link</span>
                </div>
                <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark">
                  Copy any Instagram reel URL and paste it in the box at the top of your dashboard.
                </p>
              </div>

              <Link
                href="/integrations/instagram"
                className="p-4 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark hover:border-brand-500/40 rounded-rd-md space-y-2 group transition-colors block"
              >
                <div className="flex items-center justify-between text-violet-600 dark:text-violet-400 font-semibold text-xs">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>Option 2: Instagram DM</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark">
                  Link your @handle to DM reels to @ReelDash_app and auto-sync to your gallery.
                </p>
              </Link>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
