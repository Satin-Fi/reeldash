"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useReels } from "@/context/ReelContext";
import {
  Search,
  Film,
  Folder,
  Plus,
  Moon,
  Sun,
  User,
  Heart,
  Music2,
  Command,
  X,
  ArrowRight,
} from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { reels, setIsSaveModalOpen, showToast } = useReels();

  // Keyboard shortcut listener (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!open) return null;

  const filteredReels = query
    ? reels.filter(
        (r) =>
          r.caption.toLowerCase().includes(query.toLowerCase()) ||
          r.creatorUsername.toLowerCase().includes(query.toLowerCase()) ||
          r.category.toLowerCase().includes(query.toLowerCase())
      )
    : reels.slice(0, 4);

  const actions = [
    {
      title: "Save Instagram Link",
      subtitle: "Ingest any Reel, Post, Carousel, Audio, or Story",
      icon: <Plus className="w-4 h-4 text-[#5B52E8]" />,
      run: () => {
        setOpen(false);
        setIsSaveModalOpen(true);
      },
    },
    {
      title: "Search Library & Creators",
      subtitle: "Find saved reels, captions, notes, and profiles",
      icon: <Search className="w-4 h-4 text-[#8E93A2]" />,
      run: () => {
        setOpen(false);
        router.push("/search");
      },
    },
    {
      title: "Collections",
      subtitle: "Organized workspaces and reference sets",
      icon: <Folder className="w-4 h-4 text-[#8E93A2]" />,
      run: () => {
        setOpen(false);
        router.push("/collections");
      },
    },
    {
      title: "Favorites",
      subtitle: "Quickly access bookmarked items",
      icon: <Heart className="w-4 h-4 text-[#8E93A2]" />,
      run: () => {
        setOpen(false);
        router.push("/favorites");
      },
    },
    {
      title: "Songs & Audio",
      subtitle: "Browse saved Instagram audio tracks",
      icon: <Music2 className="w-4 h-4 text-[#8E93A2]" />,
      run: () => {
        setOpen(false);
        router.push("/reels?type=audio");
      },
    },
  ];

  return (
    <div
      onClick={() => setOpen(false)}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#12131a] border border-zinc-200/80 dark:border-white/[0.12] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-zinc-200/60 dark:border-white/[0.08]">
          <Search className="w-4 h-4 text-zinc-400 mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, creator (@username), or search reels…"
            className="w-full bg-transparent text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none"
          />
          <div className="flex items-center space-x-1.5 ml-2">
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 dark:bg-white/[0.08] text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/[0.1]">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results Container */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {/* Quick Actions */}
          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Quick Actions
          </div>
          {actions.map((act, i) => (
            <div
              key={i}
              onClick={act.run}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-white/[0.05] flex items-center justify-center">
                  {act.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                    {act.title}
                  </p>
                  <p className="text-[10px] text-zinc-400">{act.subtitle}</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}

          {/* Matching Reels */}
          {filteredReels.length > 0 && (
            <>
              <div className="px-2 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Your Reels ({filteredReels.length})
              </div>
              {filteredReels.map((r) => (
                <div
                  key={r.id}
                  onClick={() => {
                    setOpen(false);
                    router.push(`/reel/${r.id}`);
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center space-x-3 truncate">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.thumbnailUrl}
                      alt={r.caption}
                      className="w-8 h-8 rounded-lg object-cover shrink-0"
                    />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                        {r.caption || `Reel by @${r.creatorUsername}`}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        @{r.creatorUsername} • {r.category}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-brand-500 font-semibold shrink-0 ml-2">
                    Open
                  </span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-zinc-50 dark:bg-white/[0.02] border-t border-zinc-200/60 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center space-x-2">
            <span>Navigate with</span>
            <kbd className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-white/[0.08] text-[9px]">↑↓</kbd>
            <span>Select with</span>
            <kbd className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-white/[0.08] text-[9px]">↵</kbd>
          </div>
          <span className="text-brand-500 font-medium">ReelDash Pro</span>
        </div>
      </div>
    </div>
  );
}
