'use client';

import {
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useReels } from '@/context/ReelContext';
import { LibraryHeader } from '@/components/ui/LibraryHeader';
import { FilterToolbar } from '@/components/ui/FilterToolbar';
import { ReelGrid } from '@/components/reels/ReelGrid';

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

    if (
      !isInstagram ||
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.port
    ) {
      return null;
    }

    const pathname = url.pathname.replace(/\/$/, "");

    // 1. Audio track pattern (/reels/audio/<id> or /audio/<id> or /share/audio/<id>)
    const audioMatch = pathname.match(/\/(?:reels\/audio|share\/audio|audio)\/([a-zA-Z0-9_.-]+)/i);
    if (audioMatch) {
      return `https://www.instagram.com/reels/audio/${audioMatch[1]}/`;
    }

    // 2. Reel or Post pattern (/reel/<id>, /reels/<id>, /p/<id>, /share/reel/<id>, /share/p/<id>)
    const mediaMatch = pathname.match(/\/(?:share\/)?(?:reel|reels|p)\/([a-zA-Z0-9_-]+)/i);
    if (mediaMatch) {
      const type = pathname.includes('/p/') ? 'p' : 'reel';
      return `https://www.instagram.com/${type}/${mediaMatch[1]}/`;
    }

    // 3. Stories pattern (/stories/<user>/<id> or /stories/<id>)
    const storyMatch = pathname.match(/\/stories\/(?:[a-zA-Z0-9_.]+\/)?([a-zA-Z0-9_-]+)/i);
    if (storyMatch) {
      return `https://www.instagram.com${pathname}/`;
    }

    return null;
  } catch {
    return null;
  }
}

type SaveFeedback = {
  kind: 'success' | 'error';
  message: string;
} | null;

export default function DashboardPage() {
  const { reels, saveReel, searchQuery, sortOption, viewMode } = useReels();

  const [url, setUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<SaveFeedback>(null);

  const savingRef = useRef(false);
  const ingestId = useId();
  const feedbackId = useId();

  // Compute unique creators count
  const creatorsCount = useMemo(() => {
    return new Set(
      reels
        .map((r) => r.creatorUsername)
        .filter(Boolean)
    ).size;
  }, [reels]);

  // Filter and sort reels
  const filteredReels = useMemo(() => {
    let result = reels.filter((reel) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCreator =
          reel.creatorUsername?.toLowerCase().includes(q) ||
          reel.creatorFullName?.toLowerCase().includes(q);
        const matchCaption = reel.caption?.toLowerCase().includes(q);
        const matchCategory = reel.category?.toLowerCase().includes(q);
        const matchAudio =
          reel.audioTitle?.toLowerCase().includes(q) ||
          reel.audioArtist?.toLowerCase().includes(q);
        const matchKeywords =
          Array.isArray(reel.aiKeywords) &&
          reel.aiKeywords.some((k) => k.toLowerCase().includes(q));
        const matchTags =
          Array.isArray(reel.tags) &&
          reel.tags.some((t) => t.toLowerCase().includes(q));

        if (
          !matchCreator &&
          !matchCaption &&
          !matchCategory &&
          !matchAudio &&
          !matchKeywords &&
          !matchTags
        ) {
          return false;
        }
      }
      return true;
    });

    const sorted = [...result];
    sorted.sort((a, b) => {
      if (sortOption === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortOption === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortOption === 'creator') {
        return (a.creatorUsername || '').localeCompare(b.creatorUsername || '');
      }
      if (sortOption === 'most_viewed') {
        return (b.viewCount || 0) - (a.viewCount || 0);
      }
      if (sortOption === 'recently_viewed') {
        return (
          new Date(b.lastViewedAt || 0).getTime() -
          new Date(a.lastViewedAt || 0).getTime()
        );
      }
      return 0;
    });

    return sorted;
  }, [reels, searchQuery, sortOption]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (savingRef.current) return;

    const normalizedUrl = normalizeInstagramUrl(url);

    if (!normalizedUrl) {
      setFeedback({
        kind: 'error',
        message: 'Please paste a valid Instagram reel, post, or audio link.',
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
        message: 'Saved to library.',
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
    <div className="w-full">
      {/* Editorial Header */}
      <LibraryHeader
        title="Dashboard"
        subtitle="Your creative vault at a glance. Fresh saves, quick capture, and personal inspiration."
        stats={[
          { value: reels.length, label: 'SAVED REELS' },
          { value: creatorsCount, label: 'CREATORS' },
        ]}
      />

      {/* Quick Save URL Bar */}
      <form
        onSubmit={handleSave}
        aria-label="Save an Instagram link"
        aria-busy={isSaving}
        className="mt-6 max-w-3xl"
      >
        <label htmlFor={ingestId} className="sr-only">
          Instagram reel or post link
        </label>

        <div className="flex h-12 sm:h-14 items-center gap-2 rounded-full border border-black/[0.08] bg-white p-1.5 pl-4 sm:pl-6 shadow-sm transition-[border-color,box-shadow] duration-200 focus-within:border-[#CBB5FD] focus-within:ring-4 focus-within:ring-[#CBB5FD]/15 dark:border-white/10 dark:bg-white/[0.035] dark:shadow-none dark:focus-within:border-[#CBB5FD]/70">
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
            placeholder="Paste Instagram reel or post link…"
            aria-invalid={feedback?.kind === 'error'}
            aria-describedby={feedback ? feedbackId : undefined}
            className="min-w-0 flex-1 bg-transparent py-2 text-xs sm:text-sm outline-none placeholder:text-black/40 disabled:opacity-60 dark:placeholder:text-white/35"
          />

          <button
            type="submit"
            disabled={isSaving || !url.trim()}
            className="inline-flex h-9 sm:h-11 px-4 sm:px-6 shrink-0 items-center justify-center rounded-full bg-[#090A0D] text-xs sm:text-sm font-semibold text-[#FAFAF9] transition-[background-color,opacity,transform] duration-200 hover:bg-[#29252F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CBB5FD] focus-visible:ring-offset-2 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#CBB5FD] dark:text-[#090A0D] dark:hover:bg-[#D9C9FF] dark:focus-visible:ring-offset-[#090A0D] motion-reduce:transform-none"
          >
            {isSaving ? (
              <span className="flex items-center gap-1.5">
                <Loader2
                  aria-hidden="true"
                  className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none"
                />
                <span>Saving…</span>
              </span>
            ) : (
              'Save Reel'
            )}
          </button>
        </div>

        {feedback && (
          <div
            id={feedbackId}
            aria-live="polite"
            aria-atomic="true"
            className="min-h-6 pl-4 pt-2"
          >
            <p
              className={`flex items-center gap-1.5 text-xs font-medium ${
                feedback.kind === 'error'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {feedback.kind === 'success' && (
                <Check aria-hidden="true" className="h-3.5 w-3.5" />
              )}
              {feedback.message}
            </p>
          </div>
        )}
      </form>

      {/* Controls: Search Pill + Sort Dropdown + View Mode Pill (No New Category button) */}
      <FilterToolbar
        placeholder="Find in dashboard…"
        className="mt-6 sm:mt-8 mb-6"
      />

      {/* Reels Grid / Feed / Compact View */}
      <ReelGrid
        reels={filteredReels}
        viewMode={viewMode}
        emptyTitle={searchQuery ? 'No matches found' : 'No saved reels yet'}
        emptySubtitle={
          searchQuery
            ? 'Try searching for a different creator, keyword, or clear your query.'
            : 'Paste an Instagram reel or post link above to start your collection.'
        }
      />
    </div>
  );
}
