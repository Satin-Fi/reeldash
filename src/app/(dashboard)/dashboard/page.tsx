"use client";

import {
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Film,
  Grid2X2,
  Heart,
  Images,
  LayoutList,
  List,
  Loader2,
  Play,
  Plus,
  Search,
  X,
} from "lucide-react";

import { useReels } from "@/context/ReelContext";
import { ReelGrid } from "@/components/reels/ReelGrid";
import { ReelPlayerModal } from "@/components/reels/ReelPlayerModal";

type Reel = ReturnType<typeof useReels>["reels"][number];
type Collection = ReturnType<typeof useReels>["collections"][number];
type MediaFilter = "all" | "reel" | "post";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#101012]";

const MOODBOARD_THEMES = [
  "bg-[#FFFBF0] dark:bg-[#1C180E] border-[#F6E3B5] dark:border-[#382E16] text-[#8A6715] dark:text-[#E8C265]",
  "bg-[#F7F3FF] dark:bg-[#161224] border-[#E5DAFD] dark:border-[#2E2250] text-[#6E47C7] dark:text-[#CBB5FD]",
  "bg-[#F0FDF4] dark:bg-[#101C15] border-[#CCEBD7] dark:border-[#1E3B29] text-[#286641] dark:text-[#80CFA0]",
  "bg-[#FFF1F2] dark:bg-[#1D1116] border-[#F8D2D7] dark:border-[#3B1C26] text-[#9E2A4B] dark:text-[#F39CB4]",
] as const;

const MEDIA_FILTERS = [
  {
    value: "all",
    label: "All",
    icon: Grid2X2,
    active:
      "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950",
    inactive:
      "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:bg-white/[0.07]",
  },
  {
    value: "reel",
    label: "Reels",
    icon: Film,
    active:
      "border-[#DDD1F9] bg-[#F3EEFF] text-[#6E47C7] ring-1 ring-[#DDD1F9] dark:border-[#493570] dark:bg-[#241A38] dark:text-[#CBB5FD] dark:ring-[#493570]",
    inactive:
      "border-[#DDD1F9]/60 bg-[#F3EEFF]/60 text-[#6E47C7] hover:bg-[#F3EEFF] dark:border-[#2E2250] dark:bg-[#161224] dark:text-[#CBB5FD] dark:hover:bg-[#241A38]",
  },
  {
    value: "post",
    label: "Posts",
    icon: Images,
    active:
      "border-[#FAD2DD] bg-[#FFF0F3] text-[#B83E63] ring-1 ring-[#FAD2DD] dark:border-[#653046] dark:bg-[#321922] dark:text-[#F39CB4] dark:ring-[#653046]",
    inactive:
      "border-[#FAD2DD]/70 bg-[#FFF0F3]/60 text-[#B83E63] hover:bg-[#FFF0F3] dark:border-[#3B1C26] dark:bg-[#1D1116] dark:text-[#F39CB4] dark:hover:bg-[#321922]",
  },
] as const;

const VIEW_OPTIONS = [
  { value: "grid", label: "Grid", icon: Grid2X2 },
  { value: "feed", label: "Feed stream", icon: LayoutList },
  { value: "compact", label: "Compact list", icon: List },
] as const;

/*
 * Presentation helpers tolerate optional metadata without changing the original
 * reel objects passed to ReelGrid and ReelPlayerModal.
 */
function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function getIds(value: unknown): Set<string> {
  const entries =
    value instanceof Set
      ? Array.from(value)
      : Array.isArray(value)
        ? value
        : [];

  return new Set(
    entries.flatMap((entry) => {
      const id =
        typeof entry === "object" && entry !== null
          ? asRecord(entry).id
          : entry;

      return typeof id === "string" || typeof id === "number"
        ? [String(id)]
        : [];
    }),
  );
}

