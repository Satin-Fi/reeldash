'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Loader2,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { useReels } from '@/context/ReelContext';

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

type BinItem = ReturnType<typeof useReels>['recycleBin'][number];

type Confirmation =
  | { type: 'all' }
  | { type: 'single'; reel: BinItem }
  | null;

const primaryButton =
  'inline-flex min-h-12 items-center justify-center gap-3 rounded-full ' +
  'bg-zinc-950 px-6 py-3 text-sm font-medium text-white ' +
  'transition duration-200 hover:bg-zinc-800 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E47C7] ' +
  'focus-visible:ring-offset-4 focus-visible:ring-offset-[#FAFAF9] ' +
  'dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 ' +
  'dark:focus-visible:ring-[#CBB5FD] dark:focus-visible:ring-offset-[#090A0D] ' +
  'disabled:cursor-wait disabled:opacity-50';

const secondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full ' +
  'border border-black/[0.09] bg-white px-4 py-2.5 text-sm font-medium ' +
  'text-zinc-700 transition hover:border-black/20 hover:bg-zinc-50 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E47C7] ' +
  'dark:border-white/[0.10] dark:bg-[#121316] dark:text-zinc-200 ' +
  'dark:hover:border-white/20 dark:hover:bg-white/[0.06] ' +
  'dark:focus-visible:ring-[#CBB5FD] disabled:cursor-not-allowed disabled:opacity-40';

function getDeletionDate(reel: any): string {
  const value = reel.deletedAt || reel.deleted_at || reel.removedAt;
  if (!value) return 'Deletion date unavailable';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Deletion date unavailable';

  return `Deleted ${new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)}`;
}

/**
 * Original artwork: a translucent archive chamber, drawn on a
 * 45-degree projected grid with a suspended lavender archive sheet.
 */
