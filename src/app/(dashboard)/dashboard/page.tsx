'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Film,
  Image as ImageIcon,
  Music2,
  Heart,
  Search,
  Plus,
  Play,
  ArrowRight,
  Loader2,
  Grid2X2,
  List,
  LayoutGrid,
  Check,
  X,
} from 'lucide-react';

import { useReels } from '@/context/ReelContext';
import { ReelGrid } from '@/components/reels/ReelGrid';
import { ReelPlayerModal } from '@/components/reels/ReelPlayerModal';
import type { Reel, ViewMode, SortOption } from '@/types/reel';

type MediaFilter = 'all' | 'reels' | 'posts' | 'audio';
type LibrarySort = 'newest' | 'oldest' | 'creator';
type SaveFeedback = {
  kind: 'success' | 'error';
  message: string;
} | null;

type ReelDetails = {
  reel: Reel;
  id: string;
  thumbnail: string;
  creator: string;
  title: string;
  searchText: string;
  mediaType: Exclude<MediaFilter, 'all'>;
  timestamp: number;
  duration: string;
};

const hairline = 'border-black/[0.07] dark:border-white/[0.08]';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E47C7]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAF9] dark:focus-visible:ring-[#CBB5FD]/60 dark:focus-visible:ring-offset-[#101012]';

const neutralControl =
  'border border-black/[0.07] bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 dark:border-white/[0.08] dark:bg-[#171719] dark:text-zinc-400 dark:hover:bg-white/[0.05] dark:hover:text-zinc-100';

const primaryButton =
  'bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white';

const mediaFilters = [
  {
    value: 'reels',
    label: 'Reels',
    icon: Film,
    classes:
      'bg-[#F3EEFF] text-[#6E47C7] border-[#DDD1F9] dark:bg-[#1D172B] dark:text-[#CBB5FD] dark:border-[#382B54]',
  },
  {
    value: 'posts',
    label: 'Posts',
    icon: ImageIcon,
    classes:
      'bg-[#FFF1F2] text-[#A64662] border-[#F6D4DE] dark:bg-[#27151C] dark:text-[#EDA6BF] dark:border-[#492534]',
  },
  {
    value: 'audio',
    label: 'Audio',
    icon: Music2,
    classes:
      'bg-[#F0FDF4] text-[#286641] border-[#CCEBD7] dark:bg-[#101C15] dark:text-[#80CFA0] dark:border-[#1E3B29]',
  },
] as const;

const viewOptions = [
  { value: 'grid', label: 'Grid', icon: Grid2X2 },
  { value: 'list', label: 'List', icon: List },
  { value: 'feed', label: 'Feed stream', icon: LayoutGrid },
] as const;

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function normalizeMediaType(value: unknown): MediaFilter {
  const type = String(value ?? 'all').toLowerCase();

  if (type === 'all') return 'all';
  if (/audio|music|sound/.test(type)) return 'audio';
  if (/post|image|photo|carousel|sidecar/.test(type)) return 'posts';

  return 'reels';
}

function normalizeSort(value: unknown): LibrarySort {
  const sort = String(value ?? '').toLowerCase();

  if (/oldest|date-asc|created-asc/.test(sort)) return 'oldest';
  if (/creator|author|username/.test(sort)) return 'creator';

  return 'newest';
}

function getTimestamp(value: unknown): number {
  if (value instanceof Date) return value.getTime();

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 1_000_000_000_000 ? value * 1000 : value;
  }

  if (typeof value === 'string') {
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  return 0;
}

function formatDuration(value: unknown): string {
  if (typeof value === 'string' && /^\d+:\d{2}(:\d{2})?$/.test(value)) {
    return value;
  }

  const seconds =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : 0;

  if (!Number.isFinite(seconds) || seconds <= 0) return '';

  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainder = String(total % 60).padStart(2, '0');

  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${remainder}`
    : `${minutes}:${remainder}`;
}

function getReelDetails(reel: Reel): ReelDetails {
  const data = asRecord(reel);
  const author = asRecord(data.author);
  const creatorData = asRecord(data.creator);
  const owner = asRecord(data.owner);
  const user = asRecord(data.user);

  const creator =
    firstText(
      data.username,
      data.creatorUsername,
      data.authorUsername,
      author.username,
      creatorData.username,
      owner.username,
      user.username,
      data.creator,
      data.author,
    ).replace(/^@/, '') || 'instagram';

  const title = firstText(data.title, data.caption, data.description);
  const tags = Array.isArray(data.tags)
    ? data.tags
        .map((tag) =>
          typeof tag === 'string' ? tag : firstText(asRecord(tag).name),
        )
        .join(' ')
    : '';

  const mediaType = normalizeMediaType(
    data.mediaType ?? data.media_type ?? data.type ?? 'reel',
  );

  return {
    reel,
    id: String(data.id ?? ''),
    thumbnail: firstText(
      data.thumbnailUrl,
      data.thumbnail_url,
      data.thumbnail,
      data.coverUrl,
      data.coverImage,
      data.imageUrl,
      data.displayUrl,
      data.display_url,
    ),
    creator,
    title,
    searchText: `${creator} ${title} ${tags}`.toLocaleLowerCase(),
    mediaType: mediaType === 'all' ? 'reels' : mediaType,
    timestamp: getTimestamp(
      data.savedAt ??
        data.saved_at ??
        data.createdAt ??
        data.created_at ??
        data.timestamp,
    ),
    duration: formatDuration(
      data.duration ?? data.durationSeconds ?? data.videoDuration,
    ),
  };
}

function getFavoriteIds(value: unknown): Set<string> {
  const entries: unknown[] =
    value instanceof Set
      ? Array.from(value)
      : Array.isArray(value)
        ? value
        : [];

  return new Set(
    entries
      .map((entry) => {
        if (typeof entry === 'string' || typeof entry === 'number') {
          return String(entry);
        }

        const record = asRecord(entry);
        return String(record.reelId ?? record.id ?? '');
      })
      .filter(Boolean),
  );
}

function parseInstagramLink(
  input: string,
): { url: string; type: 'reels' | 'posts' } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const candidate = /^(?:www\.)?instagram\.com\//i.test(trimmed)
    ? `https://${trimmed}`
    : trimmed;

  try {
    const url = new URL(candidate);

    if (
      !['https:', 'http:'].includes(url.protocol) ||
      !['instagram.com', 'www.instagram.com', 'm.instagram.com'].includes(
        url.hostname.toLowerCase(),
      ) ||
      url.username ||
      url.password ||
      url.port
    ) {
      return null;
    }

    const match = url.pathname.match(
      /^\/(reel|reels|p|tv)\/([a-zA-Z0-9_-]+)\/?$/,
    );

    if (!match) return null;

    const path = match[1] === 'reels' ? 'reel' : match[1];

    return {
      url: `https://www.instagram.com/${path}/${match[2]}/`,
      type: path === 'p' ? 'posts' : 'reels',
    };
  } catch {
    return null;
  }
}

function CaptureCard({
  item,
  index,
  onOpen,
  reduceMotion,
}: {
  item: ReelDetails;
  index: number;
  onOpen: () => void;
  reduceMotion: boolean;
}) {
  const [failedThumbnail, setFailedThumbnail] = useState(false);
  const MediaIcon =
    item.mediaType === 'audio'
      ? Music2
      : item.mediaType === 'posts'
        ? ImageIcon
        : Film;

  useEffect(() => {
    setFailedThumbnail(false);
  }, [item.thumbnail]);

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      aria-label={`Open ${item.mediaType === 'posts' ? 'post' : item.mediaType === 'audio' ? 'audio' : 'reel'} by @${item.creator}`}
      className={`group relative aspect-[9/16] w-[144px] shrink-0 snap-start overflow-hidden rounded-2xl bg-zinc-900 text-left shadow-[0_3px_12px_rgba(0,0,0,0.06)] sm:w-[160px] xl:w-[176px] ${focusRing}`}
    >
      {item.thumbnail && !failedThumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumbnail}
          alt=""
          loading={index < 2 ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          onError={() => setFailedThumbnail(true)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.045] motion-reduce:transition-none"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_top_left,_#51445F_0%,_#29282D_45%,_#171719_100%)]">
          <MediaIcon
            aria-hidden="true"
            className="h-9 w-9 text-white/25"
            strokeWidth={1.25}
          />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-black/20" />
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />

      <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-black/25 text-white/90 backdrop-blur-md">
          <MediaIcon aria-hidden="true" className="h-3.5 w-3.5" />
        </span>

        {item.duration && (
          <span className="rounded-md border border-white/10 bg-black/35 px-1.5 py-1 text-[10px] font-medium tabular-nums leading-none text-white backdrop-blur-md">
            {item.duration}
          </span>
        )}
      </div>

      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-11 w-11 translate-y-2 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white opacity-0 shadow-lg backdrop-blur-md transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 motion-reduce:transform-none motion-reduce:transition-none">
          <Play
            aria-hidden="true"
            className="ml-0.5 h-4 w-4 fill-current"
            strokeWidth={1.5}
          />
        </span>
      </span>

      <div className="absolute inset-x-3 bottom-3.5">
        <p className="truncate text-[12px] font-semibold tracking-[-0.01em] text-white">
          @{item.creator}
        </p>
        {item.title && (
          <p className="mt-1 line-clamp-2 text-[11px] leading-[1.45] text-white/65">
            {item.title}
          </p>
        )}
      </div>
    </motion.button>
  );
}

export default function DashboardPage() {
  const {
    reels,
    favorites,
    saveReel,
    activeMediaType,
    setActiveMediaType,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    viewMode,
    setViewMode,
    gridCols,
    setGridCols,
    setIsSaveModalOpen,
    setIsCommandPaletteOpen,
  } = useReels();

  const reduceMotion = Boolean(useReducedMotion());
  const [ingestUrl, setIngestUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);

  const ingestRef = useRef<HTMLInputElement>(null);
  const saveLockRef = useRef(false);
  const mountedRef = useRef(false);

  const parsedLink = useMemo(
    () => parseInstagramLink(ingestUrl),
    [ingestUrl],
  );

  const details = useMemo(() => reels.map(getReelDetails), [reels]);
  const favoriteIds = useMemo(() => getFavoriteIds(favorites), [favorites]);
  const selectedMediaType = normalizeMediaType(activeMediaType);
  const selectedSort = normalizeSort(sortOption);
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

  const recentCaptures = useMemo(
    () =>
      [...details]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 6),
    [details],
  );

  const filteredReels = useMemo(() => {
    const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);

    return details
      .filter((item) => {
        if (
          selectedMediaType !== 'all' &&
          item.mediaType !== selectedMediaType
        ) {
          return false;
        }

        if (favoritesOnly && !favoriteIds.has(item.id)) return false;

        return queryTerms.every((term) => item.searchText.includes(term));
      })
      .sort((a, b) => {
        if (selectedSort === 'oldest') {
          return a.timestamp - b.timestamp;
        }

        if (selectedSort === 'creator') {
          return (
            a.creator.localeCompare(b.creator, undefined, {
              sensitivity: 'base',
              numeric: true,
            }) || b.timestamp - a.timestamp
          );
        }

        return b.timestamp - a.timestamp;
      })
      .map((item) => item.reel);
  }, [
    details,
    normalizedQuery,
    selectedMediaType,
    favoritesOnly,
    favoriteIds,
    selectedSort,
  ]);

  const hasFilters =
    Boolean(normalizedQuery) ||
    selectedMediaType !== 'all' ||
    favoritesOnly;

  const DetectedMediaIcon = parsedLink?.type === 'posts' ? ImageIcon : Film;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (saveFeedback?.kind !== 'success') return;

    const timeout = window.setTimeout(() => setSaveFeedback(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [saveFeedback]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        event.key.toLowerCase() === 'k'
      ) {
        event.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    }

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [setIsCommandPaletteOpen]);

  function focusIngest() {
    ingestRef.current?.focus();
    ingestRef.current?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'center',
    });
  }

  function clearFilters() {
    setSearchQuery('');
    setFavoritesOnly(false);
    setActiveMediaType('all' as typeof activeMediaType);
  }

  async function handleQuickSave() {
    if (saveLockRef.current) return;

    const link = parseInstagramLink(ingestUrl);

    if (!link) {
      setSaveFeedback({
        kind: 'error',
        message: 'Enter a valid Instagram reel or post link.',
      });
      ingestRef.current?.focus();
      return;
    }

    saveLockRef.current = true;
    setIsSaving(true);
    setSaveFeedback(null);

    try {
      const result: unknown = await saveReel(link.url);
      const response = asRecord(result);

      if (
        result === false ||
        response.success === false ||
        Boolean(response.error)
      ) {
        throw new Error('Save failed');
      }

      if (!mountedRef.current) return;

      setIngestUrl('');
      setSaveFeedback({
        kind: 'success',
        message: 'Saved to your library.',
      });
    } catch {
      if (!mountedRef.current) return;

      setSaveFeedback({
        kind: 'error',
        message: 'Could not save this link. Please try again.',
      });
    } finally {
      saveLockRef.current = false;
      if (mountedRef.current) setIsSaving(false);
    }
  }

  return (
    <div className="min-h-full min-w-0 bg-[#FAFAF9] text-zinc-950 dark:bg-[#101012] dark:text-zinc-100">
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-4 pb-16 pt-7 sm:px-7 sm:pt-9 lg:px-9 xl:px-11">
        <header>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[28px] font-bold leading-tight tracking-[-0.045em] sm:text-[32px]">
                Dashboard
              </h1>

              <span className="rounded-full border border-[#DDD1F9] bg-[#F3EEFF] px-2.5 py-1 text-[11px] font-medium tabular-nums text-[#6E47C7] dark:border-[#382B54] dark:bg-[#1D172B] dark:text-[#CBB5FD]">
                {reels.length.toLocaleString()} saved
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsSaveModalOpen(true)}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-semibold transition-colors ${primaryButton} ${focusRing}`}
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              Save Reel
            </button>
          </div>

          <div className="mt-6 grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1.55fr)_minmax(240px,1fr)]">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleQuickSave();
              }}
              aria-label="Save an Instagram link"
              aria-busy={isSaving}
              className={`flex h-[54px] min-w-0 items-center gap-2 rounded-xl border bg-white py-1.5 pl-3.5 pr-1.5 shadow-[0_2px_5px_rgba(0,0,0,0.015)] transition-[border-color,box-shadow] focus-within:border-[#BCA4EB] focus-within:ring-2 focus-within:ring-[#6E47C7]/10 dark:bg-[#171719] dark:focus-within:border-[#71539F] dark:focus-within:ring-[#CBB5FD]/10 ${
                saveFeedback?.kind === 'error'
                  ? 'border-rose-300 dark:border-rose-900'
                  : hairline
              }`}
            >
              <DetectedMediaIcon
                aria-hidden="true"
                className={`h-[18px] w-[18px] shrink-0 ${
                  parsedLink
                    ? 'text-[#6E47C7] dark:text-[#CBB5FD]'
                    : 'text-zinc-400 dark:text-zinc-500'
                }`}
              />

              <label htmlFor="dashboard-ingest" className="sr-only">
                Instagram link
              </label>
              <input
                ref={ingestRef}
                id="dashboard-ingest"
                type="text"
                inputMode="url"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                value={ingestUrl}
                disabled={isSaving}
                onChange={(event) => {
                  setIngestUrl(event.target.value);
                  setSaveFeedback(null);
                }}
                placeholder="Paste an Instagram link..."
                aria-invalid={saveFeedback?.kind === 'error'}
                aria-describedby="dashboard-ingest-feedback"
                className="h-full min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-zinc-400 disabled:opacity-60 dark:placeholder:text-zinc-500"
              />

              <button
                type="submit"
                disabled={isSaving || !ingestUrl.trim()}
                className={`inline-flex h-10 min-w-[86px] shrink-0 items-center justify-center gap-2 rounded-lg border border-[#DDD1F9] bg-[#F3EEFF] px-3 text-[12px] font-semibold text-[#6E47C7] transition-colors hover:bg-[#EAE0FF] disabled:cursor-not-allowed disabled:opacity-45 dark:border-[#382B54] dark:bg-[#1D172B] dark:text-[#CBB5FD] dark:hover:bg-[#2A203D] ${focusRing}`}
              >
                {isSaving ? (
                  <>
                    <Loader2
                      aria-hidden="true"
                      className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none"
                    />
                    Saving
                  </>
                ) : (
                  <>
                    Save
                    <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>

            <div
              role="search"
              className={`flex h-[54px] min-w-0 items-center gap-2.5 rounded-xl border bg-white px-3.5 transition-[border-color,box-shadow] focus-within:border-[#BCA4EB] focus-within:ring-2 focus-within:ring-[#6E47C7]/10 dark:bg-[#171719] dark:focus-within:border-[#71539F] ${hairline}`}
            >
              <Search
                aria-hidden="true"
                className="h-[17px] w-[17px] shrink-0 text-zinc-400 dark:text-zinc-500"
              />

              <label htmlFor="dashboard-search" className="sr-only">
                Search saves
              </label>
              <input
                id="dashboard-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search saves..."
                autoComplete="off"
                className="h-full min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 [&::-webkit-search-cancel-button]:appearance-none"
              />

              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200 ${focusRing}`}
                >
                  <X aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCommandPaletteOpen(true)}
                  aria-label="Open command palette"
                  aria-keyshortcuts="Meta+k Control+k"
                  title="Open command palette"
                  className={`shrink-0 rounded-md border px-1.5 py-1 text-[10px] leading-none text-zinc-400 transition-colors hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 ${hairline} ${focusRing}`}
                >
                  <kbd className="font-sans">⌘ K</kbd>
                </button>
              )}
            </div>
          </div>

          <div
            id="dashboard-ingest-feedback"
            aria-live="polite"
            aria-atomic="true"
          >
            <AnimatePresence initial={false}>
              {saveFeedback && (
                <motion.div
                  key={saveFeedback.kind}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.18 }}
                  className="overflow-hidden"
                >
                  <p
                    className={`flex items-center gap-1.5 pt-2.5 text-[12px] ${
                      saveFeedback.kind === 'error'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-[#286641] dark:text-[#80CFA0]'
                    }`}
                  >
                    {saveFeedback.kind === 'success' ? (
                      <Check aria-hidden="true" className="h-3.5 w-3.5" />
                    ) : (
                      <X aria-hidden="true" className="h-3.5 w-3.5" />
                    )}
                    {saveFeedback.message}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {recentCaptures.length > 0 && (
          <section
            aria-labelledby="recent-captures-heading"
            className="mt-9 min-w-0"
          >
            <div className="mb-3.5 flex items-center justify-between gap-4">
              <h2
                id="recent-captures-heading"
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400"
              >
                Recently captured
              </h2>

              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                Latest {recentCaptures.length}
              </span>
            </div>

            <div
              role="region"
              aria-label="Recently captured media"
              tabIndex={0}
              className={`-mx-1 flex snap-x snap-proximity gap-3 overflow-x-auto overscroll-x-contain rounded-xl px-1 pb-4 pt-1 [scrollbar-width:thin] [scrollbar-color:rgba(128,128,128,0.2)_transparent] sm:gap-3.5 ${focusRing}`}
            >
              {recentCaptures.map((item, index) => (
                <CaptureCard
                  key={item.id}
                  item={item}
                  index={index}
                  reduceMotion={reduceMotion}
                  onOpen={() => setSelectedReel(item.reel)}
                />
              ))}
            </div>
          </section>
        )}

        <section
          aria-labelledby="library-heading"
          className={recentCaptures.length ? 'mt-6' : 'mt-10'}
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-2.5">
              <h2
                id="library-heading"
                className="text-[18px] font-semibold tracking-[-0.035em]"
              >
                Your library
              </h2>

              <span
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="text-[12px] tabular-nums text-zinc-400 dark:text-zinc-500"
              >
                <span className="sr-only">Matching saves: </span>
                {filteredReels.length.toLocaleString()}
              </span>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className={`inline-flex items-center gap-1.5 rounded-md text-[12px] text-zinc-500 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 ${focusRing}`}
              >
                <X aria-hidden="true" className="h-3 w-3" />
                Clear filters
              </button>
            )}
          </div>

          <div
            className={`mb-6 flex flex-col gap-4 border-b pb-5 ${hairline}`}
          >
            <div
              role="group"
              aria-label="Filter by media type"
              className="flex flex-wrap items-center gap-2"
            >
              <button
                type="button"
                aria-pressed={selectedMediaType === 'all' && !favoritesOnly}
                onClick={() => {
                  setActiveMediaType('all' as typeof activeMediaType);
                  setFavoritesOnly(false);
                }}
                className={`inline-flex h-8 items-center justify-center rounded-full border px-3.5 text-[12px] font-medium transition-colors ${focusRing} ${
                  selectedMediaType === 'all' && !favoritesOnly
                    ? 'border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
                    : neutralControl
                }`}
              >
                All
              </button>

              {mediaFilters.map((filter) => {
                const Icon = filter.icon;
                const active = selectedMediaType === filter.value;

                return (
                  <button
                    key={filter.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setActiveMediaType(
                        (active ? 'all' : filter.value) as typeof activeMediaType,
                      )
                    }
                    className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition-[box-shadow,filter] hover:brightness-[0.98] dark:hover:brightness-110 ${filter.classes} ${focusRing} ${
                      active ? 'ring-1 ring-current ring-offset-1 ring-offset-[#FAFAF9] dark:ring-offset-[#101012]' : ''
                    }`}
                  >
                    <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                    {filter.label}
                    {active && (
                      <Check aria-hidden="true" className="h-3 w-3" />
                    )}
                  </button>
                );
              })}

              <span
                aria-hidden="true"
                className="mx-0.5 h-4 w-px bg-black/[0.08] dark:bg-white/[0.1]"
              />

              <button
                type="button"
                aria-pressed={favoritesOnly}
                onClick={() => setFavoritesOnly((current) => !current)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full border border-[#F6E3B5] bg-[#FFFBF0] px-3 text-[12px] font-medium text-[#8A6715] transition-[box-shadow,filter] hover:brightness-[0.98] dark:border-[#382E16] dark:bg-[#1C180E] dark:text-[#E8C265] dark:hover:brightness-110 ${focusRing} ${
                  favoritesOnly
                    ? 'ring-1 ring-current ring-offset-1 ring-offset-[#FAFAF9] dark:ring-offset-[#101012]'
                    : ''
                }`}
              >
                <Heart
                  aria-hidden="true"
                  className={`h-3.5 w-3.5 ${favoritesOnly ? 'fill-current' : ''}`}
                />
                Favorites
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="dashboard-sort"
                  className="hidden text-[11px] text-zinc-400 sm:block dark:text-zinc-500"
                >
                  Sort by
                </label>

                <select
                  id="dashboard-sort"
                  value={selectedSort}
                  onChange={(event) =>
                    setSortOption(event.target.value as SortOption)
                  }
                  aria-label="Sort library"
                  className={`h-9 max-w-full cursor-pointer rounded-lg py-1.5 pl-3 pr-7 text-[12px] font-medium transition-colors dark:[color-scheme:dark] ${neutralControl} ${focusRing}`}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="creator">Creator (A–Z)</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                {viewMode === 'grid' && (
                  <div
                    role="group"
                    aria-label="Grid column density"
                    className="flex items-center gap-1"
                  >
                    <span className="mr-1 hidden text-[11px] text-zinc-400 sm:inline dark:text-zinc-500">
                      Columns
                    </span>

                    {([3, 4, 5] as const).map((columns) => (
                      <button
                        key={columns}
                        type="button"
                        aria-label={`${columns} columns`}
                        aria-pressed={gridCols === columns}
                        onClick={() => setGridCols(columns)}
                        className={`flex h-8 w-7 items-center justify-center rounded-md text-[11px] font-medium tabular-nums transition-colors ${focusRing} ${
                          gridCols === columns
                            ? 'bg-zinc-950/[0.06] text-zinc-950 dark:bg-white/[0.1] dark:text-zinc-100'
                            : 'text-zinc-400 hover:bg-zinc-950/[0.03] hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-white/[0.04] dark:hover:text-zinc-300'
                        }`}
                      >
                        {columns}
                      </button>
                    ))}
                  </div>
                )}

                <div
                  role="group"
                  aria-label="Library view"
                  className={`flex items-center gap-0.5 rounded-lg border bg-white p-1 dark:bg-[#171719] ${hairline}`}
                >
                  {viewOptions.map((option) => {
                    const Icon = option.icon;
                    const active = String(viewMode) === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        title={option.label}
                        aria-label={option.label}
                        aria-pressed={active}
                        onClick={() => setViewMode(option.value as ViewMode)}
                        className={`flex h-7 w-8 items-center justify-center rounded-md transition-colors ${focusRing} ${
                          active
                            ? 'bg-zinc-100 text-zinc-950 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:bg-white/[0.09] dark:text-zinc-100'
                            : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-white/[0.04] dark:hover:text-zinc-300'
                        }`}
                      >
                        <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {filteredReels.length > 0 ? (
            <div className="min-w-0">
              <ReelGrid
                reels={filteredReels}
                viewMode={viewMode}
                gridCols={gridCols}
                limit={48}
              />
            </div>
          ) : (
            <motion.div
              key={reels.length ? 'filtered-empty' : 'library-empty'}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className={`flex min-h-[340px] flex-col items-center justify-center rounded-2xl border bg-white/60 px-6 py-14 text-center dark:bg-white/[0.015] ${hairline}`}
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#DDD1F9] bg-[#F3EEFF] text-[#6E47C7] dark:border-[#382B54] dark:bg-[#1D172B] dark:text-[#CBB5FD]">
                {reels.length === 0 ? (
                  <Film aria-hidden="true" className="h-5 w-5" />
                ) : favoritesOnly && !normalizedQuery ? (
                  <Heart aria-hidden="true" className="h-5 w-5" />
                ) : (
                  <Search aria-hidden="true" className="h-5 w-5" />
                )}
              </div>

              <h3 className="text-[18px] font-semibold tracking-[-0.035em]">
                {reels.length === 0
                  ? 'Your next idea starts here.'
                  : favoritesOnly && !normalizedQuery
                    ? 'No favorites here yet.'
                    : 'No matching saves.'}
              </h3>

              <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                {reels.length === 0
                  ? 'Keep the reels you want to come back to.'
                  : 'Try another search or clear your filters.'}
              </p>

              <button
                type="button"
                onClick={reels.length === 0 ? focusIngest : clearFilters}
                className={`mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[12px] font-semibold transition-colors ${primaryButton} ${focusRing}`}
              >
                {reels.length === 0 ? 'Paste your first link' : 'Clear filters'}
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </section>
      </div>

      <ReelPlayerModal
        reel={selectedReel}
        isOpen={Boolean(selectedReel)}
        onClose={() => setSelectedReel(null)}
      />
    </div>
  );
}