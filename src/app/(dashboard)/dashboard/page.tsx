'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Search,
  Command,
  Play,
  ArrowRight,
  Bookmark,
  Users,
  Folder,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useReels } from '@/context/ReelContext';
import { Reel } from '@/types/reel';
import { ReelPlayerModal } from '@/components/reels/ReelPlayerModal';
import {
  OrbitalReelMemoryHub,
  StackedHighlightsCard,
} from '@/components/dashboard/DashboardShowcaseCards';
import { ReelMemoryModal } from '@/components/dashboard/ReelMemoryModal';

/* ─── Helpers ─── */
function getMediaUrl(reel: any): string {
  if (!reel) return '';
  return (
    reel.thumbnailUrl ||
    reel.thumbnail ||
    reel.coverUrl ||
    reel.imageUrl ||
    reel.displayUrl ||
    ''
  );
}

function getCreator(reel: any): string {
  if (!reel) return 'instagram';
  return (
    reel.creatorUsername ||
    reel.creatorFullName ||
    (typeof reel.creator === 'string' ? reel.creator : reel.creator?.username) ||
    'instagram'
  );
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'recently';
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return 'recently';
}

function normalizeInstagramUrl(value: string): string | null {
  try {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const url = new URL(
      /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
    );
    const hostname = url.hostname.toLowerCase();
    const isInstagram =
      hostname === 'instagram.com' ||
      hostname === 'www.instagram.com' ||
      hostname === 'm.instagram.com' ||
      hostname === 'instagr.am';
    if (!isInstagram) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    reels,
    saveReel,
    smartCategories,
    setActiveCategory,
  } = useReels();

  // State
  const [activePlayerReel, setActivePlayerReel] = useState<Reel | null>(null);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);

  // Dynamic greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const userName = useMemo(() => {
    if (user?.name) {
      return user.name.split(' ')[0];
    }
    return 'Piyush';
  }, [user]);

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsMemoryOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsMemoryOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Unique creators
  const creators = useMemo(() => {
    const set = new Set<string>();
    reels.forEach((r) => {
      const c = getCreator(r);
      if (c && c !== 'instagram') set.add(c);
    });
    return Array.from(set);
  }, [reels]);

  // Recent saves (first 8)
  const recentSaves = useMemo(() => {
    return [...reels]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [reels]);

  return (
    <div className="w-full pb-16 pt-2">
      {/* ─── 1. Minimal Header ─── */}
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
          {greeting}, {userName}
        </h1>
      </header>

      {/* ─── 2. Reel Memory Command Bar ─── */}
      <section className="mb-8" aria-label="Reel Memory Search">
        <button
          type="button"
          onClick={() => setIsMemoryOpen(true)}
          className="group relative flex h-13 w-full max-w-2xl items-center justify-between rounded-full border border-purple-200/80 bg-white/80 px-5 py-2 shadow-[0_4px_20px_-4px_rgba(203,181,253,0.35)] backdrop-blur-md transition-all duration-300 hover:border-purple-300 hover:shadow-[0_8px_30px_-6px_rgba(203,181,253,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 dark:border-purple-900/40 dark:bg-[#16181D]/80 dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] dark:hover:border-purple-700/60"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex size-7 items-center justify-center rounded-full bg-[#EDE9FE] text-[#7C3AED] dark:bg-[#7C3AED]/20 dark:text-[#C4B5FD]">
              <Sparkles className="size-3.5" />
            </span>
            <span className="truncate text-sm text-zinc-500 transition-colors group-hover:text-zinc-800 dark:text-zinc-400 dark:group-hover:text-zinc-200">
              Ask your Reel memory or paste link…
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-purple-200/60 bg-purple-50/60 px-2 py-0.5 text-[10px] font-mono font-medium text-purple-700 dark:border-purple-800/40 dark:bg-purple-950/40 dark:text-purple-300">
              <Command className="size-3" /> K
            </span>
            <span className="rounded-full bg-purple-500/10 p-1.5 text-purple-600 dark:text-purple-400">
              <Search className="size-3.5" />
            </span>
          </div>
        </button>
      </section>

      {/* ─── 3. Visual Showcase (Reference Images 2 & 3) ─── */}
      <section className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-12" aria-label="Reel Memory Showcase">
        <div className="lg:col-span-7">
          <OrbitalReelMemoryHub onLaunchMemory={() => setIsMemoryOpen(true)} />
        </div>
        <div className="lg:col-span-5">
          <StackedHighlightsCard
            categories={smartCategories}
            onCategoryClick={(categoryTitle) => {
              setActiveCategory(categoryTitle);
              router.push(`/reels?category=${encodeURIComponent(categoryTitle)}`);
            }}
          />
        </div>
      </section>

      {/* ─── 4. Recent Saves Carousel ─── */}
      <section className="mb-10" aria-labelledby="recent-saves-title">
        <div className="mb-3.5 flex items-center justify-between">
          <h2
            id="recent-saves-title"
            className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400"
          >
            Recent Saves
          </h2>
          <Link
            href="/reels"
            className="group flex items-center gap-1 text-xs font-medium text-purple-600 transition-colors hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
          >
            <span>View all</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {recentSaves.length > 0 ? (
          <div className="no-scrollbar -mx-4 flex gap-3.5 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
            {recentSaves.map((reel) => {
              const thumb = getMediaUrl(reel);
              const creator = getCreator(reel);
              return (
                <div
                  key={reel.id}
                  onClick={() => setActivePlayerReel(reel)}
                  className="group relative aspect-[9/16] w-[136px] shrink-0 cursor-pointer overflow-hidden rounded-2xl bg-zinc-900 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:w-[152px]"
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={reel.caption || `Reel by @${creator}`}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-zinc-800 text-zinc-500">
                      <Play className="size-8 opacity-40" />
                    </div>
                  )}

                  {/* Top vignette */}
                  <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/50 to-transparent" />

                  {/* Bottom Vignette with Creator */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 pt-6 text-white">
                    <p className="truncate text-xs font-semibold drop-shadow-sm">
                      @{creator}
                    </p>
                    {reel.category && (
                      <span className="mt-0.5 inline-block truncate text-[10px] text-zinc-300">
                        {reel.category}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
            <p className="text-xs text-zinc-400">No saved reels yet.</p>
          </div>
        )}
      </section>

      {/* ─── 5. Library Vault Metrics ─── */}
      <section className="mb-10" aria-labelledby="library-stats-title">
        <div className="mb-3.5 flex items-center justify-between">
          <h2
            id="library-stats-title"
            className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white"
          >
            Library Vault
          </h2>
          <Link
            href="/reels"
            className="text-xs font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400"
          >
            Open Library
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            href="/reels?type=all"
            className="group relative overflow-hidden rounded-2xl border border-purple-200/60 bg-gradient-to-br from-[#FAF5FF] to-white p-5 shadow-sm transition-all duration-300 hover:border-purple-300 hover:shadow-md dark:border-purple-900/30 dark:from-[#1E1129]/40 dark:to-[#121319]"
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
                {reels.length}
              </span>
              <span className="flex size-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 shadow-sm dark:bg-purple-950/70 dark:text-purple-300">
                <Bookmark className="size-4" />
              </span>
            </div>
            <p className="mt-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Saved Reels & Posts
            </p>
          </Link>

          <Link
            href="/reels"
            className="group relative overflow-hidden rounded-2xl border border-sky-200/60 bg-gradient-to-br from-[#F0F9FF] to-white p-5 shadow-sm transition-all duration-300 hover:border-sky-300 hover:shadow-md dark:border-sky-900/30 dark:from-[#082F49]/30 dark:to-[#121319]"
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
                {creators.length}
              </span>
              <span className="flex size-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700 shadow-sm dark:bg-sky-950/70 dark:text-sky-300">
                <Users className="size-4" />
              </span>
            </div>
            <p className="mt-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Creators Tracked
            </p>
          </Link>

          <Link
            href="/categories"
            className="group relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-[#ECFDF5] to-white p-5 shadow-sm transition-all duration-300 hover:border-emerald-300 hover:shadow-md dark:border-emerald-900/30 dark:from-[#064E3B]/30 dark:to-[#121319]"
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
                {smartCategories.length || 18}
              </span>
              <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-sm dark:bg-emerald-950/70 dark:text-emerald-300">
                <Folder className="size-4" />
              </span>
            </div>
            <p className="mt-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Active Categories
            </p>
          </Link>
        </div>
      </section>

      {/* ─── 6. Recent Activity Feed ─── */}
      {reels.length > 0 && (
        <section aria-labelledby="recent-activity-title">
          <h2
            id="recent-activity-title"
            className="mb-3.5 text-sm font-semibold tracking-tight text-zinc-900 dark:text-white"
          >
            Recent Activity
          </h2>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#121316]">
            <ul className="space-y-3.5">
              {reels.slice(0, 4).map((r, i) => {
                const creator = getCreator(r);
                const time = formatRelativeTime(r.createdAt);
                return (
                  <li
                    key={r.id || i}
                    onClick={() => setActivePlayerReel(r)}
                    className="flex cursor-pointer items-center justify-between gap-4 text-xs transition-colors hover:text-purple-600"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="size-2 rounded-full bg-purple-500 shrink-0" />
                      <span className="truncate text-zinc-700 dark:text-zinc-300">
                        Saved reel from <span className="font-semibold text-zinc-900 dark:text-white">@{creator}</span>
                      </span>
                      {r.category && (
                        <span className="hidden sm:inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          {r.category}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 font-mono text-[11px] text-zinc-400">
                      {time}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* ─── 7. Working Reel Memory Modal (⌘K) ─── */}
      <ReelMemoryModal
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
        reels={reels}
        onSelectReel={(reel) => setActivePlayerReel(reel)}
        onSaveUrl={async (url) => {
          await saveReel(url);
        }}
      />

      {/* Reel Player Modal */}
      {activePlayerReel && (
        <ReelPlayerModal
          reel={activePlayerReel}
          isOpen={true}
          onClose={() => setActivePlayerReel(null)}
        />
      )}
    </div>
  );
}
