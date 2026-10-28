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
  Music2,
  Plus,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Heart,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useReels } from '@/context/ReelContext';
import { Reel } from '@/types/reel';
import { ReelPlayerModal } from '@/components/reels/ReelPlayerModal';
import { DashboardCategoryDecks } from '@/components/dashboard/DashboardCategoryDecks';

type ChartRange = 'weekly' | 'monthly';

interface ActivityBucket {
  label: string;
  fullLabel: string;
  reels: number;
  audio: number;
  carousels: number;
  total: number;
}

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

function buildBuckets(
  reels: Reel[],
  range: ChartRange,
  now: number | null,
): ActivityBucket[] {
  if (!now) return [];

  const dayCount = range === 'weekly' ? 7 : 30;
  const bucketDays = range === 'weekly' ? 1 : 5;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - dayCount + 1);

  return Array.from({ length: dayCount / bucketDays }, (_, index) => {
    const from = new Date(start);
    from.setDate(from.getDate() + index * bucketDays);

    const to = new Date(from);
    to.setDate(to.getDate() + bucketDays);

    const endLabel = new Date(to);
    endLabel.setDate(endLabel.getDate() - 1);

    const items = reels.filter((r) => {
      const time = r.createdAt ? new Date(r.createdAt).getTime() : null;
      return time !== null && time >= from.getTime() && time < to.getTime() && time <= now;
    });

    const formatDate = (date: Date) =>
      new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
      }).format(date);

    return {
      label:
        range === 'weekly'
          ? new Intl.DateTimeFormat('en', { weekday: 'short' }).format(from)
          : formatDate(from),
      fullLabel:
        range === 'weekly'
          ? formatDate(from)
          : `${formatDate(from)} – ${formatDate(endLabel)}`,
      reels: items.filter(
        (r) => !r.isCarousel && !r.carouselImages?.length && r.mediaType !== 'post',
      ).length,
      carousels: items.filter(
        (r) => Boolean(r.isCarousel || r.carouselImages?.length || r.carouselSlides?.length),
      ).length,
      audio: items.filter((r) => Boolean(r.audioTitle || r.mediaType === 'audio')).length,
      total: items.length,
    };
  });
}

