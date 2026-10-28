'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Sparkles,
  TrendingUp,
  Music2,
  CheckCircle2,
  ChevronRight,
  Plus,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useReels } from '@/context/ReelContext';
import { Reel } from '@/types/reel';
import { ReelPlayerModal } from '@/components/reels/ReelPlayerModal';

type UnknownRecord = Record<string, unknown>;
type DateRange = 'all' | '30' | '7';
type ChartRange = 'weekly' | 'monthly';

interface ReelsSnapshot {
  reels?: Reel[];
  smartCategories?: unknown;
  setIsSaveModalOpen?: (open: boolean) => void;
  isLoading?: boolean;
  loading?: boolean;
}

interface CategoryDefinition {
  id: string;
  name: string;
  description: string;
}

interface LibraryReel {
  original: Reel;
  id: string;
  username: string;
  avatar: string;
  thumbnail: string;
  verified: boolean;
  caption: string;
  note: string;
  categories: string[];
  topics: string[];
  audio: string;
  savedAt: number | null;
  activityAt: number | null;
  carousel: boolean;
}

interface Creator {
  username: string;
  avatar: string;
  verified: boolean;
  count: number;
}

interface CategoryDeck {
  name: string;
  description: string;
  reels: LibraryReel[];
  creators: Creator[];
}

interface ActivityBucket {
  label: string;
  fullLabel: string;
  reels: number;
  audio: number;
  carousels: number;
  total: number;
}

const EMPTY_REELS: Reel[] = [];

const CARD_CLASS =
  'min-w-0 rounded-[24px] border border-black/[0.08] bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow] duration-300 hover:border-black/[0.13] hover:shadow-[0_10px_32px_-8px_rgba(0,0,0,0.08)] dark:border-white/[0.08] dark:bg-[#16181D] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] dark:hover:border-white/[0.15]';

