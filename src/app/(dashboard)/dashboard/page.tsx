"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useReels } from "@/context/ReelContext";
import { ReelGrid } from "@/components/reels/ReelGrid";
import { ReelPlayerModal } from "@/components/reels/ReelPlayerModal";
import { Reel } from "@/types/reel";
import {
  ArrowRight,
  ArrowUpRight,
  Film,
  FolderPlus,
  Heart,
  Image as ImageIcon,
  LayoutGrid,
  Link2,
  List,
  Loader2,
  Play,
  Plus,
  Rows,
  Search,
  X,
} from "lucide-react";

const PASTEL_COLLECTION_THEMES = [
  { bg: "bg-[#FFFBF0] dark:bg-[#1C180E]", border: "border-[#F6E3B5] dark:border-[#382E16]", text: "text-[#8A6715] dark:text-[#E8C265]" },
  { bg: "bg-[#F7F3FF] dark:bg-[#161224]", border: "border-[#E5DAFD] dark:border-[#2E2250]", text: "text-[#6E47C7] dark:text-[#CBB5FD]" },
  { bg: "bg-[#F0FDF4] dark:bg-[#101C15]", border: "border-[#CCEBD7] dark:border-[#1E3B29]", text: "text-[#286641] dark:text-[#80CFA0]" },
  { bg: "bg-[#FFF1F2] dark:bg-[#1D1116]", border: "border-[#F8D2D7] dark:border-[#3B1C26]", text: "text-[#9E2A4B] dark:text-[#F39CB4]" },
  { bg: "bg-[#F0F9FF] dark:bg-[#101824]", border: "border-[#D0E8FA] dark:border-[#1C2C40]", text: "text-[#205D8E] dark:text-[#85B7E8]" },
];

