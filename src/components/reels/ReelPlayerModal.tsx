"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Reel } from "@/types/reel";
import { useReels } from "@/context/ReelContext";
import * as PlayerModule from "./ReelPlayer";

export interface ReelPlayerModalProps {
  reel: Reel | null;
  isOpen: boolean;
  onClose: () => void;
}

type PlayerProps = {
  reel: Reel;
  autoPlay: boolean;
  className: string;
};

const playerExports = PlayerModule as unknown as {
  default?: React.ComponentType<PlayerProps>;
  ReelPlayer?: React.ComponentType<PlayerProps>;
};

const ReelPlayer = playerExports.ReelPlayer ?? playerExports.default;

type IconName =
  | "close"
  | "up"
  | "down"
  | "more"
  | "heart"
  | "comment"
  | "link"
  | "external"
  | "download"
  | "trash"
  | "music"
  | "plus"
  | "check"
  | "note"
  | "folder"
  | "sparkles"
  | "refresh";

type Drawer = "notes" | "category" | "details" | null;
type UnknownRecord = Record<string, unknown>;

const ICON_PATHS: Record<IconName, React.ReactNode> = {
  close: <path d="m6 6 12 12M18 6 6 18" />,
  up: <path d="m6 14 6-6 6 6" />,
  down: <path d="m6 10 6 6 6-6" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  heart: (
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
  ),
  comment: <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />,
  link: (
    <>
      <path d="m10 13 4-4M8 16l-1 1a4.2 4.2 0 0 1-6-6l4-4a4.2 4.2 0 0 1 6 0m2 10a4.2 4.2 0 0 0 6 0l4-4a4.2 4.2 0 0 0-6-6l-1 1" transform="translate(1 0) scale(.92)" />
    </>
  ),
  external: (
    <>
      <path d="M14 3h7v7m0-7L10 14" />
      <path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12m-5-5 5 5 5-5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5l12-2v13M9 9l12-2" />
      <ellipse cx="6" cy="18" rx="3" ry="3" />
      <ellipse cx="18" cy="16" rx="3" ry="3" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12 4 4L19 6" />,
  note: (
    <>
      <path d="M14 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9M14 3v7h7L14 3ZM7 14h10M7 17h6" />
    </>
  ),
  folder: <path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />,
  sparkles: (
    <>
      <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />
      <path d="m20 2 .7 1.3L22 4l-1.3.7L20 6l-.7-1.3L18 4l1.3-.7L20 2Z" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 7v5h-5M4 17v-5h5" />
      <path d="M6.1 7a7 7 0 0 1 11.5-2L20 8M4 16l2.4 3A7 7 0 0 0 17.9 17" />
    </>
  ),
};

function Icon({
  name,
  className = "h-4 w-4",
  filled = false,
}: {
  name: IconName;
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

function record(value: unknown): UnknownRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

function text(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function safeUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : "";
  } catch {
    return "";
  }
}

function count(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function reelKey(value: Reel): string {
  const data = record(value);
  return String(data.id ?? data.instagramUrl ?? data.videoUrl ?? "");
}

function readableDate(value: unknown): { label: string; iso: string } | null {
  if (value == null || value === "") return null;

  let input: string | number | Date;
  if (value instanceof Date) {
    input = value;
  } else if (typeof value === "number") {
    input = value < 100_000_000_000 ? value * 1000 : value;
  } else if (typeof value === "string") {
    input = /^\d{10,13}$/.test(value)
      ? Number(value) * (value.length === 10 ? 1000 : 1)
      : value;
  } else {
    return null;
  }

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;

  return {
    label: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date),
    iso: date.toISOString(),
  };
}

function summaryPoints(value: unknown): string[] {
  let source: unknown = value;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const data = record(value);
    source = data.takeaways ?? data.keyTakeaways ?? data.bullets ?? data.summary;
  }

  const entries = Array.isArray(source)
    ? source.map((item) =>
        typeof item === "string"
          ? item
          : text(record(item).text, record(item).content, record(item).title),
      )
    : typeof source === "string"
      ? source.split(/\n+/)
      : [];

  return entries
    .map((entry) =>
      entry
        .replace(/^\s*(?:[-*•]\s+|\d+[.)]\s+)/, "")
        .replace(/^\s*#{1,6}\s+/, "")
        .replace(/\*\*/g, "")
        .trim(),
    )
    .filter(Boolean);
}

function describeReel(value: Reel | null) {
  const data = record(value);
  const creator = record(data.creator);
  const stats = record(data.stats);
  const username = text(
    data.creatorUsername,
    data.username,
    creator.username,
  ).replace(/^@/, "");

  return {
    username,
    avatar: safeUrl(
      data.creatorAvatarUrl ??
        data.creatorAvatar ??
        creator.avatarUrl ??
        data.profilePicUrl,
    ),
    verified: Boolean(
      data.creatorVerified ??
        data.isVerified ??
        creator.isVerified ??
        creator.verified,
    ),
    caption: text(data.caption, data.description),
    instagramUrl: safeUrl(data.instagramUrl),
    videoUrl: safeUrl(data.downloadUrl ?? data.videoUrl ?? data.mediaUrl),
    favorite: Boolean(data.isFavorite ?? data.favorite),
    likes: count(data.likesCount ?? data.likeCount ?? data.likes ?? stats.likes),
    comments: count(
      data.commentsCount ?? data.commentCount ?? data.comments ?? stats.comments,
    ),
    category: text(data.category),
    note: typeof data.note === "string"
      ? data.note
      : typeof data.notes === "string"
        ? data.notes
        : "",
    summary: summaryPoints(data.aiSummary ?? data.summary),
    date: readableDate(
      data.publishedAt ?? data.postedAt ?? data.timestamp ?? data.createdAt,
    ),
    audioTitle: text(data.audioTitle),
    audioArtist: text(data.audioArtist, data.audioAuthor),
  };
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function Caption({ value }: { value: string }) {
  const tokens = value.split(
    new RegExp(
      "(https?:\\/\\/[^\\s<>]+|#[\\p{L}\\p{N}_]+|@[\\p{L}\\p{N}_.]+)",
      "gu",
    ),
  );

  return (
    <p className="select-text whitespace-pre-wrap break-words break-all text-sm leading-relaxed text-zinc-200 [overflow-wrap:anywhere]">
      {tokens.map((token, index) => {
        let href = "";
        let suffix = "";
        let label = token;

        if (/^https?:\/\//i.test(token)) {
          suffix = token.match(/[.,!?;:)\]}]+$/)?.[0] ?? "";
          label = suffix ? token.slice(0, -suffix.length) : token;
          href = safeUrl(label);
        } else if (token.startsWith("#")) {
          const tag = token.slice(1);
          const junk =
            tag.length > 25 ||
            /(.)\1{4,}/iu.test(tag) ||
            /(.{2,4})\1{3,}/iu.test(tag);

          if (!junk) {
            href = `https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`;
          }
        } else if (token.startsWith("@")) {
          const username = token.slice(1);
          if (/^[a-zA-Z0-9_.]{1,30}$/.test(username)) {
            href = `/creator/${encodeURIComponent(username)}`;
          }
        }

        if (!href) return <React.Fragment key={index}>{token}</React.Fragment>;

        const external = href.startsWith("http");
        return (
          <React.Fragment key={index}>
            <a
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="rounded-sm text-sky-400 transition-colors hover:text-sky-300 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
            >
              {label}
            </a>
            {suffix}
          </React.Fragment>
        );
      })}
    </p>
  );
}

