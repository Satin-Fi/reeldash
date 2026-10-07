"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Reel } from "@/types/reel";
import { useReels } from "@/context/ReelContext";
import { ReelPlayer } from "./ReelPlayer";
import {
  X,
  Heart,
  MoreHorizontal,
  Music2,
  ExternalLink,
  Copy,
  Trash2,
  Tag,
  ThumbsUp,
  MessageSquare,
  Calendar,
  Plus,
  ArrowLeft,
  ChevronUp,
  ChevronDown as ChevronDownIcon,
  Sparkles,
  Download,
  Check,
  Edit3,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

function VerifiedBadge({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg
      className={`${className} text-[#0095F6] inline-block shrink-0`}
      viewBox="0 0 40 40"
      fill="currentColor"
      aria-label="Verified"
    >
      <path d="M19.998 3.094 14.638 0l-5.36 3.094-5.36-3.094L0 3.094V8.45l3.094 5.36L0 19.17l3.094 5.36-3.094 5.36 3.094 5.36 5.36-3.094 5.36 3.094 5.36-3.094 5.36 3.094 3.094-5.36-3.094-5.36 3.094-5.36-3.094-5.36V3.094L31.816 0l-5.36 3.094-5.36-3.094z" />
      <path d="m16.5 24.5-5-5 2-2 3 3 8-8 2 2-10 10z" fill="#FFFFFF" />
    </svg>
  );
}

function parseCaptionData(
  rawCaption?: string,
  existingTags: string[] = [],
  existingTopics: string[] = []
): { cleanCaption: string; tags: string[] } {
  if (!rawCaption) {
    return {
      cleanCaption: "",
      tags: Array.from(new Set([...existingTags, ...existingTopics])).filter(Boolean),
    };
  }

  let text = rawCaption;
  const extractedTags: string[] = [];

  // Match bracketed comma-separated tokens: e.g. [Action Jackson, Ajay Devgn, ...]
  const bracketRegex = /\[([^\]]+)\]/g;
  let match;
  while ((match = bracketRegex.exec(text)) !== null) {
    const rawTokens = match[1].split(",");
    for (const token of rawTokens) {
      const clean = token.trim();
      if (clean && clean.length > 1 && clean.length < 50) {
        extractedTags.push(clean);
      }
    }
  }
  text = text.replace(/\[([^\]]+)\]/g, "");

  // Strip scraper artifacts
  text = text
    .replace(/View all \d+ comments/gi, "")
    .replace(/View more comments/gi, "")
    .trim();

  const allTags = Array.from(
    new Set([...extractedTags, ...existingTags, ...existingTopics])
  ).filter(Boolean);

  return {
    cleanCaption: text,
    tags: allTags,
  };
}

