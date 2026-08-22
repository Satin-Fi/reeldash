"use client";

import React, { useState } from "react";
import { useReels } from "@/context/ReelContext";
import { Search, Plus, Bell, Sun, Moon, User, Check, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export function TopBar() {
  const {
    setIsSaveModalOpen,
    setIsCommandPaletteOpen,
    theme,
    toggleTheme,
  } = useReels();

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const notifications = [
    { id: "1", title: "Import completed", desc: "6 Reels indexed and organized.", time: "10m ago" },
    { id: "2", title: "AI categorization", desc: "Assigned 2 new Reels to Health & Fitness.", time: "1h ago" },
  ];

  return (
    <header className="h-16 sticky top-0 z-30 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-borderSubtle-light dark:border-borderSubtle-dark px-4 md:px-6 flex items-center justify-between">
      {/* Search Input Trigger */}
      <div className="flex-1 max-w-md mr-4">
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-background-light dark:bg-background-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md text-xs text-mutedText-light dark:text-mutedText-dark hover:border-brand-500/40 transition-all cursor-pointer shadow-rd-subtle"
        >
          <div className="flex items-center space-x-2.5">
            <Search className="w-4 h-4 text-secondaryText-light dark:text-secondaryText-dark" />
            <span>Search your Reels...</span>
          </div>
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-secondaryText-light dark:text-secondaryText-dark bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-sm">
            ⌘ K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* + Save Reel Primary CTA */}
        <button
          onClick={() => setIsSaveModalOpen(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white rounded-rd-md text-xs font-semibold shadow-rd-subtle transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Save Reel</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark rounded-rd-md transition-colors cursor-pointer"
          title="Toggle Dark / Light Mode"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="relative p-2 text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark rounded-rd-md transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500" />
          </button>

          <AnimatePresence>
            {isNotificationOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                className="absolute right-0 mt-2 w-72 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md shadow-rd-modal p-3 z-40 text-xs text-primaryText-light dark:text-primaryText-dark"
              >
                <div className="flex items-center justify-between border-b border-borderSubtle-light dark:border-borderSubtle-dark pb-2 mb-2">
                  <span className="font-semibold text-xs">Notifications</span>
                  <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                </div>
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-2 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark rounded-rd-sm space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs">{n.title}</span>
                        <span className="text-[10px] text-mutedText-light dark:text-mutedText-dark">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-secondaryText-light dark:text-secondaryText-dark leading-snug">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Avatar Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-500 font-bold text-xs flex items-center justify-center cursor-pointer border border-brand-500/30"
          >
            PK
          </button>

          <AnimatePresence>
            {isProfileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                className="absolute right-0 mt-2 w-52 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md shadow-rd-modal p-1.5 z-40 text-xs text-primaryText-light dark:text-primaryText-dark space-y-1"
              >
                <div className="px-3 py-2 border-b border-borderSubtle-light dark:border-borderSubtle-dark">
                  <p className="font-semibold">Piyush Kumar</p>
                  <p className="text-[11px] text-secondaryText-light dark:text-secondaryText-dark">Free Plan</p>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="block px-3 py-1.5 rounded-rd-sm hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark transition-colors"
                >
                  Account Settings
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="block px-3 py-1.5 rounded-rd-sm hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark transition-colors"
                >
                  Billing & Usage
                </Link>
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setIsCommandPaletteOpen(true);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-rd-sm hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark transition-colors"
                >
                  Keyboard Shortcuts
                </button>
                <div className="border-t border-borderSubtle-light dark:border-borderSubtle-dark my-1" />
                <button
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="w-full text-left px-3 py-1.5 rounded-rd-sm hover:bg-rose-500/10 text-rose-500 font-medium transition-colors"
                >
                  Log Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
