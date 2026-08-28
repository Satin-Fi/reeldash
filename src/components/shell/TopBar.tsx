"use client";

import React, { useState, useEffect, useRef } from "react";
import { useReels } from "@/context/ReelContext";
import { useAuth } from "@/context/AuthContext";
import { Search, Plus, Bell, Sun, Moon, Settings, LogOut, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const dropdownVariants = {
  hidden: { opacity: 0, scale: 0.96, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.18, ease: [0.32, 0.72, 0, 1] } },
  exit:    { opacity: 0, scale: 0.96, y: -4, transition: { duration: 0.14 } },
};

export function TopBar() {
  const { setIsSaveModalOpen, setIsCommandPaletteOpen, theme, toggleTheme } = useReels();
  const { user, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "RD";

  return (
    <header className="h-14 sticky top-0 z-30 bg-surface-dark/90 backdrop-blur-md border-b border-borderSubtle-dark px-4 flex items-center justify-between shrink-0">

      {/* Search trigger */}
      <button
        onClick={() => setIsCommandPaletteOpen(true)}
        className="flex items-center gap-2.5 px-3 py-2 bg-surfaceSecondary-dark border border-borderSubtle-dark hover:border-borderDefault-dark rounded-rd-lg text-[13px] text-mutedText-dark hover:text-secondaryText-dark transition-all duration-200 cursor-pointer max-w-64 w-full"
      >
        <Search className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
        <span className="flex-1 text-left text-[12px]">Search your Reels...</span>
        <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-surfaceTertiary-dark border border-borderSubtle-dark rounded text-mutedText-dark">
          ⌘K
        </kbd>
      </button>

      {/* Right controls */}
      <div className="flex items-center gap-2 ml-4">

        {/* Save Reel CTA */}
        <button
          onClick={() => setIsSaveModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-brand-500 hover:bg-brand-600 active:scale-[0.97] text-white text-[12px] font-semibold rounded-rd-lg transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer shadow-rd-glow"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span className="hidden sm:inline">Save Reel</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-rd-md text-mutedText-dark hover:text-secondaryText-dark hover:bg-surfaceSecondary-dark transition-all duration-200 cursor-pointer"
          title="Toggle theme"
        >
          {theme === "dark"
            ? <Sun className="w-4 h-4 text-amber-400" strokeWidth={1.75} />
            : <Moon className="w-4 h-4" strokeWidth={1.75} />
          }
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
            className="relative w-8 h-8 flex items-center justify-center rounded-rd-md text-mutedText-dark hover:text-secondaryText-dark hover:bg-surfaceSecondary-dark transition-all duration-200 cursor-pointer"
          >
            <Bell className="w-4 h-4" strokeWidth={1.75} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 ring-2 ring-surface-dark" />
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-0 top-full mt-2 w-72 bg-surface-dark border border-borderSubtle-dark rounded-rd-xl shadow-rd-dark p-1 z-50 origin-top-right"
              >
                <div className="px-3 py-2.5 flex items-center justify-between border-b border-borderSubtle-dark mb-1">
                  <span className="text-[12px] font-semibold text-primaryText-dark">Notifications</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-mono bg-brand-500 text-white rounded-full">2</span>
                </div>
                {[
                  { title: "Import completed", desc: "6 Reels indexed and organized.", time: "10m ago", dot: "bg-brand-400" },
                  { title: "AI categorization", desc: "2 new Reels added to Health & Fitness.", time: "1h ago", dot: "bg-emerald-400" },
                ].map((n, i) => (
                  <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-rd-md hover:bg-surfaceSecondary-dark transition-colors cursor-pointer">
                    <div className={`w-1.5 h-1.5 rounded-full ${n.dot} mt-1.5 shrink-0`} />
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-medium text-primaryText-dark">{n.title}</span>
                        <span className="text-[10px] text-mutedText-dark shrink-0">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-secondaryText-dark leading-snug">{n.desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
            className="w-8 h-8 rounded-full bg-brand-500/15 border border-brand-500/25 hover:border-brand-500/50 text-brand-400 font-bold text-[11px] flex items-center justify-center transition-all duration-200 cursor-pointer"
          >
            {initials}
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-0 top-full mt-2 w-52 bg-surface-dark border border-borderSubtle-dark rounded-rd-xl shadow-rd-dark p-1 z-50 origin-top-right"
              >
                <div className="px-3 py-2.5 border-b border-borderSubtle-dark mb-1">
                  <p className="text-[13px] font-semibold text-primaryText-dark leading-tight">{user?.name || "User"}</p>
                  <p className="text-[11px] text-mutedText-dark mt-0.5">{user?.plan || "Free plan"}</p>
                </div>

                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-rd-md text-[12px] text-secondaryText-dark hover:bg-surfaceSecondary-dark hover:text-primaryText-dark transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Settings
                </Link>
                <button
                  onClick={() => { setProfileOpen(false); setIsCommandPaletteOpen(true); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-rd-md text-[12px] text-secondaryText-dark hover:bg-surfaceSecondary-dark hover:text-primaryText-dark transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Keyboard shortcuts
                </button>

                <div className="h-px bg-borderSubtle-dark mx-1 my-1" />

                <button
                  onClick={() => { setProfileOpen(false); logout(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-rd-md text-[12px] text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Log out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
