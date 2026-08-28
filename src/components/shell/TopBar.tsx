"use client";

import React, { useState, useEffect, useRef } from "react";
import { useReels } from "@/context/ReelContext";
import { useAuth } from "@/context/AuthContext";
import { Search, Plus, Sun, Moon, Settings, LogOut, MessageCircle, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export function TopBar() {
  const { setIsSaveModalOpen, setIsCommandPaletteOpen, theme, toggleTheme } = useReels();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <header className="h-16 sticky top-0 z-30 bg-surface-light/85 dark:bg-surface-dark/85 backdrop-blur-md border-b border-borderSubtle-light dark:border-borderSubtle-dark px-4 md:px-8 flex items-center justify-between transition-colors duration-200">
      
      {/* Global Search Bar */}
      <div className="flex-1 max-w-md mr-4">
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md text-xs text-secondaryText-light dark:text-secondaryText-dark hover:border-brand-500/40 hover:text-primaryText-light dark:hover:text-primaryText-dark transition-all cursor-pointer shadow-rd-subtle"
        >
          <div className="flex items-center space-x-2.5">
            <Search className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Search Reels, creators, tags...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-secondaryText-light dark:text-secondaryText-dark bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-sm">
            ⌘ K
          </kbd>
        </button>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center space-x-2.5">
        
        {/* DM Ingest Link Button */}
        <Link
          href="/integrations/instagram"
          className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark hover:bg-brand-500/10 text-secondaryText-light dark:text-secondaryText-dark hover:text-brand-600 dark:hover:text-brand-400 border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md text-xs font-medium transition-all"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>DM Sync</span>
        </Link>

        {/* Primary "+ Save Reel" Action */}
        <button
          onClick={() => setIsSaveModalOpen(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white rounded-rd-md text-xs font-semibold shadow-rd-glow transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span>Save Reel</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark hover:text-primaryText-light dark:hover:text-primaryText-dark rounded-rd-md transition-colors cursor-pointer"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-secondaryText-light" />
          )}
        </button>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="w-8 h-8 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-600 dark:text-brand-400 font-bold text-xs flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
          >
            {userInitial}
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg shadow-rd-modal p-1.5 z-50 text-xs text-primaryText-light dark:text-primaryText-dark space-y-1"
              >
                <div className="px-3 py-2 border-b border-borderSubtle-light dark:border-borderSubtle-dark">
                  <p className="font-semibold truncate">{user?.name || "User"}</p>
                  <p className="text-[11px] text-secondaryText-light dark:text-secondaryText-dark truncate">
                    {user?.email || "user@reeldash.app"}
                  </p>
                </div>

                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-rd-sm hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Account Settings</span>
                </Link>

                <Link
                  href="/integrations/instagram"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-rd-sm hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-brand-500" />
                  <span>Instagram DM Setup</span>
                </Link>

                <a
                  href="https://github.com/Satin-Fi/reeldash"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-2 px-3 py-2 rounded-rd-sm hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Help & Documentation</span>
                </a>

                <div className="border-t border-borderSubtle-light dark:border-borderSubtle-dark my-1" />

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-rd-sm hover:bg-rose-500/10 text-rose-500 font-medium transition-colors cursor-pointer text-left"
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
