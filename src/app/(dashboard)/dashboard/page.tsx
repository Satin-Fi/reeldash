'use client';

import {
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { Check, Loader2, Play, Search, X } from 'lucide-react';

import { useReels } from '@/context/ReelContext';
import { ReelPlayerModal } from '@/components/reels/ReelPlayerModal';

function getMediaUrl(reel: any): string {
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
  return (
    reel.creatorUsername ||
    reel.username ||
    (typeof reel.creator === 'string'
      ? reel.creator
      : reel.creator?.username) ||
    'instagram'
  );
}

function getSearchableText(reel: any): string {
  const keywords = Array.isArray(reel.keywords)
    ? reel.keywords.join(' ')
    : reel.keywords;

  const tags = Array.isArray(reel.tags)
    ? reel.tags.join(' ')
    : reel.tags;

  return [
    getCreator(reel),
    reel.title,
    reel.caption,
    reel.description,
    keywords,
    tags,
  ]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();
}

function normalizeInstagramUrl(value: string): string | null {
  try {
    const trimmed = value.trim();
    const url = new URL(
      /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
    );

    const hostname = url.hostname.toLowerCase();
    const isInstagram =
      hostname === 'instagram.com' ||
      hostname === 'www.instagram.com' ||
      hostname === 'm.instagram.com';

    if (
      !isInstagram ||
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.port ||
      !/^\/(?:reel|reels|p)\/[a-zA-Z0-9_-]+\/?$/.test(url.pathname)
    ) {
      return null;
    }

    url.protocol = 'https:';
    url.hostname = 'www.instagram.com';
    url.hash = '';
    url.search = '';

    return url.toString();
  } catch {
    return null;
  }
}

type SaveFeedback = {
  kind: 'success' | 'error';
  message: string;
} | null;

function MediaCover({ src }: { src: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(155deg,#dcd2ef_0%,#a499b7_45%,#494451_100%)] dark:bg-[linear-gradient(155deg,#363040_0%,#211e29_45%,#121217_100%)]"
      />
    );
  }

  return (
    // Native images support remote thumbnail hosts without Next image configuration.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setFailedSrc(src)}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035] motion-reduce:transform-none motion-reduce:transition-none"
    />
  );
}

export default function DashboardPage() {
  const { reels, saveReel, searchQuery, setSearchQuery } = useReels();

  type Reel = (typeof reels)[number];

  const [activeReel, setActiveReel] = useState<Reel | null>(null);
  const [url, setUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<SaveFeedback>(null);

  const savingRef = useRef(false);
  const ingestId = useId();
  const feedbackId = useId();
  const searchId = useId();

  const query = (searchQuery ?? '').trim().toLowerCase();

  const filteredReels = useMemo(() => {
    if (!query) return reels;

    const terms = query.split(/\s+/).filter(Boolean);

    return reels.filter((reel) => {
      const text = getSearchableText(reel);
      return terms.every((term) => text.includes(term));
    });
  }, [reels, query]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (savingRef.current) return;

    const normalizedUrl = normalizeInstagramUrl(url);

    if (!normalizedUrl) {
      setFeedback({
        kind: 'error',
        message: 'Please paste a valid Instagram reel or post link.',
      });
      return;
    }

    savingRef.current = true;
    setIsSaving(true);
    setFeedback(null);

    try {
      await saveReel(normalizedUrl);
      setUrl('');
      setFeedback({
        kind: 'success',
        message: 'Saved.',
      });
    } catch {
      setFeedback({
        kind: 'error',
        message: 'Could not save this link. Please try again.',
      });
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[#FAFAF9] text-[#090A0D] selection:bg-[#CBB5FD]/50 dark:bg-[#090A0D] dark:text-[#FAFAF9]">
      <div className="mx-auto w-full max-w-[1600px] px-5 pb-16 pt-8 sm:px-8 sm:pt-10 lg:px-12 lg:pb-24 lg:pt-14">
        <header className="mb-10 sm:mb-14">
          <h1 className="text-3xl font-bold tracking-[-0.045em] sm:text-4xl">
            Dashboard
          </h1>

          <form
            onSubmit={handleSave}
            aria-label="Save an Instagram link"
            aria-busy={isSaving}
            className="mt-7 max-w-4xl sm:mt-9"
          >
            <label htmlFor={ingestId} className="sr-only">
              Instagram reel or post link
            </label>

            <div className="flex min-h-16 items-center gap-2 rounded-full border border-black/[0.08] bg-white p-2 pl-5 shadow-[0_4px_24px_-12px_rgba(9,10,13,0.12)] transition-[border-color,box-shadow] duration-200 focus-within:border-[#CBB5FD] focus-within:ring-4 focus-within:ring-[#CBB5FD]/15 dark:border-white/10 dark:bg-white/[0.035] dark:shadow-none dark:focus-within:border-[#CBB5FD]/70 sm:pl-6">
              <input
                id={ingestId}
                type="text"
                inputMode="url"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                value={url}
                disabled={isSaving}
                onChange={(event) => {
                  setUrl(event.target.value);
                  if (feedback) setFeedback(null);
                }}
                placeholder="Paste Instagram reel or post link..."
                aria-invalid={feedback?.kind === 'error'}
                aria-describedby={feedback ? feedbackId : undefined}
                className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-black/40 disabled:opacity-60 dark:placeholder:text-white/35 sm:text-[15px]"
              />

              <button
                type="submit"
                disabled={isSaving || !url.trim()}
                className="inline-flex h-12 w-20 shrink-0 items-center justify-center rounded-full bg-[#090A0D] text-sm font-semibold text-[#FAFAF9] transition-[background-color,opacity,transform] duration-200 hover:bg-[#29252F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CBB5FD] focus-visible:ring-offset-2 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#CBB5FD] dark:text-[#090A0D] dark:hover:bg-[#D9C9FF] dark:focus-visible:ring-offset-[#090A0D] sm:w-24 motion-reduce:transform-none"
              >
                {isSaving ? (
                  <>
                    <Loader2
                      aria-hidden="true"
                      className="h-4 w-4 animate-spin motion-reduce:animate-none"
                    />
                    <span className="sr-only">Saving</span>
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>

            <div
              id={feedbackId}
              aria-live="polite"
              aria-atomic="true"
              className="min-h-7 pl-5 pt-2 sm:pl-6"
            >
              {feedback && (
                <p
                  className={`flex items-center gap-1.5 text-xs ${
                    feedback.kind === 'error'
                      ? 'text-rose-700 dark:text-rose-300'
                      : 'text-black/55 dark:text-white/55'
                  }`}
                >
                  {feedback.kind === 'success' && (
                    <Check aria-hidden="true" className="h-3.5 w-3.5" />
                  )}
                  {feedback.message}
                </p>
              )}
            </div>
          </form>
        </header>

        <section aria-labelledby="recent-saves-heading">
          <div className="mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <h2
              id="recent-saves-heading"
              className="text-xl font-semibold tracking-[-0.035em]"
            >
              Recent Saves
            </h2>

            <div className="flex h-11 w-full items-center gap-2.5 rounded-full border border-black/[0.07] bg-white/70 px-4 transition-[border-color,box-shadow] focus-within:border-[#CBB5FD] focus-within:ring-2 focus-within:ring-[#CBB5FD]/15 dark:border-white/[0.08] dark:bg-white/[0.025] dark:focus-within:border-[#CBB5FD]/60 sm:max-w-xs">
              <Search
                aria-hidden="true"
                strokeWidth={1.7}
                className="h-4 w-4 shrink-0 text-black/40 dark:text-white/40"
              />
              <label htmlFor={searchId} className="sr-only">
                Search by creator or keyword
              </label>
              <input
                id={searchId}
                type="text"
                autoComplete="off"
                value={searchQuery ?? ''}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by creator or keyword..."
                className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-black/40 dark:placeholder:text-white/35"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="-mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black/45 transition-colors hover:bg-black/5 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CBB5FD] dark:text-white/45 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <X aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {filteredReels.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5 2xl:grid-cols-5">
              {filteredReels.map((reel) => {
                const creator = `@${getCreator(reel).replace(/^@+/, '')}`;
                const mediaUrl = getMediaUrl(reel);

                return (
                  <button
                    key={reel.id}
                    type="button"
                    onClick={() => setActiveReel(reel)}
                    aria-label={`Open saved media by ${creator}`}
                    className="group relative isolate block aspect-[9/16] w-full overflow-hidden rounded-2xl bg-black/[0.04] text-left outline-none focus-visible:ring-2 focus-visible:ring-[#CBB5FD] focus-visible:ring-offset-4 focus-visible:ring-offset-[#FAFAF9] dark:bg-white/[0.04] dark:focus-visible:ring-offset-[#090A0D]"
                  >
                    <MediaCover src={mediaUrl} />

                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-black/65 via-black/20 to-transparent"
                    />

                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
                    >
                      <span className="flex h-12 w-12 translate-y-1 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white shadow-lg backdrop-blur-md transition-transform duration-300 group-hover:translate-y-0 group-focus-visible:translate-y-0 sm:h-14 sm:w-14 motion-reduce:transform-none motion-reduce:transition-none">
                        <Play
                          className="ml-0.5 h-5 w-5"
                          strokeWidth={1.5}
                          fill="currentColor"
                        />
                      </span>
                    </div>

                    <span className="absolute inset-x-0 bottom-0 truncate px-3.5 pb-4 pt-6 text-xs font-medium tracking-[-0.01em] text-white/90 sm:px-4 sm:pb-5 sm:text-[13px]">
                      {creator}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-black/10 px-6 py-16 dark:border-white/10">
              <p
                role="status"
                className="max-w-sm text-center text-sm leading-7 text-black/50 dark:text-white/45"
              >
                {reels.length === 0
                  ? 'No saves yet. Paste an Instagram link above to get started.'
                  : 'No matches. Try another creator or keyword.'}
              </p>
            </div>
          )}
        </section>
      </div>

      {activeReel && (
        <ReelPlayerModal
          reel={activeReel}
          isOpen={Boolean(activeReel)}
          onClose={() => setActiveReel(null)}
        />
      )}
    </main>
  );
}