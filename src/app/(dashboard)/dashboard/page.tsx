"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useReels } from "@/context/ReelContext";
import { ReelGrid } from "@/components/reels/ReelGrid";
import { SortOption, ViewMode } from "@/types/reel";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clipboard,
  ExternalLink,
  Film,
  Flame,
  FolderPlus,
  Heart,
  Image as ImageIcon,
  LayoutGrid,
  Link2,
  List,
  Loader2,
  Music2,
  Play,
  Plus,
  RotateCcw,
  Rows,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

const greetings = [
  { text: "Good morning", textAfternoon: "Good afternoon", textEvening: "Good evening" },
  { text: "Namaste", textAfternoon: "Namaste", textEvening: "Namaste" },
  { text: "Bonjour", textAfternoon: "Bonjour", textEvening: "Bonsoir" },
  { text: "¡Hola", textAfternoon: "¡Buenas tardes", textEvening: "¡Buenas noches" },
  { text: "Ohayō", textAfternoon: "Konnichiwa", textEvening: "Konbanwa" },
];

const QUICK_TAG_SUGGESTIONS = [
  { label: "Hooks", tag: "hook" },
  { label: "Motion", tag: "motion" },
  { label: "Ad Creative", tag: "ads" },
  { label: "Carousels", tag: "carousel" },
  { label: "Storytelling", tag: "storytelling" },
];

