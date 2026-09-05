"use client";

import React, { useState, useRef, useEffect } from "react";
import { useReels } from "@/context/ReelContext";
import { SortOption } from "@/types/reel";
import {
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  X,
  ChevronDown,
  Check,
  Rows,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const sortLabels: Record<SortOption, string> = {
  newest: "Recently Saved",
  oldest: "Oldest First",
  recently_viewed: "Recently Viewed",
  most_viewed: "Most Viewed",
  creator: "Creator (A-Z)",
};

export function FilterToolbar() {
  const {
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    viewMode,
    setViewMode,
    gridCols,
    setGridCols,
  } = useReels();

  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search on Cmd+K or Cmd+F
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "f")) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setIsSortOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      {/* ─── Left: Dashboard-Style Search Bar Pill ─── */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white dark:bg-surface-dark border border-black/[0.04] dark:border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.02)] text-xs text-secondaryText-light dark:text-secondaryText-dark hover:border-black/[0.08] dark:hover:border-white/[0.12] transition-all w-full sm:max-w-xs md:max-w-sm group focus-within:border-black/20 dark:focus-within:border-white/20">
        <Search className="w-3.5 h-3.5 text-mutedText-light dark:text-mutedText-dark group-focus-within:text-primaryText-light dark:group-focus-within:text-primaryText-dark transition-colors shrink-0" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search library..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-xs text-primaryText-light dark:text-primaryText-dark placeholder:text-mutedText-light dark:placeholder:text-mutedText-dark focus:outline-none"
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="text-mutedText-light hover:text-primaryText-light dark:hover:text-white p-0.5 transition-colors cursor-pointer shrink-0"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#F5F5F5] dark:bg-white/[0.06] text-mutedText-light shrink-0">⌘ K</kbd>
        )}
      </div>

      {/* ─── Right: Controls & View Switcher ─── */}
      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        {/* Sort Dropdown Pill */}
        <div ref={sortRef} className="relative">
          <button
            type="button"
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-white dark:bg-surface-dark border border-black/[0.04] dark:border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.02)] text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark hover:border-black/[0.08] dark:hover:border-white/[0.12] hover:text-primaryText-light dark:hover:text-white transition-all cursor-pointer"
            title="Sort items"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-mutedText-light dark:text-mutedText-dark shrink-0" />
            <span className="hidden sm:inline">{sortLabels[sortOption] || "Sort"}</span>
            <ChevronDown className={`w-3 h-3 text-mutedText-light dark:text-mutedText-dark transition-transform duration-150 ${isSortOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {isSortOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-full mt-2 w-44 z-50 bg-white dark:bg-[#181716] border border-black/[0.06] dark:border-white/[0.1] rounded-2xl shadow-xl p-1.5 backdrop-blur-xl space-y-0.5"
              >
                {(Object.keys(sortLabels) as SortOption[]).map((key) => {
                  const isSelected = sortOption === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSortOption(key);
                        setIsSortOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left ${
                        isSelected
                          ? "bg-black/[0.04] dark:bg-white/[0.1] text-primaryText-light dark:text-white font-semibold"
                          : "text-secondaryText-light dark:text-zinc-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:text-primaryText-light dark:hover:text-white"
                      }`}
                    >
                      <span className="truncate">{sortLabels[key]}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-primaryText-light dark:text-white shrink-0" strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Grid Columns Count Selector (Grid View Only) */}
        {viewMode === "grid" && (
          <div className="flex items-center p-1 rounded-2xl bg-[#ECEEF2] dark:bg-white/[0.08] gap-0.5 border border-black/[0.02] dark:border-white/[0.04] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <span className="hidden sm:inline-block px-2 text-[11px] font-medium text-mutedText-light dark:text-zinc-400 select-none">
              Cols:
            </span>
            {[3, 4, 5, 6].map((cols) => (
              <button
                key={cols}
                type="button"
                onClick={() => setGridCols(cols)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  gridCols === cols
                    ? "bg-white dark:bg-[#181716] text-primaryText-light dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                    : "text-mutedText-light dark:text-zinc-400 hover:text-primaryText-light dark:hover:text-white"
                }`}
                title={`${cols} reels per row`}
                aria-label={`${cols} reels per row`}
              >
                {cols}
              </button>
            ))}
          </div>
        )}

        {/* View Mode Switcher Pill matching user reference image */}
        <div className="flex items-center p-1 rounded-2xl bg-[#ECEEF2] dark:bg-white/[0.08] gap-1 border border-black/[0.02] dark:border-white/[0.04] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              viewMode === "grid"
                ? "bg-white dark:bg-[#181716] text-primaryText-light dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                : "text-mutedText-light dark:text-zinc-400 hover:text-primaryText-light dark:hover:text-white"
            }`}
            title="Grid View"
            aria-label="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("feed")}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              viewMode === "feed"
                ? "bg-white dark:bg-[#181716] text-primaryText-light dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                : "text-mutedText-light dark:text-zinc-400 hover:text-primaryText-light dark:hover:text-white"
            }`}
            title="Feed View"
            aria-label="Feed View"
          >
            <Rows className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("compact")}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              viewMode === "compact"
                ? "bg-white dark:bg-[#181716] text-primaryText-light dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                : "text-mutedText-light dark:text-zinc-400 hover:text-primaryText-light dark:hover:text-white"
            }`}
            title="Compact List View"
            aria-label="Compact List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