function VelocityChart({
  buckets,
  range,
  onRangeChange,
}: {
  buckets: ActivityBucket[];
  range: ChartRange;
  onRangeChange: (range: ChartRange) => void;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const hasActivity = buckets.some((bucket) => bucket.total > 0);

  const peakIndex = buckets.reduce(
    (best, bucket, index) =>
      bucket.total > buckets[best].total ? index : best,
    0,
  );
  const activeIndex = hoveredIndex ?? peakIndex;
  const activeBucket = buckets[activeIndex] ?? buckets[peakIndex];
  const maximum = Math.max(
    1,
    ...buckets.flatMap((bucket) => [bucket.reels, bucket.audio, bucket.carousels]),
  );

  const slotWidth = 320 / Math.max(1, buckets.length);
  const barWidth = buckets.length === 7 ? 8 : 10;

  return (
    <div className="flex flex-col h-full justify-between">
      {/* Header & Range Toggle */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
            Save Velocity
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {range === 'weekly' ? 'Daily saves over the past 7 days.' : 'Saves grouped across the past 30 days.'}
          </p>
        </div>

        <div className="flex rounded-full bg-zinc-100 p-1 dark:bg-[#20232B]">
          {(['weekly', 'monthly'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRangeChange(r)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize transition ${
                range === r
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-[#16181D] dark:text-white'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Series Legend */}
      <div className="mt-4 flex flex-wrap gap-3">
        {[
          { label: 'Reels', color: 'bg-violet-500' },
          { label: 'Audio', color: 'bg-blue-400' },
          { label: 'Carousels', color: 'bg-emerald-400' },
        ].map((series) => (
          <span
            key={series.label}
            className="inline-flex items-center gap-1.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-400"
          >
            <span className={`size-1.5 rounded-full ${series.color}`} />
            {series.label}
          </span>
        ))}
      </div>

      {/* Chart Canvas */}
      {hasActivity ? (
        <div className="relative mt-3 pt-9">
          {/* Active tooltip pill */}
          {activeBucket && (
            <div
              className="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-xl bg-zinc-900 px-2.5 py-1.5 text-[10px] font-medium text-white shadow-md dark:bg-zinc-100 dark:text-zinc-900 transition-all duration-150"
              style={{
                left: `${Math.min(
                  80,
                  Math.max(20, ((activeIndex + 0.5) / buckets.length) * 100),
                )}%`,
              }}
            >
              {activeBucket.total} {activeBucket.total === 1 ? 'save' : 'saves'}
              {activeBucket.audio > 0 && ` · ${activeBucket.audio} audio`}
              <span className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-zinc-900 dark:bg-zinc-100" />
            </div>
          )}

          <svg
            viewBox="0 0 360 170"
            className="h-auto w-full overflow-visible"
            role="group"
            aria-label="Save activity chart"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="reeldash-bar-peak" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#6D28D9" />
              </linearGradient>
            </defs>

            {/* Grid horizontal lines */}
            {[25, 55, 85, 115].map((y) => (
              <line
                key={y}
                x1="15"
                x2="345"
                y1={y}
                y2={y}
                className="stroke-black/[0.05] dark:stroke-white/[0.06]"
                strokeDasharray="3 4"
              />
            ))}

            {buckets.map((bucket, index) => {
              const center = 15 + slotWidth * (index + 0.5);
              const series = [
                { key: 'reels', value: bucket.reels, color: '#8B5CF6' },
                { key: 'audio', value: bucket.audio, color: '#60A5FA' },
                { key: 'carousels', value: bucket.carousels, color: '#34D399' },
              ];

              return (
                <g
                  key={bucket.fullLabel}
                  tabIndex={0}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onFocus={() => setHoveredIndex(index)}
                  onBlur={() => setHoveredIndex(null)}
                  className="cursor-pointer outline-none"
                >
                  <rect
                    x={center - slotWidth / 2 + 1}
                    y="10"
                    width={slotWidth - 2}
                    height="115"
                    rx="6"
                    className={
                      activeIndex === index
                        ? 'fill-violet-500/[0.08]'
                        : 'fill-transparent'
                    }
                  />

                  {series.map((item, seriesIdx) => {
                    const height = (item.value / maximum) * 95;
                    return (
                      <rect
                        key={item.key}
                        x={center - (barWidth * 3 + 6) / 2 + seriesIdx * (barWidth + 3)}
                        y={115 - height}
                        width={barWidth}
                        height={height}
                        rx={Math.min(3, height / 2)}
                        fill={
                          item.key === 'reels' && index === peakIndex
                            ? 'url(#reeldash-bar-peak)'
                            : item.color
                        }
                        opacity={activeIndex === index ? 1 : 0.65}
                        className="transition-opacity duration-150"
                      />
                    );
                  })}

                  <text
                    x={center}
                    y="142"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight={activeIndex === index ? 600 : 400}
                    className={
                      activeIndex === index
                        ? 'fill-zinc-900 dark:fill-zinc-100 font-semibold'
                        : 'fill-zinc-400 dark:fill-zinc-500'
                    }
                  >
                    {bucket.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        <div className="flex h-44 flex-col items-center justify-center text-center">
          <BarChart3 className="size-8 text-zinc-300 dark:text-zinc-600 mb-2" />
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            No save activity recorded yet
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Activity bars will appear as you save reels over the week.
          </p>
        </div>
      )}
    </div>
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
  const [velocityRange, setVelocityRange] = useState<ChartRange>('weekly');
  const [now, setNow] = useState<number | null>(null);
  const recentScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

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

  // Recent saves sorted by newest
  const recentSaves = useMemo(() => {
    return [...reels]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 16);
  }, [reels]);

  // Velocity buckets computed from actual reels
  const velocityBuckets = useMemo(() => {
    return buildBuckets(reels, velocityRange, now);
  }, [reels, velocityRange, now]);

  // Audio reels / music collection
  const audioGems = useMemo(() => {
    return reels
      .filter((r) => r.audioTitle || r.mediaType === 'audio')
      .slice(0, 5);
  }, [reels]);

  // Recent saves with personal notes or captions
  const recentNotesAndActivity = useMemo(() => {
    return [...reels]
      .sort((a, b) => {
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

        {/* Horizontal Carousel (Unobstructed thumbnails, zero intrusive creator badges) */}
        {recentSaves.length > 0 ? (
          <div
            ref={recentScrollRef}
            className="flex snap-x snap-proximity gap-3.5 overflow-x-auto pb-2 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {recentSaves.map((reel) => {
              const thumb = getMediaUrl(reel);
              const creator = getCreator(reel);
              const cleanText = cleanCaption(reel.caption);
              const time = formatRelativeTime(reel.createdAt);

              return (
                <div
                  key={reel.id}
                  onClick={() => setActivePlayerReel(reel)}
                  className="group relative aspect-[9/16] w-[155px] sm:w-[175px] shrink-0 snap-start cursor-pointer overflow-hidden rounded-[20px] border border-black/10 bg-[#EAECE5] shadow-[0_4px_16px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-zinc-900"
                >
                  {/* Clean full-bleed Thumbnail */}
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />

                  {/* Top Badges */}
                  <div className="absolute left-2.5 right-2.5 top-2.5 flex items-center justify-between gap-1">
                    {reel.category ? (
                      <span className="max-w-[105px] truncate rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
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

                  {/* Bottom Info Bar inside Card (Clean text only, no giant avatar badge) */}
                  <div className="absolute inset-x-2.5 bottom-2.5 space-y-1">
                    {/* Audio Pill */}
                    {reel.audioTitle && (
                      <div className="flex items-center gap-1 rounded-md bg-white/15 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
                        <Music2 className="size-2.5 shrink-0" />
                        <span className="truncate">{reel.audioTitle}</span>
                      </div>
                    )}

                    {/* Creator Handle (Clean text) */}
                    <p className="truncate text-xs font-semibold text-white drop-shadow-sm">
                      @{creator}
                    </p>

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

      {/* ─── 3. Bento Row: Save Velocity + Saved Audio ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Save Velocity Chart Card (Span 7) */}
        <section className={`${CARD_CLASS} lg:col-span-7`} aria-labelledby="save-velocity-title">
          <VelocityChart
            buckets={velocityBuckets}
            range={velocityRange}
            onRangeChange={setVelocityRange}
          />
        </section>

        {/* Saved Soundtracks & Audio (Span 5) */}
        <section className={`${CARD_CLASS} lg:col-span-5`} aria-labelledby="audio-gems-title">
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
                  Soundtracks saved from reels.
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
      </div>

      {/* ─── 4. Categories & Albums (Visual 3D Preview Decks) ─── */}
      <DashboardCategoryDecks
        categories={smartCategories}
        reels={reels}
        onCategoryClick={(categoryTitle) => {
          setActiveCategory(categoryTitle);
          router.push(`/reels?category=${encodeURIComponent(categoryTitle)}`);
        }}
      />

      {/* ─── 5. Notes & Highlights (Personal Reflections Card) ─── */}
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                    <div className="relative size-11 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-zinc-900 shadow-sm dark:border-white/10">
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
            <div className="col-span-full rounded-xl border border-dashed border-zinc-200 p-6 text-center text-xs text-zinc-500 dark:border-zinc-800">
              Personal notes you add to reels will show up here.
            </div>
          )}
        </div>
      </section>

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