export default function DashboardPage() {
  const {
    reels,
    favorites,
    saveReel,
    collections,
    activeCategory,
    setActiveCategory,
    activeCollection,
    setActiveCollection,
    activeMediaType,
    setActiveMediaType,
    selectedInstagramAccount,
    viewMode,
    setViewMode,
    gridCols,
    setGridCols,
    sortOption,
    setSortOption,
    setIsCreateCollectionModalOpen,
    setIsCommandPaletteOpen,
    showToast,
  } = useReels();

  const { user } = useAuth();
  const [inputUrl, setInputUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setGreetingIndex(Math.floor(Math.random() * greetings.length));
  }, []);

  const hour = new Date().getHours();
  const activeGreetingObj = greetings[greetingIndex] || greetings[0];
  const timeGreeting =
    hour < 12
      ? activeGreetingObj.text
      : hour < 17
      ? activeGreetingObj.textAfternoon
      : activeGreetingObj.textEvening;

  const connectedAccounts = user?.connectedAccounts || [];
  const activeAccounts = connectedAccounts.filter((a) => a.status === "active");
  const activeAccount = selectedInstagramAccount
    ? activeAccounts.find(
        (a) => a.username.toLowerCase() === selectedInstagramAccount.toLowerCase()
      )
    : null;

  const displayName =
    selectedInstagramAccount && activeAccount
      ? activeAccount.displayName?.trim() || `@${selectedInstagramAccount}`
      : user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "Creator";

  // Velocity calculation
  const thisWeekCount = useMemo(() => {
    return reels.filter((r) => {
      const t = new Date(r.createdAt).getTime();
      return Number.isFinite(t) && Date.now() - t < 7 * 24 * 60 * 60 * 1000;
    }).length;
  }, [reels]);

  // Spotlight reference (most recent or top favorite)
  const sortedReels = useMemo(() => {
    return [...reels].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [reels]);

  const spotlightReel = useMemo(() => {
    return favorites.length > 0 ? favorites[0] : sortedReels[0] || null;
  }, [favorites, sortedReels]);

  // Dynamic Topic Radar computed from user's saved items
  const dynamicTopics = useMemo(() => {
    const countsMap: Record<string, number> = {};
    for (const reel of reels) {
      const tags = [
        ...(reel.categories || (reel.category ? [reel.category] : [])),
        ...(reel.tags || []),
        ...(reel.hashtags || []),
        ...(reel.aiTopics || []),
      ];
      for (const t of tags) {
        if (!t) continue;
        const clean = t.replace(/^#/, "").trim().toLowerCase();
        if (clean.length >= 2 && clean.length <= 20) {
          countsMap[clean] = (countsMap[clean] || 0) + 1;
        }
      }
    }

    return Object.entries(countsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [reels]);

  // Filtered Reels for the Swipe Feed
  const filteredReels = useMemo(() => {
    return sortedReels.filter((reel) => {
      // Media type filter
      if (activeMediaType && activeMediaType !== "all") {
        const type = reel.mediaType || "reel";
        if (type !== activeMediaType) return false;
      }

      // Category filter (global context)
      if (activeCategory) {
        const catLower = activeCategory.trim().toLowerCase();
        const allAssigned =
          reel.categories && reel.categories.length > 0
            ? reel.categories
            : [reel.category || ""];
        const match =
          allAssigned.some((c) => c?.toLowerCase() === catLower) ||
          reel.tags?.some((t) => t?.toLowerCase() === catLower) ||
          reel.hashtags?.some((h) => h?.toLowerCase() === catLower);
        if (!match) return false;
      }

      // Local tag radar filter
      if (selectedTagFilter) {
        const tagLower = selectedTagFilter.trim().toLowerCase();
        const allTags = [
          ...(reel.categories || (reel.category ? [reel.category] : [])),
          ...(reel.tags || []),
          ...(reel.hashtags || []),
          ...(reel.aiTopics || []),
        ].map((t) => t?.replace(/^#/, "").toLowerCase());
        if (!allTags.some((t) => t === tagLower)) return false;
      }

      return true;
    });
  }, [sortedReels, activeMediaType, activeCategory, selectedTagFilter]);

  // Handle Quick Ingest
  const handleQuickSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await saveReel(inputUrl.trim());
      setInputUrl("");
      showToast("Reel saved to library");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1-Click Paste from Clipboard
  const handlePasteFromClipboard = async () => {
    try {
      setIsPasting(true);
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && (text.includes("instagram.com") || text.startsWith("http"))) {
          setInputUrl(text.trim());
          showToast("Link pasted from clipboard");
          inputRef.current?.focus();
        } else {
          showToast("No Instagram link found in clipboard");
        }
      }
    } catch {
      showToast("Clipboard access denied");
    } finally {
      setIsPasting(false);
    }
  };

  // Append quick tag
  const handleAppendTag = (tag: string) => {
    setInputUrl((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return `/${tag}`;
      if (trimmed.includes(`/${tag}`)) return trimmed;
      return `${trimmed} /${tag}`;
    });
    inputRef.current?.focus();
  };

  // Copy spotlight link
  const handleCopySpotlightLink = (url: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setIsCopiedLink(true);
    showToast("Link copied to clipboard");
    setTimeout(() => setIsCopiedLink(false), 2000);
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* ── 1. Top Header & Universal Command Bar ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-bricolage text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-primaryText-light dark:text-primaryText-dark">
              {timeGreeting}, {displayName}.
            </h1>
            {/* Live Status Pastel Pill */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#EBF5EE] text-[#25603F] border border-[#CEE5D4] dark:bg-[#101C15] dark:text-[#80CFA0] dark:border-[#1E3B29] transition-all">
              <span className="w-1.5 h-1.5 rounded-full bg-[#25603F] dark:bg-[#80CFA0] animate-pulse" />
              <span>
                {activeAccount ? `@${activeAccount.username} synced` : "Swipe file active"}
              </span>
            </div>
          </div>
          <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark mt-1">
            {reels.length} references captured · {thisWeekCount} saved this week
          </p>
        </div>

        {/* Header Action Hub */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white dark:bg-surface-dark border border-black/[0.06] dark:border-white/[0.08] text-xs text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light hover:border-black/15 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all cursor-pointer group"
          >
            <Search className="w-3.5 h-3.5 text-mutedText-light dark:text-mutedText-dark group-hover:text-primaryText-light transition-colors" />
            <span>Search</span>
            <kbd className="ml-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06] text-mutedText-light">
              ⌘K
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateCollectionModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white dark:bg-surface-dark border border-black/[0.06] dark:border-white/[0.08] text-xs font-semibold text-primaryText-light dark:text-primaryText-dark hover:bg-black/[0.02] dark:hover:bg-white/[0.04] shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 text-[#B88A2E] dark:text-[#E8C265]" />
            <span>New Moodboard</span>
          </button>
        </div>
      </header>

      {/* ── 2. Modern Pastel Bento Workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Tile 1: Smart Ingest & Instant Capture (Sage Pastel, 7 cols) */}
        <section className="lg:col-span-7 flex flex-col justify-between rounded-[22px] p-6 border border-[#CEE5D4] dark:border-[#1E3B29] bg-gradient-to-br from-[#F2F9F4] via-white to-[#EEF7F1] dark:from-[#111A14] dark:via-surface-dark dark:to-[#0D1510] shadow-[0_4px_20px_rgba(37,96,63,0.04)] dark:shadow-rd-card transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#DDF0E3] dark:bg-[#182C20] flex items-center justify-center text-[#25603F] dark:text-[#80CFA0]">
                  <Link2 className="w-3.5 h-3.5" />
                </span>
                <h2 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark">
                  Quick Ingest
                </h2>
              </div>
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                disabled={isPasting}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/80 dark:bg-white/[0.06] border border-[#CEE5D4] dark:border-white/[0.08] text-[#25603F] dark:text-[#80CFA0] hover:bg-white transition-all cursor-pointer shadow-sm"
              >
                <Clipboard className="w-3 h-3" />
                <span>Paste link</span>
              </button>
            </div>

            {/* Ingest Form */}
            <form onSubmit={handleQuickSave} className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="Paste Instagram link or type /category..."
                  className="h-11 w-full rounded-[14px] border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-background-dark pl-4 pr-9 text-sm text-primaryText-light placeholder:text-mutedText-light dark:text-primaryText-dark dark:placeholder:text-mutedText-dark focus:border-[#25603F] dark:focus:border-[#80CFA0] focus:ring-2 focus:ring-[#25603F]/10 dark:focus:ring-[#80CFA0]/10 focus:outline-none transition-all shadow-inner"
                />
                {inputUrl && (
                  <button
                    type="button"
                    onClick={() => setInputUrl("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-mutedText-light hover:text-primaryText-light"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={!inputUrl.trim() || isSubmitting}
                className="h-11 px-5 rounded-[14px] bg-[#1B432E] hover:bg-[#153424] dark:bg-[#80CFA0] dark:hover:bg-[#92D9B0] text-white dark:text-[#0D1510] text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" strokeWidth={2.2} />
                )}
                <span>Capture</span>
              </button>
            </form>

            {/* Fast Tag Inserters */}
            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-mutedText-light dark:text-mutedText-dark font-medium mr-1">
                Auto-file with:
              </span>
              {QUICK_TAG_SUGGESTIONS.map((s) => (
                <button
                  key={s.tag}
                  type="button"
                  onClick={() => handleAppendTag(s.tag)}
                  className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/70 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.08] border border-black/[0.05] dark:border-white/[0.06] text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light transition-all cursor-pointer"
                >
                  +{s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Micro Status Bar */}
          <div className="mt-6 pt-4 border-t border-[#CEE5D4]/60 dark:border-white/[0.06] flex items-center justify-between text-xs text-secondaryText-light dark:text-secondaryText-dark">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#34A853]" />
              <span>DM Ingestion Bot Active</span>
            </div>
            <Link
              href="/connect-instagram"
              className="font-medium text-[#25603F] dark:text-[#80CFA0] hover:underline inline-flex items-center gap-1"
            >
              <span>Manage accounts</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </section>

        {/* Tile 2: Inspiration Spotlight / Daily Swipe (Lilac Pastel, 5 cols) */}
        <section className="lg:col-span-5 flex flex-col justify-between rounded-[22px] p-6 border border-[#E5DAFD] dark:border-[#2E2250] bg-gradient-to-br from-[#F6F2FF] via-white to-[#F1EAFF] dark:from-[#161224] dark:via-surface-dark dark:to-[#130E20] shadow-[0_4px_20px_rgba(122,88,202,0.04)] dark:shadow-rd-card transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#EAE0FF] dark:bg-[#251A40] flex items-center justify-center text-[#7A58CA] dark:text-[#CBB5FD]">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <h2 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark">
                Creative Spotlight
              </h2>
            </div>
            {spotlightReel && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#EDE5FF] text-[#7A58CA] dark:bg-[#2A1D4A] dark:text-[#CBB5FD]">
                {spotlightReel.category || "Inspiration"}
              </span>
            )}
          </div>

          {spotlightReel ? (
            <div className="mt-2 flex items-center gap-4 p-3 rounded-[16px] bg-white/70 dark:bg-white/[0.02] border border-[#E5DAFD]/70 dark:border-white/[0.05]">
              {/* Aspect Thumbnail Preview */}
              <Link
                href={`/reel/${spotlightReel.id}`}
                className="group relative w-16 h-24 rounded-[10px] overflow-hidden shadow-rd-subtle border border-black/[0.06] dark:border-white/[0.08] shrink-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={spotlightReel.thumbnailUrl}
                  alt={`@${spotlightReel.creatorUsername}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center shadow">
                    <Play className="w-3 h-3 text-[#111] dark:text-white fill-current ml-0.5" />
                  </div>
                </div>
              </Link>

              {/* Reel Metadata */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-primaryText-light dark:text-primaryText-dark truncate">
                  @{spotlightReel.creatorUsername || "creator"}
                </p>
                <p className="text-[11px] text-secondaryText-light dark:text-secondaryText-dark line-clamp-2 mt-1 leading-relaxed">
                  {spotlightReel.caption || "Saved reference for moodboard & hook analysis."}
                </p>

                <div className="mt-2.5 flex items-center gap-2">
                  <Link
                    href={`/reel/${spotlightReel.id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5E42A6] dark:text-[#CBB5FD] hover:underline"
                  >
                    <span>Analyze breakdown</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                  <span className="text-mutedText-light dark:text-mutedText-dark">·</span>
                  <button
                    type="button"
                    onClick={() => handleCopySpotlightLink(spotlightReel.instagramUrl)}
                    className="text-[11px] font-medium text-secondaryText-light hover:text-primaryText-light transition-colors"
                  >
                    {isCopiedLink ? "Copied!" : "Copy link"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-secondaryText-light dark:text-secondaryText-dark">
              Paste your first reel above to ignite your creative spotlight.
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-[#E5DAFD]/60 dark:border-white/[0.06]">
            <span className="text-secondaryText-light dark:text-secondaryText-dark">
              Curated from your library
            </span>
            <Link
              href="/favorites"
              className="font-medium text-[#7A58CA] dark:text-[#CBB5FD] hover:underline inline-flex items-center gap-1"
            >
              <span>View all starred</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </section>
      </div>

      {/* ── 3. Active Moodboards & Collections Strip (Butter Pastel) ── */}
      {collections.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#B88A2E] dark:bg-[#E8C265]" />
              <h2 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark">
                Active Moodboards & Projects
              </h2>
            </div>
            <Link
              href="/collections"
              className="text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light transition-colors"
            >
              View all ({collections.length})
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {collections.slice(0, 4).map((col) => {
              const count =
                col.reelCount ??
                reels.filter((r) => r.collections?.includes(col.id)).length;
              return (
                <Link
                  key={col.id}
                  href="/reels"
                  onClick={() => setActiveCollection(col.id)}
                  className="group flex items-center justify-between p-3.5 rounded-[16px] border border-[#F6E3B5] dark:border-[#382E16] bg-[#FFFBF0] dark:bg-[#1C180E] hover:border-[#B88A2E]/40 hover:shadow-sm transition-all"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-primaryText-light dark:text-primaryText-dark truncate group-hover:text-[#B88A2E] dark:group-hover:text-[#E8C265] transition-colors">
                      {col.name}
                    </p>
                    <p className="text-[11px] text-mutedText-light dark:text-mutedText-dark mt-0.5">
                      {count} items
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#B88A2E]/60 dark:text-[#E8C265]/60 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </Link>
              );
            })}

            {/* Quick "+ New Collection" Button Card */}
            <button
              type="button"
              onClick={() => setIsCreateCollectionModalOpen(true)}
              className="flex items-center justify-center gap-1.5 p-3.5 rounded-[16px] border border-dashed border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-xs font-semibold text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Moodboard</span>
            </button>
          </div>
        </section>
      )}

      {/* ── 4. Smart Topic Radar (Interactive Pastel Filter Chips) ── */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4A72B8] dark:bg-[#85B7E8]" />
            <h2 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark">
              Topic Radar & Library Filters
            </h2>
          </div>
          {(selectedTagFilter || activeCategory || activeMediaType !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSelectedTagFilter(null);
                setActiveCategory(null);
                setActiveMediaType("all");
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondaryText-light hover:text-primaryText-light transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset filters</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* All */}
          <button
            type="button"
            onClick={() => {
              setActiveMediaType("all");
              setSelectedTagFilter(null);
              setActiveCategory(null);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
              activeMediaType === "all" && !selectedTagFilter && !activeCategory
                ? "bg-[#111] text-white dark:bg-white dark:text-black shadow-sm"
                : "bg-white dark:bg-surface-dark border border-black/[0.06] dark:border-white/[0.08] text-secondaryText-light hover:border-black/20"
            }`}
          >
            All Items ({reels.length})
          </button>

          {/* Reels */}
          <button
            type="button"
            onClick={() => {
              setActiveMediaType(activeMediaType === "reel" ? "all" : "reel");
              setSelectedTagFilter(null);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeMediaType === "reel"
                ? "bg-[#F0EAFF] text-[#6E47C7] border border-[#DDD1F9] dark:bg-[#201838] dark:text-[#CBB5FD] font-semibold shadow-sm"
                : "bg-white dark:bg-surface-dark border border-black/[0.06] dark:border-white/[0.08] text-secondaryText-light hover:border-black/20"
            }`}
          >
            <Film className="w-3 h-3" />
            <span>Reels</span>
          </button>

          {/* Carousels & Photos */}
          <button
            type="button"
            onClick={() => {
              setActiveMediaType(activeMediaType === "post" ? "all" : "post");
              setSelectedTagFilter(null);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeMediaType === "post"
                ? "bg-[#FFF0F3] text-[#B83E63] border border-[#FAD2DD] dark:bg-[#2E141E] dark:text-[#F39CB4] font-semibold shadow-sm"
                : "bg-white dark:bg-surface-dark border border-black/[0.06] dark:border-white/[0.08] text-secondaryText-light hover:border-black/20"
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            <span>Posts</span>
          </button>

          {/* Favorites */}
          <Link
            href="/favorites"
            className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-surface-dark border border-black/[0.06] dark:border-white/[0.08] text-secondaryText-light hover:border-black/20 transition-all shrink-0 flex items-center gap-1.5"
          >
            <Heart className="w-3 h-3 text-[#E8A4B8]" />
            <span>Favorites ({favorites.length})</span>
          </Link>

          {/* Dynamic computed tags */}
          {dynamicTopics.map((topic) => {
            const isSelected = selectedTagFilter === topic.name;
            return (
              <button
                key={topic.name}
                type="button"
                onClick={() =>
                  setSelectedTagFilter(isSelected ? null : topic.name)
                }
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-[#EEF5FB] text-[#245785] border border-[#CDE1F3] dark:bg-[#142336] dark:text-[#85B7E8] font-semibold shadow-sm"
                    : "bg-white dark:bg-surface-dark border border-black/[0.06] dark:border-white/[0.08] text-secondaryText-light hover:border-black/20"
                }`}
              >
                #{topic.name} <span className="opacity-60 text-[10px]">({topic.count})</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 5. Swipe File Explorer & Feed View Toolbar ── */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.05] dark:border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-primaryText-light dark:text-primaryText-dark">
              {selectedTagFilter
                ? `Filtered by #${selectedTagFilter}`
                : activeCategory
                ? `Category: ${activeCategory}`
                : activeMediaType !== "all"
                ? `${activeMediaType.toUpperCase()} Library`
                : "Swipe File Feed"}
            </h2>
            <span className="text-xs font-mono text-mutedText-light dark:text-mutedText-dark px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
              {filteredReels.length}
            </span>
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-2">
            {/* Density switch for grid */}
            {viewMode === "grid" && (
              <div className="hidden sm:flex items-center bg-white dark:bg-surface-dark border border-black/[0.06] dark:border-white/[0.08] rounded-lg p-0.5 text-xs">
                {[3, 4, 5].map((cols) => (
                  <button
                    key={cols}
                    type="button"
                    onClick={() => setGridCols(cols)}
                    className={`px-2 py-1 rounded font-mono text-[11px] font-medium transition-colors ${
                      gridCols === cols
                        ? "bg-black/[0.06] dark:bg-white/[0.1] text-primaryText-light dark:text-primaryText-dark font-bold"
                        : "text-mutedText-light hover:text-primaryText-light"
                    }`}
                  >
                    {cols}c
                  </button>
                ))}
              </div>
            )}

            {/* View Mode Switcher */}
            <div className="flex items-center bg-white dark:bg-surface-dark border border-black/[0.06] dark:border-white/[0.08] rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Grid Mode"
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "grid"
                    ? "bg-black/[0.06] dark:bg-white/[0.1] text-primaryText-light dark:text-primaryText-dark"
                    : "text-mutedText-light hover:text-primaryText-light"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("feed")}
                title="Vertical Feed Stream"
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "feed"
                    ? "bg-black/[0.06] dark:bg-white/[0.1] text-primaryText-light dark:text-primaryText-dark"
                    : "text-mutedText-light hover:text-primaryText-light"
                }`}
              >
                <Rows className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("compact")}
                title="Compact List"
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "compact"
                    ? "bg-black/[0.06] dark:bg-white/[0.1] text-primaryText-light dark:text-primaryText-dark"
                    : "text-mutedText-light hover:text-primaryText-light"
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* The Reel Feed Grid */}
        <div className="overflow-hidden rounded-[18px]">
          <ReelGrid
            reels={filteredReels}
            viewMode={viewMode}
            gridCols={gridCols}
            limit={18}
            emptyTitle={
              selectedTagFilter
                ? `No items tagged with #${selectedTagFilter}`
                : activeCategory
                ? `No reels in #${activeCategory}`
                : "No saved references found"
            }
            emptySubtitle={
              selectedTagFilter
                ? "Try clearing the topic filter to see your full library."
                : "Paste any Instagram reel, photo, or audio link above to start your swipe file."
            }
          />
        </div>
      </section>
    </div>
  );
}
