'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Sparkles,
  Search,
  Command,
  Play,
  ArrowRight,
  Bookmark,
  Users,
  Folder,
  X,
  Plus,
  Loader2,
  Check,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useReels } from '@/context/ReelContext';
import { Reel } from '@/types/reel';
import { ReelPlayerModal } from '@/components/reels/ReelPlayerModal';
import {
  OrbitalReelMemoryHub,
  StackedHighlightsCard,
} from '@/components/dashboard/DashboardShowcaseCards';

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
  const [memoryQuery, setMemoryQuery] = useState('');
  const [saveUrl, setSaveUrl] = useState('');
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{
    kind: 'success' | 'error';
    message: string;
  } | null>(null);

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

  // Reel Memory Search
  const memoryResults = useMemo(() => {
    if (!memoryQuery.trim()) {
      return reels.slice(0, 8);
    }
    const q = memoryQuery.toLowerCase().trim();
    return reels.filter((reel) => {
      const matchCreator = getCreator(reel).toLowerCase().includes(q);
      const matchCaption = (reel.caption || '').toLowerCase().includes(q);
      const matchCategory = (reel.category || '').toLowerCase().includes(q);
      const matchTags = Array.isArray(reel.tags) && reel.tags.some((t) => t.toLowerCase().includes(q));
      const matchKeywords = Array.isArray(reel.aiKeywords) && reel.aiKeywords.some((k) => k.toLowerCase().includes(q));
      const matchAudio = (reel.audioTitle || '').toLowerCase().includes(q) || (reel.audioArtist || '').toLowerCase().includes(q);
      const matchNotes = (reel.notes || '').toLowerCase().includes(q);
      return (
        matchCreator ||
        matchCaption ||
        matchCategory ||
        matchTags ||
        matchKeywords ||
        matchAudio ||
        matchNotes
      );
    });
  }, [reels, memoryQuery]);

  // Handle Quick Save in Reel Memory
  const handleMemorySave = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = normalizeInstagramUrl(saveUrl);
    if (!url) {
      setSaveFeedback({
        kind: 'error',
        message: 'Please paste a valid Instagram link.',
      });
      return;
    }
    setIsSavingUrl(true);
    setSaveFeedback(null);
    try {
      await saveReel(url);
      setSaveUrl('');
      setSaveFeedback({
        kind: 'success',
        message: 'Saved to your vault.',
      });
    } catch {
      setSaveFeedback({
        kind: 'error',
        message: 'Failed to save link.',
      });
    } finally {
      setIsSavingUrl(false);
    }
  };

  return (
    <div className="w-full pb-16 pt-2">
      {/* ─── 1. Minimal Header ─── */}
      <header className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
          {greeting}, {userName}
        </h1>
        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-zinc-400 dark:text-zinc-500">
          <span className="size-2 rounded-full bg-emerald-500" />
          Active Sync
        </span>
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
            onCategoryClick={(categoryTitle) => {
              setActiveCategory(categoryTitle);
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

      {/* ─── 5. Library Metrics (Pure counts, zero subtexts) ─── */}
      <section className="mb-10" aria-labelledby="library-stats-title">
        <h2
          id="library-stats-title"
          className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400"
        >
          Library
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            href="/reels?type=all"
            className="group relative overflow-hidden rounded-2xl border border-purple-200/70 bg-[#F5F3FF] p-5 transition-all duration-300 hover:border-purple-300 hover:shadow-md dark:border-purple-900/30 dark:bg-[#581C87]/15 dark:hover:border-purple-700/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-purple-950 dark:text-purple-100">
                {reels.length}
              </span>
              <span className="flex size-9 items-center justify-center rounded-xl bg-purple-200/60 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                <Bookmark className="size-4" />
              </span>
            </div>
            <p className="mt-2 text-xs font-semibold text-purple-700 dark:text-purple-300">
              Saved Reels
            </p>
          </Link>

          <Link
            href="/reels"
            className="group relative overflow-hidden rounded-2xl border border-sky-200/70 bg-[#F0F9FF] p-5 transition-all duration-300 hover:border-sky-300 hover:shadow-md dark:border-sky-900/30 dark:bg-[#0369A1]/15 dark:hover:border-sky-700/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-sky-950 dark:text-sky-100">
                {creators.length}
              </span>
              <span className="flex size-9 items-center justify-center rounded-xl bg-sky-200/60 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                <Users className="size-4" />
              </span>
            </div>
            <p className="mt-2 text-xs font-semibold text-sky-700 dark:text-sky-300">
              Creators
            </p>
          </Link>

          <Link
            href="/categories"
            className="group relative overflow-hidden rounded-2xl border border-emerald-200/70 bg-[#ECFDF5] p-5 transition-all duration-300 hover:border-emerald-300 hover:shadow-md dark:border-emerald-900/30 dark:bg-[#065F46]/15 dark:hover:border-emerald-700/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-emerald-950 dark:text-emerald-100">
                {smartCategories.length || 24}
              </span>
              <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-200/60 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <Folder className="size-4" />
              </span>
            </div>
            <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Categories
            </p>
          </Link>
        </div>
      </section>

      {/* ─── 6. Recent Activity Feed ─── */}
      {reels.length > 0 && (
        <section aria-labelledby="recent-activity-title">
          <h2
            id="recent-activity-title"
            className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400"
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
      <AnimatePresence>
        {isMemoryOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-20">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMemoryOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-purple-200/80 bg-white shadow-2xl dark:border-purple-800/40 dark:bg-[#121316]"
            >
              {/* Top Search Input */}
              <div className="relative border-b border-zinc-200/80 px-5 py-4 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
                    <Sparkles className="size-4" />
                  </span>
                  <input
                    type="text"
                    value={memoryQuery}
                    onChange={(e) => setMemoryQuery(e.target.value)}
                    placeholder="Search reels by creator, topic, audio, or caption…"
                    autoFocus
                    className="w-full bg-transparent text-sm sm:text-base outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 dark:text-white"
                  />
                  {memoryQuery && (
                    <button
                      type="button"
                      onClick={() => setMemoryQuery('')}
                      className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsMemoryOpen(false)}
                    className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>

              {/* Direct Save Bar */}
              <form
                onSubmit={handleMemorySave}
                className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50/70 px-5 py-2.5 dark:border-zinc-800/60 dark:bg-zinc-900/40"
              >
                <input
                  type="text"
                  value={saveUrl}
                  onChange={(e) => setSaveUrl(e.target.value)}
                  placeholder="Paste Instagram reel URL to save…"
                  className="flex-1 bg-transparent text-xs outline-none placeholder:text-zinc-400 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={isSavingUrl || !saveUrl.trim()}
                  className="inline-flex items-center gap-1 rounded-full bg-purple-600 px-3 py-1 text-[11px] font-medium text-white shadow-sm transition-all hover:bg-purple-700 disabled:opacity-50"
                >
                  {isSavingUrl ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Plus className="size-3" />
                  )}
                  <span>Save</span>
                </button>
              </form>

              {saveFeedback && (
                <div
                  className={`px-5 py-2 text-xs font-medium ${
                    saveFeedback.kind === 'success'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                  }`}
                >
                  {saveFeedback.message}
                </div>
              )}

              {/* Quick Query Chips */}
              <div className="flex items-center gap-2 overflow-x-auto px-5 py-2.5 border-b border-zinc-100 dark:border-zinc-800/80 no-scrollbar">
                {['Travel', 'Design', 'Recipes', 'Tech', 'Audio'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setMemoryQuery(chip)}
                    className="shrink-0 rounded-full border border-purple-200/60 bg-purple-50/50 px-2.5 py-0.5 text-[11px] font-medium text-purple-700 transition-colors hover:bg-purple-100 dark:border-purple-800/40 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/50"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Results Grid */}
              <div className="max-h-[380px] overflow-y-auto p-5">
                {memoryResults.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {memoryResults.map((reel) => {
                      const thumb = getMediaUrl(reel);
                      const creator = getCreator(reel);
                      return (
                        <div
                          key={reel.id}
                          onClick={() => {
                            setActivePlayerReel(reel);
                            setIsMemoryOpen(false);
                          }}
                          className="group relative aspect-[9/16] cursor-pointer overflow-hidden rounded-xl bg-zinc-900 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                        >
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={reel.caption || `@${creator}`}
                              className="size-full object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center bg-zinc-800 text-zinc-500">
                              <Play className="size-6 opacity-40" />
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2 pt-4 text-white">
                            <p className="truncate text-[11px] font-semibold">
                              @{creator}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-zinc-400">
                    No matching reels found.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
