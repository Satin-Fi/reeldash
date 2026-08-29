"use client";

import React, { useState, useEffect, useRef } from "react";
import { useReels } from "@/context/ReelContext";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  Plus,
  Sun,
  Moon,
  Settings,
  LogOut,
  MessageCircle,
  HelpCircle,
  Command,
  Sparkles,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function TopBar() {
  const { setIsSaveModalOpen, setIsCommandPaletteOpen, theme, toggleTheme } = useReels();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Format user initial
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  // Contextual page title for situational awareness
  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Visual Library";
    if (pathname.startsWith("/collections")) return "Collections";
    if (pathname.startsWith("/creator")) return "Creator Studio";
    if (pathname.startsWith("/search")) return "Search & Discovery";
    if (pathname.startsWith("/integrations")) return "Integrations";
    if (pathname.startsWith("/settings")) return "Settings";
    if (pathname.startsWith("/favorites")) return "Favorites";
    return "Workspace";
  };

  return (
    <header className="h-14 shrink-0 w-full z-30 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-xl border-b border-zinc-200/80 dark:border-white/[0.08] px-4 sm:px-6 flex items-center justify-between transition-colors duration-200">
      {/* Left: Situational Breadcrumb / Quick Search Trigger */}
      <div className="flex items-center gap-3 md:gap-4 flex-1 max-w-xl">
        {/* Subtle Workspace Pill */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium select-none shrink-0">
          <span className="text-zinc-700 dark:text-zinc-300 font-semibold">ReelDash</span>
          <span className="text-zinc-300 dark:text-zinc-700">/</span>
          <span>{getPageTitle()}</span>
        </div>

        {/* Global Quick Search Button (Linear / Raycast Style) */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="group relative flex-1 max-w-xs sm:max-w-sm flex items-center justify-between h-9 px-3 bg-zinc-100/80 dark:bg-white/[0.04] hover:bg-zinc-200/60 dark:hover:bg-white/[0.07] border border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/[0.14] rounded-lg text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all duration-150 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)] active:scale-[0.99]"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" strokeWidth={2} />
            <span className="font-normal truncate">Search Reels, creators, tags...</span>
          </div>

          <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white dark:bg-white/[0.08] border border-zinc-200/80 dark:border-white/[0.08] text-[10px] font-medium text-zinc-500 dark:text-zinc-400 shadow-sm shrink-0">
            <span className="text-[11px] leading-none">⌘</span>
            <span className="font-sans">K</span>
          </div>
        </button>
      </div>

      {/* Right: SaaS Action Bar */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* DM Ingest Link Button (Refined Secondary Action) */}
        <Link
          href="/integrations/instagram"
          className="hidden md:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] border border-transparent hover:border-zinc-200 dark:hover:border-white/[0.08] transition-all duration-150"
        >
          <MessageCircle className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.75} />
          <span>DM Sync</span>
        </Link>

        {/* Primary "+ Save Reel" Action (SaaS High-Contrast Button) */}
        <button
          onClick={() => setIsSaveModalOpen(true)}
          className="group relative flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 shadow-[0_1px_2px_rgba(0,0,0,0.1)] active:scale-[0.97] transition-all duration-150 cursor-pointer select-none"
        >
          <Plus className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
          <span>Save Reel</span>
        </button>

        {/* Subtle Vertical Hairline Divider */}
        <div className="h-4 w-px bg-zinc-200 dark:bg-white/[0.1] mx-0.5" />

        {/* Theme Toggle (Clean Icon Button) */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400/90 hover:text-amber-400 transition-colors" strokeWidth={2} />
          ) : (
            <Moon className="w-4 h-4 text-zinc-600 hover:text-zinc-900 transition-colors" strokeWidth={2} />
          )}
        </button>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-zinc-300 dark:hover:ring-white/20 transition-all cursor-pointer select-none"
            aria-expanded={profileOpen}
            aria-label="User profile menu"
          >
            <div className="w-7.5 h-7.5 rounded-full bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white font-semibold text-xs flex items-center justify-center shadow-sm ring-1 ring-black/10 dark:ring-white/10">
              {userInitial}
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 4 }}
                transition={{ duration: 0.12, ease: "easeOut" }}
                className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#12131a] border border-zinc-200/80 dark:border-white/[0.1] rounded-xl shadow-xl shadow-black/10 dark:shadow-black/40 p-1.5 z-50 text-xs text-zinc-700 dark:text-zinc-200 space-y-0.5"
              >
                {/* User Header */}
                <div className="px-3 py-2.5 rounded-lg bg-zinc-50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/[0.04] mb-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-zinc-900 dark:text-white truncate">{user?.name || "User"}</p>
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                      Pro
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                    {user?.email || "user@reeldash.app"}
                  </p>
                </div>

                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                  <span>Account Settings</span>
                </Link>

                <Link
                  href="/integrations/instagram"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                  <span>Instagram DM Setup</span>
                </Link>

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    setIsCommandPaletteOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Command className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                    <span>Command Menu</span>
                  </div>
                  <kbd className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">⌘K</kbd>
                </button>

                <a
                  href="https://github.com/Satin-Fi/reeldash"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                    <span>Documentation</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </a>

                <div className="border-t border-zinc-200/80 dark:border-white/[0.08] my-1" />

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium transition-colors cursor-pointer text-left"
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
