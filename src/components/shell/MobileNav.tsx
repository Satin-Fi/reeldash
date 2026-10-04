"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useReels } from "@/context/ReelContext";
import {
  Home,
  Film,
  Plus,
  Heart,
  Menu,
  X,
  Layers,
  Image as ImageIcon,
  Music2,
  Folder,
  Trash2,
  Settings,
  CreditCard,
  Sun,
  Moon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ReelDashLogo } from "@/components/ui/ReelDashLogo";

export function MobileNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type");
  const {
    reels,
    favorites,
    recycleBin,
    setIsSaveModalOpen,
    setActiveMediaType,
    setActiveCategory,
    setActiveCollection,
    setSearchQuery,
    theme,
    toggleTheme,
  } = useReels();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Compute live counts
  const reelsCount = reels.filter((r) => (r.mediaType || "reel") === "reel").length;
  const postsCount = reels.filter((r) => r.mediaType === "post").length;
  const audioCount = reels.filter((r) => r.mediaType === "audio").length;
  const allCount = reels.length;
  const favsCount = favorites.length;
  const recycleCount = recycleBin.length;

  const isReelsActive =
    pathname === "/reels" && (currentType === "reel" || (!currentType && false));
  const isFavoritesActive = pathname === "/favorites";
  const isHomeActive = pathname === "/dashboard";

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      {/* ─── Bottom Navigation Bar for Mobile (<768px) ─── */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-[#0c0e14]/90 backdrop-blur-xl border-t border-black/[0.06] dark:border-white/[0.08] px-3 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom,0.6rem))] flex items-center justify-around text-xs shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        {/* 1. Home */}
        <Link
          href="/dashboard"
          onClick={() => {
            setActiveCategory(null);
            setActiveCollection(null);
            setActiveMediaType("all");
            setSearchQuery("");
            closeMenu();
          }}
          className={`flex flex-col items-center space-y-1 py-1 px-2.5 rounded-xl transition-all active:scale-95 ${
            isHomeActive
              ? "text-zinc-950 dark:text-white font-semibold"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          <Home className="w-5 h-5" strokeWidth={isHomeActive ? 2.5 : 2} />
          <span className="text-[10px] tracking-tight">Home</span>
        </Link>

        {/* 2. Reels */}
        <Link
          href="/reels?type=reel"
          onClick={() => {
            setActiveMediaType("reel");
            setActiveCategory(null);
            setActiveCollection(null);
            setSearchQuery("");
            closeMenu();
          }}
          className={`flex flex-col items-center space-y-1 py-1 px-2.5 rounded-xl transition-all active:scale-95 ${
            isReelsActive
              ? "text-zinc-950 dark:text-white font-semibold"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          <Film className="w-5 h-5" strokeWidth={isReelsActive ? 2.5 : 2} />
          <span className="text-[10px] tracking-tight">Reels</span>
        </Link>

        {/* 3. Center Prominent Save Button */}
        <button
          onClick={() => setIsSaveModalOpen(true)}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-md active:scale-90 transition-transform cursor-pointer -mt-5 shrink-0"
          title="Save Reel"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </button>

        {/* 4. Favorites */}
        <Link
          href="/favorites"
          onClick={() => {
            setActiveCategory(null);
            setActiveCollection(null);
            setSearchQuery("");
            closeMenu();
          }}
          className={`flex flex-col items-center space-y-1 py-1 px-2.5 rounded-xl transition-all active:scale-95 ${
            isFavoritesActive
              ? "text-rose-500 font-semibold"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          <Heart
            className={`w-5 h-5 ${isFavoritesActive ? "fill-rose-500 text-rose-500" : ""}`}
            strokeWidth={isFavoritesActive ? 2.5 : 2}
          />
          <span className="text-[10px] tracking-tight">Favorites</span>
        </Link>

        {/* 5. Mobile Drawer Trigger */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`flex flex-col items-center space-y-1 py-1 px-2.5 rounded-xl transition-all active:scale-95 ${
            isMenuOpen
              ? "text-zinc-950 dark:text-white font-semibold"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
          aria-label="Open library menu"
        >
          <Menu className="w-5 h-5" strokeWidth={isMenuOpen ? 2.5 : 2} />
          <span className="text-[10px] tracking-tight">Menu</span>
        </button>
      </div>

      {/* ─── Full Mobile Navigation Drawer (<768px) ─── */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMenu}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Slide-Up Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="absolute bottom-0 inset-x-0 max-h-[85vh] overflow-y-auto rounded-t-[32px] bg-[#FAFAF9] dark:bg-[#121316] border-t border-black/[0.08] dark:border-white/[0.08] p-5 pb-[max(1.5rem,env(safe-area-inset-bottom,1.5rem))] shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.06]">
                <ReelDashLogo />
                <button
                  type="button"
                  onClick={closeMenu}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Sections */}
              <div className="mt-4 space-y-1">
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Media Vault
                </p>

                <Link
                  href="/reels?type=all"
                  onClick={() => {
                    setActiveMediaType("all");
                    setActiveCategory(null);
                    setActiveCollection(null);
                    setSearchQuery("");
                    closeMenu();
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                    pathname === "/reels" && currentType === "all"
                      ? "bg-black/[0.06] dark:bg-white/[0.1] text-zinc-950 dark:text-white"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Layers className="w-4 h-4 text-zinc-500" />
                    <span>All Library</span>
                  </div>
                  <span className="text-xs text-zinc-400 font-mono">{allCount}</span>
                </Link>

                <Link
                  href="/reels?type=reel"
                  onClick={() => {
                    setActiveMediaType("reel");
                    setActiveCategory(null);
                    setActiveCollection(null);
                    setSearchQuery("");
                    closeMenu();
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                    pathname === "/reels" && currentType === "reel"
                      ? "bg-black/[0.06] dark:bg-white/[0.1] text-zinc-950 dark:text-white"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Film className="w-4 h-4 text-zinc-500" />
                    <span>Reels</span>
                  </div>
                  <span className="text-xs text-zinc-400 font-mono">{reelsCount}</span>
                </Link>

                <Link
                  href="/reels?type=post"
                  onClick={() => {
                    setActiveMediaType("post");
                    setActiveCategory(null);
                    setActiveCollection(null);
                    setSearchQuery("");
                    closeMenu();
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                    pathname === "/reels" && currentType === "post"
                      ? "bg-black/[0.06] dark:bg-white/[0.1] text-zinc-950 dark:text-white"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ImageIcon className="w-4 h-4 text-zinc-500" />
                    <span>Posts & Photos</span>
                  </div>
                  <span className="text-xs text-zinc-400 font-mono">{postsCount}</span>
                </Link>

                <Link
                  href="/reels?type=audio"
                  onClick={() => {
                    setActiveMediaType("audio");
                    setActiveCategory(null);
                    setActiveCollection(null);
                    setSearchQuery("");
                    closeMenu();
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                    pathname === "/reels" && currentType === "audio"
                      ? "bg-black/[0.06] dark:bg-white/[0.1] text-zinc-950 dark:text-white"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Music2 className="w-4 h-4 text-zinc-500" />
                    <span>Songs & Audio</span>
                  </div>
                  <span className="text-xs text-zinc-400 font-mono">{audioCount}</span>
                </Link>

                <Link
                  href="/favorites"
                  onClick={() => {
                    setActiveCategory(null);
                    setActiveCollection(null);
                    setSearchQuery("");
                    closeMenu();
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                    pathname === "/favorites"
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>Favorites</span>
                  </div>
                  <span className="text-xs text-zinc-400 font-mono">{favsCount}</span>
                </Link>

                <div className="my-2 h-px bg-black/[0.06] dark:bg-white/[0.06]" />

                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Organize & Manage
                </p>

                <Link
                  href="/categories"
                  onClick={closeMenu}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                    pathname === "/categories"
                      ? "bg-black/[0.06] dark:bg-white/[0.1] text-zinc-950 dark:text-white"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Folder className="w-4 h-4 text-zinc-500" />
                    <span>Categories</span>
                  </div>
                </Link>

                <Link
                  href="/collections"
                  onClick={closeMenu}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                    pathname === "/collections"
                      ? "bg-black/[0.06] dark:bg-white/[0.1] text-zinc-950 dark:text-white"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Folder className="w-4 h-4 text-zinc-500" />
                    <span>Collections</span>
                  </div>
                </Link>

                <Link
                  href="/recycle-bin"
                  onClick={closeMenu}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                    pathname === "/recycle-bin"
                      ? "bg-black/[0.06] dark:bg-white/[0.1] text-zinc-950 dark:text-white"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-4 h-4 text-zinc-500" />
                    <span>Recycle Bin</span>
                  </div>
                  {recycleCount > 0 && (
                    <span className="text-xs text-zinc-400 font-mono">{recycleCount}</span>
                  )}
                </Link>

                <div className="my-2 h-px bg-black/[0.06] dark:bg-white/[0.06]" />

                <div className="flex items-center justify-between pt-1 px-1">
                  <Link
                    href="/settings"
                    onClick={closeMenu}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                  >
                    <Settings className="w-4 h-4 text-zinc-500" />
                    <span>Settings</span>
                  </Link>

                  <Link
                    href="/pricing"
                    onClick={closeMenu}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                  >
                    <CreditCard className="w-4 h-4 text-zinc-500" />
                    <span>Plans</span>
                  </Link>

                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="w-4 h-4 text-amber-400" />
                        <span>Light</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-4 h-4 text-zinc-600" />
                        <span>Dark</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