function Avatar({ username, src }: { username: string; src: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  return (
    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-sm font-medium text-zinc-300 ring-1 ring-white/10">
      {src && !failed ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        (username[0] || "R").toUpperCase()
      )}
    </span>
  );
}

function VerifiedBadge() {
  return (
    <span className="shrink-0 text-sky-400" title="Verified creator">
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          fill="currentColor"
          d="m12 1 3 2.1 3.6.3 1.1 3.4L22 9.6l-1 3.5.4 3.6-3 2-1.8 3.1-3.6-.2-3.4 1.1-2.8-2.2-3.4-1.1-.4-3.6L1 12l2.1-3 .3-3.6 3.4-1.1L9.6 2 12 1Z"
        />
        <path
          d="m7.5 12 3 3 6-6"
          fill="none"
          stroke="#090A0E"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="sr-only">Verified</span>
    </span>
  );
}

function NoteEditor({
  value,
  onSave,
}: {
  value: string;
  onSave: (value: string) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState(value);
  const [status, setStatus] = useState<"saved" | "editing" | "saving" | "error">(
    "saved",
  );
  const textareaId = useId();
  const draftRef = useRef(value);
  const savedRef = useRef(value);
  const saveRef = useRef(onSave);
  const aliveRef = useRef(false);
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    saveRef.current = onSave;
  }, [onSave]);

  const persist = useCallback(() => {
    const snapshot = draftRef.current;
    queueRef.current = queueRef.current.then(async () => {
      if (snapshot === savedRef.current) return;
      if (aliveRef.current) setStatus("saving");

      let success = false;
      try {
        success = await saveRef.current(snapshot);
      } catch {
        success = false;
      }

      if (success) savedRef.current = snapshot;
      if (aliveRef.current) {
        setStatus(
          !success
            ? "error"
            : draftRef.current === snapshot
              ? "saved"
              : "editing",
        );
      }
    });
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      persist();
    };
  }, [persist]);

  useEffect(() => {
    if (draftRef.current === savedRef.current) {
      draftRef.current = value;
      savedRef.current = value;
      setDraft(value);
    }
  }, [value]);

  useEffect(() => {
    if (draft === savedRef.current) return;
    const timer = window.setTimeout(persist, 800);
    return () => window.clearTimeout(timer);
  }, [draft, persist]);

  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <label
          htmlFor={textareaId}
          className="flex items-center gap-2 text-xs font-medium text-zinc-400"
        >
          <Icon name="note" className="h-3.5 w-3.5" />
          Personal notes
        </label>
        <span className="text-[11px] text-zinc-500" aria-live="polite">
          {status === "saved"
            ? "Saved"
            : status === "saving"
              ? "Saving…"
              : status === "error"
                ? "Not saved"
                : "Unsaved changes"}
        </span>
      </div>
      <textarea
        id={textareaId}
        value={draft}
        onChange={(event) => {
          draftRef.current = event.target.value;
          setDraft(event.target.value);
          setStatus("editing");
        }}
        onBlur={persist}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            persist();
          }
        }}
        placeholder="A hook worth keeping. A script to try. Your next remix."
        rows={4}
        maxLength={20000}
        spellCheck
        className="rd-notepad block min-h-28 w-full resize-y rounded-xl border border-transparent bg-white/[0.025] px-3.5 py-3 text-sm leading-7 text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 hover:bg-white/[0.035] focus:border-white/10 focus:bg-white/[0.04]"
      />
      {status === "error" && (
        <button
          type="button"
          onClick={persist}
          className="mt-2 text-xs text-sky-400 hover:text-sky-300"
        >
          Retry saving
        </button>
      )}
    </section>
  );
}

const iconButton =
  "rd-focus inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-30";
const AUDIO_STORAGE_KEY = "reeldash:saved-audio";

