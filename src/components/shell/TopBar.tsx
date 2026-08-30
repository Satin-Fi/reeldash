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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function TopBar() {
  const { reels, favorites, setIsCommandPaletteOpen, theme, toggleTheme } = useReels();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isMac, setIsMac] = useState(true);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mediaTypeParam = searchParams.get("type");

  // Detect platform for keyboard shortcut display (⌘K on Mac, Ctrl+K on Windows/Linux)
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.userAgent) {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.userAgent));
    }
  }, []);

  // Close profile dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && profileOpen) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileOpen]);

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
    <header className="h-[64px] min-h-[64px] w-full sticky top-0 z-30 bg-surface-light dark:bg-surface-dark border-b border-borderSubtle-light dark:border-borderSubtle-dark px-6 flex items-center justify-between select-none transition-colors duration-150">
      
      {/* ─── 1. LEFT ZONE: Workspace / Page Identity ────────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Identity Icon */}
        <IdentityIcon
          className="w-[18px] h-[18px] text-secondaryText-light dark:text-secondaryText-dark shrink-0 transition-colors duration-150"
          strokeWidth={1.7}
        />

        {/* Identity Title */}
        <span className="text-[14px] font-semibold leading-[20px] tracking-[-0.01em] text-primaryText-light dark:text-primaryText-dark transition-colors duration-150">
          {identity.title}
        </span>

        {/* Tiny Muted Count Capsule */}
        {identity.count !== undefined && (
          <span className="inline-flex items-center justify-center h-[20px] min-w-[20px] px-[6px] rounded-[6px] text-[11px] font-semibold bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-secondaryText-light dark:text-secondaryText-dark tabular-nums transition-colors duration-150 border border-borderSubtle-light dark:border-borderSubtle-dark">
            {identity.count}
          </span>
        )}
      </div>

      {/* ─── 2. CENTER ZONE: Command Center Search ────────────────── */}
      <div className="flex-1 flex justify-center px-4 max-w-2xl">
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="group w-full max-w-[420px] h-[38px] px-3 bg-surfaceSecondary-light dark:bg-[#111419] hover:bg-surfaceTertiary-light dark:hover:bg-[#13161B] border border-borderSubtle-light dark:border-white/[0.07] hover:border-borderDefault-light dark:hover:border-white/[0.12] focus:border-brand-500 rounded-[10px] flex items-center justify-between transition-all duration-150 cursor-pointer text-left outline-none"
          title={`Search reels, creators, or command shortcuts (${isMac ? "⌘K" : "Ctrl+K"})`}
          aria-label="Global search and command palette"
        >
          {/* Left: Icon + Subtle Placeholder */}
          <div className="flex items-center gap-2.5 truncate">
            <Search
              className="w-[17px] h-[17px] text-secondaryText-light dark:text-[#777C89] group-hover:text-primaryText-light dark:group-hover:text-[#A0A5B2] transition-colors shrink-0"
              strokeWidth={1.8}
            />
            <span className="text-[14px] font-normal text-secondaryText-light dark:text-[#747987] group-hover:text-primaryText-light dark:group-hover:text-[#A0A5B2] transition-colors truncate font-sans">
              Search or jump to…
            </span>
          </div>

          {/* Right: Keyboard Shortcut Key */}
          <div className="hidden sm:inline-flex items-center justify-center h-[24px] px-[6px] min-w-[32px] rounded-[6px] bg-surfaceTertiary-light dark:bg-white/[0.05] border border-borderSubtle-light dark:border-white/[0.08] text-[11px] font-semibold text-secondaryText-light dark:text-[#8E93A2] tracking-wide shrink-0 select-none">
            {isMac ? "⌘ K" : "Ctrl K"}
          </div>
        </button>
      </div>

      {/* ─── 3. RIGHT ZONE: Action Controls ───────────────────────── */}
      <div className="flex items-center shrink-0 gap-2.5">
        {/* Theme Toggle (36px x 36px with Kinetic Spring Rotation) */}
        <button
          onClick={toggleTheme}
          className="w-[36px] h-[36px] rounded-[8px] bg-transparent hover:bg-surfaceSecondary-light dark:hover:bg-white/[0.06] flex items-center justify-center text-secondaryText-light dark:text-[#A8ACB8] hover:text-primaryText-light dark:hover:text-white transition-all duration-150 cursor-pointer outline-none"
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={theme}
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {theme === "dark" ? (
                <Sun className="w-[18px] h-[18px]" strokeWidth={1.8} />
              ) : (
                <Moon className="w-[18px] h-[18px]" strokeWidth={1.8} />
              )}
            </motion.div>
          </AnimatePresence>
        </button>

        {/* User Avatar (34px x 34px with Pro-Max Dropdown Menu) */}
        <div className="relative" ref={profileRef}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setProfileOpen((v) => !v)}
            className="w-[34px] h-[34px] rounded-full aspect-square bg-gradient-to-tr from-[#5B52E8] to-[#7B73F6] border border-white/10 flex items-center justify-center text-[13px] font-semibold text-white cursor-pointer select-none outline-none shadow-sm"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            aria-label="User profile menu"
          >
            {userInitial}
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
                      Pro
                    </span>
                  </div>
                  <p className="text-[11px] text-secondaryText-light dark:text-[#747987] truncate mt-0.5">
                    {user?.email || "user@reeldash.app"}
                  </p>
                </div>

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

                <button
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false);
                    setIsCommandPaletteOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-[6px] hover:bg-surfaceSecondary-light dark:hover:bg-white/[0.06] text-secondaryText-light dark:text-[#AEB2BF] hover:text-primaryText-light dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Command className="w-3.5 h-3.5 text-secondaryText-light dark:text-[#777C89]" />
                    <span>Command Menu</span>
                  </div>
                  <span className="font-mono text-[10px] text-secondaryText-light dark:text-[#777C89] px-1 py-0.5 rounded bg-surfaceSecondary-light dark:bg-white/[0.06]">
                    {isMac ? "⌘K" : "Ctrl K"}
                  </span>
                </button>

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