function renderFormattedCaption(text: string, onClose?: () => void) {
  if (!text) return <span className="text-zinc-500 italic">No caption provided.</span>;

  const parts = text.split(/(https?:\/\/[^\s]+|#[a-zA-Z0-9_\u0900-\u097F]+|@[a-zA-Z0-9_.]+)/g);

  return parts.map((part, i) => {
    if (part.startsWith("#")) {
      return (
        <Link
          key={i}
          href={`/search?q=${encodeURIComponent(part)}`}
          onClick={onClose}
          className="text-violet-400 font-medium hover:text-violet-300 hover:underline transition-colors"
        >
          {part}
        </Link>
      );
    }
    if (part.startsWith("@")) {
      const handle = part.slice(1);
      return (
        <Link
          key={i}
          href={`/creator/${encodeURIComponent(handle)}`}
          onClick={onClose}
          className="text-violet-300 font-semibold hover:text-white hover:underline transition-colors"
        >
          {part}
        </Link>
      );
    }
    if (part.startsWith("http")) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="text-sky-400 underline hover:text-sky-300"
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

interface ReelPlayerModalProps {
  reel: Reel | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReelPlayerModal({ reel, isOpen, onClose }: ReelPlayerModalProps) {
  const {
    reels,
    toggleFavorite,
    deleteReel,
    updateNote,
    generateAiSummary,
    smartCategories,
    updateCategory,
    showToast,
    saveReel,
  } = useReels();

  const [activeReel, setActiveReel] = useState<Reel>(reel || reels[0]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [avatarSrc, setAvatarSrc] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const initialReelIdRef = useRef<string | null>(reel?.id || null);

  const availableCategories = Array.from(
    new Set([
      ...smartCategories.map((c) => c.name).filter(Boolean),
      "General",
      "Tech",
      "Humor",
      "Motivation",
      "Recipes",
      "Fitness",
      "Design",
      "Travel",
      "Business",
      "Lifestyle",
      "Music & Audio",
    ])
  );

  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const updateSize = () => setIsMobile(window.innerWidth < 768);
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (reel && reel.id !== initialReelIdRef.current) {
      initialReelIdRef.current = reel.id;
      setActiveReel(reel);
    }
  }, [reel]);

  useEffect(() => {
    if (activeReel) {
      setNoteContent(activeReel.notes || "");
      const username = activeReel.creatorUsername || "creator";
      setAvatarSrc(`/api/proxy-image?username=${encodeURIComponent(username)}`);
    }
  }, [activeReel?.id, activeReel?.creatorUsername, activeReel?.notes]);

  // Keep activeReel synchronized if context items update
  useEffect(() => {
    if (activeReel) {
      const match = reels.find((r) => r.id === activeReel.id);
      if (match) {
        if (
          match.isFavorite !== activeReel.isFavorite ||
          match.notes !== activeReel.notes ||
          match.creatorUsername !== activeReel.creatorUsername ||
          match.category !== activeReel.category
        ) {
          setActiveReel(match);
        }
      }
    }
  }, [reels]);

  const handleToggleFavorite = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    toggleFavorite(activeReel.id);
    setActiveReel((prev) => ({ ...prev, isFavorite: !prev.isFavorite }));
  };

  const currentIndex = reels.findIndex((r) => r.id === activeReel?.id);
  const hasNext = currentIndex !== -1 && currentIndex < reels.length - 1;
  const hasPrev = currentIndex > 0;

  const handleNextReel = () => {
    if (hasNext) {
      setActiveReel(reels[currentIndex + 1]);
      setIsMenuOpen(false);
    }
  };

  const handlePrevReel = () => {
    if (hasPrev) {
      setActiveReel(reels[currentIndex - 1]);
      setIsMenuOpen(false);
    }
  };

  // Keyboard navigation: Escape to close, Up/Down arrows to navigate reels
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isDetailsSheetOpen) {
          setIsDetailsSheetOpen(false);
        } else {
          onClose();
        }
      }
      if (e.key === "ArrowDown" && hasNext) {
        handleNextReel();
      }
      if (e.key === "ArrowUp" && hasPrev) {
        handlePrevReel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasNext, hasPrev, currentIndex, isDetailsSheetOpen, onClose]);

  // Touch handlers for vertical swipe on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    touchStartYRef.current = null;
    // Swipe up (deltaY < -50) -> next reel
    if (deltaY < -50 && hasNext) {
      handleNextReel();
    } else if (deltaY > 50 && hasPrev) {
      // Swipe down (deltaY > 50) -> prev reel
      handlePrevReel();
    }
  };

  if (!isOpen || !activeReel || !mounted) return null;

  const creatorHandle = activeReel.creatorUsername || "creator";
  const formattedDate = new Date(activeReel.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activeReel.instagramUrl);
    showToast("Reel link copied to clipboard");
    setIsMenuOpen(false);
  };

  const handleSaveNote = () => {
    updateNote(activeReel.id, noteContent);
    setIsEditingNote(false);
    showToast("Personal note saved");
  };

  const [isAiLoading, setIsAiLoading] = useState(false);

  const isVerifiedCreator = Boolean(
    (activeReel as any).isVerified ||
    (activeReel as any).creatorVerified ||
    ["primevideoin", "netflix_in", "instagram", "apple", "google", "spotify"].includes(
      creatorHandle.toLowerCase()
    ) ||
    creatorHandle.toLowerCase().endsWith("in") ||
    creatorHandle.toLowerCase().includes("official")
  );

  const { cleanCaption, tags: parsedTags } = useMemo(() => {
    return parseCaptionData(
      activeReel.caption,
      activeReel.tags || [],
      activeReel.aiTopics || []
    );
  }, [activeReel.caption, activeReel.tags, activeReel.aiTopics]);

  const handleDownloadVideo = () => {
    try {
      showToast("Preparing MP4 download...");
      const shortcode = activeReel.shortcode || activeReel.id;
      const directUrl = activeReel.videoUrl || activeReel.mediaUrl || "";
      const downloadApi = `/api/download?shortcode=${encodeURIComponent(shortcode)}&directUrl=${encodeURIComponent(directUrl)}`;
      const link = document.createElement("a");
      link.href = downloadApi;
      link.download = `${creatorHandle}_${shortcode}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsMenuOpen(false);
    } catch {
      showToast("Failed to initiate download");
    }
  };

  const handleExtractAiTakeaways = () => {
    setIsAiLoading(true);
    generateAiSummary(activeReel.id);
    setTimeout(() => {
      setIsAiLoading(false);
    }, 850);
  };

  // Helper to format text with hashtags and mentions in subtle brand color
  const formatCaption = (text: string) => {
    if (!text) return "";
    const parts = text.split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_.]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("#") || part.startsWith("@")) {
        return (
          <span key={i} className="text-brand-400 font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return createPortal(
    <AnimatePresence>
      {isMobile ? (
        /* ─── 1. MOBILE EXPERIENCE: 100dvh Edge-to-Edge Native Reels Viewer ─── */
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="fixed inset-0 z-[100] h-[100dvh] w-full bg-black flex flex-col justify-between overflow-hidden select-none"
        >
        {/* Full-bleed Edge-to-Edge Player */}
        <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden">
          <ReelPlayer
            key={activeReel.id}
            reel={activeReel}
            autoPlay={true}
            className="w-full h-full object-cover rounded-none border-0"
          />
        </div>

        {/* Ambient Top & Bottom Vignettes for readable text */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

        {/* Top Header Controls */}
        <div
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className="relative z-20 pt-[max(0.75rem,env(safe-area-inset-top,0.75rem))] px-4 flex items-center justify-between text-white"
        >
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-95 cursor-pointer shadow-md"
            title="Close"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-semibold">
            <span className="font-bricolage text-brand-300">Reels</span>
            {reels.length > 0 && currentIndex !== -1 && (
              <span className="text-zinc-400 font-normal">
                {currentIndex + 1} / {reels.length}
              </span>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-95 cursor-pointer shadow-md"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* Top Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-11 w-48 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-1 z-50 text-xs space-y-0.5">
                <button
                  onClick={handleCopyLink}
                  className="w-full px-3 py-2 text-left text-zinc-200 hover:bg-white/[0.08] rounded-lg flex items-center space-x-2 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </button>
                <button
                  onClick={() => {
                    setIsCategoryPickerOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-zinc-200 hover:bg-white/[0.08] rounded-lg flex items-center space-x-2 cursor-pointer"
                >
                  <Tag className="w-4 h-4 text-brand-400" />
                  <span>Assign Category</span>
                </button>
                <a
                  href={activeReel.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full px-3 py-2 text-left text-zinc-200 hover:bg-white/[0.08] rounded-lg flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open on Instagram</span>
                </a>
                <div className="my-1 border-t border-white/10" />
                <button
                  onClick={() => {
                    deleteReel(activeReel.id);
                    onClose();
                  }}
                  className="w-full px-3 py-2 text-left text-rose-400 hover:bg-rose-500/15 rounded-lg flex items-center space-x-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Reel</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Floating Vertical Action Rail */}
        <div
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className="absolute right-3 bottom-24 z-20 flex flex-col items-center space-y-4 text-white"
        >
          {/* Like / Heart button */}
          <button
            onClick={handleToggleFavorite}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="flex flex-col items-center space-y-1 cursor-pointer active:scale-125 transition-transform"
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border ${
              activeReel.isFavorite
                ? "bg-rose-500/30 border-rose-500/50 text-rose-500"
                : "bg-black/40 border-white/15 text-white"
            }`}>
              <Heart className={`w-6 h-6 ${activeReel.isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
            </div>
            <span className="text-[10px] font-semibold text-zinc-200 drop-shadow">
              {activeReel.likes || "Like"}
            </span>
          </button>

          {/* Details & Notes Drawer Trigger */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDetailsSheetOpen(true);
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="flex flex-col items-center space-y-1 cursor-pointer active:scale-110 transition-transform"
          >
            <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold text-zinc-200 drop-shadow">
              Details
            </span>
          </button>

          {/* Category Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCategoryPickerOpen(true);
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="flex flex-col items-center space-y-1 cursor-pointer active:scale-110 transition-transform"
          >
            <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white">
              <Tag className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold text-zinc-200 drop-shadow">
              Category
            </span>
          </button>

          {/* Instagram Button */}
          <a
            href={activeReel.instagramUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="flex flex-col items-center space-y-1 cursor-pointer active:scale-110 transition-transform"
          >
            <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white">
              <ExternalLink className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold text-zinc-200 drop-shadow">
              IG
            </span>
          </a>

          {/* Up / Down Chevrons for Quick Next/Prev Reel */}
          <div
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="pt-1 flex flex-col space-y-1.5"
          >
            {hasPrev && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevReel();
                }}
                className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer"
                title="Previous Reel"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
            )}
            {hasNext && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextReel();
                }}
                className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer"
                title="Next Reel"
              >
                <ChevronDownIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Overlay: Creator, Caption & Audio */}
        <div
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className="relative z-20 p-4 pb-[max(1rem,env(safe-area-inset-bottom,1rem))] pr-16 space-y-2 text-white"
        >
          <Link
            href={`/creator/${creatorHandle}`}
            onClick={onClose}
            className="inline-flex items-center space-x-2 group/author"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 border border-white/20 shrink-0">
              <img
                src={avatarSrc}
                alt={creatorHandle}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
            <span className="text-xs font-bold text-white group-hover/author:underline truncate">
              @{creatorHandle}
            </span>
          </Link>

          <p
            onClick={() => setIsDetailsSheetOpen(true)}
            className="text-xs text-zinc-200 line-clamp-2 leading-relaxed cursor-pointer"
          >
            {activeReel.caption || activeReel.aiSummary || "Saved reel"}
          </p>

          {activeReel.audioTitle && (
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] text-zinc-300">
              <Music2 className="w-3 h-3 text-emerald-400 shrink-0 animate-pulse" />
              <span className="truncate max-w-[200px]">{activeReel.audioTitle}</span>
            </div>
          )}
        </div>

        {/* Slide-Up Details & Notes Bottom Drawer */}
        <AnimatePresence>
          {isDetailsSheetOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDetailsSheetOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-xs z-40"
              />

              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 280 }}
                className="absolute inset-x-0 bottom-0 max-h-[75vh] bg-zinc-950/95 backdrop-blur-2xl border-t border-zinc-800 rounded-t-3xl p-5 z-50 overflow-y-auto space-y-4"
              >
                <div className="w-10 h-1 rounded-full bg-zinc-700 mx-auto" />

                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <span className="text-sm font-bold text-white">Reel Details &amp; Notes</span>
                  <button
                    onClick={() => setIsDetailsSheetOpen(false)}
                    className="p-1 rounded-full text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Full Caption
                  </span>
                  <div className="text-xs text-zinc-200 leading-relaxed whitespace-pre-line">
                    {renderFormattedCaption(cleanCaption || "No caption.", onClose)}
                  </div>
                  {parsedTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                      {parsedTags.map((tag: string, i: number) => (
                        <span
                          key={i}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-zinc-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {activeReel.aiSummary && activeReel.aiSummary !== activeReel.caption && (
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 space-y-1">
                    <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>AI Summary</span>
                    </span>
                    <p className="text-xs text-zinc-300 leading-relaxed">{activeReel.aiSummary}</p>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Personal Notes
                    </span>
                    {isEditingNote ? (
                      <button
                        onClick={handleSaveNote}
                        className="px-2.5 py-1 rounded bg-brand-600 text-white text-[11px] font-semibold"
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditingNote(true)}
                        className="text-[11px] text-brand-400 hover:underline"
                      >
                        Edit Note
                      </button>
                    )}
                  </div>
                  {isEditingNote ? (
                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Write your thoughts, ideas, or action items..."
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none focus:border-brand-500"
                      rows={3}
                    />
                  ) : (
                    <p className="text-xs text-zinc-400 italic">
                      {activeReel.notes || "No personal notes yet. Tap Edit Note to add."}
                    </p>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile Slide-Up Category Picker Drawer */}
        <AnimatePresence>
          {isCategoryPickerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCategoryPickerOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-xs z-40"
              />

              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 280 }}
                className="absolute inset-x-0 bottom-0 max-h-[65vh] bg-zinc-950/95 backdrop-blur-2xl border-t border-zinc-800 rounded-t-3xl p-5 z-50 overflow-y-auto space-y-4"
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
              >
                <div className="w-10 h-1 rounded-full bg-zinc-700 mx-auto" />

                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <span className="text-sm font-bold text-white">Assign Category</span>
                  <button
                    onClick={() => setIsCategoryPickerOpen(false)}
                    className="p-1 rounded-full text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        updateCategory(activeReel.id, cat);
                        setActiveReel((prev) => ({
                          ...prev,
                          category: cat,
                          categories: [cat],
                        }));
                        setIsCategoryPickerOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer ${
                        activeReel.category?.toLowerCase() === cat.toLowerCase()
                          ? "bg-brand-500/20 border-brand-500/40 text-brand-300 font-semibold"
                          : "bg-zinc-900 border-zinc-800 hover:border-brand-500/30 text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Tag className="w-4 h-4 text-brand-400 shrink-0" />
                        <span className="truncate font-medium flex-1">{cat}</span>
                      </div>
                      {activeReel.category?.toLowerCase() === cat.toLowerCase() && (
                        <span className="text-[10px] text-brand-400 font-medium">Current</span>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      ) : (
        /* ─── 2. DESKTOP EXPERIENCE: Dual-Pane Modal (>= md screens) ─── */
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/85 backdrop-blur-md">
          {/* Backdrop Close */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* Modal Window: Split Video Player & Personal Library Inspector */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[960px] h-[88vh] max-h-[700px] bg-[#0A0B0E] text-white rounded-2xl overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.85)] border border-white/[0.08] flex flex-col md:flex-row z-10"
          >
            {/* LEFT COLUMN: Clean 9:16 Vertical Video Player */}
            <div className="w-full md:w-[380px] lg:w-[410px] h-[46vh] md:h-full bg-black flex items-center justify-center relative overflow-hidden border-b md:border-b-0 md:border-r border-white/[0.08] shrink-0">
              <ReelPlayer
                key={activeReel.id}
                reel={activeReel}
                autoPlay={true}
                className="w-full h-full rounded-none border-0 shadow-none bg-black"
              />
            </div>

            {/* RIGHT COLUMN: Pure Dark Astra Inspector */}
            <div className="flex-1 md:h-full flex flex-col bg-[#0B0C10] text-zinc-100 min-w-0 overflow-hidden relative">
              {/* Subtle Ambient Radial Glow */}
              <div className="pointer-events-none absolute -top-24 right-0 w-80 h-80 bg-violet-600/[0.08] rounded-full blur-3xl" />

              {/* 1. TOP CREATOR HEADER */}
              <div className="p-3.5 px-5 flex items-center justify-between border-b border-white/[0.08] shrink-0 bg-[#0C0D13]/95 backdrop-blur-md z-20">
                <div className="flex items-center space-x-3 min-w-0">
                  <Link
                    href={`/creator/${creatorHandle}`}
                    onClick={onClose}
                    className="group/avatar relative w-9 h-9 rounded-full ring-1 ring-white/10 overflow-hidden bg-zinc-900 shrink-0 flex items-center justify-center transition-transform hover:scale-105"
                  >
                    <img
                      src={`/api/proxy-image?username=${encodeURIComponent(creatorHandle)}`}
                      alt={creatorHandle}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                        const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <div className="hidden w-full h-full bg-zinc-800 items-center justify-center text-zinc-300 font-bold text-xs">
                      {creatorHandle[0]?.toUpperCase()}
                    </div>
                  </Link>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <Link
                        href={`/creator/${creatorHandle}`}
                        onClick={onClose}
                        className="text-[13px] font-semibold text-white hover:text-violet-300 truncate transition-colors flex items-center gap-1.5"
                      >
                        <span>@{creatorHandle}</span>
                        {isVerifiedCreator && <VerifiedBadge />}
                      </Link>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-zinc-400 font-mono">
                      <span className="uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/[0.05] border border-white/[0.06] text-zinc-300">
                        {activeReel.mediaType ? activeReel.mediaType.toUpperCase() : "REEL"}
                      </span>
                      <span>•</span>
                      <a
                        href={activeReel.instagramUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-white transition-colors flex items-center gap-0.5"
                      >
                        <span>Follow</span>
                        <ExternalLink className="size-2.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Top Right Header Controls */}
                <div className="flex items-center space-x-1">
                  {(hasPrev || hasNext) && (
                    <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg p-0.5 mr-1">
                      <button
                        onClick={handlePrevReel}
                        disabled={!hasPrev}
                        className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="Previous Reel (Up Arrow)"
                      >
                        <ChevronUp className="size-3.5" />
                      </button>
                      <button
                        onClick={handleNextReel}
                        disabled={!hasNext}
                        className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="Next Reel (Down Arrow)"
                      >
                        <ChevronDownIcon className="size-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="relative">
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
                      title="More options"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#14151C] border border-white/[0.1] rounded-xl shadow-2xl py-1 z-50 text-xs backdrop-blur-xl">
                        <button
                          onClick={handleCopyLink}
                          className="w-full px-3 py-2 text-left text-zinc-200 hover:bg-white/[0.06] flex items-center space-x-2.5 transition-colors cursor-pointer"
                        >
                          <Copy className="size-3.5 text-zinc-400" />
                          <span>Copy Link</span>
                        </button>
                        <button
                          onClick={handleDownloadVideo}
                          className="w-full px-3 py-2 text-left text-zinc-200 hover:bg-white/[0.06] flex items-center space-x-2.5 transition-colors cursor-pointer"
                        >
                          <Download className="size-3.5 text-violet-400" />
                          <span>Download MP4</span>
                        </button>
                        <a
                          href={activeReel.instagramUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full px-3 py-2 text-left text-zinc-200 hover:bg-white/[0.06] flex items-center space-x-2.5 transition-colors"
                        >
                          <ExternalLink className="size-3.5 text-zinc-400" />
                          <span>Open on Instagram</span>
                        </a>
                        <div className="my-1 border-t border-white/[0.08]" />
                        <button
                          onClick={() => {
                            deleteReel(activeReel.id);
                            onClose();
                          }}
                          className="w-full px-3 py-2 text-left text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                          <span>Delete Reel</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={onClose}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors ml-1 cursor-pointer"
                    title="Close (Esc)"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              {/* 2. METRICS & CATEGORY STRIP */}
              <div className="px-5 py-2.5 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between text-xs shrink-0 relative z-10">
                <div className="flex items-center space-x-4 text-zinc-400">
                  <span className="flex items-center space-x-1.5 text-zinc-300 font-medium">
                    <Heart className={`size-3.5 ${activeReel.isFavorite ? "fill-rose-500 text-rose-500" : "text-zinc-500"}`} />
                    <span className="font-mono text-[11px]">{activeReel.likes || "Like"}</span>
                  </span>
                  {activeReel.commentsCount && (
                    <span className="flex items-center space-x-1.5 text-zinc-400">
                      <MessageSquare className="size-3.5 text-zinc-500" />
                      <span className="font-mono text-[11px]">{activeReel.commentsCount} comments</span>
                    </span>
                  )}
                  <span className="flex items-center space-x-1.5 text-zinc-400 text-[11px]">
                    <Calendar className="size-3 text-zinc-500" />
                    <span>{formattedDate}</span>
                  </span>
                </div>

                {/* Category Pill with inline popover toggle */}
                <div className="relative">
                  <button
                    onClick={() => setIsCategoryPickerOpen(!isCategoryPickerOpen)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 text-[11px] font-medium hover:bg-violet-500/20 transition-all cursor-pointer"
                    title="Change Category"
                  >
                    <Tag className="size-3 text-violet-400" />
                    <span className="max-w-[120px] truncate">{activeReel.category || "General"}</span>
                    <ChevronDownIcon className="size-3 text-violet-400/80" />
                  </button>

                  {/* Category popover */}
                  {isCategoryPickerOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-[#14151C] border border-white/[0.1] rounded-xl shadow-2xl p-2 z-40 text-xs backdrop-blur-xl">
                      <div className="px-2 py-1 text-[10px] uppercase font-mono tracking-wider text-zinc-400 border-b border-white/[0.06] mb-1.5 flex justify-between items-center">
                        <span>Select Category</span>
                        <button
                          onClick={() => setIsCategoryPickerOpen(false)}
                          className="text-zinc-400 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="max-h-44 overflow-y-auto space-y-1 custom-scrollbar">
                        {availableCategories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => {
                              updateCategory(activeReel.id, cat);
                              setActiveReel((prev) => ({
                                ...prev,
                                category: cat,
                                categories: [cat],
                              }));
                              setIsCategoryPickerOpen(false);
                              showToast(`Category set to "${cat}"`);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              activeReel.category?.toLowerCase() === cat.toLowerCase()
                                ? "bg-violet-600/25 text-violet-200 font-semibold"
                                : "text-zinc-300 hover:bg-white/[0.06]"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Tag className="size-3 text-violet-400 shrink-0" />
                              <span className="truncate">{cat}</span>
                            </div>
                            {activeReel.category?.toLowerCase() === cat.toLowerCase() && (
                              <Check className="size-3.5 text-violet-400 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. MIDDLE SCROLLABLE BODY */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-normal leading-relaxed custom-scrollbar bg-[#090A0F]">
                {/* Clean Caption */}
                <div className="space-y-2.5">
                  <div className="text-[13px] text-zinc-200 leading-relaxed font-normal whitespace-pre-line">
                    {renderFormattedCaption(cleanCaption || "No caption provided.", onClose)}
                  </div>

                  {/* Extracted Topic Tags Shelf */}
                  {parsedTags.length > 0 && (
                    <div className="pt-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                        <Sparkles className="size-3 text-violet-400" />
                        <span>Topics & Keywords</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {parsedTags.map((tag: string, i: number) => (
                          <Link
                            key={i}
                            href={`/search?q=${encodeURIComponent(tag)}`}
                            onClick={onClose}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-violet-500/30 text-xs text-zinc-300 hover:text-violet-200 transition-all font-sans"
                          >
                            <span>{tag}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Soundtrack Audio Card */}
                {activeReel.audioTitle && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-zinc-200">
                    <div className="flex items-center space-x-2.5 min-w-0 mr-2">
                      <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <Music2 className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-white truncate">
                          {activeReel.audioTitle}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {activeReel.audioArtist || `@${creatorHandle} • Soundtrack`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        await saveReel(activeReel.instagramUrl, {
                          mediaType: "audio",
                          shortcode: `audio_${activeReel.shortcode || activeReel.id}`,
                          audioTitle: activeReel.audioTitle || "Original audio",
                          audioArtist: activeReel.audioArtist || `@${creatorHandle}`,
                          creator: creatorHandle,
                          caption: `Soundtrack: ${activeReel.audioTitle || "Original audio"}`,
                          category: "Music & Audio",
                          thumbnailUrl: activeReel.thumbnailUrl,
                          mediaUrl: activeReel.videoUrl || activeReel.mediaUrl,
                        });
                        showToast("Audio track saved to Songs & Audio!");
                      }}
                      className="shrink-0 flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium transition-all cursor-pointer"
                    >
                      <Plus className="size-3" />
                      <span>Save Audio</span>
                    </button>
                  </div>
                )}

                {/* Astra AI Insights & Takeaways Card */}
                <div className="rounded-xl bg-gradient-to-br from-violet-950/20 via-[#10121A] to-black/30 border border-violet-500/20 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold tracking-wide text-violet-300 flex items-center gap-1.5 uppercase font-mono">
                      <Sparkles className="size-3.5 text-violet-400" />
                      <span>Astra AI Insights</span>
                    </span>
                    {activeReel.aiSummary && !isAiLoading && (
                      <button
                        onClick={handleExtractAiTakeaways}
                        className="text-[10px] text-violet-400 hover:text-violet-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>Regenerate</span>
                      </button>
                    )}
                  </div>

                  {isAiLoading ? (
                    <div className="py-4 flex items-center justify-center space-x-2 text-violet-300 text-xs">
                      <Loader2 className="size-4 animate-spin text-violet-400" />
                      <span>Synthesizing key hooks & takeaways...</span>
                    </div>
                  ) : activeReel.aiSummary && !activeReel.aiSummary.includes("discussing General") ? (
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line font-sans">
                      {activeReel.aiSummary}
                    </p>
                  ) : (
                    <button
                      onClick={handleExtractAiTakeaways}
                      className="w-full py-2.5 px-3 rounded-lg bg-violet-600/15 hover:bg-violet-600/25 border border-violet-500/30 text-violet-200 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Sparkles className="size-3.5 text-violet-400" />
                      <span>Extract Key Takeaways & Hooks</span>
                    </button>
                  )}
                </div>

                {/* Workspace Notes Card */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase font-mono tracking-wider">
                      Workspace Notes
                    </span>
                    <button
                      onClick={() => setIsEditingNote(!isEditingNote)}
                      className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="size-3" />
                      <span>{isEditingNote ? "Cancel" : "Edit"}</span>
                    </button>
                  </div>

                  {isEditingNote ? (
                    <div className="space-y-2">
                      <textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Jot down creative hooks, lighting notes, or remix ideas..."
                        rows={3}
                        autoFocus
                        className="w-full p-2.5 bg-black/40 border border-violet-500/40 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none leading-relaxed"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setIsEditingNote(false)}
                          className="px-3 py-1 rounded-md text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveNote}
                          className="px-3.5 py-1 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors cursor-pointer"
                        >
                          Save Note
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {activeReel.notes ? (
                        activeReel.notes
                      ) : (
                        <span
                          onClick={() => setIsEditingNote(true)}
                          className="italic text-zinc-500 hover:text-zinc-400 cursor-pointer block"
                        >
                          Click to record hooks, ideas, or references for this reel…
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* 4. BOTTOM ACTION DOCK */}
              <div className="p-3 px-5 border-t border-white/[0.08] bg-[#0C0D13] shrink-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleFavorite}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                      activeReel.isFavorite
                        ? "border-rose-500/40 bg-rose-500/15 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
                        : "border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                    }`}
                    title={activeReel.isFavorite ? "Favorited" : "Add to favorites"}
                  >
                    <Heart
                      className={`size-4 ${activeReel.isFavorite ? "fill-rose-500 text-rose-500" : ""}`}
                    />
                  </button>

                  <button
                    onClick={() => setIsCategoryPickerOpen(!isCategoryPickerOpen)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
                    title="Change Category"
                  >
                    <Tag className="size-3.5 text-violet-400" />
                    <span className="max-w-[120px] truncate">{activeReel.category || "General"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadVideo}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-xs font-medium text-violet-200 transition-colors cursor-pointer"
                    title="Download high-resolution MP4"
                  >
                    <Download className="size-3.5 text-violet-400" />
                    <span>Download MP4</span>
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="p-2 rounded-xl border border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                    title="Copy Reel Link"
                  >
                    <Copy className="size-4" />
                  </button>

                  <a
                    href={activeReel.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl border border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                    title="Open on Instagram"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
