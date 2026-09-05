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
  const [isGridMenuOpen, setIsGridMenuOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const gridMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search on Cmd+K or Cmd+F, close menus on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "f")) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setIsSortOpen(false);
        setIsGridMenuOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
      if (gridMenuRef.current && !gridMenuRef.current.contains(e.target as Node)) {
        setIsGridMenuOpen(false);
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
      <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto overflow-x-visible py-0.5 shrink-0">
        {/* Sort Dropdown Pill */}
        <div ref={sortRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-full bg-white dark:bg-surface-dark border border-black/[0.04] dark:border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.02)] text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark hover:border-black/[0.08] dark:hover:border-white/[0.12] hover:text-primaryText-light dark:hover:text-white transition-all cursor-pointer"
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
                className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-44 z-50 bg-white dark:bg-[#181716] border border-black/[0.06] dark:border-white/[0.1] rounded-2xl shadow-xl p-1.5 backdrop-blur-xl space-y-0.5"
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

        {/* View Mode Switcher Pill with integrated column dropdown */}
        <div className="flex items-center p-1 rounded-2xl bg-[#ECEEF2] dark:bg-white/[0.08] gap-1 border border-black/[0.02] dark:border-white/[0.04] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          {/* Grid Button with popover for column options */}
          <div ref={gridMenuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                if (viewMode !== "grid") {
                  setViewMode("grid");
                } else {
                  setIsGridMenuOpen(!isGridMenuOpen);
                }
              }}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white dark:bg-[#181716] text-primaryText-light dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                  : "text-mutedText-light dark:text-zinc-400 hover:text-primaryText-light dark:hover:text-white"
              }`}
              title={viewMode === "grid" ? `Grid View (${gridCols} cols) - click to change` : "Grid View"}
              aria-label="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
              {viewMode === "grid" && (
                <ChevronDown
                  className={`w-2.5 h-2.5 text-mutedText-light dark:text-zinc-400 transition-transform duration-150 ${
                    isGridMenuOpen ? "rotate-180" : ""
                  }`}
                />
              )}
            </button>

            {/* Grid Columns Popover */}
            <AnimatePresence>
              {isGridMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-2 w-52 sm:w-56 z-50 bg-white dark:bg-[#181716] border border-black/[0.06] dark:border-white/[0.1] rounded-2xl shadow-2xl p-2.5 backdrop-blur-xl space-y-2.5"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-1 pt-0.5">
                    <span className="text-[10px] font-bold tracking-wider text-mutedText-light dark:text-zinc-400 uppercase">
                      Reels Per Row
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.08] text-secondaryText-light dark:text-zinc-300 font-semibold">
                      {gridCols} cols
                    </span>
                  </div>

                  {/* 1-Tap Quick Segmented Buttons (2, 3, 4, 5, 6) */}
                  <div className="grid grid-cols-5 gap-1 p-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.02] dark:border-white/[0.03]">
                    {[2, 3, 4, 5, 6].map((cols) => (
                      <button
                        key={cols}
                        type="button"
                        onClick={() => {
                          setGridCols(cols);
                          setIsGridMenuOpen(false);
                        }}
                        className={`py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center ${
                          gridCols === cols
                            ? "bg-white dark:bg-zinc-800 text-primaryText-light dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                            : "text-secondaryText-light dark:text-zinc-400 hover:text-primaryText-light dark:hover:text-white"
                        }`}
                        title={`${cols} per row`}
                      >
                        {cols}
                      </button>
                    ))}
                  </div>

                  {/* Detailed options with helper descriptions */}
                  <div className="space-y-0.5 pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
                    {[
                      { cols: 2, label: "2 per row", hint: "Showcase" },
                      { cols: 3, label: "3 per row", hint: "Instagram" },
                      { cols: 4, label: "4 per row", hint: "Default" },
                      { cols: 5, label: "5 per row", hint: "Dense" },
                      { cols: 6, label: "6 per row", hint: "Compact" },
                    ].map((item) => {
                      const isSelected = gridCols === item.cols;
                      return (
                        <button
                          key={item.cols}
                          type="button"
                          onClick={() => {
                            setGridCols(item.cols);
                            setIsGridMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                            isSelected
                              ? "bg-black/[0.04] dark:bg-white/[0.08] text-primaryText-light dark:text-white font-semibold"
                              : "text-secondaryText-light dark:text-zinc-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:text-primaryText-light dark:hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{item.label}</span>
                            <span className="text-[10px] text-mutedText-light dark:text-zinc-500 font-normal">
                              ({item.hint})
                            </span>
                          </div>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-primaryText-light dark:text-white shrink-0" strokeWidth={2.5} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => {
              setViewMode("feed");
              setIsGridMenuOpen(false);
            }}
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
            onClick={() => {
              setViewMode("compact");
              setIsGridMenuOpen(false);
            }}
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