function getReelMetadata(reel: Reel) {
  const data = asRecord(reel);
  const creator = asRecord(data.creator);
  const author = asRecord(data.author);

  const username = firstString(
    data.username,
    data.creatorUsername,
    data.authorUsername,
    creator.username,
    creator.handle,
    author.username,
    author.handle,
    typeof data.creator === "string" ? data.creator : undefined,
    typeof data.author === "string" ? data.author : undefined,
  ).replace(/^@+/, "");

  const rawType = firstString(
    data.mediaType,
    data.media_type,
    data.type,
  ).toLowerCase();

  const isPost = [
    "post",
    "posts",
    "carousel",
    "carousel_album",
    "image",
  ].includes(rawType);

  const isAudio = rawType === "audio";

  const timestamp = data.savedAt ?? data.createdAt ?? data.saved_at;
  const parsedTimestamp =
    typeof timestamp === "number"
      ? timestamp
      : typeof timestamp === "string"
        ? Date.parse(timestamp)
        : timestamp instanceof Date
          ? timestamp.getTime()
          : 0;

  return {
    thumbnail: firstString(
      data.thumbnailUrl,
      data.thumbnail,
      data.coverUrl,
      data.coverImage,
      data.thumbnail_url,
      data.displayUrl,
    ),
    creator: username ? `@${username}` : "",
    caption: firstString(data.caption, data.title),
    type: isAudio ? "audio" : isPost ? "post" : "reel",
    savedAt: Number.isFinite(parsedTimestamp) ? parsedTimestamp : 0,
  };
}

function getCollectionReelIds(collection: Collection, reels: Reel[]) {
  const data = asRecord(collection);
  const ids = getIds(
    data.reelIds ?? data.itemIds ?? data.items ?? data.reels,
  );

  for (const reel of reels) {
    const reelData = asRecord(reel);
    const collectionIds = getIds(reelData.collectionIds);

    if (
      String(reelData.collectionId ?? "") === String(collection.id) ||
      collectionIds.has(String(collection.id))
    ) {
      ids.add(String(reel.id));
    }
  }

  return ids;
}

function normalizeInstagramUrl(input: string): string | null {
  try {
    const trimmed = input.trim();
    const url = new URL(
      /^[a-z][a-z\d+.-]*:/i.test(trimmed)
        ? trimmed
        : `https://${trimmed}`,
    );

    if (
      !["http:", "https:"].includes(url.protocol) ||
      !["instagram.com", "www.instagram.com", "m.instagram.com"].includes(
        url.hostname.toLowerCase(),
      ) ||
      url.username ||
      url.password ||
      !/^\/(?:reel|reels|p|tv)\/[A-Za-z0-9_-]+(?:\/|$)/.test(url.pathname)
    ) {
      return null;
    }

    url.protocol = "https:";
    url.hostname = "www.instagram.com";
    url.port = "";
    url.search = "";
    url.hash = "";

    return url.toString();
  } catch {
    return null;
  }
}

function RecentSaveCard({
  reel,
  onOpen,
  priority,
}: {
  reel: Reel;
  onOpen: (reel: Reel) => void;
  priority: boolean;
}) {
  const metadata = getReelMetadata(reel);
  const [failedThumbnail, setFailedThumbnail] = useState<string | null>(null);
  const hasThumbnail =
    Boolean(metadata.thumbnail) && failedThumbnail !== metadata.thumbnail;

  const accessibleName = metadata.creator
    ? `Open save by ${metadata.creator}`
    : metadata.caption
      ? `Open ${metadata.caption.slice(0, 100)}`
      : "Open saved media";

  return (
    <button
      type="button"
      onClick={() => onOpen(reel)}
      aria-label={accessibleName}
      className={`group relative aspect-[9/16] w-full shrink-0 overflow-hidden rounded-2xl bg-zinc-200 text-left shadow-sm ring-1 ring-black/5 transition-shadow duration-300 hover:shadow-lg dark:bg-zinc-800 dark:ring-white/10 motion-reduce:transition-none ${FOCUS_RING}`}
    >
      {hasThumbnail ? (
        // Native images support saved Instagram/CDN URLs without remotePatterns.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={metadata.thumbnail}
          alt=""
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
          onError={() => setFailedThumbnail(metadata.thumbnail)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045] group-focus-visible:scale-[1.045] motion-reduce:transform-none motion-reduce:transition-none"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-950">
          {metadata.type === "post" ? (
            <Images className="h-8 w-8 text-white/30" aria-hidden="true" />
          ) : (
            <Film className="h-8 w-8 text-white/30" aria-hidden="true" />
          )}
        </div>
      )}

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-black/10"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/10 group-focus-visible:bg-black/10 motion-reduce:transition-none"
      >
        <span className="flex h-12 w-12 translate-y-2 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 motion-reduce:transform-none motion-reduce:transition-none">
          <Play className="ml-0.5 h-5 w-5 fill-current" strokeWidth={1.5} />
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5">
        <span className="min-w-0 truncate text-xs font-medium tracking-tight text-white sm:text-sm">
          {metadata.creator || "Saved media"}
        </span>
        {metadata.type === "post" ? (
          <Images
            className="mb-0.5 h-3.5 w-3.5 shrink-0 text-white/75"
            aria-hidden="true"
          />
        ) : (
          <Play
            className="mb-0.5 h-3.5 w-3.5 shrink-0 fill-white/75 text-white/75"
            aria-hidden="true"
          />
        )}
      </div>
    </button>
  );
}

