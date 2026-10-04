"use client";

import React, { useState, useRef, useEffect, useId } from "react";
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

interface FilterToolbarProps {
  placeholder?: string;
  className?: string;
}

export function FilterToolbar({
  placeholder = "Find in library…",
  className = "",
}: FilterToolbarProps) {
  const searchId = useId();
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
    <section
      aria-label="Library controls"
      className={`mt-8 sm:mt-10 mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      {/* ─── Left: Categories-Style Search Bar Pill ─── */}
      <div className="relative w-full sm:max-w-[340px]">
        <label htmlFor={searchId} className="sr-only">
          {placeholder}
        </label>

        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
        />

        <input
          id={searchId}
          ref={searchInputRef}
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="h-11 w-full rounded-full border border-black/[0.07] bg-white pl-11 pr-11 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#A589DB] focus:ring-4 focus:ring-[#CBB5FD]/15 [&::-webkit-search-cancel-button]:appearance-none dark:border-white/[0.08] dark:bg-[#121316] dark:text-white dark:placeholder:text-zinc-500"
        />

        {searchQuery ? (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-white/[0.06] dark:hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
            <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06] text-zinc-400">
              ⌘K
            </kbd>
          </div>
        )}
      </div>

      {/* ─── Right: Controls & View Switcher (No New Category Button) ─── */}
      <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0">
        {/* Sort Dropdown Pill */}
        <div ref={sortRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="flex h-11 items-center gap-2 px-4 rounded-full border border-black/[0.07] bg-white text-xs font-medium text-zinc-700 transition hover:border-black/20 hover:text-zinc-950 focus:border-[#A589DB] focus:outline-none focus:ring-4 focus:ring-[#CBB5FD]/15 dark:border-white/[0.08] dark:bg-[#121316] dark:text-zinc-300 dark:hover:border-white/20 dark:hover:text-white cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            title="Sort items"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="hidden sm:inline">{sortLabels[sortOption] || "Sort"}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-150 ${
                isSortOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {isSortOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-full mt-2 w-44 z-50 rounded-2xl border border-black/[0.08] bg-white p-1.5 shadow-xl backdrop-blur-xl dark:border-white/[0.1] dark:bg-[#121316] space-y-0.5"
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
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left ${
                        isSelected
                          ? "bg-black/[0.05] dark:bg-white/[0.1] text-zinc-950 dark:text-white font-semibold"
                          : "text-zinc-600 dark:text-zinc-400 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:text-zinc-950 dark:hover:text-white"
                      }`}
                    >
                      <span className="truncate">{sortLabels[key]}</span>
                      {isSelected && (
                        <Check
                          className="w-3.5 h-3.5 text-zinc-950 dark:text-white shrink-0"
                          strokeWidth={2.5}
                        />
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* View Mode Switcher Pill */}
        <div className="flex h-11 items-center p-1 rounded-full border border-black/[0.07] bg-white dark:border-white/[0.08] dark:bg-[#121316] gap-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          {/* Grid Button with popover for column options */}
          <div ref={gridMenuRef} className="relative h-full flex items-center">
            <button
              type="button"
              onClick={() => {
                if (viewMode !== "grid") {
                  setViewMode("grid");
                } else {
                  setIsGridMenuOpen(!isGridMenuOpen);
                }
              }}
              className={`h-9 flex items-center gap-1 px-3 rounded-full text-xs transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-black/[0.06] dark:bg-white/[0.1] text-zinc-950 dark:text-white font-medium"
                  : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}
              title={viewMode === "grid" ? `Grid View (${gridCols} cols) - click to change` : "Grid View"}
              aria-label="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              {viewMode === "grid" && (
                <ChevronDown
                  className={`w-2.5 h-2.5 text-zinc-400 transition-transform duration-150 ${
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
                  className="absolute right-0 top-full mt-2 w-36 z-50 rounded-2xl border border-black/[0.08] bg-white p-1.5 shadow-xl backdrop-blur-xl dark:border-white/[0.1] dark:bg-[#121316] space-y-0.5"
                >
                  {[2, 3, 4, 5, 6].map((cols) => {
                    const isSelected = gridCols === cols;
                    return (
                      <button
                        key={cols}
                        type="button"
                        onClick={() => {
                          setGridCols(cols);
                          setIsGridMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left ${
                          isSelected
                            ? "bg-black/[0.05] dark:bg-white/[0.1] text-zinc-950 dark:text-white font-semibold"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:text-zinc-950 dark:hover:text-white"
                        }`}
                      >
                        <span>{cols} columns</span>
                        {isSelected && (
                          <Check
                            className="w-3.5 h-3.5 text-zinc-950 dark:text-white shrink-0"
                            strokeWidth={2.5}
                          />
                        )}
                      </button>
                    );
                  })}
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
            className={`h-9 w-9 flex items-center justify-center rounded-full text-xs transition-all cursor-pointer ${
              viewMode === "feed"
                ? "bg-black/[0.06] dark:bg-white/[0.1] text-zinc-950 dark:text-white font-medium"
                : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
            title="Feed View"
            aria-label="Feed View"
          >
            <Rows className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode("compact");
              setIsGridMenuOpen(false);
            }}
            className={`h-9 w-9 flex items-center justify-center rounded-full text-xs transition-all cursor-pointer ${
              viewMode === "compact"
                ? "bg-black/[0.06] dark:bg-white/[0.1] text-zinc-950 dark:text-white font-medium"
                : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
            title="Compact List View"
            aria-label="Compact List View"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
