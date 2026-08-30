"use client";

import React, { useState, useEffect, useRef } from "react";
import { useReels } from "@/context/ReelContext";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  Sun,
  Moon,
  Settings,
  LogOut,
  MessageCircle,
  HelpCircle,
  Command,
  ExternalLink,
  LayoutGrid,
  Film,
  Image as ImageIcon,
  Music2,
  CircleDashed,
  Folder,
  Heart,
  Clock,
  Users,
  Compass,
  Instagram,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function TopBar() {
  const {
    reels,
    favorites,
    setIsCommandPaletteOpen,
    theme,
    toggleTheme,
    selectedInstagramAccount,
    setSelectedInstagramAccount,
  } = useReels();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);
  const [isMac, setIsMac] = useState(true);
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileAccountRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mediaTypeParam = searchParams.get("type");

  const connectedAccounts = user?.connectedAccounts || [];
  const allHandles = Array.from(
    new Set([
      ...connectedAccounts.map((a) => a.username.toLowerCase()),
      ...(user?.instagramUsername ? [user.instagramUsername.toLowerCase()] : []),
    ])
  ).filter(Boolean);

  const getAccountAvatarSrc = (handle: string) => {
    const acc = user?.connectedAccounts?.find(
      (a) => a.username?.toLowerCase() === handle.toLowerCase()
    );
    if (acc?.avatarUrl && acc.avatarUrl.startsWith("http") && !acc.avatarUrl.includes("proxy-image")) {
      return `/api/proxy-image?url=${encodeURIComponent(acc.avatarUrl)}`;
    }
    return `/api/proxy-image?username=${encodeURIComponent(handle)}`;
  };

  // Detect platform for keyboard shortcut display (⌘K on Mac, Ctrl+K on Windows/Linux)
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.userAgent) {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.userAgent));
    }
  }, []);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (mobileAccountRef.current && !mobileAccountRef.current.contains(e.target as Node)) {
        setMobileAccountOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setProfileOpen(false);
        setMobileAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileOpen, mobileAccountOpen]);

  // Format user initial
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "J";

  // Contextual distinct page identity for the Left Zone
  const getContextIdentity = () => {
    if (pathname === "/dashboard") {
      return { title: "Visual Library", icon: LayoutGrid, count: reels.length };
    }
    if (pathname === "/reels") {
      if (mediaTypeParam === "reel") {
        const count = reels.filter((r) => !r.mediaType || r.mediaType === "reel").length;
        return { title: "Reels", icon: Film, count };
      }
      if (mediaTypeParam === "post") {
        const count = reels.filter((r) => r.mediaType === "post").length;
        return { title: "Posts & Photos", icon: ImageIcon, count };
      }
      if (mediaTypeParam === "audio") {
        const count = reels.filter((r) => r.mediaType === "audio").length;
        return { title: "Songs & Audio", icon: Music2, count };
      }
      if (mediaTypeParam === "story") {
        const count = reels.filter((r) => r.mediaType === "story").length;
        return { title: "Stories", icon: CircleDashed, count };
      }
      return { title: "All Library", icon: LayoutGrid, count: reels.length };
    }
    if (pathname.startsWith("/collections")) {
      return { title: "Collections", icon: Folder };
    }
    if (pathname.startsWith("/creator")) {
      return { title: "Creator Studio", icon: Users };
    }
    if (pathname.startsWith("/search")) {
      return { title: "Discovery", icon: Compass };
    }
    if (pathname.startsWith("/settings")) {
      return { title: "Settings", icon: Settings };
    }
    if (pathname.startsWith("/favorites")) {
      return { title: "Favorites", icon: Heart, count: favorites.length };
    }
    if (pathname.startsWith("/recent")) {
      return { title: "Recently Saved", icon: Clock };
    }
    return { title: "Visual Library", icon: LayoutGrid, count: reels.length };
  };

  const identity = getContextIdentity();
  const IdentityIcon = identity.icon;

  return (
    <header className="h-[64px] min-h-[64px] w-full sticky top-0 z-30 bg-surface-light dark:bg-surface-dark border-b border-borderSubtle-light dark:border-borderSubtle-dark px-3 sm:px-6 flex items-center justify-between select-none transition-colors duration-150">
      
      {/* ─── 1. LEFT ZONE: Workspace / Page Identity & Mobile Switcher ── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Desktop Page Identity */}
        <div className="hidden md:flex items-center gap-2">
          <IdentityIcon
            className="w-[18px] h-[18px] text-secondaryText-light dark:text-secondaryText-dark shrink-0 transition-colors duration-150"
            strokeWidth={1.7}
          />
          <span className="text-[14px] font-semibold leading-[20px] tracking-[-0.01em] text-primaryText-light dark:text-primaryText-dark transition-colors duration-150">
            {identity.title}
          </span>
          {identity.count !== undefined && (
            <span className="inline-flex items-center justify-center h-[20px] min-w-[20px] px-[6px] rounded-[6px] text-[11px] font-semibold bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-secondaryText-light dark:text-secondaryText-dark tabular-nums transition-colors duration-150 border border-borderSubtle-light dark:border-borderSubtle-dark">
              {identity.count}
            </span>
          )}
        </div>

        {/* Mobile View: Interactive Account Switcher (if handles exist) or Mobile Title */}
        <div className="flex md:hidden items-center gap-1.5">
          {allHandles.length > 0 ? (
            <div className="relative" ref={mobileAccountRef}>
              <button
                onClick={() => setMobileAccountOpen(!mobileAccountOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surfaceSecondary-light dark:bg-white/[0.06] border border-borderSubtle-light dark:border-white/[0.08] text-xs font-semibold text-primaryText-light dark:text-zinc-200 cursor-pointer active:scale-95 transition-all max-w-[155px]"
              >
                <div className="w-4 h-4 rounded-full overflow-hidden bg-brand-500/15 flex items-center justify-center shrink-0 relative">
                  {selectedInstagramAccount ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getAccountAvatarSrc(selectedInstagramAccount)}
                      alt=""
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                      className="w-full h-full object-cover z-10"
                    />
                  ) : null}
                  <Instagram className="w-2.5 h-2.5 text-brand-500 absolute" />
                </div>
                <span className="truncate font-mono text-[11px]">
                  {selectedInstagramAccount ? `@${selectedInstagramAccount}` : "All Feeds"}
                </span>
                <ChevronsUpDown className="w-3 h-3 text-secondaryText-light dark:text-zinc-400 shrink-0" />
              </button>

              {/* Mobile Account Dropdown Menu */}
              <AnimatePresence>
                {mobileAccountOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute left-0 mt-1.5 w-52 bg-surface-light dark:bg-[#111419] border border-borderSubtle-light dark:border-white/[0.08] rounded-[10px] shadow-2xl p-1.5 z-50 text-xs space-y-0.5"
                  >
                    <button
                      onClick={() => {
                        setSelectedInstagramAccount(null);
                        setMobileAccountOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-[6px] text-xs transition-colors cursor-pointer text-left ${
                        !selectedInstagramAccount
                          ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold"
                          : "text-secondaryText-light dark:text-zinc-400 hover:bg-surfaceSecondary-light dark:hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-4 h-4 rounded-full bg-brand-500/15 flex items-center justify-center shrink-0">
                          <Instagram className="w-2.5 h-2.5 text-brand-500" />
                        </div>
                        <span>All Accounts</span>
                      </div>
                      {!selectedInstagramAccount && <Check className="w-3.5 h-3.5 text-brand-500 shrink-0" />}
                    </button>

                    {allHandles.map((handle) => {
                      const isSelected = selectedInstagramAccount?.toLowerCase() === handle.toLowerCase();
                      return (
                        <button
                          key={handle}
                          onClick={() => {
                            setSelectedInstagramAccount(handle);
                            setMobileAccountOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-[6px] text-xs transition-colors cursor-pointer text-left ${
                            isSelected
                              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold"
                              : "text-secondaryText-light dark:text-zinc-400 hover:bg-surfaceSecondary-light dark:hover:bg-white/[0.05]"
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
                          {isSelected && <Check className="w-3.5 h-3.5 text-brand-500 shrink-0" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <IdentityIcon className="w-4 h-4 text-secondaryText-light dark:text-secondaryText-dark shrink-0" />
              <span className="text-xs font-semibold text-primaryText-light dark:text-primaryText-dark">
                {identity.title}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ─── 2. CENTER ZONE: Command Center Search ────────────────── */}
      <div className="flex-1 flex justify-center px-2 sm:px-4 max-w-2xl">
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="group w-full max-w-[420px] h-[36px] sm:h-[38px] px-2.5 sm:px-3 bg-surfaceSecondary-light dark:bg-[#111419] hover:bg-surfaceTertiary-light dark:hover:bg-[#13161B] border border-borderSubtle-light dark:border-white/[0.07] hover:border-borderDefault-light dark:hover:border-white/[0.12] focus:border-brand-500 rounded-[10px] flex items-center justify-between transition-all duration-150 cursor-pointer text-left outline-none hover:ring-1 hover:ring-brand-500/15"
          title={`Search reels, creators, or command shortcuts (${isMac ? "⌘K" : "Ctrl+K"})`}
          aria-label="Global search and command palette"
        >
          {/* Left: Icon + Subtle Placeholder */}
          <div className="flex items-center gap-2 truncate">
            <Search
              className="w-[15px] sm:w-[17px] h-[15px] sm:h-[17px] text-secondaryText-light dark:text-[#777C89] group-hover:text-primaryText-light dark:group-hover:text-[#A0A5B2] transition-colors shrink-0"
              strokeWidth={1.8}
            />
            <span className="text-[13px] sm:text-[14px] font-normal text-secondaryText-light dark:text-[#747987] group-hover:text-primaryText-light dark:group-hover:text-[#A0A5B2] transition-colors truncate font-sans">
              Search library…
            </span>
          </div>

          {/* Right: Keyboard Shortcut Key */}
          <div className="hidden sm:inline-flex items-center justify-center h-[24px] px-[6px] min-w-[32px] rounded-[6px] bg-surfaceTertiary-light dark:bg-white/[0.05] border border-borderSubtle-light dark:border-white/[0.08] text-[11px] font-semibold text-secondaryText-light dark:text-[#8E93A2] tracking-wide shrink-0 select-none">
            {isMac ? "⌘ K" : "Ctrl K"}
          </div>
        </button>
      </div>

      {/* ─── 3. RIGHT ZONE: Action Controls ───────────────────────── */}
      <div className="flex items-center shrink-0 gap-1.5 sm:gap-2.5">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-[32px] sm:w-[36px] h-[32px] sm:h-[36px] rounded-[8px] bg-transparent hover:bg-surfaceSecondary-light dark:hover:bg-white/[0.06] flex items-center justify-center text-secondaryText-light dark:text-[#A8ACB8] hover:text-primaryText-light dark:hover:text-white transition-all duration-150 cursor-pointer outline-none active:scale-[0.92]"
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={theme}
              initial={{ rotate: -90, opacity: 0, scale: 0.75 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.75 }}
              transition={{ duration: 0.15 }}
            >
              {theme === "dark" ? (
                <Sun className="w-[16px] sm:w-[18px] h-[16px] sm:h-[18px]" strokeWidth={1.8} />
              ) : (
                <Moon className="w-[16px] sm:w-[18px] h-[16px] sm:h-[18px]" strokeWidth={1.8} />
              )}
            </motion.div>
          </AnimatePresence>
        </button>

        {/* User Avatar & Dropdown Menu */}
        <div className="relative" ref={profileRef}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setProfileOpen((v) => !v)}
            className="w-[32px] sm:w-[34px] h-[32px] sm:h-[34px] rounded-full aspect-square overflow-hidden bg-gradient-to-tr from-[#5B52E8] to-[#7B73F6] border border-white/10 flex items-center justify-center text-[13px] font-semibold text-white cursor-pointer select-none outline-none shadow-sm relative ring-2 ring-transparent hover:ring-brand-500/20 transition-all"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            aria-label="User profile menu"
          >
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
            <span className="absolute">{userInitial}</span>
          </motion.button>

          {/* Profile Dropdown Menu */}
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 4 }}
                transition={{ duration: 0.12, ease: "easeOut" }}
                className="absolute right-0 mt-2 w-56 bg-surface-light dark:bg-[#111419] border border-borderSubtle-light dark:border-white/[0.08] rounded-[10px] shadow-2xl p-1.5 z-50 text-xs text-primaryText-light dark:text-[#E7E8EC] space-y-0.5"
                role="menu"
                aria-orientation="vertical"
              >
                {/* User Header */}
                <div className="px-3 py-2 rounded-[8px] bg-surfaceSecondary-light dark:bg-white/[0.03] border border-borderSubtle-light dark:border-white/[0.04] mb-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-primaryText-light dark:text-white truncate">{user?.name || "User"}</p>
                    <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30">
                      {user?.plan === "Free Plan" ? "Free" : "Pro"}
                    </span>
                  </div>
                  <p className="text-[11px] text-secondaryText-light dark:text-[#747987] truncate mt-0.5">
                    {user?.email || "user@reeldash.app"}
                  </p>
                </div>

                {/* Account Switching in Profile Menu */}
                {allHandles.length > 0 && (
                  <div className="py-1 border-b border-borderSubtle-light dark:border-white/[0.06] mb-1">
                    <div className="px-2.5 py-1 text-[10px] font-semibold text-secondaryText-light dark:text-[#747987] uppercase tracking-wider">
                      Instagram Accounts
                    </div>
                    <button
                      onClick={() => {
                        setSelectedInstagramAccount(null);
                        setProfileOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-xs transition-colors cursor-pointer text-left ${
                        !selectedInstagramAccount
                          ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold"
                          : "text-secondaryText-light dark:text-[#AEB2BF] hover:bg-surfaceSecondary-light dark:hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Instagram className="w-3.5 h-3.5 text-brand-500 shrink-0" />
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
                            setProfileOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-xs transition-colors cursor-pointer text-left ${
                            isSelected
                              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold"
                              : "text-secondaryText-light dark:text-[#AEB2BF] hover:bg-surfaceSecondary-light dark:hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-3.5 h-3.5 rounded-full overflow-hidden bg-brand-500/15 flex items-center justify-center shrink-0 relative">
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
                              <span className="text-[7px] uppercase font-mono absolute text-brand-500 font-bold">
                                {handle.replace(/^_/, "").charAt(0) || handle.charAt(0)}
                              </span>
                            </div>
                            <span className="truncate font-mono">@{handle}</span>
                          </div>
                          {isSelected && <Check className="w-3 h-3 text-brand-500 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                <Link
                  href="/settings"
                  role="menuitem"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-[6px] hover:bg-surfaceSecondary-light dark:hover:bg-white/[0.06] text-secondaryText-light dark:text-[#AEB2BF] hover:text-primaryText-light dark:hover:text-white transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-secondaryText-light dark:text-[#777C89]" />
                  <span>Account Settings</span>
                </Link>

                <Link
                  href="/pricing"
                  role="menuitem"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-[6px] hover:bg-surfaceSecondary-light dark:hover:bg-white/[0.06] text-secondaryText-light dark:text-[#AEB2BF] hover:text-primaryText-light dark:hover:text-white transition-colors"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-secondaryText-light dark:text-[#777C89]" />
                  <span>Plans & Pricing</span>
                </Link>

                <div className="border-t border-borderSubtle-light dark:border-white/[0.06] my-1" />

                <button
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[6px] hover:bg-rose-500/10 text-rose-500 font-medium transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
