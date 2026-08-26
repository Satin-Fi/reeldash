"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReels } from "@/context/ReelContext";
import { useAuth } from "@/context/AuthContext";
import {
  House,
  LayoutGrid,
  Heart,
  Clock,
  Folder,
  Sparkles,
  Settings,
  HelpCircle,
  Plus,
  ChevronRight,
  LogOut,
  Film,
  Image as ImageIcon,
  Music2,
  CircleDashed,
  Layers,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const {
    reels,
    favorites,
    collections,
    smartCategories,
    activeCategory,
    setActiveCategory,
    activeMediaType,
    setActiveMediaType,
    setIsCreateCollectionModalOpen,
  } = useReels();
  const { user, logout } = useAuth();

  const reelsCount = reels.filter((r) => !r.mediaType || r.mediaType === "reel").length;
  const postsCount = reels.filter((r) => r.mediaType === "post").length;
  const audioCount = reels.filter((r) => r.mediaType === "audio").length;
  const storiesCount = reels.filter((r) => r.mediaType === "story").length;
  const totalCount = reels.length;

  const navItems = [
    { label: "Home", href: "/dashboard", icon: House },
    {
      label: "Reels",
      href: "/reels?type=reel",
      icon: Film,
      count: reelsCount,
      mediaType: "reel" as const,
    },
    {
      label: "Posts & Carousels",
      href: "/reels?type=post",
      icon: ImageIcon,
      count: postsCount,
      mediaType: "post" as const,
    },
    {
      label: "Songs & Audio",
      href: "/reels?type=audio",
      icon: Music2,
      count: audioCount,
      mediaType: "audio" as const,
    },
    {
      label: "Stories",
      href: "/reels?type=story",
      icon: CircleDashed,
      count: storiesCount,
      mediaType: "story" as const,
    },
    {
      label: "All Library",
      href: "/reels?type=all",
      icon: Layers,
      count: totalCount,
      mediaType: "all" as const,
    },
    { label: "Favorites", href: "/favorites", icon: Heart, count: favorites.length },
    { label: "Recently Saved", href: "/recent", icon: Clock },
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 bg-surface-light dark:bg-surface-dark border-r border-borderSubtle-light dark:border-borderSubtle-dark p-4 justify-between select-none text-primaryText-light dark:text-primaryText-dark">
      <div className="flex flex-col space-y-6 min-h-0 overflow-y-auto pr-1 scrollbar-none">
        {/* Sidebar Header Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2.5 px-2 cursor-pointer group">
          <div className="w-8 h-8 rounded-rd-md bg-brand-500 flex items-center justify-center text-white font-bold shadow-rd-subtle group-hover:scale-105 transition-transform">
            ⚡
          </div>
          <span className="text-base font-bold tracking-tight text-primaryText-light dark:text-primaryText-dark">
            ReelDash
          </span>
        </Link>

        {/* Primary Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isPathActive =
              item.href.startsWith("/reels")
                ? pathname === "/reels" && (!item.mediaType || activeMediaType === item.mediaType)
                : pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (item.mediaType) {
                    setActiveMediaType(item.mediaType);
                  }
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-rd-md text-xs font-medium transition-all duration-200 ${
                  isPathActive
                    ? "bg-brand-500/10 text-brand-500 font-semibold"
                    : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark hover:text-primaryText-light dark:hover:text-primaryText-dark"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
                    isPathActive
                      ? "bg-brand-500 text-white"
                      : "bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-mutedText-light dark:text-mutedText-dark"
                  }`}
                >
                  {item.count !== undefined ? item.count : 0}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Collections Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3 text-[11px] font-semibold text-mutedText-light dark:text-mutedText-dark uppercase tracking-wider">
            <div className="flex items-center space-x-1.5">
              <Folder className="w-3.5 h-3.5" />
              <span>Collections</span>
            </div>
            <button
              onClick={() => setIsCreateCollectionModalOpen(true)}
              className="p-1 hover:text-brand-500 rounded-rd-sm transition-colors cursor-pointer"
              title="Create Collection"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {collections.length > 0 ? (
              collections.slice(0, 5).map((col) => (
                <Link
                  key={col.id}
                  href="/collections"
                  className="flex items-center justify-between px-3 py-1.5 rounded-rd-md text-xs text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark hover:text-primaryText-light transition-colors"
                >
                  <span className="truncate">
                    {col.icon || "📁"} {col.name}
                  </span>
                  <span className="text-[10px] text-mutedText-light dark:text-mutedText-dark font-mono">
                    {col.reelCount}
                  </span>
                </Link>
              ))
            ) : (
              <p className="px-3 py-1 text-[11px] text-mutedText-light dark:text-mutedText-dark italic">
                No collections yet
              </p>
            )}

            <Link
              href="/collections"
              className="block px-3 py-1 text-[11px] font-medium text-brand-500 hover:underline"
            >
              View all collections →
            </Link>
          </div>
        </div>

        {/* Smart Categories Section */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 px-3 text-[11px] font-semibold text-mutedText-light dark:text-mutedText-dark uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span>Smart Categories</span>
          </div>

          <div className="space-y-0.5">
            {smartCategories.length > 0 ? (
              smartCategories.map((cat) => {
                const isSelected = activeCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(isSelected ? null : cat.name)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-rd-md text-xs text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-brand-500/10 text-brand-500 font-semibold"
                        : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark hover:text-primaryText-light"
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className="text-[10px] text-mutedText-light dark:text-mutedText-dark font-mono">
                      {cat.count}
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-1 text-[11px] text-mutedText-light dark:text-mutedText-dark italic">
                Auto-generated on save
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Bottom Area - REMOVED STORAGE METER AS PER SPEC SECTION 11 */}
      <div className="pt-4 border-t border-borderSubtle-light dark:border-borderSubtle-dark space-y-2 shrink-0">
        <Link
          href="/settings"
          className="flex items-center space-x-2.5 px-3 py-1.5 rounded-rd-md text-xs text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Link>

        <a
          href="https://github.com/Satin-Fi/reeldash"
          target="_blank"
          rel="noreferrer"
          className="flex items-center space-x-2.5 px-3 py-1.5 rounded-rd-md text-xs text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Help & Specs</span>
        </a>

        {/* User Profile / Account */}
        <div className="flex items-center justify-between p-2 rounded-rd-md bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark mt-2">
          <Link href="/settings" className="flex items-center space-x-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-brand-500/20 text-brand-500 font-bold text-xs flex items-center justify-center shrink-0">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="text-xs font-semibold text-primaryText-light dark:text-primaryText-dark leading-tight truncate">
                {user?.name || "User"}
              </span>
              <span className="text-[10px] text-secondaryText-light dark:text-secondaryText-dark">
                {user?.plan || "Free Plan"}
              </span>
            </div>
          </Link>
          <button
            onClick={logout}
            className="p-1 text-mutedText-light hover:text-rose-500 transition-colors cursor-pointer shrink-0"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