export default function DashboardPage() {
  const {
    reels,
    favorites,
    saveReel,
    collections,
    activeMediaType,
    setActiveMediaType,
    setActiveCollection,
    viewMode,
    setViewMode,
    gridCols,
    setGridCols,
    setIsCreateCollectionModalOpen,
    setIsCommandPaletteOpen,
    showToast,
  } = useReels();

  const [inputUrl, setInputUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeModalReel, setActiveModalReel] = useState<Reel | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sorted reels by newest
  const sortedReels = useMemo(() => {
    return [...reels].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [reels]);

  // Recent 6 reels for visual tray
  const recentTrayReels = useMemo(() => {
    return sortedReels.slice(0, 6);
  }, [sortedReels]);

  // Filtered reels for main grid
  const filteredReels = useMemo(() => {
    if (!activeMediaType || activeMediaType === "all") return sortedReels;
    return sortedReels.filter((r) => (r.mediaType || "reel") === activeMediaType);
  }, [sortedReels, activeMediaType]);

  // Quick Ingest Handler
  const handleQuickSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = inputUrl.trim();
    if (!url || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await saveReel(url);
      setInputUrl("");
      showToast("Saved to library");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-7 pb-16">
      {/* ── 1. Clean Top Bar: Title + Quick Ingest & Actions ── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primaryText-light dark:text-primaryText-dark">
            Dashboard
          </h1>
        </div>

        {/* Action Hub */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Quick Ingest Form */}
          <form onSubmit={handleQuickSave} className="relative flex-1 md:w-80">
            <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mutedText-light dark:text-mutedText-dark pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Paste Instagram link..."
              className="h-10 w-full rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-surface-dark pl-9 pr-16 text-xs text-primaryText-light placeholder:text-mutedText-light dark:text-primaryText-dark dark:placeholder:text-mutedText-dark focus:border-black/25 dark:focus:border-white/25 focus:outline-none transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
            />
            {inputUrl ? (
              <button
                type="submit"
                disabled={isSubmitting}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 px-3 rounded-full bg-[#111] dark:bg-white text-white dark:text-black text-[11px] font-semibold hover:bg-black dark:hover:bg-zinc-200 transition-all flex items-center gap-1 cursor-pointer"
              >
                {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
              </button>
            ) : (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-mutedText-light dark:text-mutedText-dark pointer-events-none">
                ↵
              </span>
            )}
          </form>

          {/* Search Trigger */}
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            title="Search library (⌘K)"
            className="h-10 px-3.5 rounded-full bg-white dark:bg-surface-dark border border-black/[0.08] dark:border-white/[0.08] text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light hover:border-black/20 text-xs flex items-center gap-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all cursor-pointer shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <kbd className="font-mono text-[10px] text-mutedText-light">⌘K</kbd>
          </button>

          {/* New Moodboard */}
          <button
            type="button"
            onClick={() => setIsCreateCollectionModalOpen(true)}
            className="h-10 px-4 rounded-full bg-[#111] dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_1px_4px_rgba(0,0,0,0.06)] active:scale-[0.98] cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span className="hidden sm:inline">Moodboard</span>
          </button>
        </div>
      </header>

      {/* ── 2. Visual Recent Saves Tray (Media First, Apple/Cosmos style) ── */}
      {recentTrayReels.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark tracking-tight">
              Recent Saves
            </h2>
            <Link
              href="/reels"
              className="text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light transition-colors flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {recentTrayReels.map((reel) => (
              <div
                key={reel.id}
                onClick={() => setActiveModalReel(reel)}
                className="group relative rounded-[16px] overflow-hidden bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-black/[0.05] dark:border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-black/15 dark:hover:border-white/20 transition-all cursor-pointer"
                style={{ aspectRatio: "9/16" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={reel.thumbnailUrl}
                  alt={`@${reel.creatorUsername}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />

                {/* Subtle dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-9 h-9 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                    <Play className="w-4 h-4 text-black dark:text-white fill-current ml-0.5" />
                  </div>
                </div>

                {/* Footer Info */}
                <div className="absolute inset-x-0 bottom-0 p-2.5">
                  <p className="text-white text-[11px] font-semibold truncate">
                    @{reel.creatorUsername || "creator"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 3. Moodboards / Collections (Pastel SaaS Cards) ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark tracking-tight">
            Moodboards
          </h2>
          {collections.length > 0 && (
            <Link
              href="/collections"
              className="text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light transition-colors flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {collections.slice(0, 4).map((col, idx) => {
            const theme = PASTEL_COLLECTION_THEMES[idx % PASTEL_COLLECTION_THEMES.length];
            const count =
              col.reelCount ??
              reels.filter((r) => r.collections?.includes(col.id)).length;

            return (
              <Link
                key={col.id}
                href="/reels"
                onClick={() => setActiveCollection(col.id)}
                className={`group p-4 rounded-[18px] border ${theme.border} ${theme.bg} hover:shadow-sm transition-all flex flex-col justify-between min-h-[5.5rem]`}
              >
                <p className="text-xs font-bold text-primaryText-light dark:text-primaryText-dark truncate group-hover:underline">
                  {col.name}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-[11px] font-semibold ${theme.text}`}>
                    {count} {count === 1 ? "item" : "items"}
                  </span>
                  <ArrowRight className={`w-3 h-3 ${theme.text} opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all`} />
                </div>
              </Link>
            );
          })}

          {/* Quick Create Card */}
          <button
            type="button"
            onClick={() => setIsCreateCollectionModalOpen(true)}
            className="p-4 rounded-[18px] border border-dashed border-black/15 dark:border-white/15 hover:border-black/30 dark:hover:border-white/30 bg-white/50 dark:bg-surface-dark/50 hover:bg-white dark:hover:bg-surface-dark transition-all flex flex-col items-center justify-center text-center min-h-[5.5rem] cursor-pointer group"
          >
            <FolderPlus className="w-4 h-4 text-mutedText-light dark:text-mutedText-dark group-hover:text-primaryText-light transition-colors mb-1" />
            <span className="text-xs font-semibold text-secondaryText-light dark:text-secondaryText-dark group-hover:text-primaryText-light transition-colors">
              New Moodboard
            </span>
          </button>
        </div>
      </section>

      {/* ── 4. Main Library Feed with Pastel Controls ── */}
      <section className="space-y-4 pt-1">
        {/* Filter & View Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.05] dark:border-white/[0.06] pb-3.5">
          {/* Pastel Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {/* All */}
            <button
              type="button"
              onClick={() => setActiveMediaType("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                activeMediaType === "all" || !activeMediaType
                  ? "bg-[#111] text-white dark:bg-white dark:text-black font-semibold shadow-sm"
                  : "bg-white dark:bg-surface-dark border border-black/[0.06] dark:border-white/[0.08] text-secondaryText-light hover:text-primaryText-light"
              }`}
            >
              All ({reels.length})
            </button>

            {/* Reels (Pastel Lilac) */}
            <button
              type="button"
              onClick={() => setActiveMediaType("reel")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeMediaType === "reel"
                  ? "bg-[#F3EEFF] text-[#6E47C7] border border-[#DDD1F9] dark:bg-[#201838] dark:text-[#CBB5FD] font-semibold shadow-sm"
                  : "bg-white dark:bg-surface-dark border border-black/[0.06] dark:border-white/[0.08] text-secondaryText-light hover:text-primaryText-light"
              }`}
            >
              <Film className="w-3 h-3" />
              <span>Reels</span>
            </button>

            {/* Posts (Pastel Rose) */}
            <button
              type="button"
              onClick={() => setActiveMediaType("post")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeMediaType === "post"
                  ? "bg-[#FFF0F3] text-[#B83E63] border border-[#FAD2DD] dark:bg-[#2E141E] dark:text-[#F39CB4] font-semibold shadow-sm"
                  : "bg-white dark:bg-surface-dark border border-black/[0.06] dark:border-white/[0.08] text-secondaryText-light hover:text-primaryText-light"
              }`}
            >
              <ImageIcon className="w-3 h-3" />
              <span>Posts</span>
            </button>

            {/* Favorites (Pastel Butter) */}
            <Link
              href="/favorites"
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-surface-dark border border-black/[0.06] dark:border-white/[0.08] text-secondaryText-light hover:text-primaryText-light transition-all shrink-0 flex items-center gap-1.5"
            >
              <Heart className="w-3 h-3 text-[#D47F9B]" />
              <span>Favorites ({favorites.length})</span>
            </Link>
          </div>

          {/* Density & Layout Controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {viewMode === "grid" && (
              <div className="flex items-center bg-white dark:bg-surface-dark border border-black/[0.06] dark:border-white/[0.08] rounded-lg p-0.5 text-xs">
                {[3, 4, 5].map((cols) => (
                  <button
                    key={cols}
                    type="button"
                    onClick={() => setGridCols(cols)}
                    className={`px-2 py-0.5 rounded font-mono text-[11px] transition-colors ${
                      gridCols === cols
                        ? "bg-black/[0.07] dark:bg-white/[0.1] text-primaryText-light dark:text-primaryText-dark font-bold"
                        : "text-mutedText-light hover:text-primaryText-light"
                    }`}
                  >
                    {cols}c
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center bg-white dark:bg-surface-dark border border-black/[0.06] dark:border-white/[0.08] rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Grid View"
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "grid"
                    ? "bg-black/[0.07] dark:bg-white/[0.1] text-primaryText-light dark:text-primaryText-dark"
                    : "text-mutedText-light hover:text-primaryText-light"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("feed")}
                title="Feed View"
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "feed"
                    ? "bg-black/[0.07] dark:bg-white/[0.1] text-primaryText-light dark:text-primaryText-dark"
                    : "text-mutedText-light hover:text-primaryText-light"
                }`}
              >
                <Rows className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("compact")}
                title="List View"
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "compact"
                    ? "bg-black/[0.07] dark:bg-white/[0.1] text-primaryText-light dark:text-primaryText-dark"
                    : "text-mutedText-light hover:text-primaryText-light"
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Reel Grid */}
        <div className="overflow-hidden rounded-[18px]">
          <ReelGrid
            reels={filteredReels}
            viewMode={viewMode}
            gridCols={gridCols}
            limit={24}
            emptyTitle="No saved items yet"
            emptySubtitle="Paste any Instagram link above to begin building your library."
          />
        </div>
      </section>

      {/* Direct Playback Modal when clicking tray item */}
      {activeModalReel && (
        <ReelPlayerModal
          reel={activeModalReel}
          isOpen={true}
          onClose={() => setActiveModalReel(null)}
        />
      )}
    </div>
  );
}
