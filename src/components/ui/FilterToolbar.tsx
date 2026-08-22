"use client";

import React from "react";
import { useReels } from "@/context/ReelContext";
import { SortOption, ViewMode } from "@/types/reel";
import { Search, LayoutGrid, List, SlidersHorizontal, ArrowUpDown, X } from "lucide-react";

export function FilterToolbar() {
  const {
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    activeCollection,
    setActiveCollection,
    smartCategories,
    collections,
    sortOption,
    setSortOption,
    viewMode,
    setViewMode,
  } = useReels();

  return (
    <div className="flex flex-col space-y-3 mb-6">
      {/* Main Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md shadow-rd-subtle">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[200px] flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-mutedText-light dark:text-mutedText-dark" />
          <input
            type="text"
            placeholder="Filter Reels by keyword, creator, caption..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-transparent text-xs text-primaryText-light dark:text-primaryText-dark focus:outline-none placeholder:text-mutedText-light dark:placeholder:text-mutedText-dark"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="pr-3 text-mutedText-light dark:text-mutedText-dark hover:text-primaryText-light dark:hover:text-primaryText-dark cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Sort and View mode */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Sort Dropdown */}
          <div className="relative flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-secondaryText-light dark:text-secondaryText-dark absolute left-2.5 pointer-events-none" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="pl-8 pr-3 py-1.5 text-xs bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-sm text-primaryText-light dark:text-primaryText-dark focus:outline-none cursor-pointer appearance-none"
            >
              <option value="newest">Recently Saved</option>
              <option value="oldest">Oldest First</option>
              <option value="recently_viewed">Recently Viewed</option>
              <option value="most_viewed">Most Viewed</option>
              <option value="creator">Creator (A-Z)</option>
            </select>
          </div>

          {/* View Switcher */}
          <div className="flex items-center bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-sm p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded-rd-sm transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-surface-light dark:bg-surface-dark text-brand-500 shadow-rd-subtle"
                  : "text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("compact")}
              className={`p-1 rounded-rd-sm transition-colors cursor-pointer ${
                viewMode === "compact"
                  ? "bg-surface-light dark:bg-surface-dark text-brand-500 shadow-rd-subtle"
                  : "text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light"
              }`}
              title="Compact View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          onClick={() => {
            setActiveCategory(null);
            setActiveCollection(null);
          }}
          className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer shrink-0 ${
            activeCategory === null && activeCollection === null
              ? "bg-brand-500 text-white"
              : "bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark text-secondaryText-light dark:text-secondaryText-dark hover:border-brand-500/50"
          }`}
        >
          All
        </button>

        {smartCategories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => {
              setActiveCategory(cat.name === activeCategory ? null : cat.name);
              setActiveCollection(null);
            }}
            className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer shrink-0 flex items-center space-x-1.5 ${
              activeCategory === cat.name
                ? "bg-brand-500 text-white"
                : "bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark text-secondaryText-light dark:text-secondaryText-dark hover:border-brand-500/50"
            }`}
          >
            <span>{cat.name}</span>
            <span
              className={`px-1.5 py-0.2 text-[10px] rounded-full ${
                activeCategory === cat.name ? "bg-white/20 text-white" : "bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-mutedText-light dark:text-mutedText-dark"
              }`}
            >
              {cat.count}
            </span>
          </button>
        ))}

        {collections.map((col) => (
          <button
            key={col.id}
            onClick={() => {
              setActiveCollection(col.id === activeCollection ? null : col.id);
              setActiveCategory(null);
            }}
            className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer shrink-0 flex items-center space-x-1 ${
              activeCollection === col.id
                ? "bg-brand-500 text-white"
                : "bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark text-secondaryText-light dark:text-secondaryText-dark hover:border-brand-500/50"
            }`}
          >
            <span>{col.icon} {col.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
