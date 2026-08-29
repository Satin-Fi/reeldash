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
  ExternalLink,
  Layers,
  Folder,
  Heart,
  Sparkles,
  Users,
  Compass,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function TopBar() {
  const { reels, favorites, setIsSaveModalOpen, setIsCommandPaletteOpen, theme, toggleTheme } = useReels();
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
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "J";

  // Contextual page identity for the Left Zone
  const getContextIdentity = () => {
    if (pathname === "/dashboard") return { title: "Visual Library", icon: Layers, count: reels.length };
    if (pathname.startsWith("/collections")) return { title: "Collections", icon: Folder };
    if (pathname.startsWith("/creator")) return { title: "Creator Studio", icon: Users };
    if (pathname.startsWith("/search")) return { title: "Discovery", icon: Compass };
    if (pathname.startsWith("/integrations")) return { title: "Instagram Sync", icon: MessageCircle };
    if (pathname.startsWith("/settings")) return { title: "Settings", icon: Settings };
    if (pathname.startsWith("/favorites")) return { title: "Favorites", icon: Heart, count: favorites.length };
    return { title: "Visual Library", icon: Layers, count: reels.length };
  };

  const identity = getContextIdentity();
  const IdentityIcon = identity.icon;

  return (
    <header className="h-[64px] min-h-[64px] w-full sticky top-0 z-30 bg-[#0B0D10] border-b border-white/[0.06] px-6 flex items-center justify-between select-none transition-colors duration-150">
      
      {/* ─── 1. LEFT ZONE: Workspace / Page Identity ────────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Identity Icon */}
        <IdentityIcon
          className="w-[18px] h-[18px] text-[#A7A9B5] shrink-0"
          strokeWidth={1.7}
        />

        {/* Identity Title */}
        <span className="text-[14px] font-semibold leading-[20px] tracking-[-0.01em] text-[#E7E8EC]">
          {identity.title}
        </span>

        {/* Tiny Muted Count Capsule */}
        {identity.count !== undefined && (
          <span className="inline-flex items-center justify-center h-[20px] min-w-[20px] px-[6px] rounded-[6px] text-[11px] font-semibold bg-white/[0.06] text-[#9296A5]">
            {identity.count}
          </span>
        )}
      </div>

      {/* ─── 2. CENTER ZONE: Command Center Search ────────────────── */}
      <div className="flex-1 flex justify-center px-4 max-w-2xl">
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="group w-full max-w-[420px] h-[38px] px-3 bg-[#111419] hover:bg-[#13161B] border border-white/[0.07] hover:border-white/[0.12] focus:border-[#635BFF]/55 focus:ring-4 focus:ring-[#635BFF]/10 rounded-[10px] flex items-center justify-between transition-all duration-150 cursor-pointer text-left"
          title="Search reels, creators, or command shortcuts (⌘K)"
        >
          {/* Left: Icon + Subtle Placeholder */}
          <div className="flex items-center gap-2.5 truncate">
            <Search
              className="w-[17px] h-[17px] text-[#777C89] group-hover:text-[#A0A5B2] transition-colors shrink-0"
              strokeWidth={1.8}
            />
            <span className="text-[14px] font-normal text-[#747987] group-hover:text-[#A0A5B2] transition-colors truncate">
              Search or jump to…
            </span>
          </div>

          {/* Right: Keyboard Shortcut Key */}
          <div className="hidden sm:inline-flex items-center justify-center h-[24px] px-[6px] min-w-[32px] rounded-[6px] bg-white/[0.05] border border-white/[0.08] text-[11px] font-semibold text-[#8E93A2] tracking-wide shrink-0">
            ⌘ K
          </div>
        </button>
      </div>

      {/* ─── 3. RIGHT ZONE: Action Controls ───────────────────────── */}
      <div className="flex items-center shrink-0">
        {/* DM Sync (Secondary Status/Product Action) */}
        <Link
          href="/integrations/instagram"
          className="hidden md:inline-flex items-center gap-2 text-[13px] font-medium text-[#AEB2BF] hover:text-white transition-colors duration-150 mr-[20px]"
          title="Instagram Direct Message Sync"
        >
          <MessageCircle className="w-[16px] h-[16px] text-[#AEB2BF]" strokeWidth={1.8} />
          <span>DM Sync</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
        </Link>

        {/* Primary CTA: + Save Reel */}
        <button
          onClick={() => setIsSaveModalOpen(true)}
          className="h-[38px] px-[15px] rounded-[9px] bg-[#5B52E8] hover:bg-[#665DF2] hover:-translate-y-[1px] hover:shadow-[0_4px_14px_rgba(91,82,232,0.22)] active:translate-y-0 active:scale-[0.98] text-[14px] font-semibold text-white flex items-center gap-1.5 transition-all duration-150 ease-out cursor-pointer mr-[16px]"
        >
          <Plus className="w-[16px] h-[16px]" strokeWidth={2.2} />
          <span>Save Reel</span>
        </button>

        {/* Theme Toggle (36px x 36px) */}
        <button
          onClick={toggleTheme}
          className="w-[36px] h-[36px] rounded-[8px] bg-transparent hover:bg-white/[0.06] flex items-center justify-center text-[#A8ACB8] hover:text-white transition-all duration-150 cursor-pointer mr-[10px]"
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="w-[18px] h-[18px]" strokeWidth={1.8} />
          ) : (
            <Moon className="w-[18px] h-[18px]" strokeWidth={1.8} />
          )}
        </button>

        {/* User Avatar (34px x 34px) */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="w-[34px] h-[34px] rounded-full aspect-square bg-gradient-to-tr from-[#5B52E8] to-[#7B73F6] border border-white/10 flex items-center justify-center text-[13px] font-semibold text-white hover:scale-[1.03] transition-transform duration-150 cursor-pointer select-none"
            aria-expanded={profileOpen}
            aria-label="User profile menu"
          >
            {userInitial}
          </button>

          {/* Profile Dropdown Menu */}
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 4 }}
                transition={{ duration: 0.12, ease: "easeOut" }}
                className="absolute right-0 mt-2 w-56 bg-[#111419] border border-white/[0.08] rounded-[10px] shadow-2xl shadow-black/80 p-1.5 z-50 text-xs text-[#E7E8EC] space-y-0.5"
              >
                {/* User Header */}
                <div className="px-3 py-2 rounded-[8px] bg-white/[0.03] border border-white/[0.04] mb-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white truncate">{user?.name || "User"}</p>
                    <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-[#5B52E8]/20 text-[#8E87F6] border border-[#5B52E8]/30">
                      Pro
                    </span>
                  </div>
                  <p className="text-[11px] text-[#747987] truncate mt-0.5">
                    {user?.email || "user@reeldash.app"}
                  </p>
                </div>

                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-[6px] hover:bg-white/[0.06] text-[#AEB2BF] hover:text-white transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-[#777C89]" />
                  <span>Account Settings</span>
                </Link>

                <Link
                  href="/integrations/instagram"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-[6px] hover:bg-white/[0.06] text-[#AEB2BF] hover:text-white transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#777C89]" />
                  <span>Instagram DM Setup</span>
                </Link>

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    setIsCommandPaletteOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-[6px] hover:bg-white/[0.06] text-[#AEB2BF] hover:text-white transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Command className="w-3.5 h-3.5 text-[#777C89]" />
                    <span>Command Menu</span>
                  </div>
                  <kbd className="text-[10px] text-[#777C89] font-mono">⌘K</kbd>
                </button>

                <a
                  href="https://github.com/Satin-Fi/reeldash"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between px-2.5 py-2 rounded-[6px] hover:bg-white/[0.06] text-[#AEB2BF] hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="w-3.5 h-3.5 text-[#777C89]" />
                    <span>Documentation</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-[#777C89]" />
                </a>

                <div className="border-t border-white/[0.06] my-1" />

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[6px] hover:bg-rose-500/10 text-rose-400 font-medium transition-colors cursor-pointer text-left"
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
