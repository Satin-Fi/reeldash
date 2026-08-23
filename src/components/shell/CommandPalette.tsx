"use client";

import React, { useEffect, useState } from "react";
import { useReels } from "@/context/ReelContext";
import {
  Search,
  PlusCircle,
  Heart,
  FolderPlus,
  LayoutDashboard,
  Settings,
  Film,
  Instagram,
  ExternalLink,
  Filter,
  BadgeCheck,
  Loader2,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface AccountResult {
  username: string;
  displayName: string;
  profileUrl: string;
  avatarUrl: string;
  followers?: string | null;
  postsCount?: string | null;
  bio?: string;
  isVerified?: boolean;
}

export function CommandPalette() {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    setIsSaveModalOpen,
    setIsCreateCollectionModalOpen,
    setSearchQuery,
    reels,
  } = useReels();

  const [query, setQuery] = useState("");
  const [searchedAccount, setSearchedAccount] = useState<AccountResult | null>(null);
  const [isSearchingAccount, setIsSearchingAccount] = useState(false);
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

  // Debounced Instagram account search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setSearchedAccount(null);
      setIsSearchingAccount(false);
      return;
    }

    const cleanUsername = trimmed.replace(/^@/, "").split("/")[0].trim();
    if (!cleanUsername || cleanUsername.length < 2) {
      setSearchedAccount(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingAccount(true);
      try {
        const res = await fetch(`/api/instagram/search-account?query=${encodeURIComponent(cleanUsername)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.account) {
            setSearchedAccount(data.account);
          }
        }
      } catch {
        // Silently catch
      } finally {
        setIsSearchingAccount(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

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
      id: "search-page",
      label: "Open Full Search & Discovery",
      icon: Search,
      action: () => {
        setIsCommandPaletteOpen(false);
        router.push("/search");
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

  // Find saved creators matching query from local Reels
  const matchingCreators = Array.from(
    new Set(
      reels
        .filter((r) => r.creatorUsername.toLowerCase().includes(query.toLowerCase().replace(/^@/, "")))
        .map((r) => r.creatorUsername)
    )
  ).slice(0, 3);

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
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Palette Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-xl bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg shadow-rd-modal overflow-hidden text-primaryText-light dark:text-primaryText-dark"
        >
          <div className="flex items-center px-4 py-3.5 border-b border-borderSubtle-light dark:border-borderSubtle-dark">
            <Search className="w-4 h-4 text-mutedText-light dark:text-mutedText-dark mr-3 shrink-0" />
            <input
              type="text"
              placeholder="Search Reels, commands, or any Instagram account (@username)..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchQuery(e.target.value);
              }}
              autoFocus
              className="w-full bg-transparent text-sm text-primaryText-light dark:text-primaryText-dark focus:outline-none placeholder:text-mutedText-light dark:placeholder:text-mutedText-dark"
            />
            {isSearchingAccount && (
              <Loader2 className="w-4 h-4 animate-spin text-brand-500 mr-2 shrink-0" />
            )}
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-mutedText-light dark:text-mutedText-dark bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-sm shrink-0">
              ESC
            </kbd>
          </div>

          <div className="p-2 max-h-80 overflow-y-auto space-y-3 custom-scrollbar">
            {/* 1. INSTAGRAM ACCOUNT DISCOVERY RESULT */}
            {query.trim().length >= 2 && (
              <div>
                <div className="px-3 py-1 text-[11px] font-semibold tracking-wider text-mutedText-light dark:text-mutedText-dark uppercase flex items-center space-x-1.5">
                  <Instagram className="w-3 h-3 text-pink-500" />
                  <span>Instagram Account Search</span>
                </div>

                {searchedAccount ? (
                  <div className="p-3 mx-1 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark rounded-rd-md border border-borderSubtle-light dark:border-borderSubtle-dark space-y-2.5 mt-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0">
                        {/* Avatar */}
                        <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={searchedAccount.avatarUrl}
                            alt={searchedAccount.username}
                            className="w-9 h-9 rounded-full object-cover bg-zinc-800"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center space-x-1">
                            <span className="text-xs font-bold text-primaryText-light dark:text-primaryText-dark truncate">
                              @{searchedAccount.username}
                            </span>
                            <BadgeCheck className="w-3.5 h-3.5 fill-[#0095F6] text-white shrink-0" />
                          </div>
                          <p className="text-[11px] text-secondaryText-light dark:text-secondaryText-dark truncate">
                            {searchedAccount.displayName}
                            {searchedAccount.followers && ` • ${searchedAccount.followers} followers`}
                          </p>
                        </div>
                      </div>

                      {/* In-App ReelDash Profile Link */}
                      <button
                        onClick={() => {
                          setIsCommandPaletteOpen(false);
                          router.push(`/creator/${searchedAccount.username}`);
                        }}
                        className="px-2.5 py-1 bg-brand-500 hover:bg-brand-600 text-white rounded text-xs font-medium flex items-center space-x-1 transition-colors shrink-0 cursor-pointer"
                      >
                        <span>View on ReelDash</span>
                      </button>
                    </div>

                    {/* Quick Filters & Actions */}
                    <div className="flex items-center space-x-2 pt-1 border-t border-borderSubtle-light dark:border-borderSubtle-dark">
                      <button
                        onClick={() => {
                          setIsCommandPaletteOpen(false);
                          router.push(`/creator/${searchedAccount.username}`);
                        }}
                        className="text-[11px] text-brand-500 hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <Film className="w-3 h-3" />
                        <span>Open @{searchedAccount.username}&apos;s profile on ReelDash</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <a
                    href={`https://instagram.com/${query.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-rd-md text-xs font-medium hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark transition-colors cursor-pointer text-left mt-1"
                  >
                    <div className="flex items-center space-x-2.5">
                      <User className="w-4 h-4 text-pink-500" />
                      <span>Search <strong>@{query.replace(/^@/, "")}</strong> on Instagram</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-mutedText-light" />
                  </a>
                )}
              </div>
            )}

            {/* 2. LOCAL CREATORS IN LIBRARY */}
            {matchingCreators.length > 0 && (
              <div>
                <div className="px-3 py-1 text-[11px] font-semibold tracking-wider text-mutedText-light dark:text-mutedText-dark uppercase">
                  Creators in Library
                </div>
                {matchingCreators.map((creator) => (
                  <button
                    key={creator}
                    onClick={() => {
                      setSearchQuery(creator);
                      setIsCommandPaletteOpen(false);
                      router.push(`/search?q=${encodeURIComponent(creator)}`);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-rd-md text-xs font-medium hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Film className="w-3.5 h-3.5 text-brand-500" />
                      <span>Saved Reels by <strong>@{creator}</strong></span>
                    </div>
                    <span className="text-[10px] text-mutedText-light">
                      {reels.filter((r) => r.creatorUsername.toLowerCase() === creator.toLowerCase()).length} reels
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* 3. COMMANDS */}
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold tracking-wider text-mutedText-light dark:text-mutedText-dark uppercase">
                Quick Navigation
              </div>
              {filteredCommands.length > 0 ? (
                filteredCommands.map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-rd-md text-xs font-medium hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark transition-colors cursor-pointer text-left"
                    >
                      <Icon className="w-4 h-4 text-secondaryText-light dark:text-secondaryText-dark" />
                      <span>{cmd.label}</span>
                    </button>
                  );
                })
              ) : (
                <p className="px-3 py-2 text-xs text-mutedText-light dark:text-mutedText-dark">
                  Press Enter to search library for &quot;{query}&quot;
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
