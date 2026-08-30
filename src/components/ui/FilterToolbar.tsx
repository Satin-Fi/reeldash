"use client";

import React, { useState } from "react";
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
    reels,
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 p-1.5 rounded-xl bg-zinc-900/60 dark:bg-[#12141A] border border-zinc-800/80 dark:border-white/[0.07] backdrop-blur-md">
        
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
                    ? "bg-white/[0.12] text-white border border-white/[0.1] shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-300"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Integrated Search + Sort + View Mode */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Minimal Search Input */}
          <div className="relative flex-1 md:w-56 flex items-center">
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-black/40 dark:bg-black/30 border border-zinc-800 dark:border-white/[0.08] rounded-lg text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="relative flex items-center">
            <ArrowUpDown className="w-3 h-3 text-zinc-400 absolute left-2.5 pointer-events-none" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="pl-7 pr-3 py-1.5 text-xs bg-black/40 dark:bg-black/30 border border-zinc-800 dark:border-white/[0.08] rounded-lg text-zinc-300 hover:text-white focus:outline-none cursor-pointer appearance-none transition-colors"
            >
              <option value="newest">Recently Saved</option>
              <option value="oldest">Oldest First</option>
              <option value="recently_viewed">Recently Viewed</option>
              <option value="most_viewed">Most Viewed</option>
              <option value="creator">Creator (A-Z)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-black/40 dark:bg-black/30 border border-zinc-800 dark:border-white/[0.08] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white/[0.12] text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("compact")}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === "compact"
                  ? "bg-white/[0.12] text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Compact List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* ─── 2. SMART CATEGORIES & COLLECTIONS (Quiet Filter Chips) ───────── */}
      {(smartCategories.length > 0 || collections.length > 0) && (
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => {
              setActiveCategory(null);
              setActiveCollection(null);
            }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer shrink-0 ${
              activeCategory === null && activeCollection === null
                ? "bg-white/[0.12] text-white border border-white/[0.12]"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent"
            }`}
          >
            All Categories
          </button>

          {smartCategories.map((cat) => {
            const isCatActive = activeCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => {
                  setActiveCategory(isCatActive ? null : cat.name);
                  setActiveCollection(null);
                  setActiveMediaType("all");
                }}
                className={`group px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer shrink-0 flex items-center space-x-1.5 ${
                  isCatActive
                    ? "bg-white/[0.12] text-white border border-white/[0.12]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                <span>{cat.name}</span>
              </button>
            );
          })}

          {collections.map((col) => {
            const isColActive = activeCollection === col.id;
            return (
              <button
                key={col.id}
                onClick={() => {
                  setActiveCollection(isColActive ? null : col.id);
                  setActiveCategory(null);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer shrink-0 flex items-center space-x-1.5 ${
                  isColActive
                    ? "bg-white/[0.12] text-white border border-white/[0.12]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                <span>{col.icon} {col.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
