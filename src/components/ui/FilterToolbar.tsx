"use client";

import React from "react";
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
} from "lucide-react";

const mediaTabs: { id: MediaTypeFilter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "all", label: "All Media", icon: LayoutGrid },
  { id: "reel", label: "Reels", icon: Film },
  { id: "post", label: "Posts & Carousels", icon: Images },
  { id: "audio", label: "Songs & Audio", icon: Music2 },
  { id: "story", label: "Stories", icon: CircleDashed },
];

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
  } = useReels();

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

        {/* Right: Integrated Search + Sort + View Mode */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Minimal Search Input */}
          <div className="relative flex-1 md:w-56 flex items-center">
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

          {/* Category Dropdown Selector */}
          <div className="relative flex items-center">
            <Folder className="w-3 h-3 text-secondaryText-light dark:text-zinc-400 absolute left-2.5 pointer-events-none" />
            <select
              value={activeCategory || (activeCollection ? `__col__:${activeCollection}` : "")}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  setActiveCategory(null);
                  setActiveCollection(null);
                } else if (val.startsWith("__col__:")) {
                  setActiveCategory(null);
                  setActiveCollection(val.replace("__col__:", ""));
                } else {
                  setActiveCollection(null);
                  setActiveCategory(val);
                }
              }}
              className="pl-7 pr-6 py-1.5 text-xs bg-surfaceSecondary-light dark:bg-black/30 border border-borderSubtle-light dark:border-white/[0.08] rounded-lg text-primaryText-light dark:text-zinc-300 hover:text-primaryText-light dark:hover:text-white focus:outline-none cursor-pointer appearance-none transition-colors max-w-[140px] md:max-w-[170px] truncate"
            >
              <option value="">All Categories</option>
              {smartCategories
                .filter((cat) => !cat.name.startsWith("#"))
                .map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name} ({cat.count})
                  </option>
                ))}
              {collections.length > 0 && (
                <optgroup label="Collections">
                  {collections.map((col) => (
                    <option key={col.id} value={`__col__:${col.id}`}>
                      {col.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <ChevronDown className="w-3 h-3 text-secondaryText-light dark:text-zinc-400 absolute right-2 pointer-events-none" />
          </div>

          {/* Sort Selector */}
          <div className="relative flex items-center">
            <ArrowUpDown className="w-3 h-3 text-secondaryText-light dark:text-zinc-400 absolute left-2.5 pointer-events-none" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="pl-7 pr-6 py-1.5 text-xs bg-surfaceSecondary-light dark:bg-black/30 border border-borderSubtle-light dark:border-white/[0.08] rounded-lg text-primaryText-light dark:text-zinc-300 hover:text-primaryText-light dark:hover:text-white focus:outline-none cursor-pointer appearance-none transition-colors"
            >
              <option value="newest">Recently Saved</option>
              <option value="oldest">Oldest First</option>
              <option value="recently_viewed">Recently Viewed</option>
              <option value="most_viewed">Most Viewed</option>
              <option value="creator">Creator (A-Z)</option>
            </select>
            <ChevronDown className="w-3 h-3 text-secondaryText-light dark:text-zinc-400 absolute right-2 pointer-events-none" />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-surfaceSecondary-light dark:bg-black/30 border border-borderSubtle-light dark:border-white/[0.08] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-zinc-900 dark:bg-white/[0.12] dark:text-white shadow-xs"
                  : "text-secondaryText-light dark:text-zinc-500 hover:text-primaryText-light dark:hover:text-zinc-300"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("compact")}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === "compact"
                  ? "bg-white text-zinc-900 dark:bg-white/[0.12] dark:text-white shadow-xs"
                  : "text-secondaryText-light dark:text-zinc-500 hover:text-primaryText-light dark:hover:text-zinc-300"
              }`}
              title="Compact List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
