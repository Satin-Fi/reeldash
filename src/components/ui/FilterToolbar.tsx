"use client";

import React, { useState, useRef, useEffect } from "react";
import { useReels } from "@/context/ReelContext";
import { SortOption, ViewMode, MediaTypeFilter } from "@/types/reel";
import {
  Search,
  LayoutGrid,
  List,
  Film,
  Images,
  Music2,
  CircleDashed,
  ArrowUpDown,
  X,
  Folder,
  ChevronDown,
  Check,
  Bookmark,
  Rows,
  Play,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ReelPlayerModal } from "@/components/reels/ReelPlayerModal";

const mediaTabs: { id: MediaTypeFilter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "all", label: "All Media", icon: LayoutGrid },
  { id: "reel", label: "Reels", icon: Film },
  { id: "post", label: "Posts & Carousels", icon: Images },
  { id: "audio", label: "Songs & Audio", icon: Music2 },
  { id: "story", label: "Stories", icon: CircleDashed },
];

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
    activeCategory,
    setActiveCategory,
    activeCollection,
    setActiveCollection,
    activeMediaType,
    setActiveMediaType,
    smartCategories,
    collections,
    sortOption,
    setSortOption,
    viewMode,
    setViewMode,
    reels,
  } = useReels();

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isWatchReelsOpen, setIsWatchReelsOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsCategoryOpen(false);
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const getActiveCategoryLabel = () => {
    if (activeCollection) {
      const col = collections.find((c) => c.id === activeCollection);
      return col ? col.name : "Collection";
    }
    if (activeCategory) {
      return activeCategory;
    }
    return "All Categories";
  };

  return (
    <div className="flex flex-col space-y-3 mb-5">
      {/* ─── 1. PRIMARY ACTION BAR (Segmented Media Tabs + Search + Controls) ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 p-1.5 rounded-xl bg-surface-light dark:bg-[#12141A] border border-borderSubtle-light dark:border-white/[0.07] shadow-sm">
        
        {/* Left: Quiet Segmented Media Type Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-0.5 md:pb-0 scrollbar-none">
          {mediaTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMediaType === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMediaType(tab.id)}
                className={`group flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-zinc-900 text-white dark:bg-white/[0.12] dark:text-white shadow-xs font-semibold"
                    : "text-secondaryText-light dark:text-zinc-400 hover:text-primaryText-light dark:hover:text-zinc-200 hover:bg-surfaceSecondary-light dark:hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? "text-white" : "text-secondaryText-light dark:text-zinc-400 group-hover:text-primaryText-light dark:group-hover:text-zinc-300"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Integrated Search + Custom Dropdowns + View Mode */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Minimal Search Input */}
          <div className="relative flex-1 md:w-52 flex items-center">
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-secondaryText-light dark:text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-surfaceSecondary-light dark:bg-black/30 border border-borderSubtle-light dark:border-white/[0.08] rounded-lg text-xs text-primaryText-light dark:text-white placeholder:text-mutedText-light dark:placeholder:text-zinc-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-secondaryText-light dark:text-zinc-500 hover:text-primaryText-light dark:hover:text-zinc-300 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* ─── Fully Dressed-Up Custom Category Dropdown ─── */}
          <div ref={categoryRef} className="relative">
            <button
              onClick={() => {
                setIsCategoryOpen(!isCategoryOpen);
                setIsSortOpen(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                activeCategory || activeCollection
                  ? "bg-brand-500/10 border-brand-500/30 text-brand-600 dark:text-brand-400 font-semibold"
                  : isCategoryOpen
                  ? "bg-surfaceSecondary-light dark:bg-white/[0.08] border-brand-500/40 text-primaryText-light dark:text-white"
                  : "bg-surfaceSecondary-light dark:bg-black/30 border-borderSubtle-light dark:border-white/[0.08] text-primaryText-light dark:text-zinc-300 hover:text-primaryText-light dark:hover:text-white"
              }`}
              title="Filter by category or collection"
              aria-label="Category selector"
            >
              <Folder className={`w-3.5 h-3.5 shrink-0 ${activeCategory || activeCollection ? "text-brand-500" : "text-zinc-400"}`} />
              <span className="max-w-[100px] sm:max-w-[130px] truncate">{getActiveCategoryLabel()}</span>
              <ChevronDown
                className={`w-3 h-3 shrink-0 text-zinc-400 transition-transform duration-150 ${
                  isCategoryOpen ? "rotate-180 text-brand-500" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {isCategoryOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1.5 w-60 z-50 bg-surface-light dark:bg-[#13151D] border border-borderSubtle-light dark:border-white/[0.1] rounded-xl shadow-2xl p-1.5 backdrop-blur-xl max-h-72 overflow-y-auto custom-scrollbar"
                >
                  {/* All Categories Option */}
                  <button
                    onClick={() => {
                      setActiveCategory(null);
                      setActiveCollection(null);
                      setIsCategoryOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                      !activeCategory && !activeCollection
                        ? "bg-brand-500/15 text-brand-600 dark:text-brand-400 font-semibold"
                        : "text-secondaryText-light dark:text-zinc-300 hover:bg-surfaceSecondary-light dark:hover:bg-white/[0.06] hover:text-primaryText-light dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <LayoutGrid className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">All Categories</span>
                    </div>
                    {!activeCategory && !activeCollection && (
                      <Check className="w-3.5 h-3.5 text-brand-500 shrink-0" strokeWidth={2.5} />
                    )}
                  </button>

                  {/* Categories Section */}
                  {smartCategories.filter((cat) => !cat.name.startsWith("#")).length > 0 && (
                    <div className="pt-1.5 mt-1 border-t border-borderSubtle-light dark:border-white/[0.06]">
                      <div className="px-2.5 py-1 text-[10px] font-semibold text-secondaryText-light dark:text-zinc-500 uppercase tracking-wider">
                        Categories
                      </div>
                      <div className="space-y-0.5">
                        {smartCategories
                          .filter((cat) => !cat.name.startsWith("#"))
                          .map((cat) => {
                            const isSelected = activeCategory?.toLowerCase() === cat.name.toLowerCase();
                            return (
                              <button
                                key={cat.name}
                                onClick={() => {
                                  setActiveCategory(isSelected ? null : cat.name);
                                  setActiveCollection(null);
                                  setIsCategoryOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                                  isSelected
                                    ? "bg-brand-500/15 text-brand-600 dark:text-brand-400 font-semibold"
                                    : "text-secondaryText-light dark:text-zinc-300 hover:bg-surfaceSecondary-light dark:hover:bg-white/[0.06] hover:text-primaryText-light dark:hover:text-white"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Folder className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                  <span className="truncate">{cat.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-surfaceSecondary-light dark:bg-white/[0.06] text-secondaryText-light dark:text-zinc-400">
                                    {cat.count}
                                  </span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-brand-500" strokeWidth={2.5} />}
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Collections Section */}
                  {collections.length > 0 && (
                    <div className="pt-1.5 mt-1 border-t border-borderSubtle-light dark:border-white/[0.06]">
                      <div className="px-2.5 py-1 text-[10px] font-semibold text-secondaryText-light dark:text-zinc-500 uppercase tracking-wider">
                        Collections
                      </div>
                      <div className="space-y-0.5">
                        {collections.map((col) => {
                          const isSelected = activeCollection === col.id;
                          return (
                            <button
                              key={col.id}
                              onClick={() => {
                                setActiveCollection(isSelected ? null : col.id);
                                setActiveCategory(null);
                                setIsCategoryOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                                isSelected
                                  ? "bg-brand-500/15 text-brand-600 dark:text-brand-400 font-semibold"
                                  : "text-secondaryText-light dark:text-zinc-300 hover:bg-surfaceSecondary-light dark:hover:bg-white/[0.06] hover:text-primaryText-light dark:hover:text-white"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Bookmark className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                <span className="truncate">{col.name}</span>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-brand-500" strokeWidth={2.5} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ─── Fully Dressed-Up Custom Sort Dropdown ─── */}
          <div ref={sortRef} className="relative">
            <button
              onClick={() => {
                setIsSortOpen(!isSortOpen);
                setIsCategoryOpen(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                isSortOpen
                  ? "bg-surfaceSecondary-light dark:bg-white/[0.08] border-brand-500/40 text-primaryText-light dark:text-white"
                  : "bg-surfaceSecondary-light dark:bg-black/30 border-borderSubtle-light dark:border-white/[0.08] text-primaryText-light dark:text-zinc-300 hover:text-primaryText-light dark:hover:text-white"
              }`}
              title="Sort items"
              aria-label="Sort options"
            >
              <ArrowUpDown className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
              <span className="hidden sm:inline">{sortLabels[sortOption] || "Sort"}</span>
              <ChevronDown
                className={`w-3 h-3 shrink-0 text-zinc-400 transition-transform duration-150 ${
                  isSortOpen ? "rotate-180 text-brand-500" : ""
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
                  className="absolute right-0 top-full mt-1.5 w-44 z-50 bg-surface-light dark:bg-[#13151D] border border-borderSubtle-light dark:border-white/[0.1] rounded-xl shadow-2xl p-1.5 backdrop-blur-xl space-y-0.5"
                >
                  {(Object.keys(sortLabels) as SortOption[]).map((key) => {
                    const isSelected = sortOption === key;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setSortOption(key);
                          setIsSortOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                          isSelected
                            ? "bg-brand-500/15 text-brand-600 dark:text-brand-400 font-semibold"
                            : "text-secondaryText-light dark:text-zinc-300 hover:bg-surfaceSecondary-light dark:hover:bg-white/[0.06] hover:text-primaryText-light dark:hover:text-white"
                        }`}
                      >
                        <span className="truncate">{sortLabels[key]}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-brand-500 shrink-0" strokeWidth={2.5} />}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* View Mode Toggle: 3-Col Grid | Feed | Compact */}
          <div className="flex items-center bg-surfaceSecondary-light dark:bg-black/30 border border-borderSubtle-light dark:border-white/[0.08] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-zinc-900 dark:bg-white/[0.12] dark:text-white shadow-xs font-semibold"
                  : "text-secondaryText-light dark:text-zinc-500 hover:text-primaryText-light dark:hover:text-zinc-300"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("feed")}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === "feed"
                  ? "bg-white text-zinc-900 dark:bg-white/[0.12] dark:text-white shadow-xs font-semibold"
                  : "text-secondaryText-light dark:text-zinc-500 hover:text-primaryText-light dark:hover:text-zinc-300"
              }`}
              title="Feed View (Instagram/Facebook format)"
            >
              <Rows className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("compact")}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === "compact"
                  ? "bg-white text-zinc-900 dark:bg-white/[0.12] dark:text-white shadow-xs font-semibold"
                  : "text-secondaryText-light dark:text-zinc-500 hover:text-primaryText-light dark:hover:text-zinc-300"
              }`}
              title="Compact List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Launch Full-Screen Reels Mode */}
          {reels.length > 0 && (
            <button
              onClick={() => setIsWatchReelsOpen(true)}
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
              title="Watch full-screen Reels (Instagram format)"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Watch Reels</span>
            </button>
          )}
        </div>

      </div>

      {/* Watch Reels Modal launcher */}
      {isWatchReelsOpen && reels.length > 0 && (
        <ReelPlayerModal
          isOpen={isWatchReelsOpen}
          onClose={() => setIsWatchReelsOpen(false)}
          reel={reels[0]}
        />
      )}
    </div>
  );
}
