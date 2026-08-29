"use client";

import React, { useState, useEffect } from "react";
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
  Sparkles,
  Copy,
  Trash2,
  FolderPlus,
  ThumbsUp,
  MessageSquare,
  Calendar,
  Plus,
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
    toggleFavorite,
    deleteReel,
    updateNote,
    generateAiSummary,
    collections,
    addReelToCollection,
    showToast,
    saveReel,
  } = useReels();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollectionPickerOpen, setIsCollectionPickerOpen] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [avatarSrc, setAvatarSrc] = useState<string>("");

  useEffect(() => {
    if (reel) {
      setNoteContent(reel.notes || "");
      const username = reel.creatorUsername || "creator";
      setAvatarSrc(`/api/proxy-image?username=${encodeURIComponent(username)}`);
    }
  }, [reel]);

  if (!isOpen || !reel) return null;

  const creatorHandle = reel.creatorUsername || "creator";
  const formattedDate = new Date(reel.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(reel.instagramUrl);
    showToast("Reel link copied to clipboard");
    setIsMenuOpen(false);
  };

  const handleSaveNote = () => {
    updateNote(reel.id, noteContent);
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md">
        {/* Backdrop Close */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Modal Window: Split Video Player & Personal Library Inspector */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-5xl h-[92vh] max-h-[750px] bg-zinc-950 text-white rounded-xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col md:flex-row z-10"
        >
          {/* Close Button on Mobile */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 md:hidden z-30 p-1.5 rounded-full bg-black/80 text-white hover:bg-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* LEFT COLUMN: Clean 9:16 Vertical Video Player */}
          <div className="w-full md:w-[48%] lg:w-[50%] h-[55vh] md:h-full min-h-[380px] bg-black flex items-center justify-center relative overflow-hidden border-b md:border-b-0 md:border-r border-zinc-800 shrink-0">
            <ReelPlayer
              reel={reel}
              autoPlay={true}
              className="w-full h-full rounded-none border-0 shadow-none bg-black"
            />
          </div>

          {/* RIGHT COLUMN: Pure Dark Inspector & Library Details */}
          <div className="w-full md:w-[52%] lg:w-[50%] flex-1 md:h-full flex flex-col bg-zinc-950 text-zinc-100 min-w-0 border-l border-zinc-800/60 overflow-y-auto">
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
                    {reel.mediaType ? reel.mediaType.toUpperCase() : "REEL"}
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
                        href={reel.instagramUrl}
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
                          deleteReel(reel.id);
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
                  {formatCaption(reel.caption || "No caption provided.")}
                </p>

                {/* Audio Track Tag with 1-Click Save Audio action */}
                {(reel.audioTitle || reel.mediaType === "audio") && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <div className="flex items-center space-x-2 min-w-0 mr-2">
                      <Music2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-white truncate">
                          {reel.audioTitle || "Original audio"}
                        </p>
                        <p className="text-[10px] text-emerald-400/80 truncate">
                          {reel.audioArtist || `@${reel.creatorUsername} • Audio Track`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        await saveReel(reel.instagramUrl, {
                          mediaType: "audio",
                          audioTitle: reel.audioTitle || "Original audio",
                          audioArtist: reel.audioArtist || `@${reel.creatorUsername}`,
                          creator: reel.creatorUsername,
                          caption: `Soundtrack from @${reel.creatorUsername}`,
                          category: "Music & Audio",
                        });
                        showToast("Audio track saved to Songs & Audio!");
                      }}
                      className="shrink-0 flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
                      title="Save this audio track to your library"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Save Audio</span>
                    </button>
                  </div>
                )}

                {/* Hashtags list */}
                {reel.hashtags && reel.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {reel.hashtags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-brand-400 font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Real Instagram Engagement & Save Metadata */}
              <div className="pt-3 border-t border-zinc-800/60 space-y-2 text-xs text-zinc-400">
                <div className="flex flex-wrap items-center gap-4 text-zinc-400">
                  {reel.likes && (
                    <span className="flex items-center space-x-1 font-semibold text-zinc-300">
                      <ThumbsUp className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{reel.likes}</span>
                    </span>
                  )}
                  {reel.commentsCount && (
                    <span className="flex items-center space-x-1 text-zinc-300">
                      <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{reel.commentsCount} comments</span>
                    </span>
                  )}
                  <span className="flex items-center space-x-1 text-zinc-500 text-[11px]">
                    <Calendar className="w-3 h-3 text-zinc-500" />
                    <span>Saved {formattedDate}</span>
                  </span>
                </div>
              </div>

              {/* AI Key Insights (Rendered only when valid takeaways exist or requested) */}
              {reel.aiSummary && !reel.aiSummary.includes("discussing General") && !reel.aiSummary.startsWith("Summary:") ? (
                <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-brand-400 font-semibold text-[11px]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Key Insights</span>
                    </div>
                    <button
                      onClick={() => generateAiSummary(reel.id)}
                      className="text-[10px] text-zinc-400 hover:text-brand-400 cursor-pointer"
                    >
                      Regenerate
                    </button>
                  </div>
                  <p className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed">
                    {reel.aiSummary}
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => generateAiSummary(reel.id)}
                  className="w-full p-2.5 rounded-lg border border-dashed border-zinc-800 hover:border-brand-500/40 bg-zinc-900/30 hover:bg-zinc-900 text-[11px] text-zinc-400 hover:text-brand-400 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                  <span>Extract Key Takeaways with AI</span>
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
                    {reel.notes || (
                      <span className="italic text-zinc-500">
                        No notes yet. Click edit to add your thoughts.
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* 3. BOTTOM CLEAN LIBRARY ACTION BAR (Zero fake social buttons) */}
            <div className="p-3.5 px-4 border-t border-zinc-800/80 bg-zinc-950 shrink-0 space-y-2">
              <div className="flex items-center gap-2">
                {/* Favorite Toggle Button */}
                <button
                  onClick={() => toggleFavorite(reel.id)}
                  className={`p-2.5 rounded-md border transition-all cursor-pointer flex items-center justify-center ${
                    reel.isFavorite
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-400"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
                  }`}
                  title={reel.isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart
                    className={`w-4 h-4 ${reel.isFavorite ? "fill-rose-500 text-rose-500" : ""}`}
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
                            addReelToCollection(reel.id, col.id);
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
    </AnimatePresence>
  );
}