const FOCUS_CLASS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-4 dark:focus-visible:ring-offset-[#16181D]';

const DECK_COLORS = [
  'border-purple-500/15 bg-purple-500/[0.07] text-purple-950 hover:bg-purple-500/[0.11] dark:text-purple-100',
  'border-blue-500/15 bg-blue-500/[0.07] text-blue-950 hover:bg-blue-500/[0.11] dark:text-blue-100',
  'border-emerald-500/15 bg-emerald-500/[0.07] text-emerald-950 hover:bg-emerald-500/[0.11] dark:text-emerald-100',
  'border-amber-500/15 bg-amber-500/[0.07] text-amber-950 hover:bg-amber-500/[0.11] dark:text-amber-100',
];

function asRecord(value: unknown): UnknownRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

function text(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function identifier(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';
}

function imageURL(...values: unknown[]): string {
  for (const value of values) {
    const candidate = text(value);
    if (/^https?:\/\//i.test(candidate) || /^\/(?!\/)/.test(candidate)) {
      return candidate;
    }
  }
  return '';
}

function timestamp(...values: unknown[]): number | null {
  for (const value of values) {
    let parsed = Number.NaN;

    if (value instanceof Date) {
      parsed = value.getTime();
    } else if (typeof value === 'number') {
      parsed = value < 100_000_000_000 ? value * 1000 : value;
    } else if (typeof value === 'string' && value.trim()) {
      parsed = Date.parse(value);
    }

    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function stringList(value: unknown): string[] {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith('[')) {
      try {
        return stringList(JSON.parse(trimmed) as unknown);
      } catch {
        return [trimmed];
      }
    }

    return [trimmed];
  }

  if (Array.isArray(value)) {
    return Array.from(new Set(value.flatMap(stringList)));
  }

  const item = asRecord(value);
  const name = text(item.name, item.label, item.title, item.topic);
  return name ? [name] : [];
}

function normalizeCategories(value: unknown): CategoryDefinition[] {
  const entries: unknown[] = Array.isArray(value)
    ? value
    : Object.entries(asRecord(value)).map(([name, detail]) => ({
        name,
        ...asRecord(detail),
      }));

  return entries.flatMap((entry) => {
    if (typeof entry === 'string' && entry.trim()) {
      return [{ id: entry, name: entry.trim(), description: '' }];
    }

    const category = asRecord(entry);
    const name = text(category.name, category.title, category.label);
    if (!name) return [];

    return [
      {
        id: identifier(category.id) || name,
        name,
        description: text(category.description, category.summary),
      },
    ];
  });
}

function normalizeReel(
  original: Reel,
  index: number,
  categories: CategoryDefinition[],
): LibraryReel {
  const reel = asRecord(original);
  const creator = asRecord(reel.creator);
  const owner = asRecord(reel.owner);
  const author = asRecord(reel.author);
  const ai = asRecord(reel.ai);
  const metadata = asRecord(reel.metadata);
  const audio = asRecord(reel.audio ?? reel.music ?? reel.audioTrack);
  const captionRecord = asRecord(reel.caption);

  const username = text(
    creator.username,
    owner.username,
    author.username,
    reel.creatorUsername,
    reel.creator_username,
    reel.username,
    typeof reel.creator === 'string' ? reel.creator : '',
  ).replace(/^@/, '');

  const noteValue =
    reel.personalNote ??
    reel.personal_note ??
    reel.userNotes ??
    reel.user_notes ??
    reel.notes ??
    reel.note;

  const noteEntries = (Array.isArray(noteValue) ? noteValue : [noteValue])
    .map((value) => {
      const item = asRecord(value);
      return {
        content: text(value, item.content, item.text, item.note, item.body),
        date: timestamp(item.updatedAt, item.updated_at, item.createdAt, item.created_at),
      };
    })
    .filter((entry) => entry.content)
    .sort((a, b) => (b.date ?? 0) - (a.date ?? 0));

  const categoryNames = stringList(
    reel.categories ??
      reel.smartCategories ??
      reel.smart_categories ??
      reel.smartCategory ??
      reel.smart_category ??
      reel.category ??
      ai.categories ??
      ai.category,
  );

  const categoryIds = [
    reel.categoryId,
    reel.category_id,
    ...(Array.isArray(reel.categoryIds) ? reel.categoryIds : []),
  ]
    .map(identifier)
    .filter(Boolean);

  const resolvedCategories = Array.from(
    new Set([
      ...categoryNames.map(
        (name) => categories.find((category) => category.id === name)?.name ?? name,
      ),
      ...categories
        .filter((category) => categoryIds.includes(category.id))
        .map((category) => category.name),
    ]),
  );

  const savedAt = timestamp(
    reel.savedAt,
    reel.saved_at,
    reel.dateAdded,
    reel.date_added,
    reel.createdAt,
    reel.created_at,
  );

  const mediaType = text(
    reel.mediaType,
    reel.media_type,
    reel.type,
    reel.productType,
    reel.product_type,
  ).toLowerCase();

  return {
    original,
    id: identifier(reel.id) || identifier(reel.shortcode) || `saved-reel-${index}`,
    username,
    avatar: imageURL(
      creator.avatar,
      creator.avatarUrl,
      creator.avatar_url,
      creator.profilePictureUrl,
      creator.profile_pic_url,
      owner.profile_pic_url,
      author.avatar,
      reel.creatorAvatar,
      reel.creator_avatar,
      reel.creatorProfilePic,
      reel.profile_pic_url,
    ),
    thumbnail: imageURL(
      reel.thumbnail,
      reel.thumbnailUrl,
      reel.thumbnail_url,
      reel.coverUrl,
      reel.cover_url,
      reel.displayUrl,
      reel.display_url,
      reel.imageUrl,
      reel.image_url,
    ),
    verified:
      creator.isVerified === true ||
      creator.is_verified === true ||
      owner.is_verified === true ||
      reel.isVerified === true ||
      reel.is_verified === true,
    caption: text(
      reel.caption,
      captionRecord.text,
      reel.description,
      reel.title,
      ai.summary,
    ),
    note: noteEntries[0]?.content ?? '',
    categories: resolvedCategories,
    topics: stringList(
      reel.aiTopics ??
        reel.ai_topics ??
        reel.topics ??
        ai.topics ??
        metadata.topics,
    ),
    audio: text(
      reel.audio,
      reel.audioTitle,
      reel.audio_title,
      reel.audioName,
      reel.audio_name,
      reel.music,
      audio.title,
      audio.name,
      audio.song_name,
      audio.audio_title,
      audio.original_audio_title,
    ),
    savedAt,
    activityAt: noteEntries[0]?.date ?? savedAt,
    carousel:
      mediaType.includes('carousel') ||
      mediaType === 'sidecar' ||
      reel.isCarousel === true ||
      reel.is_carousel === true,
  };
}

function collectCreators(reels: LibraryReel[]): Creator[] {
  const creators = new Map<string, Creator>();

  for (const reel of reels) {
    if (!reel.username) continue;
    const key = reel.username.toLowerCase();
    const existing = creators.get(key);

    if (existing) {
      existing.count += 1;
      existing.avatar ||= reel.avatar;
      existing.verified ||= reel.verified;
    } else {
      creators.set(key, {
        username: reel.username,
        avatar: reel.avatar,
        verified: reel.verified,
        count: 1,
      });
    }
  }

  return [...creators.values()].sort(
    (a, b) => b.count - a.count || a.username.localeCompare(b.username),
  );
}

function daysBefore(time: number, days: number): number {
  const date = new Date(time);
  date.setDate(date.getDate() - days);
  return date.getTime();
}

function relativeTime(time: number | null, now: number | null): string {
  if (!time || !now) return 'Saved in your library';

  const minutes = Math.max(0, Math.floor((now - time) / 60_000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    ...(new Date(time).getFullYear() !== new Date(now).getFullYear()
      ? { year: 'numeric' as const }
      : {}),
  }).format(time);
}

function buildBuckets(
  reels: LibraryReel[],
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

    const items = reels.filter(
      (reel) =>
        reel.savedAt !== null &&
        reel.savedAt >= from.getTime() &&
        reel.savedAt < to.getTime() &&
        reel.savedAt <= now,
    );

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
      reels: items.filter((reel) => !reel.carousel).length,
      carousels: items.filter((reel) => reel.carousel).length,
      audio: items.filter((reel) => Boolean(reel.audio)).length,
      total: items.length,
    };
  });
}

