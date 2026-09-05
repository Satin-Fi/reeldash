"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Reel } from "@/types/reel";
import { useReels } from "@/context/ReelContext";
import { ReelPlayer } from "./ReelPlayer";
import {
  X,
  Heart,
  Bookmark,
  MoreHorizontal,
  Music2,
  ExternalLink,
  Copy,
  Trash2,
  Folder,
  FolderPlus,
  ThumbsUp,
  MessageSquare,
  Calendar,
  Plus,
  ArrowLeft,
  ChevronUp,
  ChevronDown as ChevronDownIcon,
  Sparkles,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

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
    collections,
    addReelToCollection,
    showToast,
    saveReel,
    updateReelCreator,
  } = useReels();

  const [activeReel, setActiveReel] = useState<Reel>(reel || reels[0]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollectionPickerOpen, setIsCollectionPickerOpen] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [isEditingCreator, setIsEditingCreator] = useState(false);
  const [creatorInput, setCreatorInput] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [avatarSrc, setAvatarSrc] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const initialReelIdRef = useRef<string | null>(reel?.id || null);

  useEffect(() => {
    setMounted(true);
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
          match.creatorUsername !== activeReel.creatorUsername
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

  const handleSaveCreator = () => {
    if (updateReelCreator) {
      updateReelCreator(activeReel.id, creatorInput);
      setActiveReel((prev) => ({
        ...prev,
        creatorUsername: creatorInput.replace(/^@/, "").trim(),
      }));
    }
    setIsEditingCreator(false);
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
      {/* ─── 1. MOBILE EXPERIENCE: 100dvh Edge-to-Edge Native Reels Viewer ─── */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="md:hidden fixed inset-0 z-[100] h-[100dvh] w-full bg-black flex flex-col justify-between overflow-hidden select-none"
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
                  onClick={() => {
                    setCreatorInput(creatorHandle === "creator" ? "" : creatorHandle);
                    setIsEditingCreator(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-zinc-200 hover:bg-white/[0.08] rounded-lg flex items-center space-x-2"
                >
                  <User className="w-4 h-4 text-zinc-400" />
                  <span>Set Creator Handle</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="w-full px-3 py-2 text-left text-zinc-200 hover:bg-white/[0.08] rounded-lg flex items-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </button>
                <button
                  onClick={() => {
                    setIsCollectionPickerOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-zinc-200 hover:bg-white/[0.08] rounded-lg flex items-center space-x-2"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Add to Collection</span>
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
                  className="w-full px-3 py-2 text-left text-rose-400 hover:bg-rose-500/15 rounded-lg flex items-center space-x-2"
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

          {/* Collection Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollectionPickerOpen(true);
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="flex flex-col items-center space-y-1 cursor-pointer active:scale-110 transition-transform"
          >
            <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white">
              <FolderPlus className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold text-zinc-200 drop-shadow">
              Save
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

                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Full Caption
                  </span>
                  <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-line">
                    {formatCaption(activeReel.caption || "No caption.")}
                  </p>
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

        {/* Mobile Slide-Up Collection Picker Drawer */}
        <AnimatePresence>
          {isCollectionPickerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCollectionPickerOpen(false)}
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
                  <span className="text-sm font-bold text-white">Save to Collection</span>
                  <button
                    onClick={() => setIsCollectionPickerOpen(false)}
                    className="p-1 rounded-full text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {collections.length > 0 ? (
                    collections.map((col) => (
                      <button
                        key={col.id}
                        onClick={() => {
                          addReelToCollection(activeReel.id, col.id);
                          showToast("Added to collection", col.name);
                          setIsCollectionPickerOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-brand-500/30 text-xs text-zinc-200 flex items-center space-x-3 active:scale-[0.98] transition-transform cursor-pointer"
                      >
                        <Folder className="w-4 h-4 text-brand-400 shrink-0" />
                        <span className="truncate font-medium flex-1">{col.name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-6 text-zinc-500 space-y-1">
                      <p className="text-xs">No collections created yet.</p>
                      <p className="text-[11px] text-zinc-600">Create collections from the Collections tab.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ─── 2. DESKTOP EXPERIENCE: Dual-Pane Modal (>= md screens) ─── */}
      <div className="hidden md:flex fixed inset-0 z-[100] items-center justify-center p-3 sm:p-5 md:p-6 bg-black/85 backdrop-blur-md">
        {/* Backdrop Close */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Modal Window: Split Video Player & Personal Library Inspector */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-[840px] h-[86vh] max-h-[660px] bg-zinc-950 text-white rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col md:flex-row z-10"
        >
          {/* LEFT COLUMN: Clean 9:16 Vertical Video Player (Optimal compact sizing) */}
          <div className="w-full md:w-[360px] h-[48vh] md:h-full bg-black flex items-center justify-center relative overflow-hidden border-b md:border-b-0 md:border-r border-zinc-800 shrink-0">
            <ReelPlayer
              key={activeReel.id}
              reel={activeReel}
              autoPlay={true}
              className="w-full h-full rounded-none border-0 shadow-none bg-black"
            />
          </div>

          {/* RIGHT COLUMN: Pure Dark Inspector & Library Details */}
          <div className="flex-1 md:h-full flex flex-col bg-zinc-950 text-zinc-100 min-w-0 overflow-y-auto">
            {/* 1. TOP CREATOR HEADER */}
            <div className="p-3.5 px-4 flex items-center justify-between border-b border-zinc-800/80 shrink-0 bg-zinc-950">
              <div className="flex items-center space-x-3 min-w-0">
                {/* Clean Real Creator Avatar (No fake story ring) */}
                <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-900 border border-zinc-700/80 shrink-0 flex items-center justify-center">
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
                  <div className="hidden w-full h-full bg-zinc-800 items-center justify-center text-zinc-400 font-bold text-xs">
                    {creatorHandle[0]?.toUpperCase()}
                  </div>
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <Link
                      href={`/creator/${creatorHandle}`}
                      onClick={onClose}
                      className="text-xs font-bold hover:text-brand-400 truncate text-white transition-colors"
                    >
                      @{creatorHandle}
                    </Link>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {activeReel.mediaType ? activeReel.mediaType.toUpperCase() : "REEL"}
                  </span>
                </div>
              </div>

              {/* Top Right Options Menu & Close Button */}
              <div className="flex items-center space-x-1">
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="More options"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 z-30 text-xs">
                      <button
                        onClick={() => {
                          setCreatorInput(creatorHandle === "creator" ? "" : creatorHandle);
                          setIsEditingCreator(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-zinc-200 hover:bg-zinc-800 flex items-center space-x-2"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Set Creator Handle</span>
                      </button>
                      <button
                        onClick={handleCopyLink}
                        className="w-full px-3 py-2 text-left text-zinc-200 hover:bg-zinc-800 flex items-center space-x-2"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsCollectionPickerOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-zinc-200 hover:bg-zinc-800 flex items-center space-x-2"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>Add to Collection</span>
                      </button>
                      <a
                        href={activeReel.instagramUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full px-3 py-2 text-left text-zinc-200 hover:bg-zinc-800 flex items-center space-x-2"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open on Instagram</span>
                      </a>
                      <div className="my-1 border-t border-zinc-800" />
                      <button
                        onClick={() => {
                          deleteReel(activeReel.id);
                          onClose();
                        }}
                        className="w-full px-3 py-2 text-left text-red-400 hover:bg-red-500/10 flex items-center space-x-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Item</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={onClose}
                  className="hidden md:flex p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. MIDDLE SCROLLABLE FEED: Clean Caption, Real Audio, Tags, Notes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-normal leading-relaxed custom-scrollbar bg-zinc-950">
              {/* Caption Content */}
              <div className="space-y-2">
                <p className="text-xs text-zinc-200 whitespace-pre-line leading-relaxed">
                  {formatCaption(activeReel.caption || activeReel.aiSummary || "No caption provided.")}
                </p>

                {activeReel.aiSummary && activeReel.aiSummary !== activeReel.caption && (
                  <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 text-purple-400">
                      <span>✨</span> AI Content Summary
                    </span>
                    <p className="text-xs leading-relaxed text-zinc-300">{activeReel.aiSummary}</p>
                  </div>
                )}

                {/* Audio Track Information */}
                {activeReel.mediaType === "audio" ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <div className="flex items-center space-x-2 min-w-0">
                      <Music2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-white truncate">
                          {activeReel.audioTitle || "Original audio"}
                        </p>
                        <p className="text-[10px] text-emerald-400/80 truncate">
                          {activeReel.audioArtist || `@${activeReel.creatorUsername} • Original Audio`}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                      Audio Track
                    </span>
                  </div>
                ) : activeReel.audioTitle ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <div className="flex items-center space-x-2 min-w-0 mr-2">
                      <Music2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-white truncate">
                          {activeReel.audioTitle}
                        </p>
                        <p className="text-[10px] text-emerald-400/80 truncate">
                          {activeReel.audioArtist || `@${activeReel.creatorUsername} • Audio Track`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        await saveReel(activeReel.instagramUrl, {
                          mediaType: "audio",
                          audioTitle: activeReel.audioTitle,
                          audioArtist: activeReel.audioArtist || `@${activeReel.creatorUsername}`,
                          creator: activeReel.creatorUsername,
                          caption: `Soundtrack from @${activeReel.creatorUsername}`,
                          category: "Music & Audio",
                        });
                        showToast("Audio track saved to Songs & Audio!");
                      }}
                      className="shrink-0 flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
                      title="Save this audio track to Songs & Audio"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Save Audio</span>
                    </button>
                  </div>
                ) : null}

                {/* 1. Assigned Categories */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-zinc-400 mr-0.5">Categories:</span>
                  {(activeReel.categories && activeReel.categories.length > 0 ? activeReel.categories : [activeReel.category || "General"]).map((catName, idx) => (
                    <Link
                      key={idx}
                      href={`/reels?category=${encodeURIComponent(catName)}`}
                      onClick={onClose}
                      className="inline-flex items-center space-x-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/25 text-brand-400 font-medium hover:bg-brand-500/20 transition-colors"
                    >
                      <Folder className="w-3 h-3 text-brand-400" strokeWidth={2} />
                      <span>{catName}</span>
                    </Link>
                  ))}
                </div>

                {/* 2. AI Topics */}
                {activeReel.aiTopics && activeReel.aiTopics.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-zinc-400 mr-0.5">AI Topics:</span>
                    {activeReel.aiTopics.map((topic, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}

                {/* 3. Instagram Hashtags */}
                {activeReel.hashtags && activeReel.hashtags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-zinc-400 mr-0.5">Hashtags:</span>
                    {activeReel.hashtags.map((tag, i) => {
                      const cleanTag = tag.startsWith("#") ? tag.slice(1) : tag;
                      return (
                        <Link
                          key={i}
                          href={`/search?q=${encodeURIComponent(`#${cleanTag}`)}`}
                          onClick={onClose}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 font-mono transition-colors"
                        >
                          #{cleanTag}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Real Instagram Engagement & Save Metadata */}
              <div className="pt-3 border-t border-zinc-800/60 space-y-2 text-xs text-zinc-400">
                <div className="flex flex-wrap items-center gap-4 text-zinc-400">
                  {activeReel.likes && (
                    <span className="flex items-center space-x-1 font-semibold text-zinc-300">
                      <ThumbsUp className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{activeReel.likes}</span>
                    </span>
                  )}
                  {activeReel.commentsCount && (
                    <span className="flex items-center space-x-1 text-zinc-300">
                      <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{activeReel.commentsCount} comments</span>
                    </span>
                  )}
                  <span className="flex items-center space-x-1 text-zinc-500 text-[11px]">
                    <Calendar className="w-3 h-3 text-zinc-500" />
                    <span>Saved {formattedDate}</span>
                  </span>
                </div>
              </div>

              {/* AI Key Insights */}
              {activeReel.aiSummary && !activeReel.aiSummary.includes("discussing General") && !activeReel.aiSummary.startsWith("Summary:") ? (
                <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">
                      Key Takeaways
                    </span>
                    <button
                      onClick={() => generateAiSummary(activeReel.id)}
                      className="text-[10px] text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Regenerate
                    </button>
                  </div>
                  <p className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed">
                    {activeReel.aiSummary}
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => generateAiSummary(activeReel.id)}
                  className="w-full p-2.5 rounded-lg border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900 text-xs font-medium text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <span>Extract Key Takeaways</span>
                </button>
              )}

              {/* Personal Notes */}
              <div className="p-3 bg-zinc-900/50 border border-zinc-800/80 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    My Notes
                  </span>
                  <button
                    onClick={() => setIsEditingNote(!isEditingNote)}
                    className="text-[10px] text-brand-400 hover:underline cursor-pointer"
                  >
                    {isEditingNote ? "Cancel" : "Edit"}
                  </button>
                </div>

                {isEditingNote ? (
                  <div className="space-y-2">
                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Add personal notes or takeaways..."
                      rows={2}
                      className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-xs text-white focus:outline-none focus:border-brand-500 resize-none"
                    />
                    <button
                      onClick={handleSaveNote}
                      className="px-3 py-1 bg-brand-500 text-white rounded text-[11px] font-medium hover:bg-brand-600 cursor-pointer"
                    >
                      Save Note
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-300">
                    {activeReel.notes || (
                      <span className="italic text-zinc-500">
                        No notes yet. Click edit to add your thoughts.
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* 3. BOTTOM CLEAN LIBRARY ACTION BAR */}
            <div className="p-3.5 px-4 border-t border-zinc-800/80 bg-zinc-950 shrink-0 space-y-2">
              <div className="flex items-center gap-2">
                {/* Favorite Toggle Button */}
                <button
                  onClick={handleToggleFavorite}
                  className={`p-2.5 rounded-md border transition-all cursor-pointer flex items-center justify-center ${
                    activeReel.isFavorite
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-400"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
                  }`}
                  title={activeReel.isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart
                    className={`w-4 h-4 ${activeReel.isFavorite ? "fill-rose-500 text-rose-500" : ""}`}
                  />
                </button>

                {/* Primary Add to Collection Action */}
                <button
                  onClick={() => setIsCollectionPickerOpen(true)}
                  className="flex-1 py-2 px-3 bg-brand-500 hover:bg-brand-600 active:scale-98 text-white rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Add to Collection</span>
                </button>

                {/* Copy Link Button */}
                <button
                  onClick={handleCopyLink}
                  className="p-2.5 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition-all cursor-pointer"
                  title="Copy Instagram URL"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              {/* Collection Picker Dropdown Modal Overlay */}
              {isCollectionPickerOpen && (
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">Save to Collection:</span>
                    <button
                      onClick={() => setIsCollectionPickerOpen(false)}
                      className="text-zinc-400 hover:text-white text-[11px]"
                    >
                      Done
                    </button>
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1 custom-scrollbar">
                    {collections.length > 0 ? (
                      collections.map((col) => (
                        <button
                          key={col.id}
                          onClick={() => {
                            addReelToCollection(activeReel.id, col.id);
                            showToast("Added to collection", col.name);
                            setIsCollectionPickerOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 text-xs text-zinc-300 flex items-center space-x-2 cursor-pointer"
                        >
                          <Bookmark className="w-3 h-3 text-brand-400" />
                          <span className="truncate">{col.name}</span>
                        </button>
                      ))
                    ) : (
                      <p className="text-[11px] text-zinc-500">
                        No collections created yet. Create one in Collections page.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Set / Edit Creator Handle Modal */}
      {isEditingCreator && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditingCreator(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-zinc-900 border border-white/10 p-5 shadow-2xl space-y-4 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                Set Creator Handle
              </h3>
              <button
                onClick={() => setIsEditingCreator(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              Enter the Instagram handle of the creator or brand who posted this:
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-mono">
                @
              </span>
              <input
                type="text"
                value={creatorInput}
                onChange={(e) => setCreatorInput(e.target.value.replace(/^@/, ""))}
                placeholder="creator_handle"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-zinc-800 border border-white/10 text-white focus:outline-none focus:border-brand-500 font-mono"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveCreator();
                  } else if (e.key === "Escape") {
                    setIsEditingCreator(false);
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingCreator(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCreator}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors cursor-pointer"
              >
                Save Creator
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
