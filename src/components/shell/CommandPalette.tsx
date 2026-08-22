"use client";

import React, { useEffect, useState } from "react";
import { useReels } from "@/context/ReelContext";
import { Search, PlusCircle, Heart, FolderPlus, LayoutDashboard, Settings, Film } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function CommandPalette() {
  const { isCommandPaletteOpen, setIsCommandPaletteOpen, setIsSaveModalOpen, setIsCreateCollectionModalOpen, setSearchQuery } = useReels();
  const [query, setQuery] = useState("");
  const router = useRouter();

  // Listen for Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen(!isCommandPaletteOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const commands = [
    {
      id: "save-reel",
      label: "Save Reel",
      icon: PlusCircle,
      action: () => {
        setIsCommandPaletteOpen(false);
        setIsSaveModalOpen(true);
      },
    },
    {
      id: "all-reels",
      label: "All Reels",
      icon: Film,
      action: () => {
        setIsCommandPaletteOpen(false);
        router.push("/reels");
      },
    },
    {
      id: "favorites",
      label: "Open Favorites",
      icon: Heart,
      action: () => {
        setIsCommandPaletteOpen(false);
        router.push("/favorites");
      },
    },
    {
      id: "create-collection",
      label: "Create Collection",
      icon: FolderPlus,
      action: () => {
        setIsCommandPaletteOpen(false);
        setIsCreateCollectionModalOpen(true);
      },
    },
    {
      id: "dashboard",
      label: "Go to Dashboard Overview",
      icon: LayoutDashboard,
      action: () => {
        setIsCommandPaletteOpen(false);
        router.push("/dashboard");
      },
    },
    {
      id: "settings",
      label: "Open Settings",
      icon: Settings,
      action: () => {
        setIsCommandPaletteOpen(false);
        router.push("/settings");
      },
    },
  ];

  const filteredCommands = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsCommandPaletteOpen(false)}
          className="absolute inset-0 bg-black/40 backdrop-blur-xs"
        />

        {/* Palette Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-lg bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg shadow-rd-modal overflow-hidden text-primaryText-light dark:text-primaryText-dark"
        >
          <div className="flex items-center px-4 py-3 border-b border-borderSubtle-light dark:border-borderSubtle-dark">
            <Search className="w-4 h-4 text-mutedText-light dark:text-mutedText-dark mr-3" />
            <input
              type="text"
              placeholder="Search Reels, collections, commands..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchQuery(e.target.value);
              }}
              autoFocus
              className="w-full bg-transparent text-sm text-primaryText-light dark:text-primaryText-dark focus:outline-none placeholder:text-mutedText-light dark:placeholder:text-mutedText-dark"
            />
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-mutedText-light dark:text-mutedText-dark bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-sm">
              ESC
            </kbd>
          </div>

          <div className="p-2 max-h-72 overflow-y-auto space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-mutedText-light dark:text-mutedText-dark uppercase">
              Commands
            </div>
            {filteredCommands.length > 0 ? (
              filteredCommands.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-rd-md text-xs font-medium hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark transition-colors cursor-pointer text-left"
                  >
                    <Icon className="w-4 h-4 text-secondaryText-light dark:text-secondaryText-dark" />
                    <span>{cmd.label}</span>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-secondaryText-light dark:text-secondaryText-dark">
                No commands found. Press Enter to search library for &ldquo;{query}&rdquo;.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
