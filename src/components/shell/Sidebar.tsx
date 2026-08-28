"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReels } from "@/context/ReelContext";
import { useAuth } from "@/context/AuthContext";
import {
  House,
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
  ChevronRight,
} from "lucide-react";

function NavItem({
  href,
  label,
  icon: Icon,
  count,
  active,
  onClick,
  accent,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  count?: number;
  active?: boolean;
  onClick?: () => void;
  accent?: "brand" | "rose" | "amber";
}) {
  const accentClasses = {
    brand: "text-brand-400 bg-brand-500/8",
    rose:  "text-rose-400 bg-rose-500/8",
    amber: "text-amber-400 bg-amber-500/8",
  };

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex items-center justify-between px-2.5 py-2 rounded-rd-md text-[13px] font-medium transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        active
          ? "bg-brand-500/10 text-brand-400"
          : "text-secondaryText-dark hover:bg-surfaceSecondary-dark hover:text-primaryText-dark"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <Icon
          className={`w-4 h-4 shrink-0 transition-colors ${active ? "text-brand-400" : "text-mutedText-dark group-hover:text-secondaryText-dark"}`}
          strokeWidth={active ? 2 : 1.75}
        />
        <span>{label}</span>
      </div>
      {count !== undefined && count > 0 && (
        <span
          className={`px-1.5 py-0.5 text-[10px] font-mono rounded-full min-w-[18px] text-center leading-none ${
            active
              ? "bg-brand-500 text-white"
              : "bg-surfaceTertiary-dark text-mutedText-dark"
          }`}
        >
          {count > 999 ? "999+" : count}
        </span>
      )}
    </Link>
  );
}

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
    reel:    reels.filter((r) => !r.mediaType || r.mediaType === "reel").length,
    post:    reels.filter((r) => r.mediaType === "post").length,
    audio:   reels.filter((r) => r.mediaType === "audio").length,
    story:   reels.filter((r) => r.mediaType === "story").length,
    all:     reels.length,
    favs:    favorites.length,
  };

  const isReelsPath = pathname === "/reels";

  return (
    <aside className="hidden md:flex flex-col w-[232px] shrink-0 h-screen sticky top-0 bg-surface-dark border-r border-borderSubtle-dark p-3 justify-between select-none">

      {/* Top: Logo + Nav */}
      <div className="flex flex-col gap-5 min-h-0 overflow-y-auto scrollbar-none">

        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-rd-md hover:bg-surfaceSecondary-dark transition-colors duration-200 group"
        >
          <div className="w-7 h-7 rounded-[8px] bg-brand-500 flex items-center justify-center shadow-rd-glow shrink-0 group-hover:scale-105 transition-transform duration-200">
            <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[14px] font-semibold tracking-tight text-primaryText-dark">ReelDash</span>
        </Link>

        {/* Separator */}
        <div className="h-px bg-borderSubtle-dark mx-2" />

        {/* Primary nav */}
        <nav className="space-y-0.5">
          <NavItem href="/dashboard" label="Home" icon={House} active={pathname === "/dashboard"} />
          <NavItem
            href="/reels?type=reel"
            label="Reels"
            icon={Film}
            count={counts.reel}
            active={isReelsPath && activeMediaType === "reel"}
            onClick={() => setActiveMediaType("reel")}
          />
          <NavItem
            href="/reels?type=post"
            label="Posts & Photos"
            icon={ImageIcon}
            count={counts.post}
            active={isReelsPath && activeMediaType === "post"}
            onClick={() => setActiveMediaType("post")}
          />
          <NavItem
            href="/reels?type=audio"
            label="Songs & Audio"
            icon={Music2}
            count={counts.audio}
            active={isReelsPath && activeMediaType === "audio"}
            onClick={() => setActiveMediaType("audio")}
          />
          <NavItem
            href="/reels?type=story"
            label="Stories"
            icon={CircleDashed}
            count={counts.story}
            active={isReelsPath && activeMediaType === "story"}
            onClick={() => setActiveMediaType("story")}
          />
          <NavItem
            href="/reels?type=all"
            label="All Library"
            icon={Layers}
            count={counts.all}
            active={isReelsPath && activeMediaType === "all"}
            onClick={() => setActiveMediaType("all")}
          />
          <div className="h-px bg-borderSubtle-dark mx-1 my-1" />
          <NavItem
            href="/favorites"
            label="Favorites"
            icon={Heart}
            count={counts.favs}
            active={pathname === "/favorites"}
          />
          <NavItem
            href="/recent"
            label="Recently Saved"
            icon={Clock}
            active={pathname === "/recent"}
          />
        </nav>

        {/* Collections */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-mutedText-dark uppercase tracking-[0.1em]">
              <Folder className="w-3 h-3" />
              Collections
            </div>
            <button
              onClick={() => setIsCreateCollectionModalOpen(true)}
              className="p-0.5 rounded-rd-sm text-mutedText-dark hover:text-brand-400 hover:bg-brand-500/10 transition-colors cursor-pointer"
              title="New Collection"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {collections.length > 0 ? (
              <>
                {collections.slice(0, 5).map((col) => (
                  <Link
                    key={col.id}
                    href="/collections"
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-rd-md text-[12px] text-secondaryText-dark hover:bg-surfaceSecondary-dark hover:text-primaryText-dark transition-colors"
                  >
                    <span className="truncate flex items-center gap-1.5">
                      <span className="text-[11px]">{col.icon || "📁"}</span>
                      {col.name}
                    </span>
                    <span className="text-[10px] text-mutedText-dark font-mono shrink-0">{col.reelCount}</span>
                  </Link>
                ))}
                <Link
                  href="/collections"
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-brand-400 hover:text-brand-300 transition-colors"
                >
                  View all
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </>
            ) : (
              <button
                onClick={() => setIsCreateCollectionModalOpen(true)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-rd-md text-[12px] text-mutedText-dark hover:text-brand-400 hover:bg-brand-500/5 transition-colors border border-dashed border-borderSubtle-dark"
              >
                <Plus className="w-3.5 h-3.5" />
                New collection
              </button>
            )}
          </div>
        </div>

        {/* Smart Categories */}
        {smartCategories.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 px-2.5 text-[10px] font-semibold text-mutedText-dark uppercase tracking-[0.1em]">
              <Sparkles className="w-3 h-3 text-brand-400" />
              Smart Categories
            </div>
            <div className="space-y-0.5">
              {smartCategories.slice(0, 6).map((cat) => {
                const isSelected = activeCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(isSelected ? null : cat.name)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-rd-md text-[12px] text-left transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-brand-500/10 text-brand-400 font-medium"
                        : "text-secondaryText-dark hover:bg-surfaceSecondary-dark hover:text-primaryText-dark"
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className="text-[10px] font-mono text-mutedText-dark shrink-0">{cat.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom: User + Settings */}
      <div className="pt-3 border-t border-borderSubtle-dark space-y-1 shrink-0">
        <NavItem href="/settings" label="Settings" icon={Settings} active={pathname === "/settings"} />

        {/* User tile */}
        <div className="flex items-center justify-between p-2 rounded-rd-md bg-surfaceSecondary-dark border border-borderSubtle-dark mt-2">
          <Link href="/settings" className="flex items-center gap-2.5 min-w-0">
            <div className="w-6.5 h-6.5 rounded-full bg-brand-500/15 border border-brand-500/25 text-brand-400 font-bold text-[11px] flex items-center justify-center shrink-0 w-7 h-7">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-[12px] font-semibold text-primaryText-dark leading-tight truncate">
                {user?.name || "User"}
              </span>
              <span className="text-[10px] text-mutedText-dark">
                {user?.plan || "Free plan"}
              </span>
            </div>
          </Link>
          <button
            onClick={logout}
            className="p-1 text-mutedText-dark hover:text-rose-400 hover:bg-rose-500/10 rounded-rd-sm transition-colors cursor-pointer shrink-0"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
