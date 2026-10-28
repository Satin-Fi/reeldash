'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Command,
  Play,
  ArrowRight,
  Bookmark,
  Users,
  Folder,
  Clock,
  Music2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Heart,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useReels } from '@/context/ReelContext';
import { Reel } from '@/types/reel';
import { ReelPlayerModal } from '@/components/reels/ReelPlayerModal';
import { DashboardCategoryDecks } from '@/components/dashboard/DashboardCategoryDecks';

/* ─── Caption & Media Helpers ─── */
function cleanCaption(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/&amp;/g, '&')
    .replace(/&#064;/g, '@')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\bview\s+all\s+[\d,.]+\s*[km]?\s+comments?\b/gi, '')
    .replace(/\bview\s+more\s+comments?\b/gi, '')
    .replace(/Comment\s+[\w\s]+&amp;[^\n.]*/gi, '')
    .replace(/\[[^\]\n]*,[^\]\n]*\]/g, '')
    .replace(/\[\s*(?:\.{3}|…)\s*\]/g, '')
    .replace(/(?:#[a-zA-Z0-9_]+\s*){3,}$/g, '') // remove trailing hashtag blocks
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

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
  if (!reel) return 'creator';
  return (
    reel.creatorUsername ||
    reel.creatorFullName ||
    (typeof reel.creator === 'string' ? reel.creator : reel.creator?.username) ||
    'creator'
  ).replace(/^@/, '');
}

function getCreatorAvatar(reel: any): string {
  if (!reel) return '';
  return (
    reel.creatorAvatar ||
    reel.creator_avatar ||
    reel.creatorProfilePic ||
    reel.avatar ||
    (typeof reel.creator === 'object' ? reel.creator?.avatar : '') ||
    ''
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
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(
    new Date(dateString),
  );
}

const CARD_CLASS =
  'min-w-0 rounded-[26px] border border-black/[0.07] bg-white p-5 sm:p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] dark:border-white/[0.08] dark:bg-[#16181D] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.35)]';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    reels,
    smartCategories,
    setActiveCategory,
    setIsSaveModalOpen,
  } = useReels();

  const [activePlayerReel, setActivePlayerReel] = useState<Reel | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const recentScrollRef = useRef<HTMLDivElement>(null);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const userName = useMemo(() => {
    if (user?.name) return user.name.split(' ')[0];
    return 'Piyush';
  }, [user]);

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        router.push('/search');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // Unique Creators with avatar and count
  const creatorList = useMemo(() => {
    const map = new Map<string, { username: string; avatar: string; count: number }>();
    reels.forEach((r) => {
      const username = getCreator(r);
      if (!username || username.toLowerCase() === 'instagram') return;
      const key = username.toLowerCase();
      const existing = map.get(key);
      const avatar = getCreatorAvatar(r);
      if (existing) {
        existing.count += 1;
        if (!existing.avatar && avatar) existing.avatar = avatar;
      } else {
        map.set(key, { username, avatar, count: 1 });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [reels]);

  // Recent saves sorted by newest
  const recentSaves = useMemo(() => {
    return [...reels]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 16);
  }, [reels]);

  // Audio reels / music collection
  const audioGems = useMemo(() => {
    return reels
      .filter((r) => r.audioTitle || r.mediaType === 'audio')
      .slice(0, 6);
  }, [reels]);

  // Recent saves with personal notes or captions
  const recentNotesAndActivity = useMemo(() => {
    return [...reels]
      .sort((a, b) => {
        // Prioritize items with notes, then newest
        const aHasNote = Boolean(a.notes);
        const bHasNote = Boolean(b.notes);
        if (aHasNote && !bHasNote) return -1;
        if (!aHasNote && bHasNote) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 5);
  }, [reels]);

  const scrollRecent = (direction: 'left' | 'right') => {
    if (!recentScrollRef.current) return;
    const offset = direction === 'left' ? -360 : 360;
    recentScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return (
    <div className="w-full space-y-7 pb-16 pt-2">
      {/* ─── 1. Header (Clean & Personal - No "Reel Memory Vault") ─── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-tight tracking-[-0.035em] text-zinc-900 sm:text-3xl dark:text-white">
            {greeting}, {userName}.
          </h1>
          <p className="mt-1 text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">
            Your personal space for saved reels, creative inspiration, and audio.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchInput.trim()) {
                router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
              } else {
                router.push('/search');
              }
            }}
            className="group relative flex h-10 w-full items-center gap-2.5 rounded-full border border-black/[0.08] bg-white px-3.5 text-xs text-zinc-600 shadow-sm transition-[border-color,box-shadow] hover:border-black/[0.15] focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 dark:border-white/[0.08] dark:bg-[#16181D] dark:text-zinc-400 sm:w-64"
          >
            <Search className="size-4 shrink-0 text-zinc-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search your reels…"
              className="w-full bg-transparent text-xs text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white"
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-black/[0.08] bg-[#F7F7F5] px-1 font-mono text-[10px] text-zinc-400 dark:border-white/[0.08] dark:bg-[#20232B]">
              <Command className="size-2.5" />K
            </kbd>
          </form>

          {/* Quick Save Reel Button */}
          <button
            type="button"
            onClick={() => setIsSaveModalOpen(true)}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-zinc-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            <Plus className="size-3.5" />
            <span>Save Reel</span>
          </button>
        </div>
      </header>

      {/* ─── 2. Horizontal Cards for Recent Save Reels (Full-Width Card) ─── */}
      <section className={CARD_CLASS} aria-labelledby="recent-saves-title">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2
                id="recent-saves-title"
                className="text-base font-bold tracking-tight text-zinc-900 dark:text-white"
              >
                Recent Saves
              </h2>
              {recentSaves.length > 0 && (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                  {recentSaves.length}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Pick up where you left off or watch again.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Carousel navigation controls */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollRecent('left')}
                className="flex size-8 items-center justify-center rounded-full border border-black/[0.08] bg-[#F8F9FA] text-zinc-600 transition hover:bg-zinc-100 dark:border-white/[0.08] dark:bg-[#20232B] dark:text-zinc-300 dark:hover:bg-zinc-800"
                aria-label="Scroll left"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollRecent('right')}
                className="flex size-8 items-center justify-center rounded-full border border-black/[0.08] bg-[#F8F9FA] text-zinc-600 transition hover:bg-zinc-100 dark:border-white/[0.08] dark:bg-[#20232B] dark:text-zinc-300 dark:hover:bg-zinc-800"
                aria-label="Scroll right"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            <Link
              href="/reels"
              className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400"
            >
              <span>View all</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Horizontal Carousel */}
        {recentSaves.length > 0 ? (
          <div
            ref={recentScrollRef}
            className="flex snap-x snap-proximity gap-3.5 overflow-x-auto pb-2 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {recentSaves.map((reel) => {
              const thumb = getMediaUrl(reel);
              const creator = getCreator(reel);
              const avatar = getCreatorAvatar(reel);
              const cleanText = cleanCaption(reel.caption);
              const time = formatRelativeTime(reel.createdAt);

              return (
                <div
                  key={reel.id}
                  onClick={() => setActivePlayerReel(reel)}
                  className="group relative aspect-[9/16] w-[155px] sm:w-[175px] shrink-0 snap-start cursor-pointer overflow-hidden rounded-[20px] border border-black/10 bg-[#EAECE5] shadow-[0_4px_16px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-zinc-900"
                >
                  {/* Thumbnail */}
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={cleanText || `@${creator}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-zinc-600">
                      <Play className="size-8" />
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />

                  {/* Top Badges */}
                  <div className="absolute left-2.5 right-2.5 top-2.5 flex items-center justify-between gap-1">
                    {reel.category ? (
                      <span className="max-w-[100px] truncate rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
                        {reel.category}
                      </span>
                    ) : (
                      <span />
                    )}

                    {reel.isFavorite && (
                      <span className="flex size-5 items-center justify-center rounded-full bg-rose-500/80 text-white backdrop-blur-sm">
                        <Heart className="size-3 fill-current" />
                      </span>
                    )}
                  </div>

                  {/* Hover Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <span className="flex size-11 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-lg backdrop-blur-md transition-transform duration-200 group-hover:scale-110">
                      <Play className="size-5 fill-current ml-0.5" />
                    </span>
                  </div>

                  {/* Bottom Info Bar inside Card */}
                  <div className="absolute inset-x-2.5 bottom-2.5 space-y-1">
                    {/* Audio Pill */}
                    {reel.audioTitle && (
                      <div className="flex items-center gap-1 rounded-md bg-white/15 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
                        <Music2 className="size-2.5 shrink-0" />
                        <span className="truncate">{reel.audioTitle}</span>
                      </div>
                    )}

                    {/* Creator Handle & Avatar */}
                    <div className="flex items-center gap-1.5">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt=""
                          className="size-4.5 rounded-full object-cover ring-1 ring-white/40"
                        />
                      ) : (
                        <div className="flex size-4.5 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white">
                          {creator[0]?.toUpperCase() || 'C'}
                        </div>
                      )}
                      <span className="truncate text-xs font-semibold text-white">
                        @{creator}
                      </span>
                    </div>

                    {/* Clean caption snippet */}
                    {cleanText && (
                      <p className="line-clamp-1 text-[10px] text-zinc-300">
                        {cleanText}
                      </p>
                    )}

                    {/* Time */}
                    <p className="text-[9px] text-zinc-400 font-mono">
                      {time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
            <p className="text-sm text-zinc-500">No saved reels yet. Click &quot;Save Reel&quot; to add your first post!</p>
          </div>
        )}
      </section>

      {/* ─── 3. Favorite Creators in Your Library (Like Google Photos People) ─── */}
      {creatorList.length > 0 && (
        <section className={CARD_CLASS} aria-labelledby="creators-title">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="creators-title"
                  className="text-base font-bold tracking-tight text-zinc-900 dark:text-white"
                >
                  Creators
                </h2>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                  {creatorList.length}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Browse saved reels by creators you love.
              </p>
            </div>
            <Link
              href="/reels"
              className="text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400"
            >
              Explore all
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-1 pt-1 [scrollbar-width:none]">
            {creatorList.slice(0, 12).map((creator) => (
              <Link
                key={creator.username}
                href={`/creator/${encodeURIComponent(creator.username)}`}
                className="group flex w-16 shrink-0 flex-col items-center gap-1.5 rounded-xl transition hover:-translate-y-0.5"
              >
                <div className="relative size-12 rounded-full p-0.5 ring-2 ring-transparent transition group-hover:ring-violet-500">
                  {creator.avatar ? (
                    <img
                      src={creator.avatar}
                      alt={creator.username}
                      className="size-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white">
                      {creator.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 rounded-full bg-zinc-900 px-1 text-[9px] font-bold text-white shadow dark:bg-white dark:text-zinc-900">
                    {creator.count}
                  </span>
                </div>
                <span className="w-full truncate text-center text-[11px] font-medium text-zinc-700 group-hover:text-violet-600 dark:text-zinc-300 dark:group-hover:text-violet-400">
                  @{creator.username}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── 4. Categories & Albums (Visual 3D Preview Decks) ─── */}
      <DashboardCategoryDecks
        categories={smartCategories}
        reels={reels}
        onCategoryClick={(categoryTitle) => {
          setActiveCategory(categoryTitle);
          router.push(`/reels?category=${encodeURIComponent(categoryTitle)}`);
        }}
      />

      {/* ─── 5. Two-Column Personal Curation: Audio Gems + Recent Notes ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Saved Soundtracks & Audio */}
        <section className={CARD_CLASS} aria-labelledby="audio-gems-title">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Music2 className="size-4" />
              </span>
              <div>
                <h2
                  id="audio-gems-title"
                  className="text-base font-bold tracking-tight text-zinc-900 dark:text-white"
                >
                  Saved Audio
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Trending soundtracks & audio tracks.
                </p>
              </div>
            </div>
            <Link
              href="/reels?type=audio"
              className="text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400"
            >
              View all
            </Link>
          </div>

          <div className="space-y-2.5">
            {audioGems.length > 0 ? (
              audioGems.map((reel) => {
                const thumb = getMediaUrl(reel);
                const creator = getCreator(reel);
                return (
                  <div
                    key={reel.id}
                    onClick={() => setActivePlayerReel(reel)}
                    className="group flex cursor-pointer items-center justify-between rounded-2xl border border-black/[0.04] bg-[#F8F9FA] p-3 transition hover:border-black/[0.1] hover:bg-white hover:shadow-sm dark:border-white/[0.04] dark:bg-[#1C1F26] dark:hover:border-white/[0.1] dark:hover:bg-[#20232B]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Spinning vinyl-like disc */}
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-full border border-black/10 bg-zinc-900 shadow dark:border-white/10">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt=""
                            className="size-full object-cover transition-transform duration-500 group-hover:rotate-45"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-white">
                            <Music2 className="size-5" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="size-2 rounded-full bg-white ring-2 ring-black" />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-zinc-900 group-hover:text-violet-600 dark:text-zinc-100 dark:group-hover:text-violet-400">
                          {reel.audioTitle || 'Original Audio'}
                        </p>
                        <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                          by @{creator}
                        </p>
                      </div>
                    </div>

                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-black/[0.04] text-zinc-700 transition group-hover:bg-violet-600 group-hover:text-white dark:bg-white/[0.06] dark:text-zinc-300">
                      <Play className="size-3.5 fill-current ml-0.5" />
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-xs text-zinc-500 dark:border-zinc-800">
                Audio tracks from saved reels will show up here.
              </div>
            )}
          </div>
        </section>

        {/* Personal Notes & Reflections */}
        <section className={CARD_CLASS} aria-labelledby="personal-notes-title">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Bookmark className="size-4" />
              </span>
              <div>
                <h2
                  id="personal-notes-title"
                  className="text-base font-bold tracking-tight text-zinc-900 dark:text-white"
                >
                  Notes & Highlights
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Thoughts and ideas from your saved posts.
                </p>
              </div>
            </div>
            <Link
              href="/reels"
              className="text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400"
            >
              View library
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentNotesAndActivity.length > 0 ? (
              recentNotesAndActivity.map((reel) => {
                const thumb = getMediaUrl(reel);
                const creator = getCreator(reel);
                const cleanText = cleanCaption(reel.caption);
                const time = formatRelativeTime(reel.createdAt);

                return (
                  <div
                    key={reel.id}
                    onClick={() => setActivePlayerReel(reel)}
                    className="group flex cursor-pointer items-start justify-between gap-3 rounded-2xl border border-black/[0.04] bg-[#F8F9FA] p-3 transition hover:border-black/[0.1] hover:bg-white hover:shadow-sm dark:border-white/[0.04] dark:bg-[#1C1F26] dark:hover:border-white/[0.1] dark:hover:bg-[#20232B]"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Mini thumbnail */}
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-zinc-900 shadow-sm dark:border-white/10">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-zinc-500">
                            <Play className="size-4" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-xs font-semibold text-zinc-900 group-hover:text-violet-600 dark:text-zinc-100 dark:group-hover:text-violet-400">
                            @{creator}
                          </span>
                          {reel.category && (
                            <span className="rounded-md bg-zinc-200/60 px-1.5 py-0.2 text-[9px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                              {reel.category}
                            </span>
                          )}
                        </div>

                        {/* Note text if exists, or cleaned caption excerpt */}
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                          {reel.notes ? (
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                              “{reel.notes}”
                            </span>
                          ) : (
                            cleanText || 'Saved reel'
                          )}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 text-[10px] text-zinc-400 font-mono">
                      {time}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-xs text-zinc-500 dark:border-zinc-800">
                Personal notes you add to reels will show up here.
              </div>
            )}
          </div>
        </section>
      </div>

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
