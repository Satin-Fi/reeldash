'use client';

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import Link from 'next/link';
import { Bricolage_Grotesque } from 'next/font/google';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Edit3,
  Folder,
  Layers,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useReels } from '@/context/ReelContext';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

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

type UnknownRecord = Record<string, unknown>;
type CollectionKind = 'smart' | 'custom';
type CollectionFilter = 'all' | CollectionKind;

interface Collection {
  id: string;
  name: string;
  description: string;
  kind: CollectionKind;
  count: number;
  previews: UnknownRecord[];
}

type DialogState =
  | { mode: 'create' }
  | { mode: 'edit'; collection: Collection }
  | { mode: 'delete'; collection: Collection };

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A589DB] focus-visible:ring-offset-4 focus-visible:ring-offset-[#FAFAF9] dark:focus-visible:ring-offset-[#090A0D]';

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#090A0D] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-[#090A0D] dark:hover:bg-zinc-200';

function asRecord(value: unknown): UnknownRecord | null {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as UnknownRecord;
  }

  return null;
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

function normalizeToken(value: unknown): string {
  return asString(value).trim().toLowerCase();
}

function identifiers(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(identifiers);

  const record = asRecord(value);

  if (record) {
    return [record.id, record.name, record.slug, record.categoryId]
      .map(normalizeToken)
      .filter(Boolean);
  }

  const token = normalizeToken(value);
  return token ? [token] : [];
}

function categoryEntries(
  source: unknown,
): Array<{ key: string; value: unknown }> {
  if (Array.isArray(source)) {
    return source.map((value, index) => ({
      key: String(index),
      value,
    }));
  }

  const record = asRecord(source);

  return record
    ? Object.entries(record).map(([key, value]) => ({ key, value }))
    : [];
}

/**
 * Accepts category arrays or keyed category maps. Membership is resolved from
 * explicit reel lists first, then from category metadata stored on each reel.
 */
function buildCollections(
  source: unknown,
  kind: CollectionKind,
  allReels: UnknownRecord[],
): Collection[] {
  return categoryEntries(source,).map(({ key, value }) => {
    const record = asRecord(value);
    const scalarName = typeof value === 'string' ? value : '';
    const name =
      asString(record?.name) ||
      asString(record?.label) ||
      scalarName ||
      key;

    const id =
      asString(record?.id) ||
      asString(record?.slug) ||
      scalarName ||
      name;

    const explicitMembers = Array.isArray(value)
      ? value
      : Array.isArray(record?.reels)
        ? record.reels
        : Array.isArray(record?.reelIds)
          ? record.reelIds
          : null;

    const aliases = new Set(
      [id, name, record?.slug].map(normalizeToken).filter(Boolean),
    );

    let members: UnknownRecord[];

    if (explicitMembers) {
      const memberIds = new Set(explicitMembers.flatMap(identifiers));
      const embeddedReels = explicitMembers
        .map(asRecord)
        .filter((item): item is UnknownRecord => item !== null);

      members = allReels.filter((reel) =>
        identifiers([reel.id, reel.reelId, reel.url]).some((identifier) =>
          memberIds.has(identifier),
        ),
      );

      const seen = new Set(
        members.map((reel) => asString(reel.id) || asString(reel.url)),
      );

      for (const reel of embeddedReels) {
        const reelKey = asString(reel.id) || asString(reel.url);

        if (getMediaUrl(reel) && (!reelKey || !seen.has(reelKey))) {
          members.push(reel);
          if (reelKey) seen.add(reelKey);
        }
      }
    } else {
      members = allReels.filter((reel) => {
        const categoryTokens = identifiers([
          reel.category,
          reel.categoryId,
          reel.categoryIds,
          reel.categories,
          reel.smartCategory,
          reel.smartCategories,
          reel.userCategoryId,
          reel.userCategoryIds,
          reel.userCategories,
          reel.tags,
        ]);

        return categoryTokens.some((token) => aliases.has(token));
      });
    }

    const reportedCount = record?.count ?? record?.reelCount;

    const count =
      typeof reportedCount === 'number' && Number.isFinite(reportedCount)
        ? Math.max(0, Math.floor(reportedCount))
        : explicitMembers
          ? explicitMembers.length
          : members.length;

    return {
      id,
      name,
      kind,
      count,
      description: asString(record?.description),
      previews: members.filter((reel) => Boolean(getMediaUrl(reel))).slice(0, 3),
    };
  });
}

function CollectionArtwork({
  variant = 0,
  className = '',
}: {
  variant?: number;
  className?: string;
}) {
  const uniqueId = useId().replace(/:/g, '');
  const gradientId = `collection-gradient-${uniqueId}`;
  const patternId = `collection-grid-${uniqueId}`;

  return (
    <svg
      viewBox="0 0 240 320"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="20"
          y1="0"
          x2="225"
          y2="320"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={variant % 2 === 0 ? '#CBB5FD' : '#80CFA0'} />
          <stop offset="1" stopColor="#CBB5FD" stopOpacity=".12" />
        </linearGradient>

        <pattern
          id={patternId}
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r=".8" fill="currentColor" opacity=".1" />
        </pattern>
      </defs>

      <rect width="240" height="320" fill={`url(#${gradientId})`} opacity=".14" />
      <rect width="240" height="320" fill={`url(#${patternId})`} />

      <path
        d="M24 58V30H52M188 30H216V58M216 262V290H188M52 290H24V262"
        stroke="currentColor"
        strokeOpacity=".17"
        strokeWidth="1"
      />

      <g transform={`rotate(${variant % 2 === 0 ? -12 : 12} 120 160)`}>
        <rect
          x="48"
          y="80"
          width="124"
          height="164"
          rx="16"
          stroke="#CBB5FD"
          strokeOpacity=".38"
        />
        <rect
          x="58"
          y="70"
          width="124"
          height="164"
          rx="16"
          stroke="#CBB5FD"
          strokeOpacity=".65"
        />
        <rect
          x="68"
          y="60"
          width="124"
          height="164"
          rx="16"
          fill={`url(#${gradientId})`}
          fillOpacity=".16"
          stroke="#CBB5FD"
          strokeWidth="1.5"
        />

        <path
          d="M88 183L113 154L134 170L164 126L176 141"
          stroke="#CBB5FD"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="104" cy="106" r="11" stroke="#80CFA0" strokeWidth="1.5" />
        <path
          d="M88 203H142M152 203H172"
          stroke="#CBB5FD"
          strokeOpacity=".5"
          strokeLinecap="round"
        />
      </g>

      <ellipse
        cx="120"
        cy="158"
        rx="95"
        ry="47"
        transform="rotate(-35 120 158)"
        stroke="#80CFA0"
        strokeOpacity=".6"
        strokeDasharray="3 6"
      />

      <circle cx="39" cy="198" r="4" fill="#80CFA0" />
      <circle cx="194" cy="107" r="4" fill="#CBB5FD" />
      <circle cx="39" cy="198" r="9" stroke="#80CFA0" strokeOpacity=".25" />
      <circle cx="194" cy="107" r="9" stroke="#CBB5FD" strokeOpacity=".25" />

      <path
        d="M181 260H195M188 253V267"
        stroke="#80CFA0"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M49 67H59M54 62V72"
        stroke="#CBB5FD"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Cover({
  reel,
  variant,
}: {
  reel?: UnknownRecord;
  variant: number;
}) {
  const src = reel ? getMediaUrl(reel) : '';
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <CollectionArtwork
        variant={variant}
        className="h-full w-full text-zinc-700 dark:text-white"
      />
    );
  }

  return (
    <>
      {/* Native images support saved cover URLs from arbitrary media hosts. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/[0.04]" />
    </>
  );
}

function PreviewDeck({
  collection,
  index,
}: {
  collection: Collection;
  index: number;
}) {
  const positions = [
    'left-[9%] top-[17%] z-10 -rotate-[8deg] group-hover:left-[6%] group-hover:-rotate-[12deg] group-focus-visible:left-[6%]',
    'left-[49%] top-[17%] z-20 rotate-[8deg] group-hover:left-[52%] group-hover:rotate-[12deg] group-focus-visible:left-[52%]',
    'left-[29%] top-[10%] z-30 rotate-0 group-hover:-translate-y-1.5 group-focus-visible:-translate-y-1.5',
  ];

  return (
    <div className="relative isolate aspect-[1.42/1] overflow-hidden rounded-[20px] bg-[#F3F2F5] dark:bg-[#191A20]">
      <div
        className={`absolute inset-0 ${
          index % 2 === 0
            ? 'bg-[radial-gradient(ellipse_at_50%_70%,rgba(203,181,253,0.22),transparent_72%)]'
            : 'bg-[radial-gradient(ellipse_at_50%_70%,rgba(128,207,160,0.17),transparent_72%)]'
        }`}
      />

      <div className="absolute inset-x-[15%] bottom-[10%] h-6 rounded-[50%] bg-black/[0.08] blur-xl dark:bg-black/30" />

      {positions.map((position, slot) => {
        // Keep the first cover at the front of the stack.
        const previewIndex = slot === 2 ? 0 : slot + 1;

        return (
          <div
            key={slot}
            className={`absolute aspect-[3/4] w-[42%] overflow-hidden rounded-xl border border-white/70 bg-[#F9F8FC] shadow-[0_8px_24px_-8px_rgba(26,18,48,0.3)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none dark:border-white/[0.12] dark:bg-[#24232D] dark:shadow-[0_12px_28px_-8px_rgba(0,0,0,0.65)] ${position}`}
          >
            <Cover
              reel={collection.previews[previewIndex]}
              variant={index + slot}
            />
          </div>
        );
      })}

      <div className="absolute bottom-3 left-3 z-40 inline-flex items-center gap-1.5 rounded-full border border-black/[0.05] bg-white/85 px-2.5 py-1.5 text-[10px] font-medium text-zinc-700 backdrop-blur-md dark:border-white/[0.08] dark:bg-[#121316]/85 dark:text-zinc-200">
        {collection.kind === 'smart' ? (
          <Sparkles className="h-3 w-3 text-[#9276BD] dark:text-[#CBB5FD]" />
        ) : (
          <Folder className="h-3 w-3 text-[#4B9066] dark:text-[#80CFA0]" />
        )}
        {collection.kind === 'smart' ? 'Smart collection' : 'Your collection'}
      </div>
    </div>
  );
}

function CollectionCard({
  collection,
  index,
  onExplore,
  onEdit,
  onDelete,
}: {
  collection: Collection;
  index: number;
  onExplore: (id: string) => void;
  onEdit: (collection: Collection) => void;
  onDelete: (collection: Collection) => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      layout={!reduceMotion}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.035, 0.18),
        layout: { duration: 0.25 },
      }}
      className="relative min-w-0 rounded-[28px] border border-black/[0.07] bg-white p-2.5 transition-shadow duration-300 hover:shadow-[0_16px_50px_-28px_rgba(41,31,63,0.3)] dark:border-white/[0.08] dark:bg-[#121316] dark:hover:shadow-[0_16px_50px_-28px_rgba(0,0,0,0.8)]"
    >
      <Link
        href="/"
        onClick={() => onExplore(collection.id)}
        aria-label={`Explore ${collection.name}, ${collection.count} ${
          collection.count === 1 ? 'reel' : 'reels'
        }`}
        className={`group block rounded-[20px] ${focusRing}`}
      >
        <PreviewDeck collection={collection} index={index} />

        <div className="px-3.5 pb-3 pt-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2
              className={`${bricolage.className} truncate text-[23px] font-bold leading-tight tracking-[-0.045em]`}
              title={collection.name}
            >
              {collection.name}
            </h2>

            <span className="shrink-0 text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
              {collection.count.toLocaleString()}{' '}
              {collection.count === 1 ? 'reel' : 'reels'}
            </span>
          </div>

          <p className="mt-2 line-clamp-2 min-h-10 text-[13px] leading-5 text-zinc-500 dark:text-zinc-400">
            {collection.description ||
              (collection.kind === 'smart'
                ? 'Related discoveries, brought together in one place.'
                : 'A little corner of the internet, curated by you.')}
          </p>

          <div className="mt-5 flex h-8 items-center gap-2 pr-20 text-[11px] font-semibold text-zinc-500 transition-colors group-hover:text-zinc-950 group-focus-visible:text-zinc-950 dark:text-zinc-400 dark:group-hover:text-white dark:group-focus-visible:text-white">
            <span>Explore Collection</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transition-none" />
          </div>
        </div>
      </Link>

      {collection.kind === 'custom' && (
        <div className="absolute bottom-[22px] right-5 flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(collection)}
            aria-label={`Edit ${collection.name}`}
            title="Edit collection"
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-white/[0.06] dark:hover:text-white ${focusRing}`}
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(collection)}
            aria-label={`Delete ${collection.name}`}
            title="Delete collection"
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-400/10 dark:hover:text-red-300 ${focusRing}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </motion.article>
  );
}

function CategoryDialog({
  dialog,
  onClose,
  onSave,
  onDelete,
}: {
  dialog: DialogState;
  onClose: () => void;
  onSave: (
    name: string,
    description: string,
    collection?: Collection,
  ) => Promise<void>;
  onDelete: (collection: Collection) => Promise<void>;
}) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const nameId = useId();
  const fieldDescriptionId = useId();
  const errorId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const submissionLock = useRef(false);

  const isDelete = dialog.mode === 'delete';
  const collection = dialog.mode === 'create' ? undefined : dialog.collection;

  const [name, setName] = useState(collection?.name ?? '');
  const [description, setDescription] = useState(
    collection?.description ?? '',
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const frame = requestAnimationFrame(() => {
      if (isDelete) cancelRef.current?.focus();
      else nameRef.current?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!submissionLock.current) closeRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const elements = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]',
        ) ?? [],
      );

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (!first || !last) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }

      const active = document.activeElement;

      if (event.shiftKey && (active === first || !panelRef.current?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (active === last || !panelRef.current?.contains(active))
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isDelete]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submissionLock.current) return;

    if (!isDelete && !name.trim()) {
      setError('Give your collection a name.');
      nameRef.current?.focus();
      return;
    }

    submissionLock.current = true;
    setPending(true);
    setError('');

    try {
      if (dialog.mode === 'delete') {
        await onDelete(dialog.collection);
      } else {
        await onSave(
          name.trim(),
          description.trim(),
          dialog.mode === 'edit' ? dialog.collection : undefined,
        );
      }

      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Something went wrong. Please try again.',
      );
    } finally {
      submissionLock.current = false;
      setPending(false);
    }
  }

  const inputClass =
    'w-full rounded-xl border border-black/[0.09] bg-[#FAFAF9] px-4 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-[#AA8CDD] focus:ring-4 focus:ring-[#CBB5FD]/15 disabled:opacity-60 dark:border-white/[0.1] dark:bg-[#090A0D] dark:text-white dark:placeholder:text-zinc-600';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.18 }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#090A0D]/45 p-4 backdrop-blur-md"
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={pending}
        tabIndex={-1}
        initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="relative my-auto max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-black/[0.07] bg-white p-6 text-zinc-950 shadow-2xl outline-none sm:p-8 dark:border-white/[0.08] dark:bg-[#121316] dark:text-white"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          aria-label="Close dialog"
          className={`absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-black/[0.04] disabled:opacity-40 dark:hover:bg-white/[0.06] ${focusRing}`}
        >
          <X className="h-4 w-4" />
        </button>

        <div
          className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl ${
            isDelete
              ? 'bg-red-50 text-red-500 dark:bg-red-400/10 dark:text-red-300'
              : 'bg-[#CBB5FD]/25 text-[#8061AD] dark:text-[#CBB5FD]'
          }`}
        >
          {isDelete ? (
            <Trash2 className="h-5 w-5" />
          ) : dialog.mode === 'edit' ? (
            <Edit3 className="h-5 w-5" />
          ) : (
            <Folder className="h-5 w-5" />
          )}
        </div>

        <h2
          id={titleId}
          className={`${bricolage.className} pr-6 text-3xl font-bold tracking-[-0.045em]`}
        >
          {isDelete
            ? 'Let this collection go?'
            : dialog.mode === 'edit'
              ? 'Refine your collection.'
              : 'Make room for an idea.'}
        </h2>

        <p
          id={descriptionId}
          className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400"
        >
          {isDelete
            ? `“${collection?.name}” will be deleted. Your saved reels will stay in your library.`
            : dialog.mode === 'edit'
              ? 'A new name, a little context. Keep it feeling like you.'
              : 'Give your next rabbit hole a place to live.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-7">
          {!isDelete && (
            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor={nameId} className="text-xs font-semibold">
                    Name <span className="text-[#9276BD]">*</span>
                  </label>
                  <span className="text-[10px] tabular-nums text-zinc-400">
                    {name.length}/60
                  </span>
                </div>

                <input
                  ref={nameRef}
                  id={nameId}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (error) setError('');
                  }}
                  placeholder="e.g. Spaces to get lost in"
                  maxLength={60}
                  required
                  autoComplete="off"
                  disabled={pending}
                  aria-describedby={error ? errorId : undefined}
                  className={inputClass}
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor={fieldDescriptionId}
                    className="text-xs font-semibold"
                  >
                    Description
                  </label>
                  <span className="text-[10px] text-zinc-400">Optional</span>
                </div>

                <textarea
                  id={fieldDescriptionId}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What ties these discoveries together?"
                  maxLength={240}
                  rows={3}
                  disabled={pending}
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          )}

          {error && (
            <p
              id={errorId}
              role="alert"
              className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs leading-5 text-red-700 dark:bg-red-400/10 dark:text-red-300"
            >
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-black/[0.06] pt-5 dark:border-white/[0.08]">
            <button
              ref={cancelRef}
              type="button"
              onClick={onClose}
              disabled={pending}
              className={`rounded-full px-4 py-2.5 text-xs font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 disabled:opacity-40 dark:hover:bg-white/[0.06] dark:hover:text-white ${focusRing}`}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={pending || (!isDelete && !name.trim())}
              className={
                isDelete
                  ? `inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`
                  : `${primaryButton} ${focusRing}`
              }
            >
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isDelete ? (
                <Trash2 className="h-3.5 w-3.5" />
              ) : dialog.mode === 'edit' ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}

              {pending
                ? isDelete
                  ? 'Deleting…'
                  : 'Saving…'
                : isDelete
                  ? 'Delete collection'
                  : dialog.mode === 'edit'
                    ? 'Save changes'
                    : 'Create collection'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function CategoriesPage() {
  const {
    reels,
    smartCategories,
    userCategories,
    createUserCategory,
    updateUserCategory,
    deleteUserCategory,
    setActiveCategory,
  } = useReels();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CollectionFilter>('all');
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const searchId = useId();

  const reelRecords = useMemo(
    () =>
      (Array.isArray(reels) ? reels : [])
        .map(asRecord)
        .filter((reel): reel is UnknownRecord => reel !== null),
    [reels],
  );

  const collections = useMemo(
    () => [
      ...buildCollections(smartCategories, 'smart', reelRecords),
      ...buildCollections(userCategories, 'custom', reelRecords),
    ],
    [smartCategories, userCategories, reelRecords],
  );

  const counts = useMemo(
    () => ({
      all: collections.length,
      smart: collections.filter((collection) => collection.kind === 'smart')
        .length,
      custom: collections.filter((collection) => collection.kind === 'custom')
        .length,
    }),
    [collections],
  );

  const visibleCollections = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();

    return collections.filter(
      (collection) =>
        (filter === 'all' || collection.kind === filter) &&
        collection.name.toLocaleLowerCase().includes(needle),
    );
  }, [collections, filter, query]);

  useEffect(() => {
    if (!announcement) return;
    const timeout = window.setTimeout(() => setAnnouncement(''), 4500);
    return () => window.clearTimeout(timeout);
  }, [announcement]);

  async function handleSave(
    name: string,
    description: string,
    collection?: Collection,
  ) {
    const duplicate = collections.some(
      (item) =>
        item.kind === 'custom' &&
        item.id !== collection?.id &&
        item.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase(),
    );

    if (duplicate) {
      throw new Error('You already have a collection with that name.');
    }

    if (collection) {
      await updateUserCategory(collection.id, { name, description });
      setAnnouncement(`“${name}” updated.`);
    } else {
      await createUserCategory(name, undefined, description);
      setQuery('');
      setFilter('custom');
      setAnnouncement(`“${name}” is ready for your discoveries.`);
    }
  }

  async function handleDelete(collection: Collection) {
    await deleteUserCategory(collection.id);
    setAnnouncement(`“${collection.name}” deleted. Your reels are still saved.`);
  }

  const filters: Array<{ value: CollectionFilter; label: string }> = [
    { value: 'all', label: 'All collections' },
    { value: 'smart', label: 'Smart' },
    { value: 'custom', label: 'Yours' },
  ];

  const hasSearch = query.trim().length > 0;

  return (
    <main className="min-h-screen bg-[#FAFAF9] text-zinc-950 selection:bg-[#CBB5FD]/45 dark:bg-[#090A0D] dark:text-white">
      <div className="mx-auto max-w-[1440px] px-5 pb-16 pt-10 sm:px-8 sm:pt-14 lg:px-12 lg:pt-16">
        <header className="flex items-end justify-between gap-8">
          <div className="max-w-2xl">
            <div className="mb-5 flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-[#80CFA0]/25 ring-4 ring-[#80CFA0]/10" />
                <span className="relative h-2 w-2 rounded-full bg-[#80CFA0]" />
              </span>
              Your visual index
            </div>

            <h1
              className={`${bricolage.className} text-[clamp(3rem,6vw,5rem)] font-bold leading-[0.98] tracking-[-0.065em]`}
            >
              Categories<span className="text-[#CBB5FD]">.</span>
            </h1>

            <p className="mt-5 max-w-md text-sm leading-6 text-zinc-500 sm:text-[15px] dark:text-zinc-400">
              Less scrolling. More finding.
              <br className="sm:hidden" /> A considered home for everything
              that catches your eye.
            </p>
          </div>

          <div className="hidden shrink-0 items-center gap-7 pb-1 md:flex">
            <div>
              <p
                className={`${bricolage.className} text-3xl font-medium tracking-tight tabular-nums`}
              >
                {counts.all.toString().padStart(2, '0')}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                Collections
              </p>
            </div>

            <div className="h-10 w-px bg-black/[0.08] dark:bg-white/[0.08]" />

            <div>
              <p
                className={`${bricolage.className} text-3xl font-medium tracking-tight tabular-nums`}
              >
                {reelRecords.length.toLocaleString()}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                Saved reels
              </p>
            </div>
          </div>
        </header>

        <section aria-label="Collection controls" className="mt-10 sm:mt-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-[340px]">
              <label htmlFor={searchId} className="sr-only">
                Search category names
              </label>

              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              />

              <input
                id={searchId}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find a collection…"
                autoComplete="off"
                className="h-11 w-full rounded-full border border-black/[0.07] bg-white pl-11 pr-11 text-xs outline-none transition placeholder:text-zinc-400 focus:border-[#A589DB] focus:ring-4 focus:ring-[#CBB5FD]/15 [&::-webkit-search-cancel-button]:appearance-none dark:border-white/[0.08] dark:bg-[#121316] dark:placeholder:text-zinc-500"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className={`absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-white/[0.06] dark:hover:text-white ${focusRing}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setDialog({ mode: 'create' })}
              className={`${primaryButton} min-h-11 self-start sm:self-auto ${focusRing}`}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              New Category
            </button>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.07] pb-4 dark:border-white/[0.08]">
            <div
              role="group"
              aria-label="Filter collections"
              className="flex flex-wrap items-center gap-1"
            >
              {filters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={filter === item.value}
                  onClick={() => setFilter(item.value)}
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[11px] font-medium transition-colors ${focusRing} ${
                    filter === item.value
                      ? 'bg-[#EDE6F8] text-[#655080] dark:bg-[#CBB5FD]/15 dark:text-[#DCCDF8]'
                      : 'text-zinc-500 hover:bg-black/[0.03] hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-white'
                  }`}
                >
                  {item.label}
                  <span
                    className={`text-[10px] tabular-nums ${
                      filter === item.value ? 'opacity-75' : 'opacity-60'
                    }`}
                  >
                    {counts[item.value]}
                  </span>
                </button>
              ))}
            </div>

            <p
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="px-1 text-[10px] text-zinc-400 dark:text-zinc-500"
            >
              {visibleCollections.length}{' '}
              {visibleCollections.length === 1 ? 'collection' : 'collections'}
              {hasSearch ? ' found' : ''}
            </p>
          </div>
        </section>

        <section aria-label="Categories" className="mt-7">
          {visibleCollections.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:gap-6">
              <AnimatePresence mode="popLayout">
                {visibleCollections.map((collection, index) => (
                  <CollectionCard
                    key={`${collection.kind}:${collection.id}`}
                    collection={collection}
                    index={index}
                    onExplore={(id) => setActiveCategory(id)}
                    onEdit={(item) =>
                      setDialog({ mode: 'edit', collection: item })
                    }
                    onDelete={(item) =>
                      setDialog({ mode: 'delete', collection: item })
                    }
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex min-h-[430px] flex-col items-center justify-center rounded-[28px] border border-dashed border-black/[0.1] px-6 py-12 text-center dark:border-white/[0.1]">
              <div className="relative mb-5">
                <div className="absolute inset-4 rounded-full bg-[#CBB5FD]/15 blur-2xl" />
                <CollectionArtwork
                  variant={1}
                  className="relative h-40 w-32 text-zinc-700 dark:text-zinc-200"
                />
              </div>

              <h2
                className={`${bricolage.className} text-3xl font-bold tracking-[-0.045em]`}
              >
                {hasSearch
                  ? 'Nothing in this corner. Yet.'
                  : filter === 'smart'
                    ? 'Connections are coming.'
                    : 'Every collection starts somewhere.'}
              </h2>

              <p className="mt-3 max-w-sm break-words text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                {hasSearch
                  ? `No collections match “${query.trim()}”. Try another name or start something new.`
                  : filter === 'smart'
                    ? 'As your reel library grows, related discoveries can find a home together.'
                    : 'Start with a mood, an obsession, or a very good idea. Make your first collection yours.'}
              </p>

              {hasSearch ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className={`${primaryButton} mt-6 ${focusRing}`}
                >
                  <X className="h-3.5 w-3.5" />
                  Clear search
                </button>
              ) : filter === 'smart' ? (
                <Link
                  href="/"
                  className={`${primaryButton} mt-6 ${focusRing}`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  Visit your library
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setDialog({ mode: 'create' })}
                  className={`${primaryButton} mt-6 ${focusRing}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Category
                </button>
              )}
            </div>
          )}
        </section>

        {visibleCollections.length > 0 && (
          <footer className="mt-10 flex items-center justify-center gap-2 text-[10px] tracking-wide text-zinc-400 dark:text-zinc-600">
            <Layers className="h-3 w-3" aria-hidden="true" />
            A little order for your endless curiosity.
          </footer>
        )}
      </div>

      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed bottom-6 inset-x-4 z-[110] flex justify-center"
      >
        <AnimatePresence>
          {announcement && (
            <motion.div
              key={announcement}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex max-w-md items-center gap-3 rounded-2xl border border-black/[0.07] bg-white px-5 py-4 text-xs leading-5 text-zinc-800 shadow-xl dark:border-white/[0.1] dark:bg-[#1B1D20] dark:text-zinc-100"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#80CFA0]/20 text-[#39774F] dark:text-[#80CFA0]">
                <Check className="h-3.5 w-3.5" />
              </span>
              {announcement}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {dialog && (
          <CategoryDialog
            key={
              dialog.mode === 'create'
                ? 'create'
                : `${dialog.mode}:${dialog.collection.id}`
            }
            dialog={dialog}
            onClose={() => setDialog(null)}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </main>
  );
}