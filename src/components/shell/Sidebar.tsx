"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReels } from "@/context/ReelContext";
import { useAuth } from "@/context/AuthContext";
import { ReelDashLogo } from "@/components/ui/ReelDashLogo";
import {
  Home,
  Film,
  Image as ImageIcon,
  Music2,
  CircleDashed,
  LayoutGrid,
  Heart,
  Folder,
  Settings,
  Plus,
  LogOut,
  Layers,
  Instagram,
  ChevronDown,
  Check,
  Crown,
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
    selectedInstagramAccount,
    setSelectedInstagramAccount,
    setIsCreateCollectionModalOpen,
  } = useReels();
  const { user, logout } = useAuth();
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  const connectedAccounts = user?.connectedAccounts || [];
  const allHandles = Array.from(
    new Set([
      ...connectedAccounts.map((a) => a.username.toLowerCase()),
      ...(user?.instagramUsername ? [user.instagramUsername.toLowerCase()] : []),
    ])
  ).filter(Boolean);

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
      icon: LayoutGrid,
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
  ];

  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : "U";

  return (
    <aside className="w-64 border-r border-borderSubtle-light dark:border-borderSubtle-dark bg-surface-light dark:bg-surface-dark flex flex-col justify-between p-4 shrink-0 select-none h-screen sticky top-0">
      <div className="space-y-4 flex-1 overflow-y-auto pr-1">
        {/* Brand Logo Header */}
        <div className="flex items-center justify-between px-2 pt-1">
          <ReelDashLogo href="/dashboard" size={26} textSize="text-[19px]" />
          <Link
            href="/pricing"
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 font-semibold text-[10px] transition-colors"
          >
            <Crown className="w-3 h-3 text-brand-500" />
            <span>{user?.plan === "Free Plan" ? "Upgrade" : "Pro"}</span>
          </Link>
        </div>

        {/* ─── Professional Sidebar Instagram Account Switcher ─── */}
        {allHandles.length > 0 && (
          <div className="relative px-1 pt-1">
            <button
              onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
              className="w-full flex items-center justify-between p-2 rounded-rd-md bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark hover:border-brand-500/40 transition-all cursor-pointer text-left shadow-rd-subtle"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-6 h-6 rounded-full overflow-hidden bg-brand-500/10 border border-brand-500/20 text-brand-500 font-bold text-[10px] flex items-center justify-center shrink-0">
                  {selectedInstagramAccount ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/proxy-image?username=${encodeURIComponent(selectedInstagramAccount)}`}
                      alt=""
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Layers className="w-3.5 h-3.5 text-brand-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-primaryText-light dark:text-primaryText-dark truncate font-mono">
                    {selectedInstagramAccount ? `@${selectedInstagramAccount}` : "All Accounts"}
                  </span>
                  <span className="block text-[10px] text-secondaryText-light dark:text-secondaryText-dark truncate">
                    {selectedInstagramAccount ? "Filtered Feed" : "Unified Library"}
                  </span>
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-secondaryText-light dark:text-secondaryText-dark transition-transform ${isAccountDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {isAccountDropdownOpen && (
              <div className="absolute top-full left-1 right-1 mt-1 z-50 p-1.5 rounded-rd-md bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark shadow-rd-modal space-y-1">
                <button
                  onClick={() => {
                    setSelectedInstagramAccount(null);
                    setIsAccountDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-rd-sm text-xs transition-colors cursor-pointer text-left ${
                    !selectedInstagramAccount
                      ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold"
                      : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark hover:text-primaryText-light dark:hover:text-primaryText-dark"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Layers className="w-3.5 h-3.5 text-brand-500" />
                    <span>All Accounts</span>
                  </div>
                  <span className="font-mono text-[10px] opacity-75">{counts.all}</span>
                </button>

                {allHandles.map((handle) => {
                  const isSelected = selectedInstagramAccount?.toLowerCase() === handle.toLowerCase();
                  return (
                    <button
                      key={handle}
                      onClick={() => {
                        setSelectedInstagramAccount(handle);
                        setIsAccountDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-rd-sm text-xs transition-colors cursor-pointer text-left ${
                        isSelected
                          ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold"
                          : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark hover:text-primaryText-light dark:hover:text-primaryText-dark"
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <Instagram className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                        <span className="font-mono truncate">@{handle}</span>
                      </div>
                      {isSelected && <Check className="w-3 h-3 text-brand-500" />}
                    </button>
                  );
                })}

                <div className="pt-1 border-t border-borderSubtle-light dark:border-borderSubtle-dark">
                  <Link
                    href="/settings"
                    onClick={() => setIsAccountDropdownOpen(false)}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-rd-sm text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Manage Accounts</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Primary Navigation List */}
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={item.onClick}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-rd-md text-xs font-medium transition-colors cursor-pointer ${
                  item.isActive
                    ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold"
                    : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark hover:text-primaryText-light dark:hover:text-primaryText-dark"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className="w-4 h-4" strokeWidth={item.isActive ? 2.25 : 1.75} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span className="text-[10px] font-mono text-mutedText-light dark:text-mutedText-dark">
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
            <span>Collections</span>
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
                      <Folder className="w-3.5 h-3.5 text-secondaryText-light dark:text-secondaryText-dark shrink-0" strokeWidth={1.75} />
                      <span className="truncate">{col.name}</span>
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
            <div className="px-2 text-[11px] font-semibold text-secondaryText-light dark:text-secondaryText-dark uppercase tracking-wider">
              <span>Categories</span>
            </div>

            <div className="space-y-0.5">
              {smartCategories.map((cat) => {
                const isSelected = isReelsPath && activeCategory === cat.name;
                return (
                  <Link
                    key={cat.name}
                    href={isSelected ? "/reels" : `/reels?category=${encodeURIComponent(cat.name)}`}
                    onClick={() => {
                      setActiveCategory(isSelected ? null : cat.name);
                      setActiveMediaType("all");
                    }}
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
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Area: Settings & User Tile */}
      <div className="pt-4 border-t border-borderSubtle-light dark:border-borderSubtle-dark space-y-2 shrink-0">
        <Link
          href="/pricing"
          className={`flex items-center space-x-2.5 px-3 py-2 rounded-rd-md text-xs font-medium transition-colors ${
            pathname === "/pricing"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold"
              : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark hover:text-primaryText-light dark:hover:text-primaryText-dark"
          }`}
        >
          <Crown className="w-4 h-4 text-brand-500" strokeWidth={1.75} />
          <span>Plans & Pricing</span>
        </Link>

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