export default function ReelPlayerModal({
  reel,
  isOpen,
  onClose,
}: ReelPlayerModalProps) {
  // Hooks are deliberately unconditional, including while the portal is closed.
  const {
    reels,
    toggleFavorite,
    deleteReel,
    updateNote,
    generateAiSummary,
    smartCategories,
    updateCategory,
    showToast,
  } = useReels();

  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [removedKeys, setRemovedKeys] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [savedAudio, setSavedAudio] = useState<string[]>([]);
  const [dragOffset, setDragOffset] = useState(0);
  const [announcement, setAnnouncement] = useState("");

  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const categoryButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerTriggerRef = useRef<HTMLElement | null>(null);
  const busyRef = useRef(new Set<string>());
  const aliveRef = useRef(false);
  const toastRef = useRef(showToast);
  const gestureRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    vertical: boolean;
  } | null>(null);
  const titleId = useId();
  const drawerTitleId = useId();
  const menuId = useId();
  const categoryId = useId();

  const propKey = reel ? reelKey(reel) : "";

  const availableReels = useMemo(() => {
    const source: Reel[] = Array.isArray(reels) ? [...reels] : [];
    if (reel && !source.some((item) => reelKey(item) === propKey)) {
      source.unshift(reel);
    }
    const seen = new Set<string>();
    return source.filter((item) => {
      if (!item) return false;
      const key = reelKey(item);
      if (!key || seen.has(key) || removedKeys.includes(key)) return false;
      seen.add(key);
      return true;
    });
  }, [reels, reel, propKey, removedKeys]);

  const activeIndex = useMemo(() => {
    const requested = selectedKey ?? propKey;
    const index = availableReels.findIndex((item) => reelKey(item) === requested);
    return index >= 0 ? index : availableReels.length ? 0 : -1;
  }, [availableReels, selectedKey, propKey]);

  const activeReel = activeIndex >= 0 ? availableReels[activeIndex] : null;
  const activeKey = activeReel ? reelKey(activeReel) : "";
  const view = useMemo(() => describeReel(activeReel), [activeReel]);

  const availableCategories = useMemo(() => {
    const source: unknown = smartCategories;
    const entries = Array.isArray(source)
      ? source
      : Object.entries(record(source)).map(([key, value]) =>
          typeof value === "string" ? value : { ...record(value), id: key },
        );

    const result = entries
      .map((entry) =>
        typeof entry === "string"
          ? entry.trim()
          : text(
              record(entry).name,
              record(entry).label,
              record(entry).title,
              record(entry).id,
            ),
      )
      .filter(Boolean);

    if (view.category) result.unshift(view.category);
    return [...new Set(result)];
  }, [smartCategories, view.category]);

  const audioKey = `${view.audioTitle}\u001f${view.audioArtist}`;
  const isAudioSaved = savedAudio.includes(audioKey);
  const hasPrevious = activeIndex > 0;
  const hasNext = activeIndex >= 0 && activeIndex < availableReels.length - 1;
  const summaryBusy = Boolean(busy[`${activeKey}:summary`]);
  const downloadBusy = Boolean(busy[`${activeKey}:download`]);
  const categoryBusy = Boolean(busy[`${activeKey}:category`]);

  const notify = useCallback((message: string) => {
    if (aliveRef.current) setAnnouncement(message);
    try {
      toastRef.current(message);
    } catch {
      // The local live region remains available if the app toast is unavailable.
    }
  }, []);

  const runAction = useCallback(
    async (
      key: string,
      task: () => unknown | Promise<unknown>,
      failureMessage: string,
      successMessage?: string,
    ): Promise<boolean> => {
      if (busyRef.current.has(key)) return false;
      busyRef.current.add(key);
      if (aliveRef.current) setBusy((previous) => ({ ...previous, [key]: true }));

      try {
        await task();
        if (successMessage) notify(successMessage);
        return true;
      } catch {
        notify(failureMessage);
        return false;
      } finally {
        busyRef.current.delete(key);
        if (aliveRef.current) {
          setBusy((previous) => {
            const next = { ...previous };
            delete next[key];
            return next;
          });
        }
      }
    },
    [notify],
  );

  const navigate = useCallback(
    (direction: -1 | 1) => {
      const next = availableReels[activeIndex + direction];
      if (!next) return;
      setSelectedKey(reelKey(next));
      setMenuOpen(false);
      setCategoryOpen(false);
      setDrawer(null);
      setDragOffset(0);
    },
    [availableReels, activeIndex],
  );

  const closeDrawer = useCallback(() => {
    setDrawer(null);
    window.requestAnimationFrame(() => drawerTriggerRef.current?.focus());
  }, []);

  const openDrawer = useCallback((next: Drawer) => {
    drawerTriggerRef.current = document.activeElement as HTMLElement | null;
    setMenuOpen(false);
    setDrawer(next);
  }, []);

  const copyLink = useCallback(async () => {
    setMenuOpen(false);
    if (!view.instagramUrl) return;

    await runAction(
      `${activeKey}:copy`,
      async () => {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(view.instagramUrl);
          return;
        }

        const previousFocus = document.activeElement as HTMLElement | null;
        const input = document.createElement("textarea");
        input.value = view.instagramUrl;
        input.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
        (rootRef.current ?? document.body).appendChild(input);
        input.select();
        let copied = false;
        try {
          copied = document.execCommand("copy");
        } finally {
          input.remove();
          previousFocus?.focus();
        }
        if (!copied) throw new Error("Clipboard unavailable");
      },
      "Couldn’t copy the link. Please try again.",
      "Link copied.",
    );
  }, [activeKey, view.instagramUrl, runAction]);

  const download = useCallback(async () => {
    setMenuOpen(false);
    if (!view.videoUrl) {
      notify("A downloadable video file isn’t available for this reel.");
      return;
    }

    await runAction(
      `${activeKey}:download`,
      async () => {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 60000);
        let objectUrl = "";

        try {
          const response = await fetch(view.videoUrl, {
            signal: controller.signal,
            credentials: "omit",
          });
          if (!response.ok) throw new Error("Download failed");
          const contentType = response.headers.get("content-type") ?? "";
          if (
            contentType &&
            !/^(video\/|application\/octet-stream)/i.test(contentType)
          ) {
            throw new Error("The response is not a video");
          }

          const blob = await response.blob();
          if (!blob.size) throw new Error("Empty video");

          objectUrl = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = objectUrl;
          const filename = `${view.username || "reeldash"}-${activeKey}`
            .replace(/[^a-zA-Z0-9_-]/g, "-")
            .slice(0, 100);
          anchor.download = `${filename}.mp4`;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
        } finally {
          window.clearTimeout(timer);
          if (objectUrl) {
            const urlToRevoke = objectUrl;
            window.setTimeout(() => URL.revokeObjectURL(urlToRevoke), 30000);
          }
        }
      },
      "Download unavailable. Try opening the reel on Instagram.",
      "Download started.",
    );
  }, [activeKey, view.videoUrl, view.username, runAction, notify]);

  const favorite = useCallback(async () => {
    if (!activeReel) return;
    await runAction(
      `${activeKey}:favorite`,
      () => toggleFavorite(activeReel.id),
      "Couldn’t update your favorite. Please try again.",
    );
  }, [activeReel, activeKey, toggleFavorite, runAction]);

  const generateSummary = useCallback(async () => {
    if (!activeReel) return;
    await runAction(
      `${activeKey}:summary`,
      () => generateAiSummary(activeReel.id),
      "Couldn’t extract takeaways. Please try again.",
    );
  }, [activeReel, activeKey, generateAiSummary, runAction]);

  const chooseCategory = useCallback(
    async (category: string) => {
      if (!activeReel || categoryBusy) return;
      const success = await runAction(
        `${activeKey}:category`,
        () => updateCategory(activeReel.id, category),
        "Couldn’t update the category. Please try again.",
      );
      if (success) {
        setCategoryOpen(false);
        if (isMobile) closeDrawer();
        else categoryButtonRef.current?.focus();
      }
    },
    [
      activeReel,
      activeKey,
      categoryBusy,
      updateCategory,
      runAction,
      isMobile,
      closeDrawer,
    ],
  );

  const saveNote = useCallback(
    async (note: string): Promise<boolean> => {
      if (!activeReel) return false;
      try {
        await updateNote(activeReel.id, note);
        return true;
      } catch {
        notify("Your note wasn’t saved. Please try again.");
        return false;
      }
    },
    [activeReel, updateNote, notify],
  );

  const removeReel = useCallback(async () => {
    setMenuOpen(false);
    if (!activeReel) return;
    if (!window.confirm("Delete this reel from your library? This can’t be undone.")) {
      menuButtonRef.current?.focus();
      return;
    }

    const neighbor =
      availableReels[activeIndex + 1] ?? availableReels[activeIndex - 1];
    const success = await runAction(
      `${activeKey}:delete`,
      () => deleteReel(activeReel.id),
      "Couldn’t delete this reel. Please try again.",
      "Reel removed from your library.",
    );

    if (success) {
      setRemovedKeys((previous) => [...previous, activeKey]);
      if (neighbor) setSelectedKey(reelKey(neighbor));
      else onClose();
    }
  }, [
    activeReel,
    availableReels,
    activeIndex,
    activeKey,
    deleteReel,
    runAction,
    onClose,
  ]);

  const saveAudio = useCallback(() => {
    if (!view.audioTitle || isAudioSaved) return;

    try {
      let existing: unknown = [];
      try {
        existing = JSON.parse(localStorage.getItem(AUDIO_STORAGE_KEY) ?? "[]");
      } catch {
        existing = [];
      }

      const items = Array.isArray(existing) ? existing : [];
      const next = [
        ...items.filter((item) => record(item).key !== audioKey),
        {
          key: audioKey,
          title: view.audioTitle,
          artist: view.audioArtist,
          instagramUrl: view.instagramUrl,
          savedAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(next));
      setSavedAudio(next.map((item) => text(record(item).key)).filter(Boolean));
      notify("Audio reference saved on this device.");
    } catch {
      notify("Couldn’t save audio. Device storage may be unavailable.");
    }
  }, [view.audioTitle, view.audioArtist, view.instagramUrl, audioKey, isAudioSaved, notify]);

  useEffect(() => {
    aliveRef.current = true;
    setMounted(true);
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);

    try {
      const stored: unknown = JSON.parse(
        localStorage.getItem(AUDIO_STORAGE_KEY) ?? "[]",
      );
      if (Array.isArray(stored)) {
        setSavedAudio(stored.map((item) => text(record(item).key)).filter(Boolean));
      }
    } catch {
      // Saving audio remains optional when browser storage is restricted.
    }

    return () => {
      aliveRef.current = false;
      media.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    toastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedKey(propKey || null);
    setRemovedKeys([]);
    setMenuOpen(false);
    setCategoryOpen(false);
    setDrawer(null);
    setDragOffset(0);
  }, [isOpen, propKey]);

  useEffect(() => {
    setDrawer(null);
    setMenuOpen(false);
    setCategoryOpen(false);
    setDragOffset(0);
  }, [isMobile]);

  useEffect(() => {
    if (!isOpen || !mounted || !activeReel) return;
    setAnnouncement(
      `Reel ${activeIndex + 1} of ${availableReels.length}${view.username ? ` by @${view.username}` : ""}`,
    );
  }, [isOpen, mounted, activeKey, activeIndex, availableReels.length, view.username, activeReel]);

  useEffect(() => {
    if (!isOpen || !mounted) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      const padding = parseFloat(getComputedStyle(document.body).paddingRight) || 0;
      document.body.style.paddingRight = `${padding + scrollbarWidth}px`;
    }

    const background = Array.from(document.body.children).filter(
      (element) =>
        element instanceof HTMLElement &&
        element !== rootRef.current &&
        !element.contains(rootRef.current),
    ) as HTMLElement[];
    const inertStates = background.map((element) => ({
      element,
      value: element.getAttribute("inert"),
    }));
    background.forEach((element) => element.setAttribute("inert", ""));

    const frame = requestAnimationFrame(() => {
      (closeRef.current ?? rootRef.current)?.focus();
    });

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
      inertStates.forEach(({ element, value }) => {
        if (value === null) element.removeAttribute("inert");
        else element.setAttribute("inert", value);
      });
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isOpen, mounted]);

  useEffect(() => {
    if (!isOpen || !mounted) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        if (menuOpen) {
          setMenuOpen(false);
          menuButtonRef.current?.focus();
        } else if (categoryOpen) {
          setCategoryOpen(false);
          categoryButtonRef.current?.focus();
        } else if (drawer) {
          closeDrawer();
        } else {
          onClose();
        }
        return;
      }

      if (event.key === "Tab") {
        const scope = drawer ? drawerRef.current : rootRef.current;
        const focusable = Array.from(
          scope?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ) ?? [],
        ).filter(
          (element) =>
            element.getClientRects().length > 0 &&
            !element.closest("[inert]"),
        );

        if (!focusable.length) {
          event.preventDefault();
          scope?.focus();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const current = document.activeElement;
        if (event.shiftKey && (current === first || !scope?.contains(current))) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (current === last || !scope?.contains(current))
        ) {
          event.preventDefault();
          first.focus();
        }
        return;
      }

      if (menuOpen || categoryOpen || drawer || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target?.closest(
          'input, textarea, select, [contenteditable="true"], [role="slider"], [role="combobox"], video',
        )
      ) {
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        navigate(1);
      } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        navigate(-1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    mounted,
    menuOpen,
    categoryOpen,
    drawer,
    closeDrawer,
    navigate,
    onClose,
  ]);

  useEffect(() => {
    if (!menuOpen && !categoryOpen) return;

    const dismiss = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        menuOpen &&
        !menuRef.current?.contains(target) &&
        !menuButtonRef.current?.contains(target)
      ) {
        setMenuOpen(false);
      }
      if (
        categoryOpen &&
        !categoryRef.current?.contains(target) &&
        !categoryButtonRef.current?.contains(target)
      ) {
        setCategoryOpen(false);
      }
    };

    document.addEventListener("pointerdown", dismiss);
    const frame = requestAnimationFrame(() => {
      const scope = menuOpen ? menuRef.current : categoryRef.current;
      scope?.querySelector<HTMLElement>("button:not([disabled]), a[href]")?.focus();
    });

    return () => {
      document.removeEventListener("pointerdown", dismiss);
      cancelAnimationFrame(frame);
    };
  }, [menuOpen, categoryOpen]);

  useEffect(() => {
    if (!drawer) return;
    const frame = requestAnimationFrame(() => drawerRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [drawer]);

  if (!isOpen || !activeReel || !mounted) return null;

  const creatorHref = view.username
    ? `/creator/${encodeURIComponent(view.username)}`
    : undefined;

  const creator = (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar username={view.username} src={view.avatar} />
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          {creatorHref ? (
            <a
              href={creatorHref}
              className="rd-focus truncate rounded text-sm font-semibold text-zinc-100 hover:text-white"
              title={`@${view.username}`}
            >
              @{view.username}
            </a>
          ) : (
            <span className="text-sm font-semibold text-zinc-100">Unknown creator</span>
          )}
          {view.verified && <VerifiedBadge />}
        </div>
        {view.instagramUrl && (
          <a
            href={view.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rd-focus rounded text-xs text-sky-400 transition-colors hover:text-sky-300"
            aria-label={`Follow ${view.username || "creator"} on Instagram`}
          >
            Follow
          </a>
        )}
      </div>
    </div>
  );

  const menu = (
    <div className="relative shrink-0">
      <button
        ref={menuButtonRef}
        type="button"
        className={iconButton}
        aria-label="Reel options"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls={menuOpen ? menuId : undefined}
        onClick={() => {
          setCategoryOpen(false);
          setMenuOpen((previous) => !previous);
        }}
      >
        <Icon name="more" className="h-5 w-5" />
      </button>
      {menuOpen && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Reel options"
          className="rd-popover absolute right-0 top-11 z-50 w-56 rounded-2xl border border-white/[0.07] bg-[#191C25] p-1.5 shadow-2xl"
          onKeyDown={(event) => {
            if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            event.stopPropagation();
            const items = Array.from(
              event.currentTarget.querySelectorAll<HTMLElement>(
                '[role="menuitem"]:not([disabled])',
              ),
            );
            if (!items.length) return;
            const index = items.indexOf(document.activeElement as HTMLElement);
            const next =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? items.length - 1
                  : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) %
                    items.length;
            items[next]?.focus();
          }}
        >
          <button
            role="menuitem"
            type="button"
            className="rd-menu-item"
            onClick={copyLink}
            disabled={!view.instagramUrl}
          >
            <Icon name="link" /> Copy link
          </button>
          <button
            role="menuitem"
            type="button"
            className="rd-menu-item"
            onClick={download}
            disabled={!view.videoUrl || downloadBusy}
          >
            <Icon name="download" />
            {downloadBusy ? "Downloading…" : "Download MP4"}
          </button>
          {view.instagramUrl && (
            <a
              role="menuitem"
              className="rd-menu-item"
              href={view.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
            >
              <Icon name="external" /> Open on Instagram
            </a>
          )}
          <div className="my-1 h-px bg-white/[0.07]" />
          <button
            role="menuitem"
            type="button"
            className="rd-menu-item !text-rose-400 hover:!bg-rose-400/10"
            onClick={removeReel}
            disabled={busy[`${activeKey}:delete`]}
          >
            <Icon name="trash" /> Delete reel
          </button>
        </div>
      )}
    </div>
  );

  const categoryOptions = (
    <div className="custom-scrollbar max-h-72 overflow-y-auto p-1.5" aria-busy={categoryBusy}>
      {!availableCategories.length && (
        <p className="px-3 py-4 text-sm leading-relaxed text-zinc-500">
          No categories yet. Create one in your library to organize this reel.
        </p>
      )}
      {availableCategories.map((category) => (
        <button
          key={category}
          type="button"
          disabled={categoryBusy}
          aria-pressed={view.category === category}
          className="rd-menu-item justify-between"
          onClick={() => void chooseCategory(category)}
        >
          <span className="min-w-0 break-words text-left [overflow-wrap:anywhere]">
            {category}
          </span>
          {view.category === category && (
            <Icon name="check" className="h-4 w-4 shrink-0 text-sky-400" />
          )}
        </button>
      ))}
      {view.category && (
        <>
          <div className="my-1 h-px bg-white/[0.07]" />
          <button
            type="button"
            disabled={categoryBusy}
            className="rd-menu-item !text-zinc-500"
            onClick={() => void chooseCategory("")}
          >
            Remove category
          </button>
        </>
      )}
    </div>
  );

  const audioBar = view.audioTitle ? (
    <div className="flex min-w-0 items-center gap-3 rounded-xl bg-white/[0.035] px-3.5 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-zinc-400">
        <Icon name="music" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-zinc-200" title={view.audioTitle}>
          {view.audioTitle}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-zinc-500">
          {view.audioArtist || "Original audio"}
        </p>
      </div>
      <button
        type="button"
        onClick={saveAudio}
        disabled={isAudioSaved}
        title="Save this audio reference on this device"
        className="rd-focus inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-2 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-white/[0.05] hover:text-white disabled:text-zinc-500"
      >
        <Icon name={isAudioSaved ? "check" : "plus"} className="h-3 w-3" />
        {isAudioSaved ? "Saved" : "Save audio"}
      </button>
    </div>
  ) : null;

  const takeaways = (
    <section aria-label="Key takeaways" aria-busy={summaryBusy}>
      {view.summary.length ? (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-xs font-medium text-zinc-400">
              <Icon name="sparkles" className="h-3.5 w-3.5" />
              Key takeaways
            </h3>
            <button
              type="button"
              onClick={generateSummary}
              disabled={summaryBusy}
              className="rd-focus inline-flex items-center gap-1.5 rounded-md text-[11px] text-zinc-500 transition-colors hover:text-zinc-200 disabled:opacity-50"
            >
              <Icon
                name="refresh"
                className={`h-3 w-3 ${summaryBusy ? "rd-spin" : ""}`}
              />
              {summaryBusy ? "Extracting…" : "Regenerate"}
            </button>
          </div>
          <ul className="space-y-3">
            {view.summary.map((point, index) => (
              <li key={`${index}-${point}`} className="flex min-w-0 gap-3">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-sky-400/70" />
                <span className="min-w-0 select-text break-words text-sm leading-relaxed text-zinc-300 [overflow-wrap:anywhere]">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <button
          type="button"
          onClick={generateSummary}
          disabled={summaryBusy}
          className="rd-focus group inline-flex min-h-10 items-center gap-2.5 rounded-full bg-sky-400/[0.07] px-4 py-2.5 text-xs font-medium text-sky-200 transition-colors hover:bg-sky-400/[0.12] disabled:cursor-wait disabled:opacity-60"
        >
          <Icon
            name={summaryBusy ? "refresh" : "sparkles"}
            className={`h-4 w-4 text-sky-400 ${summaryBusy ? "rd-spin" : ""}`}
          />
          {summaryBusy ? "Extracting key takeaways…" : "Extract Key Takeaways"}
        </button>
      )}
    </section>
  );

  const captionContent = (
    <section className="min-w-0" aria-label="Caption">
      {view.caption ? (
        <Caption value={view.caption} />
      ) : (
        <p className="text-sm text-zinc-500">No caption for this reel.</p>
      )}
      {view.date && (
        <time
          dateTime={view.date.iso}
          className="mt-4 block text-[11px] text-zinc-500"
        >
          {view.date.label}
        </time>
      )}
    </section>
  );

  const downloadButton = (
    <button
      type="button"
      onClick={download}
      disabled={downloadBusy || !view.videoUrl}
      title={!view.videoUrl ? "Video file unavailable" : "Download video"}
      className="rd-focus inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-sky-400 px-4 py-2.5 text-xs font-semibold text-[#07121C] shadow-[0_3px_16px_rgba(56,189,248,0.1)] transition-colors hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon name={downloadBusy ? "refresh" : "download"} className={`h-4 w-4 ${downloadBusy ? "rd-spin" : ""}`} />
      {downloadBusy ? "Downloading…" : "Download MP4"}
    </button>
  );

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[100] flex items-center justify-center select-none"
    >
      <style>{`
        .rd-focus:focus-visible { outline: 2px solid #38bdf8; outline-offset: 1px; }
        .rd-menu-item { display: flex; width: 100%; align-items: center; gap: 0.625rem; border-radius: 0.625rem; padding: 0.5rem 0.75rem; font-size: 0.8125rem; font-weight: 500; color: #d4d4d8; transition: all 150ms; text-align: left; }
        .rd-menu-item:hover { background-color: rgba(255, 255, 255, 0.06); color: #ffffff; }
        .rd-menu-item:disabled { opacity: 0.35; cursor: not-allowed; }
        .rd-spin { animation: rd-spin 1s linear infinite; }
        @keyframes rd-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* Screen reader live announcements */}
      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {isMobile ? (
        /* ─── MOBILE VIEW: 100dvh Edge-to-Edge Native Reel Experience ─── */
        <div className="fixed inset-0 z-10 h-[100dvh] w-full bg-black flex flex-col justify-between overflow-hidden select-none">
          {/* Full bleed Video Player */}
          <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden">
            {ReelPlayer && (
              <ReelPlayer
                key={activeKey}
                reel={activeReel}
                autoPlay={true}
                className="w-full h-full object-cover rounded-none border-0"
              />
            )}
          </div>

          {/* Top Vignette Gradient */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none z-10" />
          {/* Bottom Vignette Gradient */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

          {/* Top Header Bar */}
          <div className="relative z-20 pt-[max(0.75rem,env(safe-area-inset-top,0.75rem))] px-4 flex items-center justify-between text-white">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-95 cursor-pointer shadow-md"
              title="Close"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-semibold">
              <span className="font-bricolage text-sky-400">ReelDash</span>
              {availableReels.length > 0 && activeIndex !== -1 && (
                <span className="text-zinc-400 font-normal">
                  {activeIndex + 1} / {availableReels.length}
                </span>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-95 cursor-pointer shadow-md"
              >
                <Icon name="more" className="h-5 w-5" />
              </button>
              {menuOpen && (
                <div
                  ref={menuRef}
                  id={menuId}
                  role="menu"
                  className="rd-popover absolute right-0 top-11 z-50 w-52 rounded-2xl border border-white/[0.1] bg-[#191C25] p-1.5 shadow-2xl"
                >
                  <button
                    type="button"
                    className="rd-menu-item"
                    onClick={copyLink}
                    disabled={!view.instagramUrl}
                  >
                    <Icon name="link" /> Copy link
                  </button>
                  <button
                    type="button"
                    className="rd-menu-item"
                    onClick={download}
                    disabled={!view.videoUrl || downloadBusy}
                  >
                    <Icon name="download" />
                    {downloadBusy ? "Downloading…" : "Download MP4"}
                  </button>
                  {view.instagramUrl && (
                    <a
                      className="rd-menu-item"
                      href={view.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Icon name="external" /> Open on Instagram
                    </a>
                  )}
                  <div className="my-1 h-px bg-white/[0.07]" />
                  <button
                    type="button"
                    className="rd-menu-item !text-rose-400 hover:!bg-rose-400/10"
                    onClick={removeReel}
                  >
                    <Icon name="trash" /> Delete reel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Floating Action Rail */}
          <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center space-y-4 text-white">
            {/* Favorite / Like */}
            <button
              type="button"
              onClick={favorite}
              className="flex flex-col items-center space-y-1 cursor-pointer active:scale-125 transition-transform"
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border ${
                  view.favorite
                    ? "bg-rose-500/30 border-rose-500/50 text-rose-500"
                    : "bg-black/40 border-white/15 text-white"
                }`}
              >
                <Icon
                  name="heart"
                  className={`h-6 w-6 ${view.favorite ? "fill-rose-500 text-rose-500" : ""}`}
                  filled={view.favorite}
                />
              </div>
              <span className="text-[10px] font-semibold text-zinc-200 drop-shadow">
                {view.likes !== null ? formatCount(view.likes) : "Like"}
              </span>
            </button>

            {/* Details & Insights Drawer Trigger */}
            <button
              type="button"
              onClick={() => openDrawer("details")}
              className="flex flex-col items-center space-y-1 cursor-pointer active:scale-110 transition-transform"
            >
              <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white">
                <Icon name="sparkles" className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-semibold text-zinc-200 drop-shadow">
                Details
              </span>
            </button>

            {/* Notes Drawer Trigger */}
            <button
              type="button"
              onClick={() => openDrawer("notes")}
              className="flex flex-col items-center space-y-1 cursor-pointer active:scale-110 transition-transform"
            >
              <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white">
                <Icon name="note" className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-semibold text-zinc-200 drop-shadow">
                Notes
              </span>
            </button>

            {/* Category Trigger */}
            <button
              type="button"
              onClick={() => openDrawer("category")}
              className="flex flex-col items-center space-y-1 cursor-pointer active:scale-110 transition-transform"
            >
              <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white">
                <Icon name="folder" className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-semibold text-zinc-200 drop-shadow">
                Category
              </span>
            </button>

            {/* Next / Prev navigation buttons */}
            {(hasPrevious || hasNext) && (
              <div className="pt-1 flex flex-col space-y-1.5">
                {hasPrevious && (
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer"
                    title="Previous Reel"
                  >
                    <Icon name="up" className="h-5 w-5" />
                  </button>
                )}
                {hasNext && (
                  <button
                    type="button"
                    onClick={() => navigate(1)}
                    className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer"
                    title="Next Reel"
                  >
                    <Icon name="down" className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bottom Overlay: Creator info & caption */}
          <div className="relative z-20 p-4 pb-[max(1rem,env(safe-area-inset-bottom,1rem))] pr-16 space-y-2 text-white">
            <div className="flex items-center space-x-2">
              <Avatar username={view.username} src={view.avatar} />
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-white truncate">
                  @{view.username}
                </span>
                {view.verified && <VerifiedBadge />}
              </div>
            </div>

            {view.caption && (
              <p
                onClick={() => openDrawer("details")}
                className="text-xs text-zinc-200 line-clamp-2 leading-relaxed cursor-pointer"
              >
                {view.caption}
              </p>
            )}

            {view.audioTitle && (
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] text-zinc-300">
                <Icon name="music" className="h-3 w-3 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[200px]">{view.audioTitle}</span>
              </div>
            )}
          </div>

          {/* Slide-Up Bottom Drawer for Mobile */}
          {drawer && (
            <>
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-xs z-40"
                onClick={closeDrawer}
              />
              <div
                ref={drawerRef}
                tabIndex={-1}
                className="absolute inset-x-0 bottom-0 max-h-[75vh] bg-zinc-950/95 backdrop-blur-2xl border-t border-zinc-800 rounded-t-3xl p-5 z-50 overflow-y-auto space-y-4"
              >
                <div className="w-10 h-1 rounded-full bg-zinc-700 mx-auto" />
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <span id={drawerTitleId} className="text-sm font-bold text-white capitalize">
                    {drawer === "notes" ? "Personal Notes" : drawer === "category" ? "Assign Category" : "Reel Details & Insights"}
                  </span>
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="p-1 rounded-full text-zinc-400 hover:text-white"
                  >
                    <Icon name="close" className="h-4 w-4" />
                  </button>
                </div>

                {drawer === "notes" && (
                  <NoteEditor value={view.note} onSave={saveNote} />
                )}

                {drawer === "category" && categoryOptions}

                {drawer === "details" && (
                  <div className="space-y-4">
                    {captionContent}
                    {audioBar}
                    {takeaways}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        /* ─── DESKTOP VIEW: Split Dual-Pane Masterpiece ─── */
        <div
          className="relative z-10 flex h-[88vh] max-h-[720px] w-full max-w-[960px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0A0B0E] text-white shadow-[0_24px_70px_rgba(0,0,0,0.85)] md:flex-row"
        >
          {/* LEFT COLUMN: 9:16 Video Player */}
          <div className="relative flex h-[46vh] w-full shrink-0 items-center justify-center overflow-hidden border-b border-white/[0.08] bg-black md:h-full md:w-[380px] lg:w-[410px] md:border-b-0 md:border-r">
            {ReelPlayer && (
              <ReelPlayer
                key={activeKey}
                reel={activeReel}
                autoPlay={true}
                className="h-full w-full rounded-none border-0 bg-black shadow-none"
              />
            )}
          </div>

          {/* RIGHT COLUMN: Sensible, High-Craft ReelDash Inspector */}
          <div className="relative flex flex-1 flex-col overflow-hidden bg-[#0B0C10] text-zinc-100 min-w-0">
            {/* 1. Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#0C0D13]/95 px-5 py-3.5 backdrop-blur-md">
              {creator}

              <div className="flex items-center gap-1">
                {(hasPrevious || hasNext) && (
                  <div className="mr-1 flex items-center rounded-lg border border-white/[0.08] bg-white/[0.04] p-0.5">
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      disabled={!hasPrevious}
                      className="cursor-pointer rounded p-1 text-zinc-400 transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-30"
                      title="Previous Reel (Up Arrow)"
                    >
                      <Icon name="up" className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(1)}
                      disabled={!hasNext}
                      className="cursor-pointer rounded p-1 text-zinc-400 transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-30"
                      title="Next Reel (Down Arrow)"
                    >
                      <Icon name="down" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {menu}

                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  className={iconButton}
                  title="Close (Esc)"
                >
                  <Icon name="close" className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 2. Scrollable Body */}
            <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto p-5 select-text">
              {captionContent}

              {audioBar}

              {/* Organization: Category + Key Takeaways */}
              <div className="space-y-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                {/* Category Selector */}
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                    <Icon name="folder" className="h-3.5 w-3.5" />
                    Category
                  </span>
                  <div className="relative">
                    <button
                      ref={categoryButtonRef}
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setCategoryOpen((prev) => !prev);
                      }}
                      className="rd-focus inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.05] px-3 py-1 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/[0.09]"
                    >
                      <span>{view.category || "Select category"}</span>
                      <Icon name="down" className="h-3 w-3 text-zinc-400" />
                    </button>
                    {categoryOpen && (
                      <div
                        ref={categoryRef}
                        id={categoryId}
                        className="rd-popover absolute right-0 top-9 z-50 w-56 rounded-2xl border border-white/[0.07] bg-[#191C25] shadow-2xl"
                      >
                        {categoryOptions}
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-white/[0.06]" />

                {/* Key Takeaways */}
                {takeaways}
              </div>

              {/* Personal Notes */}
              <NoteEditor value={view.note} onSave={saveNote} />
            </div>

            {/* 3. Bottom Engagement & Action Bar */}
            <div className="flex shrink-0 items-center justify-between border-t border-white/[0.08] bg-[#0C0D13] p-3 px-5">
              <div className="flex items-center gap-3">
                {/* Favorite button */}
                <button
                  type="button"
                  onClick={favorite}
                  className={`rd-focus inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors ${
                    view.favorite
                      ? "bg-rose-500/15 text-rose-400 hover:bg-rose-500/25"
                      : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                  }`}
                  title={view.favorite ? "Favorited" : "Add to favorites"}
                >
                  <Icon
                    name="heart"
                    className={`h-4 w-4 ${view.favorite ? "fill-current text-rose-500" : ""}`}
                    filled={view.favorite}
                  />
                  <span>{view.likes !== null ? formatCount(view.likes) : "Like"}</span>
                </button>

                {/* Comments count */}
                {view.comments !== null && (
                  <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Icon name="comment" className="h-4 w-4 text-zinc-500" />
                    <span>{formatCount(view.comments)}</span>
                  </span>
                )}

                {/* Copy link */}
                <button
                  type="button"
                  onClick={copyLink}
                  className={iconButton}
                  title="Copy Link"
                  disabled={!view.instagramUrl}
                >
                  <Icon name="link" className="h-4 w-4" />
                </button>

                {/* External link */}
                {view.instagramUrl && (
                  <a
                    href={view.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={iconButton}
                    title="Open on Instagram"
                  >
                    <Icon name="external" className="h-4 w-4" />
                  </a>
                )}
              </div>

              {downloadButton}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

export { ReelPlayerModal };