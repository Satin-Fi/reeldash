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
  Instagram,
  ChevronDown,
  ChevronsUpDown,
  Check,
  Crown,
  Trash2,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const {
    reels,
    favorites,
    recycleBin,
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
  const getAccountAvatarSrc = (handle: string) => {
    const acc = user?.connectedAccounts?.find(
      (a) => a.username?.toLowerCase() === handle.toLowerCase()
    );
    if (acc?.avatarUrl && acc.avatarUrl.startsWith("http") && !acc.avatarUrl.includes("proxy-image")) {
      return `/api/proxy-image?url=${encodeURIComponent(acc.avatarUrl)}`;
    }
    return `/api/proxy-image?username=${encodeURIComponent(handle)}`;
  };

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
    <aside className="hidden md:flex w-64 min-w-[16rem] max-w-[16rem] border-r border-borderSubtle-light dark:border-borderSubtle-dark bg-surface-light dark:bg-surface-dark flex-col justify-between p-4 shrink-0 select-none h-screen sticky top-0 overflow-x-hidden">
      <div className="space-y-4 flex-1 overflow-y-auto overflow-x-hidden scrollbar-none no-scrollbar pr-0.5">
        {/* Brand Logo Header */}
        <div className="flex items-center justify-between px-1 pt-1">
          <ReelDashLogo href="/dashboard" size={24} showText={true} textSize="text-base" />
          <Link
            href="/pricing"
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 font-semibold text-[10px] transition-colors shrink-0"
          >
            <Crown className="w-3 h-3 text-brand-500" />
            <span>{user?.plan === "Free Plan" ? "Upgrade" : "Pro"}</span>
          </Link>
        </div>

        {/* ─── Instagram Account Selector ─── */}
        {allHandles.length > 0 && (
          <div className="relative pt-1 pb-1">
            <button
              onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-rd-md hover:bg-surfaceSecondary-light dark:hover:bg-white/[0.05] transition-colors cursor-pointer text-left focus:outline-none group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {selectedInstagramAccount ? (
                  /* Profile picture for selected account */
                  <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 bg-brand-500/15 flex items-center justify-center relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getAccountAvatarSrc(selectedInstagramAccount)}
                      alt={selectedInstagramAccount}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                      className="w-full h-full object-cover z-10"
                    />
                    <Instagram className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 absolute" />
                  </div>
                ) : (
                  /* Instagram icon for All Accounts */
                  <div className="w-7 h-7 rounded-lg bg-brand-500/15 flex items-center justify-center shrink-0">
                    <Instagram className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="block text-xs font-semibold truncate text-primaryText-light dark:text-zinc-200 leading-tight">
                    {selectedInstagramAccount ? `@${selectedInstagramAccount}` : "All Accounts"}
                  </span>
                  <span className="block text-[10px] text-secondaryText-light dark:text-zinc-500 leading-tight mt-0.5">
                    Instagram
                  </span>
                </div>
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Dropdown Menu */}
            {isAccountDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 p-1 rounded-rd-md bg-surface-light dark:bg-zinc-900 border border-borderSubtle-light dark:border-white/[0.08] shadow-xl shadow-black/20 space-y-0.5 animate-slide-down">
                <button
                  onClick={() => {
                    setSelectedInstagramAccount(null);
                    setIsAccountDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-rd-sm text-[11px] transition-colors cursor-pointer text-left ${
                    !selectedInstagramAccount
                      ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold"
                      : "text-secondaryText-light dark:text-zinc-400 hover:bg-surfaceSecondary-light dark:hover:bg-white/[0.05] hover:text-primaryText-light dark:hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-4 h-4 rounded-full bg-brand-500/15 flex items-center justify-center shrink-0">
                      <Instagram className="w-2.5 h-2.5 text-brand-500" />
                    </div>
                    <span>All Accounts</span>
                  </div>
                  {!selectedInstagramAccount && <Check className="w-3 h-3 text-brand-500 shrink-0" />}
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
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-rd-sm text-[11px] transition-colors cursor-pointer text-left ${
                        isSelected
                          ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold"
                          : "text-secondaryText-light dark:text-zinc-400 hover:bg-surfaceSecondary-light dark:hover:bg-white/[0.05] hover:text-primaryText-light dark:hover:text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-4 h-4 rounded-full overflow-hidden bg-brand-500/15 flex items-center justify-center shrink-0 relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getAccountAvatarSrc(handle)}
                            alt={handle}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                            className="w-full h-full object-cover z-10"
                          />
                          <span className="text-[8px] uppercase font-mono absolute text-brand-500 font-bold">
                            {handle.replace(/^_/, "").charAt(0) || handle.charAt(0)}
                          </span>
                        </div>
                        <span className="truncate font-mono">@{handle}</span>
                      </div>
                      {isSelected && <Check className="w-3 h-3 text-brand-500 shrink-0" />}
                    </button>
                  );
                })}

                <div className="pt-1 mt-0.5 border-t border-borderSubtle-light dark:border-white/[0.06]">
                  <Link
                    href="/settings"
                    onClick={() => setIsAccountDropdownOpen(false)}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-rd-sm text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 transition-colors"
                  >
                    <Plus className="w-3 h-3 shrink-0" />
                    <span>Connect Account</span>
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
                    ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold nav-active-indicator"
                    : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark hover:text-primaryText-light dark:hover:text-primaryText-dark"
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={item.isActive ? 2.25 : 1.75} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span className="text-[10px] font-mono text-mutedText-light dark:text-mutedText-dark shrink-0">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collections Section */}
        <div className="space-y-2 pt-2 border-t border-borderSubtle-light dark:border-borderSubtle-dark">
          <div className="flex items-center justify-between px-2 text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark">
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
                    <span className="truncate flex items-center space-x-2 min-w-0">
                      <Folder className="w-3.5 h-3.5 text-secondaryText-light dark:text-secondaryText-dark shrink-0" strokeWidth={1.75} />
                      <span className="truncate">{col.name}</span>
                    </span>
                    <span className="text-[10px] font-mono text-mutedText-light dark:text-mutedText-dark shrink-0">
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
            <div className="px-2 text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark">
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
                    <span className="text-[10px] font-mono text-mutedText-light dark:text-mutedText-dark shrink-0">
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
      <div className="pt-3 border-t border-borderSubtle-light dark:border-borderSubtle-dark space-y-2 shrink-0 overflow-x-hidden">
        <Link
          href="/pricing"
          className={`flex items-center space-x-2.5 px-3 py-2 rounded-rd-md text-xs font-medium transition-colors ${
            pathname === "/pricing"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold"
              : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark hover:text-primaryText-light dark:hover:text-primaryText-dark"
          }`}
        >
          <Crown className="w-4 h-4 text-brand-500 shrink-0" strokeWidth={1.75} />
          <span className="truncate">Plans & Pricing</span>
        </Link>

        <Link
          href="/recycle-bin"
          className={`flex items-center justify-between px-3 py-2 rounded-rd-md text-xs font-medium transition-colors ${
            pathname === "/recycle-bin"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold"
              : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark hover:text-primaryText-light dark:hover:text-primaryText-dark"
          }`}
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <Trash2 className="w-4 h-4 shrink-0 text-zinc-400" strokeWidth={1.75} />
            <span className="truncate">Recycle Bin</span>
          </div>
          {recycleBin.length > 0 && (
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-rose-500/15 text-rose-400 shrink-0">
              {recycleBin.length}
            </span>
          )}
        </Link>

        <Link
          href="/settings"
          className={`flex items-center space-x-2.5 px-3 py-2 rounded-rd-md text-xs font-medium transition-colors ${
            pathname === "/settings"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold"
              : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark hover:text-primaryText-light dark:hover:text-primaryText-dark"
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" strokeWidth={1.75} />
          <span className="truncate">Settings</span>
        </Link>

        {/* User Profile Bar */}
        <div className="flex items-center justify-between p-2 rounded-rd-md bg-surfaceSecondary-light/80 dark:bg-surfaceSecondary-dark/80 backdrop-blur-sm border border-borderSubtle-light dark:border-white/[0.06]">
          <Link href="/settings" className="flex items-center space-x-2.5 min-w-0 flex-1 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-brand-500/15 border border-brand-500/30 text-brand-600 dark:text-brand-400 font-bold text-xs flex items-center justify-center shrink-0 relative">
              {user?.avatar || user?.instagramUsername ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar || `/api/proxy-image?username=${encodeURIComponent(user.instagramUsername || "")}`}
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                  className="w-full h-full object-cover z-10"
                />
              ) : null}
              <span className="text-xs uppercase absolute">{userInitial}</span>
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="text-xs font-semibold text-primaryText-light dark:text-primaryText-dark truncate">
                {user?.name || "User"}
              </span>
              <span className="text-[10px] text-secondaryText-light dark:text-secondaryText-dark truncate font-mono">
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