function Avatar({
  username,
  src,
  className = 'h-10 w-10',
}: {
  username: string;
  src?: string;
  className?: string;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const canShowImage = Boolean(src && src !== failedSource);
  const initials = username.replace(/^@/, '').slice(0, 2).toUpperCase();

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-100 via-indigo-100 to-blue-100 font-semibold text-violet-700 dark:from-violet-500/20 dark:via-indigo-500/20 dark:to-blue-500/20 dark:text-violet-200 ${className}`}
      aria-hidden="true"
    >
      {canShowImage ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={() => setFailedSource(src ?? null)}
        />
      ) : (
        <span className="text-[0.7em]">{initials || <Users size={16} />}</span>
      )}
    </span>
  );
}

function Thumbnail({ reel }: { reel: LibraryReel }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);

  return (
    <span className="relative flex h-[76px] w-[58px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-100 to-indigo-50 dark:from-violet-500/20 dark:to-indigo-500/10">
      {reel.thumbnail && failedSource !== reel.thumbnail ? (
        <img
          src={reel.thumbnail}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedSource(reel.thumbnail)}
          className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
        />
      ) : (
        <Bookmark className="h-6 w-6 text-violet-400" aria-hidden="true" />
      )}
      <span className="absolute inset-0 bg-black/10" />
      <span className="absolute flex h-7 w-7 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white backdrop-blur-sm">
        <Play className="ml-0.5 h-3 w-3 fill-current" aria-hidden="true" />
      </span>
    </span>
  );
}

function EmptyState({
  icon: Icon = Bookmark,
  title,
  description,
}: {
  icon?: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center px-5 py-8 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/[0.08] text-violet-500">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        {title}
      </p>
      <p className="mt-1.5 max-w-64 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  badge,
  positive,
  loading,
}: {
  icon: typeof Bookmark;
  label: string;
  value: number;
  badge: string;
  positive: boolean;
  loading: boolean;
}) {
  return (
    <div className="rounded-[20px] border border-black/[0.04] bg-[#F8F9FA] p-5 dark:border-white/[0.04] dark:bg-[#1C1F26] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
        <Icon className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
      </div>
      <p className="mt-4 text-[clamp(2.25rem,4vw,3.25rem)] font-semibold leading-none tracking-[-0.065em] tabular-nums">
        {loading ? '—' : value.toLocaleString('en')}
      </p>
      <span
        className={`mt-4 inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium sm:text-[11px] ${
          positive
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
            : 'bg-black/[0.04] text-zinc-500 dark:bg-white/[0.05] dark:text-zinc-400'
        }`}
      >
        {positive && <TrendingUp className="h-3 w-3 shrink-0" aria-hidden="true" />}
        {loading ? 'Loading your library' : badge}
      </span>
    </div>
  );
}

function VelocityChart({
  buckets,
  loading,
}: {
  buckets: ActivityBucket[];
  loading: boolean;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const hasActivity = buckets.some((bucket) => bucket.total > 0);

  if (loading) {
    return (
      <div className="flex h-[228px] items-center justify-center text-sm text-zinc-500">
        Loading save activity…
      </div>
    );
  }

  if (!hasActivity) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No dated saves in this period"
        description="Save activity appears here when your library includes save timestamps."
      />
    );
  }

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

  const slotWidth = 320 / buckets.length;
  const barWidth = buckets.length === 7 ? 8 : 10;

  return (
    <div className="relative mt-4 pt-11">
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none absolute top-0 max-w-[95%] -translate-x-1/2 whitespace-nowrap rounded-xl bg-zinc-900 px-3 py-2 text-[10px] font-medium text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900"
        style={{
          left: `${Math.min(
            72,
            Math.max(28, ((activeIndex + 0.5) / buckets.length) * 100),
          )}%`,
        }}
      >
        {activeBucket.total} {activeBucket.total === 1 ? 'save' : 'saves'}
        <span className="mx-1.5 opacity-40">·</span>
        {activeBucket.audio} with audio
        <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-zinc-900 dark:bg-zinc-100" />
      </div>

      <svg
        viewBox="0 0 360 190"
        className="h-auto w-full overflow-visible"
        role="group"
        aria-label="Save activity. Focus a date to inspect its reel, audio, and carousel counts."
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <linearGradient id="reeldash-save-peak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>

        {[30, 65, 100, 135].map((y) => (
          <line
            key={y}
            x1="20"
            x2="340"
            y1={y}
            y2={y}
            className="stroke-black/[0.05] dark:stroke-white/[0.06]"
            strokeDasharray="3 5"
          />
        ))}

        {buckets.map((bucket, index) => {
          const center = 20 + slotWidth * (index + 0.5);
          const series = [
            { key: 'reels', value: bucket.reels, color: '#A78BFA' },
            { key: 'audio', value: bucket.audio, color: '#60A5FA' },
            { key: 'carousels', value: bucket.carousels, color: '#34D399' },
          ];

          return (
            <g
              key={bucket.fullLabel}
              tabIndex={0}
              role="img"
              aria-label={`${bucket.fullLabel}: ${bucket.reels} reels, ${bucket.carousels} carousels, ${bucket.audio} saves with audio`}
              onMouseEnter={() => setHoveredIndex(index)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
              className="outline-none"
            >
              <rect
                x={center - slotWidth / 2 + 2}
                y="16"
                width={slotWidth - 4}
                height="131"
                rx="8"
                className={
                  activeIndex === index
                    ? 'fill-violet-500/[0.05]'
                    : 'fill-transparent'
                }
              />
              {series.map((seriesItem, seriesIndex) => {
                const height = (seriesItem.value / maximum) * 108;
                return (
                  <rect
                    key={seriesItem.key}
                    x={center - (barWidth * 3 + 6) / 2 + seriesIndex * (barWidth + 3)}
                    y={135 - height}
                    width={barWidth}
                    height={height}
                    rx={Math.min(4, height / 2)}
                    fill={
                      seriesItem.key === 'reels' && index === peakIndex
                        ? 'url(#reeldash-save-peak)'
                        : seriesItem.color
                    }
                    opacity={activeIndex === index ? 1 : 0.55}
                    className="transition-opacity duration-200"
                  />
                );
              })}
              <text
                x={center}
                y="163"
                textAnchor="middle"
                fontSize="10"
                fontWeight={activeIndex === index ? 600 : 400}
                className={
                  activeIndex === index
                    ? 'fill-zinc-900 dark:fill-zinc-100'
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
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const auth = useAuth();
  const reelContext = useReels();

  const snapshot = reelContext as unknown as ReelsSnapshot;
  const sourceReels = Array.isArray(snapshot.reels) ? snapshot.reels : EMPTY_REELS;
  const loading = Boolean(snapshot.isLoading ?? snapshot.loading);
  const canSave = typeof snapshot.setIsSaveModalOpen === 'function';

  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [chartRange, setChartRange] = useState<ChartRange>('weekly');
  const [categoryQuery, setCategoryQuery] = useState('');
  const [activePlayerReel, setActivePlayerReel] = useState<Reel | null>(null);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === 'k' &&
        !event.altKey &&
        !event.repeat
      ) {
        event.preventDefault();
        router.push('/search');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [router]);

  const categoryDefinitions = useMemo(
    () => normalizeCategories(snapshot.smartCategories),
    [snapshot.smartCategories],
  );

  const library = useMemo(
    () =>
      sourceReels.map((reel, index) =>
        normalizeReel(reel, index, categoryDefinitions),
      ),
    [sourceReels, categoryDefinitions],
  );

  const creators = useMemo(() => collectCreators(library), [library]);

  const filteredReels = useMemo(() => {
    if (dateRange === 'all') return library;
    if (!now) return [];

    const cutoff = daysBefore(now, Number(dateRange));
    return library.filter(
      (reel) =>
        reel.savedAt !== null && reel.savedAt >= cutoff && reel.savedAt <= now,
    );
  }, [library, dateRange, now]);

  const filteredCreators = useMemo(
    () => collectCreators(filteredReels),
    [filteredReels],
  );

  const growth = useMemo(() => {
    if (dateRange === 'all' || !now) {
      return {
        saves: { label: 'In your personal vault', positive: false },
        creators: { label: 'Unique creators saved', positive: false },
      };
    }

    const days = Number(dateRange);
    const currentStart = daysBefore(now, days);
    const previousStart = daysBefore(now, days * 2);

    const previousReels = library.filter(
      (reel) =>
        reel.savedAt !== null &&
        reel.savedAt >= previousStart &&
        reel.savedAt < currentStart,
    );

    const describe = (current: number, previous: number) => {
      if (!previous) {
        return {
          label: current ? 'No saves in prior period' : 'No change this period',
          positive: false,
        };
      }

      const change = ((current - previous) / previous) * 100;
      return {
        label: `${change > 0 ? '+' : ''}${change.toFixed(1)}% vs. prior ${days} days`,
        positive: change > 0,
      };
    };

    return {
      saves: describe(filteredReels.length, previousReels.length),
      creators: describe(
        filteredCreators.length,
        collectCreators(previousReels).length,
      ),
    };
  }, [dateRange, now, library, filteredReels, filteredCreators]);

  const decks = useMemo<CategoryDeck[]>(() => {
    const groups = new Map<string, CategoryDeck>();

    for (const reel of library) {
      for (const name of reel.categories) {
        const key = name.toLowerCase();
        const existing = groups.get(key);
        if (existing) {
          existing.reels.push(reel);
        } else {
          const definition = categoryDefinitions.find(
            (category) => category.name.toLowerCase() === key,
          );
          groups.set(key, {
            name,
            description: definition?.description ?? '',
            reels: [reel],
            creators: [],
          });
        }
      }
    }

    return [...groups.values()]
      .map((deck) => ({
        ...deck,
        creators: collectCreators(deck.reels),
        description:
          deck.description ||
          Array.from(new Set(deck.reels.flatMap((reel) => reel.topics)))
            .slice(0, 2)
            .join(' · '),
      }))
      .sort((a, b) => b.reels.length - a.reels.length || a.name.localeCompare(b.name));
  }, [library, categoryDefinitions]);

  const visibleDecks = useMemo(
    () =>
      decks
        .filter((deck) =>
          `${deck.name} ${deck.description}`
            .toLowerCase()
            .includes(categoryQuery.trim().toLowerCase()),
        )
        .slice(0, 4),
    [decks, categoryQuery],
  );

  const coverage = useMemo(
    () => [
      {
        label: 'AI Semantic Topics',
        count: library.filter((reel) => reel.topics.length > 0).length,
        detail: 'with topics',
        icon: Sparkles,
        color: 'bg-violet-500',
      },
      {
        label: 'Categorized Saves',
        count: library.filter((reel) => reel.categories.length > 0).length,
        detail: 'categorized',
        icon: Folder,
        color: 'bg-blue-400',
      },
      {
        label: 'Audio Tracks Identified',
        count: library.filter((reel) => Boolean(reel.audio)).length,
        detail: 'with audio metadata',
        icon: Music2,
        color: 'bg-emerald-400',
      },
      {
        label: 'Personal Notes & Insights',
        count: library.filter((reel) => Boolean(reel.note)).length,
        detail: 'with personal notes',
        icon: Bookmark,
        color: 'bg-amber-400',
      },
    ],
    [library],
  );

  const highlights = useMemo(
    () =>
      [...library]
        .sort(
          (a, b) =>
            Number(Boolean(b.note)) - Number(Boolean(a.note)) ||
            (b.savedAt ?? 0) - (a.savedAt ?? 0),
        )
        .slice(0, 4),
    [library],
  );

  const recentActivity = useMemo(
    () =>
      [...library]
        .sort((a, b) => (b.activityAt ?? 0) - (a.activityAt ?? 0))
        .slice(0, 5),
    [library],
  );

  const buckets = useMemo(
    () => buildBuckets(library, chartRange, now),
    [library, chartRange, now],
  );

  const authRecord = asRecord(auth);
  const user = asRecord(authRecord.user);
  const profile = asRecord(authRecord.profile);
  const userMetadata = asRecord(user.user_metadata);
  const fullName = text(
    profile.firstName,
    profile.first_name,
    user.firstName,
    user.first_name,
    user.displayName,
    user.name,
    profile.full_name,
    userMetadata.full_name,
    userMetadata.name,
    user.username,
    userMetadata.username,
  );
  const firstName = fullName.split(/\s+/)[0] || '';
  const hour = now ? new Date(now).getHours() : null;
  const greeting =
    hour === null
      ? 'Welcome back'
      : hour < 12
        ? 'Good morning'
        : hour < 18
          ? 'Good afternoon'
          : 'Good evening';

  const latestActivity = recentActivity[0]?.activityAt ?? null;

  const openSave = () => {
    if (snapshot.setIsSaveModalOpen) {
      snapshot.setIsSaveModalOpen(true);
    } else {
      router.push('/reels');
    }
  };

  const playerProps = activePlayerReel
    ? ({
        reel: activePlayerReel,
        isOpen: true,
        onClose: () => setActivePlayerReel(null),
      } as React.ComponentProps<typeof ReelPlayerModal>)
    : null;

  return (
    <main
      className="min-h-full bg-[#F6F7F9] text-zinc-900 dark:bg-[#101216] dark:text-zinc-100"
      aria-label="ReelDash dashboard"
      aria-busy={loading}
    >
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        <header className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-violet-500/10 bg-violet-500/[0.06] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-violet-700 dark:text-violet-300">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              Reel Memory Vault
            </div>
            <h1 className="text-2xl font-semibold tracking-[-0.045em] sm:text-3xl lg:text-[34px]">
              {greeting}
              {firstName ? `, ${firstName}` : ''}.
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              Your best finds, connected. Pick up where inspiration left off.
            </p>
          </div>

          <div className="flex w-full items-center gap-2.5 xl:w-auto">
            <Link
              href="/search"
              aria-label="Search your vault. Command or Control K."
              className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-black/[0.08] bg-white px-4 py-3.5 text-sm text-zinc-500 shadow-sm transition-colors hover:border-violet-500/30 dark:border-white/[0.08] dark:bg-[#16181D] dark:text-zinc-400 xl:w-64 ${FOCUS_CLASS}`}
            >
              <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">Search your vault</span>
              <kbd
                className="ml-auto hidden shrink-0 items-center gap-0.5 rounded-md border border-black/[0.07] bg-[#F8F9FA] px-1.5 py-0.5 font-sans text-[10px] text-zinc-400 dark:border-white/[0.08] dark:bg-[#1C1F26] sm:inline-flex"
                aria-hidden="true"
              >
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </Link>
            <button
              type="button"
              onClick={openSave}
              className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_4px_16px_-4px_rgba(124,58,237,0.45)] transition-colors hover:bg-violet-700 active:bg-violet-800 sm:px-5 ${FOCUS_CLASS}`}
            >
              {canSave ? (
                <Plus className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Bookmark className="h-4 w-4" aria-hidden="true" />
              )}
              {canSave ? 'Save Reel' : 'Explore Library'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
          <section
            aria-labelledby="vault-overview-title"
            className={`${CARD_CLASS} p-5 sm:p-6 lg:col-span-8`}
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 id="vault-overview-title" className="text-base font-semibold tracking-tight">
                  Vault Overview
                </h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  A little less scrolling. A lot more remembering.
                </p>
              </div>
              <div
                role="group"
                aria-label="Overview date range"
                className="inline-flex w-fit max-w-full rounded-full bg-[#F8F9FA] p-1 dark:bg-[#1C1F26]"
              >
                {(
                  [
                    ['all', 'All Time'],
                    ['30', 'Last 30 Days'],
                    ['7', 'Last 7 Days'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={dateRange === value}
                    onClick={() => setDateRange(value)}
                    className={`rounded-full px-3 py-2 text-[10px] font-medium transition-colors sm:text-[11px] ${FOCUS_CLASS} ${
                      dateRange === value
                        ? 'bg-white text-zinc-900 shadow-sm dark:bg-[#2A2E38] dark:text-white'
                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:gap-4">
              <Metric
                icon={Bookmark}
                label="Saved Reels & Media"
                value={filteredReels.length}
                badge={growth.saves.label}
                positive={growth.saves.positive}
                loading={loading}
              />
              <Metric
                icon={Users}
                label="Tracked Creators"
                value={filteredCreators.length}
                badge={growth.creators.label}
                positive={growth.creators.positive}
                loading={loading}
              />
            </div>

            <div className="mt-6 border-t border-black/[0.06] pt-5 dark:border-white/[0.06]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {loading ? '—' : creators.length.toLocaleString('en')}
                  </span>{' '}
                  {creators.length === 1 ? 'creator' : 'creators'} saved in your library
                </p>
                <Link
                  href="/reels"
                  className={`inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-300 ${FOCUS_CLASS}`}
                >
                  Explore creators
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>

              {creators.length > 0 ? (
                <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
                  {creators.slice(0, 10).map((creator) => (
                    <Link
                      key={creator.username.toLowerCase()}
                      href={`/creator/${encodeURIComponent(creator.username)}`}
                      aria-label={`Explore @${creator.username}, ${creator.count} saved items`}
                      title={`@${creator.username} · ${creator.count} saved`}
                      className={`group flex w-14 shrink-0 flex-col items-center gap-2 rounded-xl ${FOCUS_CLASS}`}
                    >
                      <span className="rounded-full border border-transparent p-0.5 transition-colors group-hover:border-violet-400/60">
                        <Avatar
                          username={creator.username}
                          src={creator.avatar}
                          className="h-11 w-11 text-lg"
                        />
                      </span>
                      <span className="w-full truncate text-center text-[10px] text-zinc-500 transition-colors group-hover:text-violet-600 dark:text-zinc-400 dark:group-hover:text-violet-300">
                        @{creator.username}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-5 pb-2 text-xs leading-5 text-zinc-400">
                  {loading
                    ? 'Loading saved creators…'
                    : 'Creators appear here as you save their reels.'}
                </p>
              )}
            </div>
          </section>

          <section
            aria-labelledby="save-velocity-title"
            className={`${CARD_CLASS} flex flex-col p-5 sm:p-6 lg:col-span-4`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="save-velocity-title" className="text-base font-semibold tracking-tight">
                Save Velocity
              </h2>
              <div
                role="group"
                aria-label="Save activity date range"
                className="flex rounded-full bg-[#F8F9FA] p-1 dark:bg-[#1C1F26]"
              >
                {(['weekly', 'monthly'] as const).map((range) => (
                  <button
                    key={range}
                    type="button"
                    aria-pressed={chartRange === range}
                    onClick={() => setChartRange(range)}
                    className={`rounded-full px-2.5 py-1.5 text-[10px] font-medium capitalize transition-colors ${FOCUS_CLASS} ${
                      chartRange === range
                        ? 'bg-white shadow-sm dark:bg-[#2A2E38]'
                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {chartRange === 'weekly' ? 'Your last 7 days of saves.' : 'Your last 30 days, in 5-day groups.'}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {[
                { label: 'Reels', color: 'bg-violet-400' },
                { label: 'Audio', color: 'bg-blue-400' },
                { label: 'Carousels', color: 'bg-emerald-400' },
              ].map((series) => (
                <span
                  key={series.label}
                  className="inline-flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400"
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${series.color}`} />
                  {series.label}
                </span>
              ))}
            </div>

            <div className="my-auto">
              <VelocityChart buckets={buckets} loading={loading} />
            </div>
            <p className="mt-2 border-t border-black/[0.05] pt-3 text-[10px] leading-4 text-zinc-400 dark:border-white/[0.05] dark:text-zinc-500">
              Audio counts saves with identified tracks, including reels and carousels.
            </p>
          </section>

          <section
            aria-labelledby="smart-categories-title"
            className={`${CARD_CLASS} flex flex-col p-5 sm:p-6 lg:col-span-4`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 id="smart-categories-title" className="text-base font-semibold tracking-tight">
                  Smart Categories
                </h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Topic stacks derived from your saves.
                </p>
              </div>
              <Link
                href="/categories"
                className={`inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-300 ${FOCUS_CLASS}`}
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-4">
              <input
                type="text"
                value={categoryQuery}
                onChange={(e) => setCategoryQuery(e.target.value)}
                placeholder="Filter categories…"
                className="w-full rounded-xl border border-black/[0.08] bg-[#F8F9FA] px-3.5 py-2 text-xs text-zinc-800 placeholder-zinc-400 outline-none transition-colors focus:border-violet-500/40 focus:bg-white dark:border-white/[0.08] dark:bg-[#1C1F26] dark:text-zinc-200 dark:placeholder-zinc-500 dark:focus:bg-[#16181D]"
              />
            </div>

            <div className="mt-4 flex flex-1 flex-col gap-3">
              {visibleDecks.length > 0 ? (
                visibleDecks.map((deck, idx) => {
                  const colorClass = DECK_COLORS[idx % DECK_COLORS.length];
                  return (
                    <Link
                      key={deck.name}
                      href={`/reels?category=${encodeURIComponent(deck.name)}`}
                      className={`group flex items-center justify-between rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 ${colorClass} ${FOCUS_CLASS}`}
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-semibold tracking-tight">
                            {deck.name}
                          </h3>
                          <span className="shrink-0 rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold dark:bg-white/10">
                            {deck.reels.length}
                          </span>
                        </div>
                        {deck.description && (
                          <p className="mt-1 truncate text-xs opacity-75">
                            {deck.description}
                          </p>
                        )}
                      </div>

                      {/* Stacked creator avatars */}
                      {deck.creators.length > 0 && (
                        <div className="flex shrink-0 -space-x-2 overflow-hidden">
                          {deck.creators.slice(0, 3).map((creator) => (
                            <Avatar
                              key={creator.username}
                              username={creator.username}
                              src={creator.avatar}
                              className="h-7 w-7 ring-2 ring-white dark:ring-[#16181D]"
                            />
                          ))}
                        </div>
                      )}
                    </Link>
                  );
                })
              ) : (
                <EmptyState
                  icon={Folder}
                  title="No categories matched"
                  description={categoryQuery ? "Try a different search query." : "Save reels to see smart category decks form."}
                />
              )}
            </div>
          </section>

          <section
            aria-labelledby="curation-health-title"
            className={`${CARD_CLASS} flex flex-col p-5 sm:p-6 lg:col-span-4`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 id="curation-health-title" className="text-base font-semibold tracking-tight">
                  Curation Health & AI
                </h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Automated tagging and indexing coverage.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Active
              </span>
            </div>

            <div className="mt-6 flex flex-1 flex-col justify-around gap-4">
              {coverage.map((item) => {
                const total = library.length || 1;
                const percent = Math.min(100, Math.round((item.count / total) * 100));
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-xl border border-black/[0.04] bg-[#F8F9FA] p-3.5 dark:border-white/[0.04] dark:bg-[#1C1F26]">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-black/[0.04] text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          {item.label}
                        </span>
                      </div>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {percent}%
                      </span>
                    </div>

                    <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <p className="mt-2 text-[10px] text-zinc-400 dark:text-zinc-500">
                      {item.count.toLocaleString('en')} of {library.length.toLocaleString('en')} {item.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section
            aria-labelledby="top-curations-title"
            className={`${CARD_CLASS} flex flex-col p-5 sm:p-6 lg:col-span-4`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 id="top-curations-title" className="text-base font-semibold tracking-tight">
                  Top Curations
                </h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Priority reels from your library.
                </p>
              </div>
              <Link
                href="/reels"
                className={`inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-300 ${FOCUS_CLASS}`}
              >
                View library
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-5 flex flex-1 flex-col gap-3">
              {highlights.length > 0 ? (
                highlights.map((reel) => (
                  <div
                    key={reel.id}
                    onClick={() => setActivePlayerReel(reel.original)}
                    className="group flex cursor-pointer items-center gap-3.5 rounded-2xl border border-black/[0.04] bg-[#F8F9FA] p-2.5 transition-all duration-200 hover:border-black/[0.1] hover:bg-white hover:shadow-sm dark:border-white/[0.04] dark:bg-[#1C1F26] dark:hover:border-white/[0.1] dark:hover:bg-[#20232B]"
                  >
                    <Thumbnail reel={reel} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-semibold text-zinc-800 transition-colors group-hover:text-violet-600 dark:text-zinc-200 dark:group-hover:text-violet-400">
                          @{reel.username || 'creator'}
                        </span>
                        {reel.verified && (
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" title="Verified" />
                        )}
                      </div>

                      <p className="mt-1 line-clamp-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        {reel.note ? `“${reel.note}”` : reel.caption || 'Saved Reel'}
                      </p>

                      <div className="mt-1.5 flex items-center gap-2">
                        {reel.audio && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-medium text-blue-600 dark:text-blue-400">
                            <Music2 className="h-2.5 w-2.5" />
                            <span className="max-w-[100px] truncate">{reel.audio}</span>
                          </span>
                        )}
                        {reel.categories[0] && (
                          <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[9px] font-medium text-violet-600 dark:text-violet-400">
                            {reel.categories[0]}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5" />
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={Bookmark}
                  title="No saved reels"
                  description="Your top curated reels will be showcased here."
                />
              )}
            </div>
          </section>

          <section
            aria-labelledby="recent-activity-title"
            className={`${CARD_CLASS} p-5 sm:p-6 lg:col-span-12`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 id="recent-activity-title" className="text-base font-semibold tracking-tight">
                  Recent Activity & Notes
                </h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Latest saves, annotations, and curator activity.
                </p>
              </div>
              <Link
                href="/reels"
                className={`inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-300 ${FOCUS_CLASS}`}
              >
                View all activity
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-6 divide-y divide-black/[0.04] dark:divide-white/[0.04]">
              {recentActivity.length > 0 ? (
                recentActivity.map((reel) => (
                  <div
                    key={reel.id}
                    onClick={() => setActivePlayerReel(reel.original)}
                    className="group flex cursor-pointer items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0 transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.015] rounded-xl px-2"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Avatar
                        username={reel.username}
                        src={reel.avatar}
                        className="h-10 w-10 text-sm ring-1 ring-black/5 dark:ring-white/10"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-xs font-semibold text-zinc-900 group-hover:text-violet-600 dark:text-zinc-100 dark:group-hover:text-violet-400">
                            @{reel.username || 'creator'}
                          </span>
                          {reel.categories[0] && (
                            <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                              {reel.categories[0]}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {reel.note ? (
                            <span className="text-zinc-700 dark:text-zinc-300 font-medium">Note: {reel.note}</span>
                          ) : (
                            reel.caption || 'Saved Reel'
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 text-right">
                      <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-400">
                        <Clock className="h-3 w-3" />
                        <span>{relativeTime(reel.activityAt, now)}</span>
                      </div>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.04] text-zinc-600 transition-colors group-hover:bg-violet-600 group-hover:text-white dark:bg-white/[0.06] dark:text-zinc-300">
                        <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={Clock}
                  title="No recent activity"
                  description="New saves and personal annotations will populate here."
                />
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Reel Player Modal */}
      {playerProps && (
        <ReelPlayerModal
          reel={playerProps.reel}
          isOpen={playerProps.isOpen}
          onClose={playerProps.onClose}
        />
      )}
    </main>
  );
}