export default function DashboardPage() {
  const {
    reels,
    favorites,
    saveReel,
    collections,
    activeMediaType,
    setActiveMediaType,
    setActiveCollection,
    viewMode,
    setViewMode,
    gridCols,
    setGridCols,
    setIsCreateCollectionModalOpen,
    setIsCommandPaletteOpen,
    showToast,
  } = useReels();

  const [ingestUrl, setIngestUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    Collection["id"] | null
  >(null);

  const saveInFlight = useRef(false);
  const ingestInputRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLElement>(null);

  const favoriteIds = useMemo(() => getIds(favorites), [favorites]);

  const recentReels = useMemo(
    () =>
      reels
        .filter((reel) => getReelMetadata(reel).type !== "audio")
        .slice()
        .sort(
          (a, b) =>
            getReelMetadata(b).savedAt - getReelMetadata(a).savedAt,
        )
        .slice(0, 6),
    [reels],
  );

  const moodboards = useMemo(
    () =>
      collections.map((collection) => {
        const data = asRecord(collection);
        const reelIds = getCollectionReelIds(collection, reels);
        const storedCount = data.itemCount ?? data.count;

        return {
          collection,
          reelIds,
          count:
            typeof storedCount === "number" &&
            Number.isFinite(storedCount) &&
            storedCount >= 0
              ? Math.floor(storedCount)
              : reelIds.size,
        };
      }),
    [collections, reels],
  );

  const selectedMoodboard = moodboards.find(
    ({ collection }) => collection.id === selectedCollectionId,
  );

  const filteredReels = useMemo(() => {
    const selectedIds = selectedMoodboard?.reelIds;

    return reels.filter((reel) => {
      const id = String(reel.id);
      const metadata = getReelMetadata(reel);

      if (selectedIds && !selectedIds.has(id)) return false;
      if (favoritesOnly && !favoriteIds.has(id)) return false;
      if (metadata.type === "audio") return false;

      if (activeMediaType === "reel" && metadata.type !== "reel") {
        return false;
      }

      if (activeMediaType === "post" && metadata.type !== "post") {
        return false;
      }

      return true;
    });
  }, [
    reels,
    selectedMoodboard,
    favoritesOnly,
    favoriteIds,
    activeMediaType,
  ]);

  async function handleIngest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saveInFlight.current) return;

    const normalizedUrl = normalizeInstagramUrl(ingestUrl);

    if (!normalizedUrl) {
      setIngestError("Enter a valid Instagram reel or post link.");
      ingestInputRef.current?.focus();
      return;
    }

    saveInFlight.current = true;
    setIsSaving(true);
    setIngestError(null);

    try {
      const result: unknown = await saveReel(normalizedUrl);

      if (result === false) {
        setIngestError("This link could not be saved. Try again.");
        return;
      }

      setIngestUrl("");
      showToast("Saved to your library.");
    } catch {
      setIngestError("Could not save this link. Please try again.");
    } finally {
      saveInFlight.current = false;
      setIsSaving(false);
    }
  }

  function selectMediaFilter(filter: MediaFilter) {
    setFavoritesOnly(false);
    setActiveMediaType(filter);
  }

  function selectMoodboard(collection: Collection) {
    setSelectedCollectionId(collection.id);
    setActiveCollection(collection.id);
    setActiveMediaType("all");
    setFavoritesOnly(false);

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    libraryRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  function clearMoodboard() {
    setSelectedCollectionId(null);
    setActiveCollection(null);
  }

  return (
    <div className="min-w-0 bg-[#FAFAF9] text-zinc-950 dark:bg-[#101012] dark:text-zinc-100">
      <div className="mx-auto max-w-[1600px] space-y-10 px-4 py-6 sm:px-6 sm:py-8 lg:space-y-12 lg:px-8 xl:px-10">
        <header className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <h1 className="shrink-0 text-3xl font-semibold tracking-[-0.045em] sm:text-[32px] xl:pt-1">
            Dashboard
          </h1>

          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start xl:w-full xl:max-w-[830px] xl:justify-end">
            <form
              onSubmit={handleIngest}
              aria-label="Save an Instagram link"
              className="min-w-0 flex-1 xl:max-w-[430px]"
              noValidate
            >
              <div
                className={`flex h-11 items-center gap-2 rounded-xl border bg-white p-1 shadow-sm transition-[border-color,box-shadow] focus-within:ring-2 dark:bg-[#18181B] motion-reduce:transition-none ${
                  ingestError
                    ? "border-rose-300 focus-within:border-rose-400 focus-within:ring-rose-100 dark:border-rose-800 dark:focus-within:ring-rose-950"
                    : "border-zinc-200/90 focus-within:border-violet-300 focus-within:ring-violet-100 dark:border-white/10 dark:focus-within:border-violet-700 dark:focus-within:ring-violet-950"
                }`}
              >
                <label htmlFor="dashboard-ingest-url" className="sr-only">
                  Instagram link
                </label>
                <input
                  ref={ingestInputRef}
                  id="dashboard-ingest-url"
                  type="text"
                  inputMode="url"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={ingestUrl}
                  readOnly={isSaving}
                  onChange={(event) => {
                    setIngestUrl(event.target.value);
                    if (ingestError) setIngestError(null);
                  }}
                  placeholder="Paste Instagram link..."
                  aria-invalid={Boolean(ingestError)}
                  aria-describedby={
                    ingestError ? "dashboard-ingest-error" : undefined
                  }
                  className="h-full min-w-0 flex-1 bg-transparent pl-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 read-only:opacity-60 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />

                <button
                  type="submit"
                  disabled={isSaving || !ingestUrl.trim()}
                  aria-busy={isSaving}
                  className={`inline-flex h-8 min-w-[66px] shrink-0 items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white motion-reduce:transition-none ${FOCUS_RING}`}
                >
                  {isSaving ? (
                    <>
                      <Loader2
                        className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none"
                        aria-hidden="true"
                      />
                      <span>Saving</span>
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>

              {ingestError && (
                <p
                  id="dashboard-ingest-error"
                  role="alert"
                  className="mt-2 text-xs text-rose-600 dark:text-rose-400"
                >
                  {ingestError}
                </p>
              )}
            </form>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCommandPaletteOpen(true)}
                aria-label="Search library"
                aria-haspopup="dialog"
                className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200/90 bg-white px-3.5 text-sm font-medium text-zinc-600 shadow-sm transition-colors hover:border-zinc-300 hover:text-zinc-950 sm:flex-none dark:border-white/10 dark:bg-[#18181B] dark:text-zinc-300 dark:hover:border-white/20 dark:hover:text-white motion-reduce:transition-none ${FOCUS_RING}`}
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                <span>Search</span>
                <kbd className="ml-1 rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-sans text-[10px] leading-none text-zinc-400 dark:border-white/10 dark:bg-white/5 dark:text-zinc-500">
                  ⌘K
                </kbd>
              </button>

              <button
                type="button"
                onClick={() => setIsCreateCollectionModalOpen(true)}
                aria-haspopup="dialog"
                className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200/90 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 sm:flex-none dark:border-white/10 dark:bg-[#18181B] dark:text-zinc-100 dark:hover:border-white/20 dark:hover:bg-white/[0.06] motion-reduce:transition-none ${FOCUS_RING}`}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Moodboard
              </button>
            </div>
          </div>
        </header>

        <section aria-labelledby="recent-saves-heading">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2
              id="recent-saves-heading"
              className="text-base font-semibold tracking-tight"
            >
              Recent saves
            </h2>

            {recentReels.length > 0 && (
              <a
                href="#dashboard-library"
                className={`group inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 motion-reduce:transition-none ${FOCUS_RING}`}
              >
                View library
                <ArrowDown
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5 motion-reduce:transform-none"
                  aria-hidden="true"
                />
              </a>
            )}
          </div>

          {recentReels.length > 0 ? (
            <div
              tabIndex={0}
              aria-label="Recent saves, scroll horizontally for more"
              className={`-mx-1 overflow-x-auto overscroll-x-contain rounded-2xl px-1 pb-3 pt-1 [scrollbar-width:thin] ${FOCUS_RING}`}
            >
              <div className="grid min-w-[960px] grid-cols-6 gap-3 lg:gap-4">
                {recentReels.map((reel, index) => (
                  <RecentSaveCard
                    key={reel.id}
                    reel={reel}
                    priority={index < 3}
                    onOpen={setSelectedReel}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white/60 px-6 text-center dark:border-white/10 dark:bg-white/[0.02]">
              <Film
                className="mb-4 h-7 w-7 text-zinc-300 dark:text-zinc-600"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <p className="text-sm font-medium">Your next reference starts here.</p>
              <button
                type="button"
                onClick={() => ingestInputRef.current?.focus()}
                className={`mt-2 rounded-md text-xs text-zinc-500 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-950 dark:text-zinc-400 dark:decoration-zinc-600 dark:hover:text-white ${FOCUS_RING}`}
              >
                Save an Instagram link
              </button>
            </div>
          )}
        </section>

        <section aria-labelledby="moodboards-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2
              id="moodboards-heading"
              className="text-base font-semibold tracking-tight"
            >
              Moodboards &amp; projects
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {moodboards.map(({ collection, count }, index) => {
              const isSelected = selectedCollectionId === collection.id;

              return (
                <button
                  key={collection.id}
                  type="button"
                  onClick={() => selectMoodboard(collection)}
                  aria-pressed={isSelected}
                  className={`group relative flex min-h-[132px] flex-col justify-between overflow-hidden rounded-2xl border p-5 text-left transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-sm motion-reduce:transform-none motion-reduce:transition-none ${
                    MOODBOARD_THEMES[index % MOODBOARD_THEMES.length]
                  } ${isSelected ? "ring-1 ring-current" : ""} ${FOCUS_RING}`}
                >
                  <span className="flex w-full items-start justify-between gap-3">
                    <span className="line-clamp-2 text-[15px] font-semibold tracking-tight">
                      {collection.name}
                    </span>
                    {isSelected && (
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </span>

                  <span className="mt-5 flex w-full items-center justify-between gap-3">
                    <span className="text-xs font-medium tabular-nums opacity-70">
                      {count.toLocaleString()} {count === 1 ? "item" : "items"}
                    </span>
                    <ArrowRight
                      className="h-4 w-4 opacity-50 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100 group-focus-visible:translate-x-1 group-focus-visible:opacity-100 motion-reduce:transform-none motion-reduce:transition-none"
                      aria-hidden="true"
                    />
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setIsCreateCollectionModalOpen(true)}
              aria-haspopup="dialog"
              className={`group flex min-h-[132px] items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300/80 bg-transparent px-5 text-sm font-medium text-zinc-500 transition-colors hover:border-zinc-400 hover:bg-white hover:text-zinc-900 dark:border-white/15 dark:text-zinc-400 dark:hover:border-white/30 dark:hover:bg-white/[0.03] dark:hover:text-zinc-100 motion-reduce:transition-none ${FOCUS_RING}`}
            >
              <Plus
                className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90 motion-reduce:transform-none motion-reduce:transition-none"
                aria-hidden="true"
              />
              New Moodboard
            </button>
          </div>
        </section>

        <section
          ref={libraryRef}
          id="dashboard-library"
          aria-labelledby="library-heading"
          className="scroll-mt-8 pb-8"
        >
          <div className="mb-5 flex min-h-7 flex-wrap items-center gap-3">
            <h2
              id="library-heading"
              className="text-base font-semibold tracking-tight"
            >
              Library
            </h2>

            {selectedMoodboard && (
              <button
                type="button"
                onClick={clearMoodboard}
                aria-label={`Clear moodboard filter: ${selectedMoodboard.collection.name}`}
                className={`inline-flex max-w-full items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 ${FOCUS_RING}`}
              >
                <span className="max-w-[220px] truncate">
                  {selectedMoodboard.collection.name}
                </span>
                <X className="h-3 w-3 shrink-0" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="mb-6 flex flex-col justify-between gap-4 border-b border-zinc-200/70 pb-5 2xl:flex-row 2xl:items-center dark:border-white/[0.07]">
            <div
              role="group"
              aria-label="Filter library"
              className="flex flex-wrap items-center gap-2"
            >
              {MEDIA_FILTERS.map((filter) => {
                const Icon = filter.icon;
                const isActive =
                  !favoritesOnly && activeMediaType === filter.value;

                return (
                  <button
                    key={filter.value}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => selectMediaFilter(filter.value)}
                    className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-xs font-medium transition-colors motion-reduce:transition-none ${
                      isActive ? filter.active : filter.inactive
                    } ${FOCUS_RING}`}
                  >
                    <Icon
                      className="h-3.5 w-3.5"
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                    {filter.label}
                  </button>
                );
              })}

              <button
                type="button"
                aria-pressed={favoritesOnly}
                onClick={() => {
                  setActiveMediaType("all");
                  setFavoritesOnly(true);
                }}
                className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-xs font-medium transition-colors motion-reduce:transition-none ${
                  favoritesOnly
                    ? "border-[#F0D997] bg-[#FFF7DF] text-[#8A6715] ring-1 ring-[#F0D997] dark:border-[#66511E] dark:bg-[#30260E] dark:text-[#E8C265] dark:ring-[#66511E]"
                    : "border-[#F6E3B5]/80 bg-[#FFFBF0] text-[#8A6715] hover:bg-[#FFF7DF] dark:border-[#382E16] dark:bg-[#1C180E] dark:text-[#E8C265] dark:hover:bg-[#30260E]"
                } ${FOCUS_RING}`}
              >
                <Heart
                  className={`h-3.5 w-3.5 ${
                    favoritesOnly ? "fill-current" : ""
                  }`}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                Favorites
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start 2xl:shrink-0">
              {viewMode === "grid" && (
                <div
                  role="group"
                  aria-label="Grid column density"
                  className="inline-flex h-9 items-center gap-0.5 rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-0.5 dark:border-white/[0.07] dark:bg-white/[0.03]"
                >
                  {([3, 4, 5] as const).map((columns) => (
                    <button
                      key={columns}
                      type="button"
                      onClick={() => setGridCols(columns)}
                      aria-label={`${columns} columns`}
                      aria-pressed={gridCols === columns}
                      title={`${columns} columns`}
                      className={`inline-flex h-7 min-w-8 items-center justify-center rounded-md px-2 text-[11px] font-medium tabular-nums transition-colors motion-reduce:transition-none ${
                        gridCols === columns
                          ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                          : "text-zinc-400 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200"
                      } ${FOCUS_RING}`}
                    >
                      {columns}c
                    </button>
                  ))}
                </div>
              )}

              <div
                role="group"
                aria-label="Library view"
                className="inline-flex h-9 items-center gap-0.5 rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-0.5 dark:border-white/[0.07] dark:bg-white/[0.03]"
              >
                {VIEW_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = viewMode === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setViewMode(option.value)}
                      aria-label={option.label}
                      aria-pressed={isActive}
                      title={option.label}
                      className={`inline-flex h-7 items-center justify-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition-colors motion-reduce:transition-none ${
                        isActive
                          ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                      } ${FOCUS_RING}`}
                    >
                      <Icon
                        className="h-3.5 w-3.5"
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                      <span className="hidden sm:inline">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {filteredReels.length > 0 ? (
            <ReelGrid
              reels={filteredReels}
              viewMode={viewMode}
              gridCols={gridCols}
              limit={24}
            />
          ) : (
            <div
              role="status"
              className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 px-6 py-12 text-center dark:border-white/10"
            >
              {favoritesOnly ? (
                <Heart
                  className="mb-4 h-7 w-7 text-zinc-300 dark:text-zinc-600"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              ) : (
                <Grid2X2
                  className="mb-4 h-7 w-7 text-zinc-300 dark:text-zinc-600"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              )}

              <p className="text-sm font-medium">
                {favoritesOnly
                  ? "No favorites here yet."
                  : selectedMoodboard
                    ? "No matching saves in this moodboard."
                    : reels.length === 0
                      ? "Your library is ready."
                      : "No matching saves."}
              </p>

              {reels.length === 0 ? (
                <button
                  type="button"
                  onClick={() => ingestInputRef.current?.focus()}
                  className={`mt-3 rounded-md text-xs font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 ${FOCUS_RING}`}
                >
                  Save your first link
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    clearMoodboard();
                    selectMediaFilter("all");
                  }}
                  className={`mt-3 rounded-md text-xs font-medium text-zinc-500 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-950 dark:text-zinc-400 dark:decoration-zinc-600 dark:hover:text-white ${FOCUS_RING}`}
                >
                  Show all saves
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      {selectedReel && (
        <ReelPlayerModal
          reel={selectedReel}
          isOpen={Boolean(selectedReel)}
          onClose={() => setSelectedReel(null)}
        />
      )}
    </div>
  );
}