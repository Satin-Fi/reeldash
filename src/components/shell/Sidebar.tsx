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
  Sun,
  Moon,
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

function renderNavIcon(label: string, IconComponent: React.ElementType, isActive: boolean) {
  if (label === "Dashboard") {
    if (isActive) {
      return (
        <svg
          viewBox="0 0 24 24"
          className="w-[18px] h-[18px] shrink-0"
          fill="none"
        >
          <path
            d="M10.8 2.5a1.8 1.8 0 0 1 2.4 0l7.5 6.4c.5.4.8 1.1.8 1.7v9.4a2 2 0 0 1-2 2h-3.5a1 1 0 0 1-1-1v-5.5a1.5 1.5 0 0 0-1.5-1.5h-3a1.5 1.5 0 0 0-1.5 1.5v5.5a1 1 0 0 1-1 1H4.5a2 2 0 0 1-2-2v-9.4c0-.6.3-1.3.8-1.7l7.5-6.4Z"
            fill="white"
          />
        </svg>
      );
    }
    return <Home className="w-[18px] h-[18px] shrink-0 text-[#9C9895]" strokeWidth={1.5} />;
  }

  return (
    <IconComponent
      className={`w-[18px] h-[18px] shrink-0 transition-colors ${
        isActive ? "text-white fill-white" : "fill-none text-[#9C9895]"
      }`}
      strokeWidth={1.5}
    />
  );
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
    theme,
    toggleTheme,
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
      label: "Dashboard",
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
      count: counts.favs > 0 ? counts.favs : undefined,
      isActive: pathname === "/favorites",
    },
  ];

  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : "U";

  // Reusable subtle material style for inner panels
  const surfaceStyle: React.CSSProperties = {
    background: "linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 100%), #242220",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.03)",
  };

  // Warm charcoal active pill matching Payflow reference pixel-for-pixel
  const activeRowStyle: React.CSSProperties = {
    background: "linear-gradient(90deg, #4A4540 0%, #3C3834 55%, #2A2725 100%)",
  };

  // Distinct lighter warm stone circular disc (#8C857F) matching Payflow reference
  const activeCircleStyle: React.CSSProperties = {
    background: "#8C857F",
  };

  const activeCategoryCircleStyle: React.CSSProperties = {
    background: "#8C857F",
  };

  return (
    <aside className="dark hidden md:flex w-[260px] min-w-[260px] max-w-[260px] h-full flex-col justify-between p-3.5 shrink-0 select-none overflow-x-hidden bg-[#181716] border-r border-black/[0.06] dark:border-white/[0.06]">
      <div className="space-y-3 flex-1 overflow-y-auto overflow-x-hidden scrollbar-none no-scrollbar pr-0.5">
        {/* Brand Header */}
          <div className="flex items-center justify-between px-2 pt-1.5 pb-0.5">
            <ReelDashLogo href="/dashboard" size={25} showText={true} textSize="text-[16px]" />
            <Link
              href="/pricing"
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.04] hover:bg-white/[0.06] text-[#AAA6A1] hover:text-[#E8E5E1] font-medium text-[10.5px] border border-white/[0.03] transition-colors shrink-0"
            >
              <Crown className="w-3 h-3 text-[#C5A059]" strokeWidth={1.5} />
              <span>{user?.plan === "Free Plan" ? "Upgrade" : "Pro"}</span>
            </Link>
          </div>

          {/* 2. Instagram Account Selector (Quiet Warm Charcoal) */}
          {activeAccounts.length === 0 ? (
            /* ZERO ACTIVE ACCOUNTS */
            <div>
              {legacyAccounts.length > 0 ? (
                <div
                  className="p-2.5 rounded-[16px] bg-white/[0.02] border border-amber-500/15 text-xs flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-[11px] font-medium text-amber-400/90 flex items-center gap-1 truncate font-mono">
                      <span>⚠️</span> @{legacyAccounts[0].username}
                    </p>
                    <p className="text-[10px] text-amber-500/60">Unverified</p>
                  </div>
                  <Link
                    href="/connect-instagram"
                    className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400/90 text-[10px] font-medium transition-colors shrink-0"
                  >
                    Verify
                  </Link>
                </div>
              ) : (
                <Link
                  href="/settings"
                  className="w-full flex items-center justify-between p-2 rounded-[16px] bg-white/[0.02] hover:bg-white/[0.04] border border-dashed border-white/[0.04] hover:border-white/[0.08] transition-all text-left group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-white/[0.04] text-[#AAA6A1] group-hover:text-[#E8E5E1] flex items-center justify-center shrink-0 transition-colors">
                      <Instagram className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                    <p className="text-[11.5px] font-normal text-[#AAA6A1] group-hover:text-[#D4D0CB] transition-colors truncate">
                      Connect Instagram
                    </p>
                  </div>
                  <span className="text-[10px] font-medium text-[#AAA6A1] px-2 py-0.5 rounded-full bg-white/[0.04] shrink-0">
                    Link
                  </span>
                </Link>
              )}
            </div>
          ) : activeAccounts.length === 1 ? (
            /* Single account — integrated into user card at bottom */
            null
          ) : (
            /* Multiple accounts switcher */
            <div className="relative">
              <button
                onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[16px] bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.02] transition-all cursor-pointer text-left focus:outline-none group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-white/[0.04] flex items-center justify-center shrink-0 relative">
                    {selectedInstagramAccount ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getAccountAvatarSrc(selectedInstagramAccount)}
                        alt={selectedInstagramAccount}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                        className="w-full h-full object-cover z-10"
                      />
                    ) : null}
                    <Instagram className="w-3 h-3 text-[#AAA6A1]" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[12px] font-medium truncate text-[#E8E5E1] leading-tight">
                      {selectedInstagramAccount ? `@${selectedInstagramAccount}` : "All Accounts"}
                    </span>
                    <span className="block text-[9.5px] text-[#787470] leading-tight mt-0.5">
                      Instagram ({activeAccounts.length})
                    </span>
                  </div>
                </div>
                <ChevronsUpDown className="w-3.5 h-3.5 text-[#787470] shrink-0" strokeWidth={1.5} />
              </button>

              {/* Dropdown Menu */}
              {isAccountDropdownOpen && (
                <div
                  style={surfaceStyle}
                  className="absolute top-full left-0 right-0 mt-1 z-50 p-1 rounded-[16px] border border-white/[0.04] shadow-xl shadow-black/40 space-y-0.5 animate-slide-down"
                >
                  <button
                    onClick={() => {
                      setSelectedInstagramAccount(null);
                      setIsAccountDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[12px] text-[11px] transition-colors cursor-pointer text-left ${
                      !selectedInstagramAccount
                        ? "bg-[#33312F] text-[#E8E5E1] font-medium"
                        : "text-[#AAA6A1] hover:bg-white/[0.02] hover:text-[#E8E5E1]"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-4 h-4 rounded-full bg-white/[0.04] flex items-center justify-center shrink-0">
                        <Instagram className="w-2.5 h-2.5 text-[#AAA6A1]" strokeWidth={1.5} />
                      </div>
                      <span>All Accounts</span>
                    </div>
                    {!selectedInstagramAccount && <Check className="w-3 h-3 text-[#E8E5E1] shrink-0" strokeWidth={1.5} />}
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
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[12px] text-[11px] transition-colors cursor-pointer text-left ${
                          isSelected
                            ? "bg-[#33312F] text-[#E8E5E1] font-medium"
                            : "text-[#AAA6A1] hover:bg-white/[0.02] hover:text-[#E8E5E1]"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-4 h-4 rounded-full overflow-hidden bg-white/[0.04] flex items-center justify-center shrink-0 relative">
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
                            <Instagram className="w-2.5 h-2.5 text-[#AAA6A1] absolute" strokeWidth={1.5} />
                          </div>
                          <span className="truncate font-mono">@{handle}</span>
                        </div>
                        {isSelected && <Check className="w-3 h-3 text-[#E8E5E1] shrink-0" strokeWidth={1.5} />}
                      </button>
                    );
                  })}

                  <div className="pt-1 mt-0.5 border-t border-white/[0.03]">
                    <Link
                      href="/settings"
                      onClick={() => setIsAccountDropdownOpen(false)}
                      className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-[12px] text-[11px] font-medium text-[#AAA6A1] hover:text-[#E8E5E1] hover:bg-white/[0.02] transition-colors"
                    >
                      <Plus className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                      <span>Connect Account</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={item.onClick}
                  style={item.isActive ? activeRowStyle : undefined}
                  className={`group w-full h-[48px] flex items-center justify-between pl-[5px] pr-4 rounded-full text-[13.5px] transition-colors duration-150 cursor-pointer ${
                    item.isActive
                      ? "text-[#FAF8F5] font-medium"
                      : "text-[#AAA6A1] hover:bg-white/[0.02] hover:text-[#D4D0CB]"
                  }`}
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    {/* Concentric Circular Icon Container */}
                    <div
                      style={item.isActive ? activeCircleStyle : undefined}
                      className={`w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        item.isActive
                          ? "text-white shadow-sm"
                          : "bg-[#332F2C] text-[#9E9994] group-hover:text-[#D4D0CB] group-hover:bg-[#3D3936]"
                      }`}
                    >
                      {renderNavIcon(item.label, Icon, item.isActive)}
                    </div>
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.count !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md shrink-0 transition-colors ${
                        item.isActive
                          ? "text-[#DDD9D5]"
                          : "text-[#6E6A66] group-hover:text-[#8E8A85]"
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
          <div className="pt-3 space-y-1">
            <div className="flex items-center justify-between px-2 pt-0.5">
            <span className="text-[10px] uppercase tracking-wider font-medium text-[#787470]">
              Categories
            </span>
            <Link
              href="/categories"
              className="p-1 text-[#787470] hover:text-[#E8E5E1] hover:bg-white/[0.03] rounded-md transition-colors cursor-pointer"
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
                    style={isSelected ? activeRowStyle : undefined}
                    className={`group w-full h-[38px] flex items-center justify-between pl-1.5 pr-3 rounded-full text-[12.5px] transition-colors duration-150 cursor-pointer ${
                      isSelected
                        ? "text-[#F0EDE9] font-medium"
                        : "text-[#AAA6A1] hover:bg-white/[0.02] hover:text-[#D4D0CB]"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div
                        style={isSelected ? activeCategoryCircleStyle : undefined}
                        className={`w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "text-white"
                            : "bg-[#332F2C] text-[#9E9994] group-hover:text-[#D4D0CB] group-hover:bg-[#3D3936]"
                        }`}
                      >
                        <CatIcon
                          className={`w-[13px] h-[13px] transition-colors ${
                            isSelected ? "text-white fill-white" : "fill-none"
                          }`}
                          strokeWidth={1.5}
                        />
                      </div>
                      <span className="truncate">{cat.name}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-1 py-0.2 rounded shrink-0 ${
                        isSelected
                          ? "text-[#DDD9D5]"
                          : "text-[#6E6A66] group-hover:text-[#8E8A85]"
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
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-full text-[11px] font-normal text-[#8E8A85] hover:text-[#E8E5E1] hover:bg-white/[0.02] transition-colors pt-0.5"
            >
              <span>View all categories</span>
              <span className="text-xs">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 5. Bottom Area: Utility Links & Payflow Profile Card ─── */}
      <div className="pt-2 space-y-2 shrink-0 overflow-x-hidden">
        {/* Quick Utility Links */}
        <div className="space-y-0.5 px-0.5">
          <Link
            href="/pricing"
            style={pathname === "/pricing" ? activeRowStyle : undefined}
            className={`group w-full h-[42px] flex items-center space-x-3 pl-1.5 pr-3.5 rounded-full text-[12.5px] transition-colors duration-150 ${
              pathname === "/pricing"
                ? "text-[#F0EDE9] font-medium"
                : "text-[#AAA6A1] hover:bg-white/[0.02] hover:text-[#D4D0CB]"
            }`}
          >
            <div
              style={pathname === "/pricing" ? activeCircleStyle : undefined}
              className={`w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 transition-colors ${
                pathname === "/pricing"
                  ? "text-white"
                  : "bg-[#2D2A27] text-[#9A9590] group-hover:text-[#E8E5E1] group-hover:bg-[#34302D]"
              }`}
            >
              <Crown
                className={`w-4 h-4 ${
                  pathname === "/pricing" ? "text-white fill-white" : "fill-none"
                }`}
                strokeWidth={1.5}
              />
            </div>
            <span className="truncate">Plans & Pricing</span>
          </Link>

          <Link
            href="/recycle-bin"
            style={pathname === "/recycle-bin" ? activeRowStyle : undefined}
            className={`group w-full h-[42px] flex items-center justify-between pl-1.5 pr-3.5 rounded-full text-[12.5px] transition-colors duration-150 ${
              pathname === "/recycle-bin"
                ? "text-[#F0EDE9] font-medium"
                : "text-[#AAA6A1] hover:bg-white/[0.02] hover:text-[#D4D0CB]"
            }`}
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div
                style={pathname === "/recycle-bin" ? activeCircleStyle : undefined}
                className={`w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  pathname === "/recycle-bin"
                    ? "text-white"
                    : "bg-[#2D2A27] text-[#9A9590] group-hover:text-[#E8E5E1] group-hover:bg-[#34302D]"
                }`}
              >
                <Trash2
                  className={`w-4 h-4 ${
                    pathname === "/recycle-bin" ? "text-white fill-white" : "fill-none"
                  }`}
                  strokeWidth={1.5}
                />
              </div>
              <span className="truncate">Recycle Bin</span>
            </div>
            {recycleBin.length > 0 && (
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400/90 shrink-0">
                {recycleBin.length}
              </span>
            )}
          </Link>
        </div>

        {/* ─── Payflow User Profile Card ─── */}
        <div
          className="flex items-center justify-between p-2 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] transition-colors border border-white/[0.04]"
        >
          <Link href="/settings" className="flex items-center space-x-2.5 min-w-0 flex-1 hover:opacity-90 transition-opacity">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-[#302E2C] border border-white/[0.05] text-[#E8E5E1] font-medium text-xs flex items-center justify-center shrink-0 relative">
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
              <span className="text-[13px] font-medium text-[#E8E5E1] truncate">
                {user?.name || "User"}
              </span>
              <span className="text-[11px] text-[#AAA6A1] truncate font-mono">
                {activeAccounts.length === 1
                  ? `@${activeAccounts[0].username}`
                  : activeAccounts.length > 1
                  ? `${activeAccounts.length} Accounts`
                  : user?.plan || "Pro Plan"}
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={toggleTheme}
              className="p-1.5 text-[#787470] hover:text-[#E8E5E1] hover:bg-white/[0.03] rounded-lg transition-colors cursor-pointer"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <Moon className="w-4 h-4" strokeWidth={1.5} />
              )}
            </button>
            <Link
              href="/settings"
              className="p-1.5 text-[#787470] hover:text-[#E8E5E1] hover:bg-white/[0.03] rounded-lg transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings className="w-4 h-4" strokeWidth={1.5} />
            </Link>
            <button
              onClick={logout}
              className="p-1.5 text-[#787470] hover:text-rose-400/90 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
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
