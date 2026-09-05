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
  Layers,
  Heart,
  Folder,
  Settings,
  Plus,
  LogOut,
  Instagram,
  ChevronsUpDown,
  Check,
  Crown,
  Trash2,
  Code2,
  Palette,
  Compass,
  Camera,
  ShoppingBag,
  Activity,
  Utensils,
  Cpu,
} from "lucide-react";

function getSidebarCategoryIcon(name: string) {
  const norm = name.toLowerCase().trim();
  if (norm.includes("tech") || norm.includes("dev") || norm.includes("code")) return Code2;
  if (norm.includes("music") || norm.includes("audio") || norm.includes("song")) return Music2;
  if (norm.includes("travel") || norm.includes("place")) return Compass;
  if (norm.includes("design") || norm.includes("art")) return Palette;
  if (norm.includes("camera") || norm.includes("photo")) return Camera;
  if (norm.includes("saree") || norm.includes("fashion") || norm.includes("wear")) return ShoppingBag;
  if (norm.includes("fitness") || norm.includes("yoga") || norm.includes("gym")) return Activity;
  if (norm.includes("ai") || norm.includes("gpt")) return Cpu;
  if (norm.includes("recipe") || norm.includes("food")) return Utensils;
  return Folder;
}

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
  const activeAccounts = connectedAccounts.filter((a) => a.status === "active");
  const legacyAccounts = connectedAccounts.filter((a) => a.status === "legacy_unverified");

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
      count: counts.reel > 0 ? counts.reel : undefined,
      isActive: isReelsPath && activeMediaType === "reel",
      onClick: () => setActiveMediaType("reel"),
    },
    {
      label: "Posts & Photos",
      href: "/reels?type=post",
      icon: ImageIcon,
      count: counts.post > 0 ? counts.post : undefined,
      isActive: isReelsPath && activeMediaType === "post",
      onClick: () => setActiveMediaType("post"),
    },
    {
      label: "Songs & Audio",
      href: "/reels?type=audio",
      icon: Music2,
      count: counts.audio > 0 ? counts.audio : undefined,
      isActive: isReelsPath && activeMediaType === "audio",
      onClick: () => setActiveMediaType("audio"),
    },
    {
      label: "Stories",
      href: "/reels?type=story",
      icon: CircleDashed,
      count: counts.story > 0 ? counts.story : undefined,
      isActive: isReelsPath && activeMediaType === "story",
      onClick: () => setActiveMediaType("story"),
    },
    {
      label: "All Library",
      href: "/reels?type=all",
      icon: Layers,
      count: counts.all > 0 ? counts.all : undefined,
      isActive: isReelsPath && activeMediaType === "all",
      onClick: () => setActiveMediaType("all"),
    },
    {
      label: "Favorites",
      icon: Heart,
      href: "/favorites",
      badge: counts.favs > 0 ? counts.favs : null,
      isActive: pathname === "/favorites",
    },
    {
      label: "Collections",
      icon: Folder,
      href: "/collections",
      badge: collections.length > 0 ? collections.length : null,
      isActive: pathname === "/collections",
    },
  ];

  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : "U";

  return (
    <aside className="dark hidden md:flex w-64 min-w-[16rem] max-w-[16rem] h-full flex-col justify-between p-4 shrink-0 select-none overflow-x-hidden rounded-[20px] bg-[#0C0E14] ring-1 ring-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
      <div className="space-y-4 flex-1 overflow-y-auto overflow-x-hidden scrollbar-none no-scrollbar pr-0.5">
        {/* ─── Brand Logo Header ─── */}
        <div className="flex items-center justify-between px-1 pt-1">
          <ReelDashLogo href="/dashboard" size={24} showText={true} textSize="text-base" />
          <Link
            href="/pricing"
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/15 hover:bg-brand-500/25 text-brand-400 font-semibold text-[10px] transition-colors shrink-0"
          >
            <Crown className="w-3 h-3 text-brand-400" strokeWidth={1.5} />
            <span>{user?.plan === "Free Plan" ? "Upgrade" : "Pro"}</span>
          </Link>
        </div>

        {/* ─── Instagram Account Status / Selector ─── */}
        {activeAccounts.length === 0 ? (
          /* ZERO ACTIVE ACCOUNTS */
          <div className="pt-1 pb-1">
            {legacyAccounts.length > 0 ? (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <p className="text-[11px] font-semibold text-amber-400 flex items-center gap-1 truncate font-mono">
                    <span>⚠️</span> @{legacyAccounts[0].username}
                  </p>
                  <p className="text-[10px] text-amber-500/70">Unverified</p>
                </div>
                <Link
                  href="/connect-instagram"
                  className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-[10px] font-semibold transition-colors shrink-0"
                >
                  Verify
                </Link>
              </div>
            ) : (
              <Link
                href="/settings"
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] border border-dashed border-white/[0.08] hover:border-brand-500/30 transition-all text-left group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-brand-500/15 text-brand-400 flex items-center justify-center shrink-0">
                    <Instagram className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-[#8B95A4] group-hover:text-brand-400 transition-colors truncate">
                      Instagram not connected
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-brand-400 px-1.5 py-0.5 rounded-md bg-brand-500/15 shrink-0">
                  Connect
                </span>
              </Link>
            )}
          </div>
        ) : activeAccounts.length === 1 ? (
          /* ONE ACTIVE — already shown in user tile below */
          null
        ) : (
          /* TWO+ ACTIVE ACCOUNTS — Full switcher */
          <div className="relative pt-1 pb-1">
            <button
              onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer text-left focus:outline-none group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {selectedInstagramAccount ? (
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
                    <Instagram className="w-3.5 h-3.5 text-brand-400 absolute" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-brand-500/15 flex items-center justify-center shrink-0">
                    <Instagram className="w-3.5 h-3.5 text-brand-400" strokeWidth={1.5} />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="block text-xs font-semibold truncate text-zinc-200 leading-tight">
                    {selectedInstagramAccount ? `@${selectedInstagramAccount}` : "All Accounts"}
                  </span>
                  <span className="block text-[10px] text-[#5A6370] leading-tight mt-0.5">
                    Instagram ({activeAccounts.length})
                  </span>
                </div>
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 text-[#5A6370] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Dropdown Menu */}
            {isAccountDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 p-1 rounded-xl bg-[#161A1F] border border-white/[0.08] shadow-xl shadow-black/30 space-y-0.5 animate-slide-down">
                <button
                  onClick={() => {
                    setSelectedInstagramAccount(null);
                    setIsAccountDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer text-left ${
                    !selectedInstagramAccount
                      ? "bg-brand-500/15 text-brand-400 font-semibold"
                      : "text-[#8B95A4] hover:bg-white/[0.04] hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-4 h-4 rounded-full bg-brand-500/15 flex items-center justify-center shrink-0">
                      <Instagram className="w-2.5 h-2.5 text-brand-400" />
                    </div>
                    <span>All Accounts</span>
                  </div>
                  {!selectedInstagramAccount && <Check className="w-3 h-3 text-brand-400 shrink-0" />}
                </button>

                {activeAccounts.map((acc) => {
                  const handle = acc.username;
                  const isSelected = selectedInstagramAccount?.toLowerCase() === handle.toLowerCase();
                  return (
                    <button
                      key={handle}
                      onClick={() => {
                        setSelectedInstagramAccount(handle);
                        setIsAccountDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer text-left ${
                        isSelected
                          ? "bg-brand-500/15 text-brand-400 font-semibold"
                          : "text-[#8B95A4] hover:bg-white/[0.04] hover:text-zinc-200"
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
                          <Instagram className="w-2.5 h-2.5 text-brand-400 absolute" />
                        </div>
                        <span className="truncate font-mono">@{handle}</span>
                      </div>
                      {isSelected && <Check className="w-3 h-3 text-brand-400 shrink-0" />}
                    </button>
                  );
                })}

                <div className="pt-1 mt-0.5 border-t border-white/[0.06]">
                  <Link
                    href="/settings"
                    onClick={() => setIsAccountDropdownOpen(false)}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-brand-400 hover:bg-brand-500/10 transition-colors"
                  >
                    <Plus className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                    <span>Connect Account</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Primary Navigation ─── */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={item.onClick}
                className={`group w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                  item.isActive
                    ? "bg-white/[0.08] text-white font-medium shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/[0.06]"
                    : "text-[#8B95A4] hover:bg-white/[0.03] hover:text-[#D1D5DB]"
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      item.isActive
                        ? "bg-white/10 text-white shadow-sm"
                        : "text-[#717886] group-hover:text-[#A0A8B7] group-hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={item.isActive ? 1.8 : 1.5} />
                  </div>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md shrink-0 transition-colors ${
                      item.isActive
                        ? "bg-white/10 text-white"
                        : "text-[#5A6370] group-hover:text-[#8B95A4]"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ─── Categories Section ─── */}
        <div className="space-y-2 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#5A6370]">
              Categories
            </span>
            <Link
              href="/categories"
              className="p-1 text-[#5A6370] hover:text-brand-400 hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer"
              title="Create or Manage Categories"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            </Link>
          </div>

          <div className="space-y-0.5">
            {smartCategories
              .filter((cat) => !cat.name.startsWith("#"))
              .slice(0, 5)
              .map((cat) => {
                const isSelected = isReelsPath && activeCategory === cat.name;
                const CatIcon = getSidebarCategoryIcon(cat.name);
                return (
                  <Link
                    key={cat.name}
                    href={isSelected ? "/reels" : `/reels?category=${encodeURIComponent(cat.name)}`}
                    onClick={() => {
                      setActiveCategory(isSelected ? null : cat.name);
                      setActiveMediaType("all");
                    }}
                    className={`group w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[12.5px] font-medium transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-white/[0.08] text-white font-medium border border-white/[0.06]"
                        : "text-[#8B95A4] hover:bg-white/[0.03] hover:text-[#D1D5DB]"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "bg-white/10 text-white"
                            : "text-[#6B7280] group-hover:text-[#9CA3AF]"
                        }`}
                      >
                        <CatIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </div>
                      <span className="truncate">{cat.name}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded shrink-0 transition-colors ${
                        isSelected
                          ? "bg-white/10 text-white"
                          : "text-[#5A6370] group-hover:text-[#8B95A4]"
                      }`}
                    >
                      {cat.count}
                    </span>
                  </Link>
                );
              })}

            {/* View all categories link */}
            <Link
              href="/categories"
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-medium text-brand-400 hover:bg-white/[0.04] transition-colors pt-1"
            >
              <span>View all categories</span>
              <span className="text-xs">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Bottom Area: Settings & User Tile ─── */}
      <div className="pt-3 border-t border-white/[0.06] space-y-1 shrink-0 overflow-x-hidden">
        <Link
          href="/pricing"
          className={`group flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 ${
            pathname === "/pricing"
              ? "bg-white/[0.08] text-white font-semibold"
              : "text-[#8B95A4] hover:bg-white/[0.04] hover:text-[#C4C9D4]"
          }`}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-white/[0.04] text-brand-400 group-hover:bg-brand-500/15 transition-colors">
            <Crown className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <span className="truncate">Plans & Pricing</span>
        </Link>

        <Link
          href="/recycle-bin"
          className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 ${
            pathname === "/recycle-bin"
              ? "bg-white/[0.08] text-white font-semibold"
              : "text-[#8B95A4] hover:bg-white/[0.04] hover:text-[#C4C9D4]"
          }`}
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-white/[0.04] text-[#717886] group-hover:bg-white/[0.08] transition-colors">
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <span className="truncate">Recycle Bin</span>
          </div>
          {recycleBin.length > 0 && (
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 shrink-0">
              {recycleBin.length}
            </span>
          )}
        </Link>

        {/* ─── User Profile Bar (Payflow-Inspired) ─── */}
        <div className="flex items-center justify-between p-2.5 mt-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <Link href="/settings" className="flex items-center space-x-2.5 min-w-0 flex-1 hover:opacity-90 transition-opacity">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-brand-500/20 border border-brand-500/30 text-brand-400 font-bold text-sm flex items-center justify-center shrink-0 relative">
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
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
              <span className="text-[13px] font-semibold text-white truncate">
                {user?.name || "User"}
              </span>
              <span className="text-[11px] text-[#8B95A4] truncate font-mono">
                {activeAccounts.length === 1
                  ? `@${activeAccounts[0].username}`
                  : activeAccounts.length > 1
                  ? `${activeAccounts.length} Accounts`
                  : user?.plan || "Pro Plan"}
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-0.5 shrink-0">
            <Link
              href="/settings"
              className="p-1.5 text-[#717886] hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings className="w-4 h-4" strokeWidth={1.5} />
            </Link>
            <button
              onClick={logout}
              className="p-1.5 text-[#717886] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
