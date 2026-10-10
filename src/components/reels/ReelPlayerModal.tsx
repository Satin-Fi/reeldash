"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  Bookmark,
  Check,
  Copy,
  Download,
  ExternalLink,
  Folder,
  Heart,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Send,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";

import { ReelPlayer } from "@/components/reels/ReelPlayer";
import { useReels } from "@/context/ReelContext";
import { getOriginalUploadDate } from "@/lib/instagramDate";
import type { Reel } from "@/types/reel";

export interface ReelPlayerModalProps {
  reel: Reel | null;
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "caption" | "notes" | "analysis" | "organize";
type UnknownRecord = Record<string, unknown>;

interface Workspace {
  collection: string;
  audioSaved: boolean;
  customCollections: string[];
}

interface Analysis {
  hook: string;
  takeaways: string[];
  tags: string[];
}

const DEFAULT_COLLECTIONS = ["Saved reels", "Inspiration", "Hooks", "To recreate"];
const EMPTY_WORKSPACE: Workspace = {
  collection: "",
  audioSaved: false,
  customCollections: [],
};

const ICON_BUTTON =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-300 transition hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-40";

const FIELD =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-white/30 focus:ring-2 focus:ring-white/10";

function record(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    const result = text(value);
    if (result) return result;
  }
  return "";
}

function booleanValue(...values: unknown[]): boolean {
  const value = values.find((item) => typeof item === "boolean");
  return value === true;
}