function ArchiveArtwork() {
  const id = useId().replace(/:/g, '');
  const glowId = `${id}-glow`;
  const glassId = `${id}-glass`;
  const sheetId = `${id}-sheet`;
  const lineId = `${id}-line`;

  return (
    <svg
      viewBox="0 0 520 360"
      fill="none"
      aria-hidden="true"
      className="h-auto w-full overflow-visible"
    >
      <defs>
        <radialGradient id={glowId}>
          <stop offset="0" stopColor="#CBB5FD" stopOpacity=".34" />
          <stop offset=".48" stopColor="#CBB5FD" stopOpacity=".13" />
          <stop offset="1" stopColor="#CBB5FD" stopOpacity="0" />
        </radialGradient>

        <linearGradient
          id={glassId}
          x1="162"
          y1="122"
          x2="361"
          y2="287"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#CBB5FD" stopOpacity=".12" />
          <stop offset="1" stopColor="#CBB5FD" stopOpacity=".015" />
        </linearGradient>

        <linearGradient
          id={sheetId}
          x1="215"
          y1="78"
          x2="320"
          y2="199"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#CBB5FD" stopOpacity=".34" />
          <stop offset="1" stopColor="#6E47C7" stopOpacity=".04" />
        </linearGradient>

        <linearGradient
          id={lineId}
          x1="173"
          y1="85"
          x2="344"
          y2="271"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#CBB5FD" />
          <stop offset="1" stopColor="#6E47C7" stopOpacity=".35" />
        </linearGradient>
      </defs>

      <ellipse
        cx="263"
        cy="193"
        rx="228"
        ry="159"
        fill={`url(#${glowId})`}
      />

      {/* Projected ground plane. */}
      <g
        className="text-zinc-950/[0.07] dark:text-white/[0.08]"
        stroke="currentColor"
        strokeWidth=".8"
      >
        <path d="M72 241 230 83M108 265 278 95M144 289 326 107M180 313 374 119" />
        <path d="M118 119 312 313M154 95 348 289M190 83 384 277M226 71 420 265" />
        <path d="m76 237 184 104 184-104" strokeDasharray="2 7" />
      </g>

      {/* Distant construction marks. */}
      <g stroke="#6E47C7" strokeOpacity=".3" strokeWidth="1">
        <path d="M107 154h10m-5-5v10M395 191h10m-5-5v10" />
        <path d="M260 39v13M254 45h12" />
        <path d="m154 281-7 7m0-7 7 7" />
      </g>

      {/* Rear chamber edges. */}
      <g
        stroke="currentColor"
        className="text-zinc-950/20 dark:text-white/20"
        strokeWidth="1"
        strokeLinejoin="round"
      >
        <path d="m164 157 96-70 96 70-96 70-96-70Z" />
        <path d="M260 87v134" strokeDasharray="3 6" opacity=".5" />
        <path d="m164 287 96-66 96 66" strokeDasharray="3 6" opacity=".5" />
      </g>

      {/* Suspended archive leaves. */}
      <g strokeLinejoin="round">
        <path
          d="m195 144 64-48 65 48v61l-64 48-65-48V144Z"
          fill={`url(#${sheetId})`}
          stroke="#6E47C7"
          strokeOpacity=".25"
        />
        <path
          d="m203 120 57-42 57 42v72l-57 42-57-42v-72Z"
          fill={`url(#${sheetId})`}
          stroke={`url(#${lineId})`}
          strokeWidth="1.2"
        />
        <path
          d="m203 120 57 42 57-42M260 162v72"
          stroke="#CBB5FD"
          strokeOpacity=".75"
        />
        <path
          d="m219 121 37 27m-37-15 24 18m34-13 24-18"
          stroke="#6E47C7"
          strokeOpacity=".4"
          strokeLinecap="round"
        />
        <path
          d="m249 97 10-7 11 8-10 7-11-8Z"
          fill="#CBB5FD"
          fillOpacity=".6"
        />
      </g>

      {/* Translucent front and side panels. */}
      <path
        d="m164 157 96 70 96-70v130l-96 70-96-70V157Z"
        transform="translate(0 -32)"
        fill={`url(#${glassId})`}
        opacity=".25"
      />
      <path
        d="m164 157 96 70v130l-96-70V157Z"
        fill={`url(#${glassId})`}
        transform="translate(0 -32)"
        opacity=".5"
      />

      <g
        stroke="currentColor"
        className="text-zinc-950/35 dark:text-white/35"
        strokeWidth="1.2"
        strokeLinejoin="round"
      >
        <path d="M164 157v130l96 70 96-70V157" transform="translate(0 -32)" />
        <path d="m164 157 96 70 96-70M260 227v130" transform="translate(0 -32)" />
      </g>

      {/* Offset top rim. */}
      <path
        d="m154 124 106-77 106 77-106 77-106-77Z"
        stroke={`url(#${lineId})`}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="m154 124 10 11m202-11-10 11"
        stroke="#CBB5FD"
        strokeOpacity=".7"
      />

      {/* Bespoke inset archive latch. */}
      <path
        d="m280 226 28-20v17l-28 20v-17Z"
        stroke="#6E47C7"
        strokeOpacity=".55"
        strokeLinejoin="round"
      />
      <path
        d="m288 225 12-9"
        stroke="#CBB5FD"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <g fill="#CBB5FD">
        <circle cx="154" cy="124" r="2.5" />
        <circle cx="260" cy="201" r="2.5" />
        <circle cx="356" cy="255" r="2" />
      </g>
    </svg>
  );
}

