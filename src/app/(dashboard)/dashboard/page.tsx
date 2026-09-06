"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useReels } from "@/context/ReelContext";
import { ReelGrid } from "@/components/reels/ReelGrid";
import {
  ArrowRight,
  ArrowUpRight,
  Film,
  Heart,
  Image as ImageIcon,
  Link2,
  Loader2,
  Music2,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";

type MediaTypeFilter = "all" | "reel" | "post" | "audio" | "favorite";

type DashboardCounts = { reels: number; posts: number; audio: number; favorites: number };

const greetings = [
  { text: "Good morning", textAfternoon: "Good afternoon", textEvening: "Good evening" },
  { text: "Bonjour", textAfternoon: "Bonjour", textEvening: "Bonsoir" },
  { text: "¡Buenos días", textAfternoon: "¡Buenas tardes", textEvening: "¡Buenas noches" },
  { text: "Namaste", textAfternoon: "Namaste", textEvening: "Namaste" },
  { text: "Ohayō", textAfternoon: "Konnichiwa", textEvening: "Konbanwa" },
  { text: "Buongiorno", textAfternoon: "Buon pomeriggio", textEvening: "Buonasera" },
  { text: "Guten Morgen", textAfternoon: "Guten Tag", textEvening: "Guten Abend" },
  { text: "Olá", textAfternoon: "Boa tarde", textEvening: "Boa noite" },
];

export default function DashboardPage() {
  const {
    reels,
    favorites,
    saveReel,
    activeCategory,
    selectedInstagramAccount,
  } = useReels();
  const { user } = useAuth();
  const [inputUrl, setInputUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<MediaTypeFilter>("all");
  const [greetingIndex, setGreetingIndex] = useState(0);

  useEffect(() => {
    setGreetingIndex(Math.floor(Math.random() * greetings.length));
  }, []);

  const hour = new Date().getHours();
  const activeGreetingObj = greetings[greetingIndex] || greetings[0];
  const timeGreeting = hour < 12 
    ? activeGreetingObj.text 
    : hour < 17 
    ? activeGreetingObj.textAfternoon 
    : activeGreetingObj.textEvening;

  const connectedAccounts = user?.connectedAccounts || [];
  // SINGLE SOURCE OF TRUTH: strictly active accounts
  const activeAccounts = connectedAccounts.filter((a) => a.status === "active");

  const activeAccount = selectedInstagramAccount
    ? activeAccounts.find(
        (a) => a.username.toLowerCase() === selectedInstagramAccount.toLowerCase()
      )
    : null;

  // When a specific profile is selected, display that profile's name or handle.
  // When All Accounts is selected, display the account holder's primary name.
  const displayName = selectedInstagramAccount && activeAccount
    ? activeAccount.displayName && activeAccount.displayName.trim().length > 0
      ? activeAccount.displayName.trim()
      : `@${selectedInstagramAccount}`
    : user?.name
    ? user.name.split(" ")[0]
    : user?.email
    ? user.email.split("@")[0]
    : "Creator";

  const recentlySaved = [...reels].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const previewItems = recentlySaved.slice(0, 3);
  const featuredItem = previewItems[0];

  const counts: DashboardCounts = {
    reels: reels.filter((reel) => !reel.mediaType || reel.mediaType === "reel").length,
    posts: reels.filter((reel) => reel.mediaType === "post").length,
    audio: reels.filter((reel) => reel.mediaType === "audio").length,
    favorites: favorites.length,
  };
  const thisWeekCount = reels.filter((reel) => {
    const savedAt = new Date(reel.createdAt).getTime();
    return Number.isFinite(savedAt) && Date.now() - savedAt < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const handleQuickSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inputUrl.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await saveReel(inputUrl.trim());
      setInputUrl("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReels = reels.filter((reel) => {
    if (selectedFilter === "reel") {
      if (reel.mediaType && reel.mediaType !== "reel") return false;
    } else if (selectedFilter === "post") {
      if (reel.mediaType !== "post") return false;
    } else if (selectedFilter === "audio") {
      if (reel.mediaType !== "audio") return false;
    } else if (selectedFilter === "favorite") {
      if (!reel.isFavorite) return false;
    }

    if (activeCategory) {
      const catLower = activeCategory.trim().toLowerCase();
      const allAssigned =
        reel.categories && reel.categories.length > 0
          ? reel.categories
          : [reel.category || ""];
      const matchCat = allAssigned.some((c) => c && c.toLowerCase() === catLower);
      const matchTags =
        (Array.isArray(reel.tags) && reel.tags.some((t) => t && t.toLowerCase() === catLower)) ||
        (Array.isArray(reel.hashtags) && reel.hashtags.some((h) => h && h.toLowerCase() === catLower));
      const matchKeywords =
        Array.isArray(reel.aiKeywords) && reel.aiKeywords.some((k) => k && k.toLowerCase() === catLower);
      const matchSub =
        Array.isArray(reel.subcategories) &&
        reel.subcategories.some((s) => s && s.toLowerCase() === catLower);
      if (!matchCat && !matchTags && !matchKeywords && !matchSub) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="w-full space-y-6">
      {/* ─── Top Floating Search & Account Indicator Bar ─── */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
            );
          }}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white dark:bg-[#1A1918] border border-black/[0.04] dark:border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.02)] text-xs text-secondaryText-light dark:text-zinc-400 hover:border-black/[0.08] dark:hover:border-white/[0.12] transition-all w-full max-w-sm cursor-pointer group"
        >
          <Search className="w-3.5 h-3.5 text-mutedText-light dark:text-zinc-500 group-hover:text-primaryText-light dark:group-hover:text-white transition-colors" />
          <span className="font-normal text-mutedText-light dark:text-zinc-400">Search library...</span>
          <kbd className="ml-auto font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#F4F2EE] dark:bg-white/[0.06] text-mutedText-light dark:text-zinc-400">⌘ K</kbd>
        </button>

        {/* Powder Sky Pastel Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAF2FA] dark:bg-[#3B82F6]/15 border border-[#D3E4F6] dark:border-[#3B82F6]/25 text-[11px] font-medium text-[#275787] dark:text-[#A5CEFA] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2E75B6] dark:bg-[#60A5FA] animate-pulse" />
          <span>
            {selectedInstagramAccount
              ? `@${selectedInstagramAccount}`
              : activeAccounts.length > 0
              ? `${activeAccounts.length} Connected`
              : "Unified Library"}
          </span>
        </div>
      </div>

      {/* ─── Hero Bento: Double-Bezel Ingest & Metrics + Spotlight ─── */}
      <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        {/* Double-Bezel Quick Ingest & Key Metrics */}
        <section className="animate-fade-up delay-0 p-1.5 rounded-[24px] bg-[#FAF8F5] dark:bg-[#1E1D1B] border border-black/[0.04] dark:border-white/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="relative overflow-hidden rounded-[20px] bg-white dark:bg-[#181716] border border-black/[0.03] dark:border-white/[0.04] p-6 sm:p-7 flex flex-col justify-between h-full shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F2EDE4] dark:bg-white/[0.06] text-[11px] font-medium text-secondaryText-light dark:text-zinc-300">
                  <Sparkles className="w-3 h-3 text-brand-500" />
                  <span>Workspace</span>
                </span>
              </div>
              <h1 className="font-bricolage text-[1.85rem] sm:text-[2.2rem] font-bold leading-[1.12] tracking-[-0.03em] text-primaryText-light dark:text-primaryText-dark">
                {timeGreeting}, {displayName}.
              </h1>

              {/* Ingest Input Form - Zero Bloat */}
              <form onSubmit={handleQuickSave} className="mt-6 sm:mt-8 grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="group relative">
                  <Link2 className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-mutedText-light dark:text-zinc-500 group-focus-within:text-[#5E468A] dark:group-focus-within:text-[#D1BFF8] transition-colors" />
                  <input
                    type="text"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="Paste Instagram link or /category..."
                    className="h-12 w-full rounded-[14px] border border-black/[0.06] dark:border-white/[0.08] bg-[#FAF8F5] dark:bg-[#121110] pl-11 pr-10 text-sm text-primaryText-light dark:text-white placeholder:text-mutedText-light dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-[#151413] focus:border-[#5E468A]/30 dark:focus:border-[#7B59BD]/40 focus:outline-none focus:ring-3 focus:ring-[#5E468A]/10 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                  />
                  {inputUrl && (
                    <button
                      type="button"
                      onClick={() => setInputUrl("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-mutedText-light hover:text-primaryText-light dark:hover:text-white transition-colors cursor-pointer"
                      aria-label="Clear input"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!inputUrl.trim() || isSubmitting}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[#181716] dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-zinc-200 px-5 text-sm font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 shadow-sm cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" strokeWidth={2.2} />
                  )}
                  <span>{isSubmitting ? "Saving..." : "Save to library"}</span>
                </button>
              </form>
            </div>

            {/* Consolidated Metrics with Awwwards Pastel Tints */}
            <div className="mt-6 sm:mt-8 pt-5 border-t border-black/[0.04] dark:border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {/* Total Saved - Sky Blue Pastel */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-white/[0.03] border border-black/[0.02] dark:border-white/[0.03]">
                <div className="w-8 h-8 rounded-lg bg-[#EAF2FA] dark:bg-[#3B82F6]/15 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-[#275787] dark:text-[#A5CEFA]" />
                </div>
                <div>
                  <p className="font-mono text-lg font-bold tabular-nums text-primaryText-light dark:text-white leading-tight">
                    {reels.length}
                  </p>
                  <p className="text-[11px] font-medium text-secondaryText-light dark:text-zinc-400">
                    Total Saved
                  </p>
                </div>
              </div>

              {/* Reels - Lavender Pastel */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-white/[0.03] border border-black/[0.02] dark:border-white/[0.03]">
                <div className="w-8 h-8 rounded-lg bg-[#EFEAFC] dark:bg-[#7B59BD]/15 flex items-center justify-center shrink-0">
                  <Film className="w-4 h-4 text-[#5E468A] dark:text-[#D1BFF8]" />
                </div>
                <div>
                  <p className="font-mono text-lg font-bold tabular-nums text-primaryText-light dark:text-white leading-tight">
                    {counts.reels}
                  </p>
                  <p className="text-[11px] font-medium text-secondaryText-light dark:text-zinc-400">
                    Reels
                  </p>
                </div>
              </div>

              {/* Posts - Matcha Pastel */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-white/[0.03] border border-black/[0.02] dark:border-white/[0.03]">
                <div className="w-8 h-8 rounded-lg bg-[#EAF3EB] dark:bg-[#489F62]/15 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-4 h-4 text-[#2B613A] dark:text-[#A6E7B7]" />
                </div>
                <div>
                  <p className="font-mono text-lg font-bold tabular-nums text-primaryText-light dark:text-white leading-tight">
                    {counts.posts}
                  </p>
                  <p className="text-[11px] font-medium text-secondaryText-light dark:text-zinc-400">
                    Posts
                  </p>
                </div>
              </div>

              {/* Favorites - Blush Rose Pastel */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-white/[0.03] border border-black/[0.02] dark:border-white/[0.03]">
                <div className="w-8 h-8 rounded-lg bg-[#FCEEF2] dark:bg-[#CE4B77]/15 flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4 text-[#933653] dark:text-[#F9B3CB]" />
                </div>
                <div>
                  <p className="font-mono text-lg font-bold tabular-nums text-primaryText-light dark:text-white leading-tight">
                    {counts.favorites}
                  </p>
                  <p className="text-[11px] font-medium text-secondaryText-light dark:text-zinc-400">
                    Favorites
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Rail: Latest Capture Spotlight (Desktop) */}
        <section className="hidden lg:flex flex-col animate-fade-up delay-1 p-1.5 rounded-[24px] bg-[#FAF8F5] dark:bg-[#1E1D1B] border border-black/[0.04] dark:border-white/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="relative h-full overflow-hidden rounded-[20px] bg-white dark:bg-[#181716] border border-black/[0.03] dark:border-white/[0.04] p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primaryText-light dark:text-white">
                Latest Capture
              </span>
              {featuredItem && (
                <Link
                  href={`/reel/${featuredItem.id}`}
                  className="w-7 h-7 rounded-full bg-[#FAF8F5] dark:bg-white/[0.06] flex items-center justify-center text-secondaryText-light dark:text-zinc-400 hover:text-primaryText-light dark:hover:text-white transition-colors"
                  title="Open reference"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {featuredItem ? (
              <Link
                href={`/reel/${featuredItem.id}`}
                className="group relative my-3 block aspect-[9/14] w-full max-w-[200px] mx-auto overflow-hidden rounded-[16px] bg-black shadow-md border border-black/[0.04] dark:border-white/[0.08]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featuredItem.thumbnailUrl}
                  alt={featuredItem.creatorUsername || "Saved reel"}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 pt-8 text-white">
                  <p className="truncate text-xs font-semibold">
                    @{featuredItem.creatorUsername || "creator"}
                  </p>
                  {featuredItem.category && (
                    <span className="mt-1 inline-block px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[10px] font-medium text-white/90">
                      #{featuredItem.category}
                    </span>
                  )}
                </div>
              </Link>
            ) : (
              <div className="my-auto py-8 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FAF8F5] dark:bg-white/[0.04] flex items-center justify-center text-mutedText-light dark:text-zinc-600 mb-2">
                  <Film className="w-5 h-5" />
                </div>
                <p className="text-xs text-mutedText-light dark:text-zinc-500">No saves yet</p>
              </div>
            )}

            <div className="pt-1 text-center">
              <Link
                href="/reels"
                className="text-[11px] font-medium text-secondaryText-light dark:text-zinc-400 hover:text-primaryText-light dark:hover:text-white transition-colors"
              >
                View full collection →
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* ─── Interactive Pastel Media Filter Tabs ─── */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
        {[
          {
            id: "all",
            label: "All Items",
            count: reels.length,
            icon: Sparkles,
            activeClass:
              "bg-[#181716] text-white dark:bg-white dark:text-black shadow-sm",
          },
          {
            id: "reel",
            label: "Reels",
            count: counts.reels,
            icon: Film,
            activeClass:
              "bg-[#EFEAFC] text-[#5E468A] dark:bg-[#7B59BD]/20 dark:text-[#D1BFF8] border border-[#E3D9F8] dark:border-[#7B59BD]/30 shadow-sm",
          },
          {
            id: "post",
            label: "Posts",
            count: counts.posts,
            icon: ImageIcon,
            activeClass:
              "bg-[#EAF3EB] text-[#2B613A] dark:bg-[#489F62]/20 dark:text-[#A6E7B7] border border-[#D5E8D7] dark:border-[#489F62]/30 shadow-sm",
          },
          {
            id: "audio",
            label: "Audio",
            count: counts.audio,
            icon: Music2,
            activeClass:
              "bg-[#FDEEE9] text-[#8E4D27] dark:bg-[#D77636]/20 dark:text-[#FDCBA7] border border-[#FADCD1] dark:border-[#D77636]/30 shadow-sm",
          },
          {
            id: "favorite",
            label: "Favorites",
            count: counts.favorites,
            icon: Heart,
            activeClass:
              "bg-[#FCEEF2] text-[#933653] dark:bg-[#CE4B77]/20 dark:text-[#F9B3CB] border border-[#F8D5DF] dark:border-[#CE4B77]/30 shadow-sm",
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedFilter(tab.id as MediaTypeFilter)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                isActive
                  ? tab.activeClass
                  : "bg-white dark:bg-[#181716] text-secondaryText-light dark:text-zinc-400 hover:text-primaryText-light dark:hover:text-white border border-black/[0.04] dark:border-white/[0.06]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span className="font-mono text-[10px] opacity-75">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── Recently Saved Grid: Clean Title with Zero Explaining Text ─── */}
      <section className="animate-fade-up delay-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bricolage text-xl font-bold tracking-tight text-primaryText-light dark:text-primaryText-dark">
            Recently Saved
          </h2>
          <Link
            href="/reels"
            className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#181716] border border-black/[0.04] dark:border-white/[0.06] text-xs font-semibold text-primaryText-light dark:text-white hover:border-black/[0.08] dark:hover:border-white/[0.12] transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
          >
            <span>View all</span>
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-[18px] border border-black/[0.04] dark:border-white/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <ReelGrid
            reels={filteredReels}
            limit={12}
            emptyTitle={
              selectedFilter !== "all"
                ? `No ${selectedFilter}s found`
                : "No items saved yet"
            }
            emptySubtitle="Paste any Instagram link above to add references to your library."
          />
        </div>
      </section>
    </div>
  );
}