function strings(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const entry = record(item);
      const result = firstText(
        item,
        entry.name,
        entry.label,
        entry.title,
        entry.text,
        entry.description,
      );
      return result ? [result] : [];
    });
  }

  if (typeof value === "string") {
    const input = value.trim();
    if (!input) return [];

    if (input.startsWith("[")) {
      try {
        const parsed: unknown = JSON.parse(input);
        if (Array.isArray(parsed)) return strings(parsed);
      } catch {
        // A non-JSON string remains usable as plain text.
      }
    }

    return input
      .split(/\n|,(?=\s*#?[\w])/)
      .map((item) => item.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
      .filter(Boolean);
  }

  return [];
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function cleanCaption(value: unknown): string {
  return text(value)
    .replace(/\bview\s+all\s+[\d,.]+\s*[km]?\s+comments?\b/gi, "")
    .replace(/\bview\s+more\s+comments?\b/gi, "")
    .replace(/\[[^\]\n]*,[^\]\n]*\]/g, "")
    .replace(/\[\s*(?:\.{3}|…)\s*\]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function safeUrl(value: unknown): string {
  const input = text(value);
  if (!input) return "";

  if (input.startsWith("/")) {
    return input;
  }

  try {
    const url = new URL(input);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : "";
  } catch {
    return "";
  }
}

function count(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  }

  const match = text(value)
    .replace(/,/g, "")
    .match(/^([\d.]+)\s*([km])?$/i);

  if (!match) return 0;
  const multiplier =
    match[2]?.toLowerCase() === "m"
      ? 1_000_000
      : match[2]?.toLowerCase() === "k"
        ? 1_000
        : 1;
  const result = Number(match[1]) * multiplier;
  return Number.isFinite(result) ? Math.max(0, Math.floor(result)) : 0;
}

function parseDate(value: unknown): Date | null {
  if (!(typeof value === "string" || typeof value === "number" || value instanceof Date)) {
    return null;
  }

  const input =
    typeof value === "number" && value > 0 && value < 100_000_000_000
      ? value * 1000
      : value;
  const date = input instanceof Date ? new Date(input.getTime()) : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseAnalysis(value: unknown): Analysis {
  let source: unknown = value;

  if (typeof source === "string") {
    const candidate = source.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
    try {
      source = JSON.parse(candidate) as unknown;
    } catch {
      return { hook: "", takeaways: strings(source), tags: [] };
    }
  }

  if (Array.isArray(source)) {
    return { hook: "", takeaways: strings(source), tags: [] };
  }

  const data = record(source);
  const hook = record(data.hookBreakdown ?? data.hook);
  const strategy = record(data.strategy);

  return {
    hook: firstText(
      data.hookBreakdown,
      data.hook,
      data.openingHook,
      hook.description,
      hook.analysis,
      hook.text,
    ),
    takeaways: strings(
      data.takeaways ??
        data.keyTakeaways ??
        data.key_takeaways ??
        strategy.takeaways ??
        data.strategy ??
        data.summary,
    ),
    tags: unique([
      ...strings(data.tags),
      ...strings(data.topics),
      ...strings(data.semanticTags),
    ]),
  };
}

function workspaceKey(id: string): string {
  return `reeldash:reel-workspace:v1:${encodeURIComponent(id)}`;
}

function readWorkspace(id: string): Workspace {
  try {
    const raw = localStorage.getItem(workspaceKey(id));
    const stored = record(raw ? JSON.parse(raw) : {});
    return {
      collection: text(stored.collection),
      audioSaved: stored.audioSaved === true,
      customCollections: strings(stored.customCollections),
    };
  } catch {
    return { ...EMPTY_WORKSPACE };
  }
}

function Caption({ value }: { value: string }) {
  const tokens = value.split(/([#@][\p{L}\p{N}_][\p{L}\p{N}_.]*)/gu);

  return (
    <span className="whitespace-pre-wrap [overflow-wrap:anywhere]">
      {tokens.map((token, index) => {
        if (!/^[@#][\p{L}\p{N}_]/u.test(token)) {
          return <span key={index}>{token}</span>;
        }

        const previous = tokens[index - 1] ?? "";
        if (/[\p{L}\p{N}_.]$/u.test(previous)) {
          return <span key={index}>{token}</span>;
        }

        const label = token.replace(/\.+$/, "");
        const suffix = token.slice(label.length);
        const name = label.slice(1);
        const href =
          label[0] === "#"
            ? `https://www.instagram.com/explore/tags/${encodeURIComponent(name)}/`
            : `https://www.instagram.com/${encodeURIComponent(name)}/`;

        return (
          <span key={index}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-300 decoration-sky-300/40 underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              {label}
            </a>
            {suffix}
          </span>
        );
      })}
    </span>
  );
}

function Avatar({ src, username }: { src: string; username: string }) {
  const [imgError, setImgError] = useState(false);
  const cleanUser = username?.replace(/^@+/, "").trim();
  const fallbackSrc =
    cleanUser && cleanUser !== "creator"
      ? `/api/proxy-image?username=${encodeURIComponent(cleanUser)}`
      : "";
  const initialSrc = src || fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState(initialSrc);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
    setImgError(false);
  }, [src, fallbackSrc]);

  return (
    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-xs font-semibold uppercase text-zinc-300 ring-1 ring-white/10 shadow-sm">
      <span aria-hidden="true">{cleanUser.slice(0, 2) || "R"}</span>
      {currentSrc && !imgError && (
        <img
          key={currentSrc}
          src={currentSrc}
          alt={`@${cleanUser}`}
          width={40}
          height={40}
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => {
            if (fallbackSrc && currentSrc !== fallbackSrc) {
              setCurrentSrc(fallbackSrc);
            } else {
              setImgError(true);
            }
          }}
        />
      )}
    </span>
  );
}

function VerifiedBadge() {
  return (
    <span
      role="img"
      aria-label="Verified creator"
      className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-sky-500"
    >
      <Check size={10} strokeWidth={3} className="text-white" />
    </span>
  );
}

export function ReelPlayerModal({
  reel,
  isOpen,
  onClose,
}: ReelPlayerModalProps) {
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
  const [tab, setTab] = useState<Tab>("caption");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState("");
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [category, setCategory] = useState("");
  const [workspace, setWorkspace] = useState<Workspace>({ ...EMPTY_WORKSPACE });
  const [newCollection, setNewCollection] = useState("");
  const [generatedAnalysis, setGeneratedAnalysis] = useState<unknown>(null);
  const [posting, setPosting] = useState(false);
  const [liking, setLiking] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const dialogRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const desktopComposerRef = useRef<HTMLTextAreaElement>(null);
  const mobileComposerRef = useRef<HTMLTextAreaElement>(null);
  const notesRef = useRef("");
  const workspaceRef = useRef<Workspace>({ ...EMPTY_WORKSPACE });
  const sessionRef = useRef(0);
  const operationLocksRef = useRef(new Set<string>());
  const downloadAbortRef = useRef<AbortController | null>(null);
  const onCloseRef = useRef(onClose);

  const componentId = useId();

  const activeReel = useMemo(
    () => (reel ? reels.find((item) => item.id === reel.id) ?? reel : null),
    [reel, reels],
  );

  const data = useMemo(() => record(activeReel), [activeReel]);
  const creator = useMemo(
    () => record(data.creator ?? data.author ?? data.owner),
    [data],
  );
  const reelId = activeReel ? String(activeReel.id) : "";

  const serverNotes = firstText(data.notes, data.note, data.personalNotes);
  const serverLiked = booleanValue(data.isLiked, data.isFavorite, data.favorite);
  const serverCategory = firstText(
    data.category,
    record(data.category).name,
    data.categoryName,
  );

  const availableCategories = useMemo(() => {
    const source: unknown = smartCategories;
    const values = Array.isArray(source)
      ? strings(source)
      : source && typeof source === "object"
        ? Object.entries(record(source)).map(([key, value]) =>
            firstText(record(value).name, record(value).label, key),
          )
        : strings(source);

    return unique([...values, serverCategory]).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [smartCategories, serverCategory]);

  const analysis = useMemo(
    () =>
      parseAnalysis(
        generatedAnalysis ??
          data.aiAnalysis ??
          data.aiSummary ??
          data.ai_summary ??
          data.summary,
      ),
    [generatedAnalysis, data],
  );

  const semanticTags = useMemo(
    () =>
      unique([
        ...analysis.tags,
        ...strings(data.semanticTags),
        ...strings(data.tags),
        ...strings(data.topics),
      ])
        .map((value) => value.replace(/^#/, ""))
        .filter(Boolean)
        .slice(0, 24),
    [analysis.tags, data],
  );

  useEffect(() => {
    setMounted(true);
    return () => {
      sessionRef.current += 1;
      downloadAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    sessionRef.current += 1;
    operationLocksRef.current.clear();
    downloadAbortRef.current?.abort();

    setTab("caption");
    setDrawerOpen(false);
    setMenuOpen(false);
    setDraft("");
    setNewCollection("");
    setGeneratedAnalysis(null);
    setPosting(false);
    setLiking(false);
    setAnalyzing(false);
    setCategorizing(false);
    setDeleting(false);
    setDownloading(false);
    setAnnouncement("");

    const stored = reelId ? readWorkspace(reelId) : { ...EMPTY_WORKSPACE };
    workspaceRef.current = stored;
    setWorkspace(stored);
  }, [reelId, isOpen]);

  useEffect(() => {
    notesRef.current = serverNotes;
    setNotes(serverNotes);
  }, [reelId, serverNotes, isOpen]);

  useEffect(() => {
    setLiked(serverLiked);
  }, [reelId, serverLiked, isOpen]);

  useEffect(() => {
    setLikes(
      count(
        data.likesCount ??
          data.likeCount ??
          data.likes ??
          record(data.stats).likes ??
          record(data.metrics).likes,
      ),
    );
  }, [
    reelId,
    isOpen,
    data.likesCount,
    data.likeCount,
    data.likes,
    data.stats,
    data.metrics,
  ]);

  useEffect(() => {
    setCategory(serverCategory);
  }, [reelId, serverCategory, isOpen]);

  useEffect(() => {
    if (!mounted || !isOpen || !reelId) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    if (scrollbarWidth > 0) {
      const currentPadding =
        Number.parseFloat(getComputedStyle(document.body).paddingRight) || 0;
      document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
    }

    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [mounted, isOpen, reelId]);

  useEffect(() => {
    if (!mounted || !isOpen || !reelId) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();

        if (menuOpen) {
          setMenuOpen(false);
          menuButtonRef.current?.focus();
        } else if (drawerOpen) {
          setDrawerOpen(false);
        } else {
          onCloseRef.current();
        }
        return;
      }

      if (event.key !== "Tab") return;

      const mobileDrawer =
        drawerOpen && !window.matchMedia("(min-width: 768px)").matches;
      const root = mobileDrawer ? drawerRef.current : dialogRef.current;
      if (!root) return;

      const focusable = Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (element) =>
          element.getClientRects().length > 0 &&
          !element.closest('[aria-hidden="true"], [inert]'),
      );

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!first || !last) {
        event.preventDefault();
        root.focus();
      } else if (
        event.shiftKey &&
        (document.activeElement === first ||
          !root.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !root.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [mounted, isOpen, reelId, drawerOpen, menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !menuRef.current?.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!drawerOpen) return;

    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const frame = requestAnimationFrame(() => drawerCloseRef.current?.focus());

    return () => {
      cancelAnimationFrame(frame);
      if (previous?.isConnected) previous.focus();
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const query = window.matchMedia("(min-width: 768px)");
    const handleChange = () => {
      if (query.matches) setDrawerOpen(false);
    };

    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, [isOpen]);

  if (!mounted || !isOpen || !activeReel) return null;

  const username =
    firstText(
      data.creatorUsername,
      data.username,
      data.ownerUsername,
      creator.username,
      creator.userName,
    ).replace(/^@+/, "") || "creator";

  const creatorHref = `/creator/${encodeURIComponent(username)}`;
  const avatarUrl = safeUrl(
    firstText(
      data.creatorAvatar,
      data.creator_avatar,
      (activeReel as any).creatorAvatar,
      (activeReel as any).creator_avatar,
      data.creatorAvatarUrl,
      data.profilePicUrl,
      data.profilePictureUrl,
      creator.avatarUrl,
      creator.avatar,
      creator.profilePicUrl,
      creator.profilePictureUrl,
    ),
  );

  const verified = booleanValue(
    data.isVerified,
    data.creatorVerified,
    creator.isVerified,
    creator.verified,
  );

  const instagramUrl = safeUrl(
    firstText(data.instagramUrl, data.instagram_url, data.sourceUrl, data.url),
  );

  const videoUrl = safeUrl(
    firstText(
      data.downloadUrl,
      data.videoUrl,
      data.video_url,
      data.mediaUrl,
      record(data.video).url,
    ),
  );

  const caption = cleanCaption(
    firstText(data.caption, data.description, record(data.caption).text),
  );

  const audio = record(data.audio);
  const audioTitle = firstText(data.audioTitle, audio.title, audio.name);
  const audioArtist = firstText(
    data.audioArtist,
    data.audioAuthor,
    audio.artist,
    audio.author,
  );

  const originalUploadDate = getOriginalUploadDate(activeReel);

  const shortDate = originalUploadDate
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(originalUploadDate)
    : "";

  const longDate = originalUploadDate
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(originalUploadDate)
    : "";

  const collectionOptions = unique([
    ...DEFAULT_COLLECTIONS,
    ...workspace.customCollections,
    workspace.collection,
  ]);

  const hasAnalysis = Boolean(analysis.hook || analysis.takeaways.length);
  const busySession = sessionRef.current;

  function notify(message: string) {
    setAnnouncement(message);
    showToast(message);
  }

  function isCurrent(session: number) {
    return sessionRef.current === session;
  }

  function beginOperation(name: string) {
    if (operationLocksRef.current.has(name)) return false;
    operationLocksRef.current.add(name);
    return true;
  }

  function finishOperation(name: string, session: number) {
    if (isCurrent(session)) operationLocksRef.current.delete(name);
  }

  function persistWorkspace(patch: Partial<Workspace>): boolean {
    const next = { ...workspaceRef.current, ...patch };

    try {
      localStorage.setItem(workspaceKey(reelId), JSON.stringify(next));
      workspaceRef.current = next;
      setWorkspace(next);
      return true;
    } catch {
      notify("Could not save on this device. Check your browser storage settings.");
      return false;
    }
  }

  function toggleCollection() {
    const next = workspaceRef.current.collection ? "" : "Saved reels";
    if (persistWorkspace({ collection: next })) {
      notify(next ? "Added to Saved reels on this device." : "Removed from collection.");
    }
  }

  function openWorkspace(nextTab: Tab, focusComposer = false) {
    setTab(nextTab);
    setMenuOpen(false);

    const mobile = !window.matchMedia("(min-width: 768px)").matches;
    if (mobile) setDrawerOpen(true);

    if (focusComposer && !mobile) {
      requestAnimationFrame(() => desktopComposerRef.current?.focus());
    }
  }

  async function copyLink() {
    setMenuOpen(false);
    const url = instagramUrl;

    if (!url) {
      notify("This reel does not have a shareable Instagram link.");
      return;
    }

    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url);
      if (isCurrent(busySession)) notify("Link copied.");
    } catch {
      if (isCurrent(busySession)) {
        notify("Could not copy the link. Open in Instagram to share this reel.");
      }
    }
  }

  async function handleLike() {
    if (!activeReel || !beginOperation("like")) return;

    const session = sessionRef.current;
    const previous = liked;
    const previousCount = likes;
    setLiking(true);
    setLiked(!previous);
    setLikes(Math.max(0, previousCount + (previous ? -1 : 1)));

    try {
      await toggleFavorite(activeReel.id);
    } catch {
      if (isCurrent(session)) {
        setLiked(previous);
        setLikes(previousCount);
        notify("Could not update your like. Please try again.");
      }
    } finally {
      if (isCurrent(session)) setLiking(false);
      finishOperation("like", session);
    }
  }

  async function postNote() {
    const addition = draft.trim();
    if (!activeReel || !addition || !beginOperation("note")) return;

    const session = sessionRef.current;
    const previous = notesRef.current;
    const next = previous ? `${previous}\n\n${addition}` : addition;

    setPosting(true);
    setNotes(next);
    notesRef.current = next;
    setDraft("");

    try {
      await updateNote(activeReel.id, next);
      if (isCurrent(session)) notify("Note saved.");
    } catch {
      if (isCurrent(session)) {
        notesRef.current = previous;
        setNotes(previous);
        setDraft(addition);
        notify("Could not save your note. Your draft has been restored.");
      }
    } finally {
      if (isCurrent(session)) setPosting(false);
      finishOperation("note", session);
    }
  }

  async function analyzeReel() {
    if (!activeReel || !beginOperation("analysis")) return;

    const session = sessionRef.current;
    setAnalyzing(true);

    try {
      const result: unknown = await generateAiSummary(activeReel.id);

      if (isCurrent(session)) {
        const response = record(result);
        const candidate =
          response.aiAnalysis ??
          response.aiSummary ??
          response.analysis ??
          result;
        const parsed = parseAnalysis(candidate);

        if (parsed.hook || parsed.takeaways.length || parsed.tags.length) {
          setGeneratedAnalysis(candidate);
        }
        setAnnouncement("Analysis request completed.");
      }
    } catch {
      if (isCurrent(session)) {
        notify("Analysis could not be completed. Please try again.");
      }
    } finally {
      if (isCurrent(session)) setAnalyzing(false);
      finishOperation("analysis", session);
    }
  }

  async function changeCategory(next: string) {
    if (!activeReel || next === category || !beginOperation("category")) return;

    const session = sessionRef.current;
    const previous = category;
    setCategory(next);
    setCategorizing(true);

    try {
      await updateCategory(activeReel.id, next);
      if (isCurrent(session)) notify("Category updated.");
    } catch {
      if (isCurrent(session)) {
        setCategory(previous);
        notify("Could not update the category. Please try again.");
      }
    } finally {
      if (isCurrent(session)) setCategorizing(false);
      finishOperation("category", session);
    }
  }

  async function downloadVideo() {
    if (!videoUrl || !beginOperation("download")) return;

    const session = sessionRef.current;
    const controller = new AbortController();
    downloadAbortRef.current = controller;
    setMenuOpen(false);
    setDownloading(true);

    let objectUrl = "";

    try {
      const response = await fetch(videoUrl, { signal: controller.signal });
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      if (!blob.size) throw new Error("Empty video");
      if (
        blob.type &&
        !blob.type.startsWith("video/") &&
        blob.type !== "application/octet-stream"
      ) {
        throw new Error("Invalid video response");
      }

      if (!isCurrent(session)) return;

      objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${username.replace(/[^\w.-]/g, "_")}-${reelId.replace(/[^\w.-]/g, "_")}.mp4`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      notify("Download started.");
    } catch {
      if (!controller.signal.aborted && isCurrent(session)) {
        notify("Download unavailable. You can still open this reel in Instagram.");
      }
    } finally {
      if (objectUrl) {
        const urlToRevoke = objectUrl;
        window.setTimeout(() => URL.revokeObjectURL(urlToRevoke), 30_000);
      }
      if (isCurrent(session)) {
        setDownloading(false);
        downloadAbortRef.current = null;
      }
      finishOperation("download", session);
    }
  }

  async function removeReel() {
    if (!activeReel) return;
    setMenuOpen(false);

    if (
      !window.confirm(
        "Delete this reel from ReelDash? This does not delete the original Instagram post.",
      ) ||
      !beginOperation("delete")
    ) {
      return;
    }

    const session = sessionRef.current;
    setDeleting(true);

    try {
      await deleteReel(activeReel.id);
      if (isCurrent(session)) {
        try {
          localStorage.removeItem(workspaceKey(reelId));
        } catch {
          // Deleting the reel does not depend on local storage availability.
        }
        notify("Reel deleted.");
        onCloseRef.current();
      }
    } catch {
      if (isCurrent(session)) notify("Could not delete this reel. Please try again.");
    } finally {
      if (isCurrent(session)) setDeleting(false);
      finishOperation("delete", session);
    }
  }

  function renderCreatorName(className = "") {
    return (
      <span className={`inline-flex min-w-0 items-center gap-1.5 ${className}`}>
        <a
          href={creatorHref}
          className="truncate font-semibold text-zinc-100 hover:text-white focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          @{username}
        </a>
        {verified && <VerifiedBadge />}
      </span>
    );
  }

  function renderTabs(scope: string) {
    const tabs: { id: Tab; label: string }[] = [
      { id: "caption", label: "Caption" },
      { id: "notes", label: "Notes" },
      { id: "analysis", label: "AI Analysis" },
      { id: "organize", label: "Organize" },
    ];

    return (
      <div
        role="tablist"
        aria-label="Creator workspace"
        className="flex gap-4 border-b border-white/[0.08]"
        onKeyDown={(event) => {
          const index = tabs.findIndex((item) => item.id === tab);
          let next = index;

          if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
          else if (event.key === "ArrowLeft") {
            next = (index - 1 + tabs.length) % tabs.length;
          } else if (event.key === "Home") next = 0;
          else if (event.key === "End") next = tabs.length - 1;
          else return;

          event.preventDefault();
          setTab(tabs[next].id);
          document
            .getElementById(`${componentId}-${scope}-tab-${tabs[next].id}`)
            ?.focus();
        }}
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            id={`${componentId}-${scope}-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            aria-controls={`${componentId}-${scope}-panel`}
            tabIndex={tab === item.id ? 0 : -1}
            onClick={() => setTab(item.id)}
            className={`relative whitespace-nowrap py-3 text-xs font-medium transition focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
              tab === item.id
                ? "text-white after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:rounded-full after:bg-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    );
  }

  function renderPanel(scope: string) {
    let content: ReactNode;

    if (tab === "caption") {
      content = (
        <div className="space-y-4">
          {caption ? (
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-xs leading-relaxed text-zinc-200">
              <Caption value={caption} />
              {longDate && (
                <div className="mt-3 pt-3 border-t border-white/[0.06] text-[11px] text-zinc-500">
                  Uploaded on {longDate}
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-zinc-500">
              No caption provided for this reel.
            </div>
          )}

          {/* Audio Track Pill */}
          {audioTitle && (
            <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-2.5">
              <div className="flex items-center gap-2.5 min-w-0 mr-2">
                <Music2 size={14} className="shrink-0 text-emerald-400" />
                <span className="truncate text-xs text-zinc-300">
                  {audioTitle} {audioArtist ? `• ${audioArtist}` : ""}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  persistWorkspace({ audioSaved: !workspace.audioSaved });
                  notify(workspace.audioSaved ? "Audio reference removed." : "Audio reference saved.");
                }}
                className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium text-zinc-400 hover:bg-white/[0.06] hover:text-white cursor-pointer"
              >
                {workspace.audioSaved ? "Saved" : "Save audio"}
              </button>
            </div>
          )}
        </div>
      );
    } else if (tab === "notes") {
      content = (
        <div className="space-y-4">
          {notes.trim() ? (
            <article className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-zinc-200">Your notes</span>
                <span className="text-[10px] text-zinc-500">Private · Only you</span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-300 [overflow-wrap:anywhere]">
                {notes}
              </p>
            </article>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center">
              <MessageCircle
                size={22}
                strokeWidth={1.4}
                className="mx-auto mb-2 text-zinc-600"
                aria-hidden="true"
              />
              <h3 className="text-xs font-medium text-zinc-300">No notes yet</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Jot down your hook ideas, research, or thoughts about this reel below.
              </p>
            </div>
          )}

          <div className="pt-1">
            {renderComposer(scope === "mobile")}
          </div>
        </div>
      );
    } else if (tab === "analysis") {
      content = (
        <div className="space-y-6" aria-busy={analyzing}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <Sparkles size={15} className="text-zinc-400" aria-hidden="true" />
                Creative breakdown
              </h3>
              <p className="mt-1.5 text-xs leading-5 text-zinc-500">
                Understand the hook. Find your next angle.
              </p>
            </div>
            <button
              type="button"
              disabled={analyzing}
              onClick={() => void analyzeReel()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-3 py-2 text-xs font-medium text-zinc-100 transition hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-50"
            >
              {analyzing ? (
                <Loader2 size={13} className="animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles size={13} aria-hidden="true" />
              )}
              {analyzing ? "Analyzing…" : hasAnalysis ? "Regenerate" : "Analyze Reel"}
            </button>
          </div>

          <section>
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Hook breakdown · First 3 seconds
            </h4>
            <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-300 [overflow-wrap:anywhere]">
              {analysis.hook ||
                (hasAnalysis
                  ? "A separate opening-hook breakdown is not available for this reel."
                  : "Analyze this reel to discover what captures attention at the start.")}
            </p>
          </section>

          <section>
            <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Strategy & takeaways
            </h4>
            {analysis.takeaways.length ? (
              <ul className="space-y-3">
                {analysis.takeaways.map((takeaway, index) => (
                  <li
                    key={`${index}-${takeaway.slice(0, 30)}`}
                    className="flex gap-3 text-sm leading-6 text-zinc-300"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-zinc-500"
                    />
                    <span className="min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere]">
                      {takeaway}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-6 text-zinc-500">
                Key ideas and reusable creative patterns will appear here.
              </p>
            )}
          </section>

          <section>
            <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Topics & semantic tags
            </h4>
            {semanticTags.length ? (
              <div className="flex flex-wrap gap-2">
                {semanticTags.map((topic) => (
                  <span
                    key={topic}
                    className="max-w-full rounded-full border border-white/[0.08] px-2.5 py-1 text-xs text-zinc-400 [overflow-wrap:anywhere]"
                  >
                    #{topic}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs leading-5 text-zinc-500">
                No topics identified yet.
              </p>
            )}
          </section>

          {hasAnalysis && (
            <p className="border-t border-white/[0.06] pt-3 text-[10px] leading-5 text-zinc-600">
              AI-generated insights can be imperfect. Check them against the reel.
            </p>
          )}
        </div>
      );
    } else {
      content = (
        <div className="space-y-6">
          <div>
            <label
              htmlFor={`${componentId}-${scope}-category`}
              className="mb-2.5 flex items-center gap-2 text-xs font-medium text-zinc-300"
            >
              <Tag size={14} className="text-zinc-500" aria-hidden="true" />
              Category
              {categorizing && (
                <Loader2 size={12} className="animate-spin" aria-hidden="true" />
              )}
            </label>
            <select
              id={`${componentId}-${scope}-category`}
              value={category}
              disabled={categorizing}
              onChange={(event) => void changeCategory(event.target.value)}
              className={`${FIELD} rounded-full disabled:opacity-50`}
            >
              <option value="" className="bg-zinc-900">
                Uncategorized
              </option>
              {availableCategories.map((item) => (
                <option key={item} value={item} className="bg-zinc-900">
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={`${componentId}-${scope}-collection`}
              className="mb-2.5 flex items-center gap-2 text-xs font-medium text-zinc-300"
            >
              <Folder size={14} className="text-zinc-500" aria-hidden="true" />
              Add to collection
            </label>
            <select
              id={`${componentId}-${scope}-collection`}
              value={workspace.collection}
              onChange={(event) => {
                const collection = event.target.value;
                if (persistWorkspace({ collection })) {
                  notify(
                    collection
                      ? `Added to ${collection} on this device.`
                      : "Removed from collection.",
                  );
                }
              }}
              className={FIELD}
            >
              <option value="" className="bg-zinc-900">
                Choose a collection
              </option>
              {collectionOptions.map((item) => (
                <option key={item} value={item} className="bg-zinc-900">
                  {item}
                </option>
              ))}
            </select>

            <form
              className="mt-3 flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const name = newCollection.trim();
                if (!name) return;

                if (
                  persistWorkspace({
                    collection: name,
                    customCollections: unique([
                      ...workspaceRef.current.customCollections,
                      name,
                    ]),
                  })
                ) {
                  setNewCollection("");
                  notify(`Created ${name} and added this reel.`);
                }
              }}
            >
              <input
                aria-label="New collection name"
                value={newCollection}
                onChange={(event) => setNewCollection(event.target.value)}
                maxLength={60}
                placeholder="New collection…"
                className={`${FIELD} min-w-0 py-2.5 text-xs`}
              />
              <button
                type="submit"
                disabled={!newCollection.trim()}
                className="shrink-0 rounded-lg px-3 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-30"
              >
                Create
              </button>
            </form>
            <p className="mt-3 text-[11px] leading-5 text-zinc-500">
              Collections and saved audio are stored on this device.
            </p>
          </div>

          {workspace.collection && (
            <div className="flex items-start gap-2.5 rounded-xl bg-white/[0.03] p-3.5">
              <Check size={15} className="mt-0.5 shrink-0 text-zinc-400" />
              <p className="text-xs leading-5 text-zinc-400 [overflow-wrap:anywhere]">
                Saved in{" "}
                <span className="font-medium text-zinc-200">
                  {workspace.collection}
                </span>
              </p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        id={`${componentId}-${scope}-panel`}
        role="tabpanel"
        aria-labelledby={`${componentId}-${scope}-tab-${tab}`}
        tabIndex={0}
        className="py-5 outline-none focus-visible:rounded-xl focus-visible:ring-1 focus-visible:ring-white/30"
      >
        {content}
      </div>
    );
  }

  function renderComposer(mobile: boolean) {
    return (
      <form
        className="flex items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void postNote();
        }}
      >
        <label
          htmlFor={`${componentId}-${mobile ? "mobile" : "desktop"}-note`}
          className="sr-only"
        >
          Add a private note or thought
        </label>
        <textarea
          ref={mobile ? mobileComposerRef : desktopComposerRef}
          id={`${componentId}-${mobile ? "mobile" : "desktop"}-note`}
          rows={1}
          maxLength={10_000}
          value={draft}
          disabled={posting}
          onChange={(event) => {
            setDraft(event.target.value);
            event.currentTarget.style.height = "auto";
            event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 112)}px`;
          }}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              void postNote();
            }
          }}
          placeholder="Add a note or thought…"
          className="min-h-10 max-h-28 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10 disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={!draft.trim() || posting}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-white px-4 text-xs font-semibold text-black transition hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {posting ? <Loader2 size={14} className="animate-spin" /> : "Post"}
        </button>
      </form>
    );
  }

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Reel by ${username}`}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-0 backdrop-blur-md select-none md:p-6"
    >
      {/* Screen reader live announcements */}
      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>

      {/* Desktop Backdrop Close */}
      <div
        className="fixed inset-0 bg-transparent"
        onClick={() => onCloseRef.current()}
        aria-hidden="true"
      />

      {/* Main Container */}
      <div className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-black text-white md:h-[88vh] md:max-h-[720px] md:max-w-[960px] md:flex-row md:rounded-2xl md:border md:border-white/[0.08] md:bg-[#0B0C10] md:shadow-[0_24px_70px_rgba(0,0,0,0.85)]">
        {/* LEFT COLUMN: 9:16 Vertical Video Player */}
        <div className="relative flex h-[50vh] w-full shrink-0 items-center justify-center overflow-hidden bg-black md:h-full md:w-[380px] lg:w-[410px] md:border-r md:border-white/[0.08]">
          <ReelPlayer
            key={reelId}
            reel={activeReel}
            autoPlay={true}
            className="h-full w-full rounded-none border-0 bg-black shadow-none"
          />
        </div>

        {/* RIGHT COLUMN: Clean, High-Craft Social & Creator Workspace */}
        <div className="flex flex-1 flex-col overflow-hidden bg-[#0B0C10] text-zinc-100 min-w-0">
          {/* 1. Header (Clean: Creator left, Menu + Close right. NO up/down chevrons!) */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#0C0D13]/95 px-5 py-3.5 backdrop-blur-md">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar username={username} src={avatarUrl} />
              <div className="flex min-w-0 flex-col">
                <div className="flex items-center gap-2">
                  {renderCreatorName()}
                </div>
                {shortDate && (
                  <span className="text-[11px] text-zinc-500">{shortDate}</span>
                )}
              </div>
            </div>

            {/* Header Controls: Options Menu + Close (✕) */}
            <div className="flex items-center gap-1">
              <div className="relative" ref={menuRef}>
                <button
                  ref={menuButtonRef}
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className={ICON_BUTTON}
                  title="Options"
                  aria-label="More options"
                >
                  <MoreHorizontal size={18} />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-11 z-50 w-52 rounded-2xl border border-white/[0.1] bg-[#181A22] p-1.5 shadow-2xl backdrop-blur-xl"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void copyLink()}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-white/[0.08] hover:text-white cursor-pointer"
                    >
                      <Copy size={14} className="text-zinc-400" />
                      Copy Link
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void handleLike()}
                      disabled={liking}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-white/[0.08] hover:text-white cursor-pointer"
                    >
                      <Heart size={14} className={liked ? "fill-rose-500 text-rose-500" : "text-zinc-400"} />
                      {liked ? "Remove from Favorites" : "Add to Favorites"}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void downloadVideo()}
                      disabled={downloading || !videoUrl}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-white/[0.08] hover:text-white disabled:opacity-40 cursor-pointer"
                    >
                      <Download size={14} className="text-zinc-400" />
                      {downloading ? "Downloading…" : "Download MP4"}
                    </button>
                    {instagramUrl && (
                      <a
                        role="menuitem"
                        href={instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMenuOpen(false)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-white/[0.08] hover:text-white"
                      >
                        <ExternalLink size={14} className="text-zinc-400" />
                        Open on Instagram
                      </a>
                    )}
                    <div className="my-1 h-px bg-white/[0.08]" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void removeReel()}
                      disabled={deleting}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/15 cursor-pointer"
                    >
                      <Trash2 size={14} />
                      {deleting ? "Deleting…" : "Delete Reel"}
                    </button>
                  </div>
                )}
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => onCloseRef.current()}
                className={ICON_BUTTON}
                title="Close (Esc)"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* 2. Scrollable Body: Clean Tabs (Caption, Notes, AI Analysis, Organize) */}
          <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-3 space-y-3 select-text">
            {renderTabs("desktop")}
            {renderPanel("desktop")}
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#12141C] p-5 shadow-2xl md:hidden"
        >
          <div className="mb-4 flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="text-sm font-semibold text-white">
              {tab === "caption" ? "Caption & Details" : tab === "notes" ? "Notes" : tab === "analysis" ? "AI Analysis" : "Organize"}
            </span>
            <button
              ref={drawerCloseRef}
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="p-1 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
          {renderTabs("mobile")}
          {renderPanel("mobile")}
        </div>
      )}
    </div>,
    document.body
  );
}

export default ReelPlayerModal;