function ReelCover({ reel }: { reel: BinItem }) {
  const url = getMediaUrl(reel);
  const creator = getCreator(reel).replace(/^@/, '');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  return (
    <div className="relative aspect-[9/16] overflow-hidden rounded-2xl border border-black/[0.07] bg-zinc-100 dark:border-white/[0.08] dark:bg-[#121316]">
      {url && !failed ? (
        // Native images support external thumbnail hosts without Next image configuration.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={`Reel by @${creator}`}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition duration-700 ease-out motion-safe:group-hover:scale-[1.035]"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[radial-gradient(ellipse_at_top_right,rgba(203,181,253,0.18),transparent_65%)] px-6">
          <svg
            width="64"
            height="76"
            viewBox="0 0 64 76"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="m11 20 21-15 21 15v35L32 70 11 55V20Z"
              stroke="#6E47C7"
              strokeOpacity=".5"
            />
            <path
              d="m11 20 21 15 21-15M32 35v35"
              stroke="#CBB5FD"
            />
            <path
              d="m21 22 11-8 11 8-11 8-11-8Z"
              fill="#CBB5FD"
              fillOpacity=".25"
            />
          </svg>
          <span className="text-center text-xs text-zinc-500 dark:text-zinc-400">
            Preview unavailable
          </span>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5 dark:ring-white/5" />
      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-2.5 py-1.5 text-[10px] font-medium tracking-[0.08em] text-white backdrop-blur-md">
        <span className="h-1 w-1 rounded-full bg-[#CBB5FD]" />
        REMOVED
      </div>
    </div>
  );
}

function ConfirmationDialog({
  confirmation,
  pending,
  onClose,
  onConfirm,
}: {
  confirmation: NonNullable<Confirmation>;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const isAll = confirmation.type === 'all';

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    cancelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      if (!pending) onClose();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), [tabindex="0"]',
    );

    if (!focusable?.length) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const current = document.activeElement;

    if (event.shiftKey && (current === first || current === dialogRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (current === last || current === dialogRef.current)) {
      event.preventDefault();
      first.focus();
    }
  }

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-5 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.18 }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={pending}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        initial={{ opacity: 0, y: reduceMotion ? 0 : 12, scale: reduceMotion ? 1 : 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
        transition={{ duration: reduceMotion ? 0 : 0.2 }}
        className="relative my-auto w-full max-w-md rounded-[28px] border border-black/[0.07] bg-[#FAFAF9] p-7 text-zinc-950 shadow-2xl outline-none sm:p-8 dark:border-white/[0.08] dark:bg-[#121316] dark:text-white"
      >
        <button
          type="button"
          aria-label="Close confirmation"
          disabled={pending}
          onClick={onClose}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E47C7] disabled:opacity-40 dark:hover:bg-white/5"
        >
          <X size={18} />
        </button>

        <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-600/10 bg-red-500/[0.06] text-red-600 dark:border-red-400/15 dark:text-red-400">
          <AlertTriangle size={21} strokeWidth={1.5} />
        </div>

        <h2
          id={titleId}
          className="pr-4 text-[28px] font-medium leading-tight tracking-[-0.04em]"
        >
          {isAll ? 'Empty the archive?' : 'Delete this reel forever?'}
        </h2>

        <p
          id={descriptionId}
          className="mt-3 text-sm leading-7 text-zinc-500 dark:text-zinc-400"
        >
          {isAll
            ? 'Every item in your Recycle Bin will be permanently erased. This cannot be undone.'
            : `This reel by @${getCreator(confirmation.reel).replace(/^@/, '')} will be permanently erased. This cannot be undone.`}
        </p>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
          <button
            ref={cancelRef}
            type="button"
            disabled={pending}
            onClick={onClose}
            className={`${secondaryButton} flex-1`}
          >
            Keep {isAll ? 'items' : 'reel'}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 dark:bg-red-500 dark:hover:bg-red-600 dark:focus-visible:ring-offset-[#121316]"
          >
            {pending ? (
              <Loader2 size={16} className="animate-spin motion-reduce:animate-none" />
            ) : (
              <Trash2 size={15} />
            )}
            {pending ? 'Deleting…' : isAll ? 'Empty Bin' : 'Delete Forever'}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

export default function RecycleBinPage() {
  const {
    recycleBin,
    restoreReel,
    permanentlyDeleteReel,
    emptyRecycleBin,
    showToast,
  } = useReels();

  const reduceMotion = useReducedMotion();
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const operationInProgress = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const count = recycleBin.length;

  function notify(message: string) {
    setAnnouncement(message);
    showToast(message);
  }

  async function handleRestore(reel: BinItem) {
    if (operationInProgress.current) return;

    operationInProgress.current = true;
    setBusy(`restore:${String(reel.id)}`);

    try {
      await restoreReel(reel.id);
      notify('Reel restored to your library.');
      headingRef.current?.focus();
    } catch {
      notify('Unable to restore this reel. Please try again.');
    } finally {
      operationInProgress.current = false;
      setBusy(null);
    }
  }

  async function handleConfirm() {
    if (!confirmation || operationInProgress.current) return;

    const target = confirmation;
    operationInProgress.current = true;
    setBusy('delete');

    try {
      if (target.type === 'all') {
        await emptyRecycleBin();
        notify('Recycle Bin emptied.');
      } else {
        await permanentlyDeleteReel(target.reel.id);
        notify('Reel permanently deleted.');
      }

      setConfirmation(null);
      headingRef.current?.focus();
    } catch {
      notify('Unable to delete items. Please try again.');
    } finally {
      operationInProgress.current = false;
      setBusy(null);
    }
  }

  return (
    <main className="relative isolate min-h-[calc(100dvh-4rem)] bg-[#FAFAF9] text-zinc-950 selection:bg-[#CBB5FD]/40 dark:bg-[#090A0D] dark:text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(ellipse_at_80%_0%,rgba(203,181,253,0.07),transparent_65%)]"
      />

      <div className="mx-auto w-full max-w-[1600px] px-5 pb-12 pt-9 sm:px-9 sm:pt-12 lg:px-14 lg:pt-14">
        <header className="flex flex-wrap items-end justify-between gap-5 border-b border-black/[0.07] pb-7 dark:border-white/[0.08]">
          <div>
            <div className="mb-3 flex items-center gap-2.5 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6E47C7] dark:bg-[#CBB5FD]" />
              Your workspace
              <span className="text-zinc-300 dark:text-zinc-700">/</span>
              Archive
            </div>

            <div className="flex items-center gap-4">
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="text-4xl font-medium leading-[1.1] tracking-[-0.04em] outline-none sm:text-5xl"
              >
                Recycle Bin
              </h1>

              {count > 0 && (
                <span className="inline-flex min-h-7 min-w-7 items-center justify-center rounded-full border border-black/[0.07] bg-white px-2.5 text-xs font-medium tabular-nums text-zinc-500 dark:border-white/[0.08] dark:bg-[#121316] dark:text-zinc-400">
                  {count}
                  <span className="sr-only"> deleted items</span>
                </span>
              )}
            </div>
          </div>

          {count > 0 && (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => setConfirmation({ type: 'all' })}
              className={secondaryButton}
            >
              <Trash2 size={15} strokeWidth={1.6} />
              Empty Bin
            </button>
          )}
        </header>

        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>

        <AnimatePresence mode="wait" initial={false}>
          {count === 0 ? (
            <motion.section
              key="empty"
              aria-labelledby="empty-archive-title"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.35 }}
              className="relative flex min-h-[620px] flex-col items-center justify-center py-14 text-center sm:min-h-[calc(100dvh-15rem)] sm:py-16"
            >
              <div className="pointer-events-none mb-5 w-full max-w-[440px] sm:mb-7 sm:max-w-[490px]">
                <ArchiveArtwork />
              </div>

              <div className="relative max-w-[410px]">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#6E47C7]/10 bg-[#6E47C7]/[0.04] px-3 py-1.5 text-[11px] font-medium text-[#6E47C7] dark:border-[#CBB5FD]/15 dark:bg-[#CBB5FD]/[0.05] dark:text-[#CBB5FD]">
                  <Check size={12} strokeWidth={1.8} />
                  Nothing left behind
                </div>

                <h2
                  id="empty-archive-title"
                  className="text-[36px] font-medium leading-[1.1] tracking-[-0.04em] sm:text-[44px]"
                >
                  Archive is clear
                </h2>

                <p className="mx-auto mt-4 max-w-[340px] text-sm leading-7 text-zinc-500 sm:text-[15px] dark:text-zinc-400">
                  Items removed from your workspace rest here before permanent
                  erasure.
                </p>

                <Link
                  href="/dashboard"
                  className={`${primaryButton} group mt-8`}
                >
                  Return to Dashboard
                  <ArrowRight
                    size={16}
                    strokeWidth={1.7}
                    className="transition-transform motion-safe:group-hover:translate-x-1"
                  />
                </Link>
              </div>

              <div
                aria-hidden="true"
                className="mt-14 flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-600"
              >
                <span className="h-px w-8 bg-black/10 dark:bg-white/10" />
                Space for what’s next
                <span className="h-px w-8 bg-black/10 dark:bg-white/10" />
              </div>
            </motion.section>
          ) : (
            <motion.section
              key="items"
              aria-label="Deleted reels"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              className="pt-7"
            >
              <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  A pause, not an ending. Restore a reel or let it go for good.
                </p>
                <span className="text-[11px] font-medium uppercase tracking-[0.13em] text-zinc-400 dark:text-zinc-500">
                  {count} {count === 1 ? 'item' : 'items'} in archive
                </span>
              </div>

              <motion.ul
                layout={!reduceMotion}
                className="grid list-none grid-cols-1 gap-x-5 gap-y-10 min-[400px]:grid-cols-2 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
              >
                <AnimatePresence initial={false}>
                  {recycleBin.map((reel) => {
                    const creator = getCreator(reel).replace(/^@/, '');
                    const isRestoring =
                      busy === `restore:${String(reel.id)}`;

                    return (
                      <motion.li
                        key={reel.id}
                        layout={!reduceMotion}
                        initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{
                          opacity: 0,
                          scale: reduceMotion ? 1 : 0.96,
                        }}
                        transition={{ duration: reduceMotion ? 0 : 0.22 }}
                        className="group min-w-0"
                      >
                        <article aria-label={`Deleted reel by @${creator}`}>
                          <ReelCover reel={reel} />

                          <div className="px-0.5 pt-4">
                            <h2
                              title={`@${creator}`}
                              className="truncate text-[15px] font-medium tracking-[-0.025em]"
                            >
                              @{creator}
                            </h2>
                            <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                              {getDeletionDate(reel)}
                            </p>

                            <div className="mt-4 flex flex-col gap-1.5">
                              <button
                                type="button"
                                disabled={busy !== null}
                                aria-label={`Restore reel by @${creator}`}
                                onClick={() => void handleRestore(reel)}
                                className={`${secondaryButton} w-full`}
                              >
                                {isRestoring ? (
                                  <Loader2
                                    size={14}
                                    className="animate-spin motion-reduce:animate-none"
                                  />
                                ) : (
                                  <RotateCcw size={14} strokeWidth={1.7} />
                                )}
                                {isRestoring ? 'Restoring…' : 'Restore'}
                              </button>

                              <button
                                type="button"
                                disabled={busy !== null}
                                aria-label={`Delete reel by @${creator} forever`}
                                onClick={() =>
                                  setConfirmation({ type: 'single', reel })
                                }
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-2 py-2 text-xs font-medium text-zinc-500 transition hover:bg-red-500/[0.05] hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:text-red-400"
                              >
                                <Trash2 size={12} strokeWidth={1.6} />
                                Delete Forever
                              </button>
                            </div>
                          </div>
                        </article>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </motion.ul>

              <footer className="mt-12 flex items-center gap-2 border-t border-black/[0.07] pt-5 text-xs leading-5 text-zinc-500 dark:border-white/[0.08] dark:text-zinc-400">
                <RotateCcw size={13} className="shrink-0" strokeWidth={1.6} />
                Restored reels return to your library.
              </footer>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {confirmation && (
          <ConfirmationDialog
            key="delete-confirmation"
            confirmation={confirmation}
            pending={busy === 'delete'}
            onClose={() => {
              if (!operationInProgress.current) setConfirmation(null);
            }}
            onConfirm={() => void handleConfirm()}
          />
        )}
      </AnimatePresence>
    </main>
  );
}