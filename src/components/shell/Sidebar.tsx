"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReels } from "@/context/ReelContext";
import { useAuth } from "@/context/AuthContext";
import {
  Home,
  Film,
  Image as ImageIcon,
  Music2,
  CircleDashed,
  Layers,
  Heart,
  Clock,
  Folder,
  Sparkles,
  Settings,
  Plus,
  LogOut,
  Zap,
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

  const counts = {
    reel: reels.filter((r) => !r.mediaType || r.mediaType === "reel").length,
    post: reels.filter((r) => r.mediaType === "post").length,
    audio: reels.filter((r) => r.mediaType === "audio").length,
    story: reels.filter((r) => r.mediaType === "story").length,
    all: reels.length,
    favs: favorites.length,
  };

  const isReelsPath = pathname === "/reels";

  const navItems = [
    {
      label: "Home",
      href: "/dashboard",
      icon: Home,
      isActive: pathname === "/dashboard",
      onClick: () => {},
    },
    {
      label: "Reels",
      href: "/reels?type=reel",
      icon: Film,
      count: counts.reel,
      isActive: isReelsPath && activeMediaType === "reel",
      onClick: () => setActiveMediaType("reel"),
    },
    {
      label: "Posts & Photos",
      href: "/reels?type=post",
      icon: ImageIcon,
      count: counts.post,
      isActive: isReelsPath && activeMediaType === "post",
      onClick: () => setActiveMediaType("post"),
    },
    {
      label: "Songs & Audio",
      href: "/reels?type=audio",
      icon: Music2,
      count: counts.audio,
      isActive: isReelsPath && activeMediaType === "audio",
      onClick: () => setActiveMediaType("audio"),
    },
    {
      label: "Stories",
      href: "/reels?type=story",
      icon: CircleDashed,
      count: counts.story,
      isActive: isReelsPath && activeMediaType === "story",
      onClick: () => setActiveMediaType("story"),
    },
    {
      label: "All Library",
      href: "/reels?type=all",
      icon: Layers,
      count: counts.all,
      isActive: isReelsPath && activeMediaType === "all",
      onClick: () => setActiveMediaType("all"),
    },
    {
      label: "Favorites",
      href: "/favorites",
      icon: Heart,
      count: counts.favs,
      isActive: pathname === "/favorites",
      onClick: () => {},
    },
    {
      label: "Recently Saved",
      href: "/recent",
      icon: Clock,
      isActive: pathname === "/recent",
      onClick: () => {},
    },
  ];

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-surface-light dark:bg-surface-dark border-r border-borderSubtle-light dark:border-borderSubtle-dark p-4 justify-between select-none text-primaryText-light dark:text-primaryText-dark transition-colors duration-200">
      
      {/* Top: Logo + Nav */}
      <div className="flex flex-col space-y-6 min-h-0 overflow-y-auto pr-1 scrollbar-none">
        
        {/* Brand Header */}
        <Link href="/dashboard" className="flex items-center space-x-2.5 px-2 py-1.5 rounded-rd-md hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-rd-md bg-brand-500 flex items-center justify-center text-white shadow-rd-glow shrink-0">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-primaryText-light dark:text-primaryText-dark">
              ReelDash
            </span>
            <span className="text-[10px] text-secondaryText-light dark:text-secondaryText-dark font-medium leading-none">
              Visual Library
            </span>
          </div>
        </Link>

        {/* Primary Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={item.onClick}
                className={`flex items-center justify-between px-3 py-2 rounded-rd-md text-xs font-medium transition-all duration-150 ${
                  item.isActive
                    ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold"
                    : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark hover:text-primaryText-light dark:hover:text-primaryText-dark"
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      item.isActive
                        ? "text-brand-600 dark:text-brand-400"
                        : "text-secondaryText-light dark:text-secondaryText-dark"
                    }`}
                    strokeWidth={item.isActive ? 2 : 1.75}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-mono rounded-full leading-none shrink-0 ${
                      item.isActive
                        ? "bg-brand-500 text-white"
                        : "bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-secondaryText-light dark:text-secondaryText-dark"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collections Section */}
        <div className="space-y-2 pt-2 border-t border-borderSubtle-light dark:border-borderSubtle-dark">
          <div className="flex items-center justify-between px-2 text-[11px] font-semibold text-secondaryText-light dark:text-secondaryText-dark uppercase tracking-wider">
            <div className="flex items-center space-x-1.5">
              <Folder className="w-3.5 h-3.5" />
              <span>Collections</span>
            </div>
            <button
              onClick={() => setIsCreateCollectionModalOpen(true)}
              className="p-1 text-secondaryText-light dark:text-secondaryText-dark hover:text-brand-500 dark:hover:text-brand-400 hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark rounded-rd-sm transition-colors cursor-pointer"
              title="Create Collection"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {collections.length > 0 ? (
              <>
                {collections.map((col) => (
                  <Link
                    key={col.id}
                    href="/collections"
                    className="flex items-center justify-between px-3 py-1.5 rounded-rd-md text-xs text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark hover:text-primaryText-light dark:hover:text-primaryText-dark transition-colors"
                  >
                    <span className="truncate flex items-center space-x-2">
                      <span className="text-[12px]">{col.icon || "📁"}</span>
                      <span>{col.name}</span>
                    </span>
                    <span className="text-[10px] font-mono text-mutedText-light dark:text-mutedText-dark">
                      {col.reelCount || 0}
                    </span>
                  </Link>
                ))}
              </>
            ) : (
              <button
                onClick={() => setIsCreateCollectionModalOpen(true)}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-rd-md text-xs text-mutedText-light dark:text-mutedText-dark hover:text-brand-500 dark:hover:text-brand-400 hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark border border-dashed border-borderSubtle-light dark:border-borderSubtle-dark transition-all cursor-pointer text-left"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Collection</span>
              </button>
            )}
          </div>
        </div>

        {/* Smart Categories */}
        {smartCategories.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-borderSubtle-light dark:border-borderSubtle-dark">
            <div className="flex items-center space-x-1.5 px-2 text-[11px] font-semibold text-secondaryText-light dark:text-secondaryText-dark uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              <span>Categories</span>
            </div>

            <div className="space-y-0.5">
              {smartCategories.map((cat) => {
                const isSelected = activeCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(isSelected ? null : cat.name)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-rd-md text-xs text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold"
                        : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark hover:text-primaryText-light dark:hover:text-primaryText-dark"
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className="text-[10px] font-mono text-mutedText-light dark:text-mutedText-dark">
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Area: Settings & User Tile */}
      <div className="pt-4 border-t border-borderSubtle-light dark:border-borderSubtle-dark space-y-2 shrink-0">
        <Link
          href="/settings"
          className={`flex items-center space-x-2.5 px-3 py-2 rounded-rd-md text-xs font-medium transition-colors ${
            pathname === "/settings"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold"
              : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark hover:text-primaryText-light dark:hover:text-primaryText-dark"
          }`}
        >
          <Settings className="w-4 h-4" strokeWidth={1.75} />
          <span>Settings</span>
        </Link>

        {/* User Profile Bar */}
        <div className="flex items-center justify-between p-2 rounded-rd-md bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark">
          <Link href="/settings" className="flex items-center space-x-2.5 min-w-0 flex-1 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-600 dark:text-brand-400 font-bold text-xs flex items-center justify-center shrink-0">
              {userInitial}
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="text-xs font-semibold text-primaryText-light dark:text-primaryText-dark truncate">
                {user?.name || "User"}
              </span>
              <span className="text-[10px] text-secondaryText-light dark:text-secondaryText-dark truncate">
                {user?.instagramUsername ? `@${user.instagramUsername}` : user?.plan || "Free Plan"}
              </span>
            </div>
          </Link>
          <button
            onClick={logout}
            className="p-1.5 text-secondaryText-light dark:text-secondaryText-dark hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-rd-sm transition-colors cursor-pointer shrink-0"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
