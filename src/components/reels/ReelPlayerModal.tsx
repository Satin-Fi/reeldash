"use client";

import React, { useState } from "react";
import { Reel } from "@/types/reel";
import { useReels } from "@/context/ReelContext";
import { ReelPlayer } from "./ReelPlayer";
import {
  X,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  BadgeCheck,
  Music2,
  ExternalLink,
  Sparkles,
  Copy,
  Trash2,
  FolderPlus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  } = useReels();

  const [isLiked, setIsLiked] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollectionPickerOpen, setIsCollectionPickerOpen] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState(reel?.notes || "");
  const [likedComments, setLikedComments] = useState<Record<number, boolean>>({});

  if (!isOpen || !reel) return null;

  const shortcodeMatch = reel.instagramUrl.match(/(?:reel|p)\/([A-Za-z0-9_-]+)/);
  const shortcode = shortcodeMatch ? shortcodeMatch[1] : reel.id.replace(/^reel-/, "");
  const creatorHandle = reel.creatorUsername || "instagram_user";

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

  const toggleCommentLike = (index: number) => {
    setLikedComments((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Clean likes display string
  const cleanLikes = reel.likes
    ? reel.likes.replace(/likes/gi, "").trim()
    : "17K";

  // Mock comments stream matching Instagram post layout
  const mockComments = [
    {
      username: "official_priyanka8797",
      time: "43s",
      text: "Beautiful ❤️✨",
      likes: 12,
    },
    {
      username: "alex_dance_vibe",
      time: "46s",
      text: "🧿 🧿 🧿 🧿 🧿 Such clean moves!",
      likes: 8,
    },
    {
      username: "creative_studio_in",
      time: "1m",
      text: "The lighting and choreography are on point 🔥",
      likes: 5,
    },
  ];

  // Helper to format text with hashtags and mentions in blue
  const formatCaption = (text: string) => {
    const parts = text.split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_.]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("#") || part.startsWith("@")) {
        return (
          <span key={i} className="text-[#0095F6] hover:underline cursor-pointer">
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

        {/* Modal Window: Unified Pure Dark Split Instagram Layout */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-5xl h-[92vh] max-h-[750px] bg-black text-white rounded-xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col md:flex-row z-10"
        >
          {/* Close Button on Mobile */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 md:hidden z-30 p-1.5 rounded-full bg-black/80 text-white hover:bg-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* LEFT COLUMN: Pure Dark 9:16 Vertical Video Player */}
          <div className="w-full md:w-[48%] lg:w-[50%] h-[42vh] md:h-full bg-black flex items-center justify-center relative overflow-hidden border-b md:border-b-0 md:border-r border-zinc-800 shrink-0">
            <ReelPlayer
              reel={reel}
              autoPlay={true}
              className="w-full h-full rounded-none border-0 shadow-none bg-black"
            />
          </div>

          {/* RIGHT COLUMN: Pure Dark Instagram Post Social & Management Sidebar */}
          <div className="w-full md:w-[52%] lg:w-[50%] h-[50vh] md:h-full flex flex-col bg-black text-zinc-100 min-w-0 border-l border-zinc-800/60">
            {/* 1. TOP CREATOR HEADER */}
            <div className="p-3.5 px-4 flex items-center justify-between border-b border-zinc-800/80 shrink-0 bg-black">
              <div className="flex items-center space-x-3 min-w-0">
                {/* Creator Avatar with Instagram gradient border ring */}
                <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 shrink-0">
                  <div className="w-9 h-9 rounded-full bg-zinc-900 border-2 border-black flex items-center justify-center font-bold text-xs text-white">
                    {creatorHandle[0]?.toUpperCase()}
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 min-w-0">
                  <a
                    href={reel.creatorProfileUrl || `https://instagram.com/${creatorHandle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold hover:opacity-80 truncate text-white"
                  >
                    {creatorHandle}
                  </a>
                  <BadgeCheck className="w-3.5 h-3.5 fill-[#0095F6] text-white shrink-0" />
                  <span className="text-zinc-500 text-xs">•</span>
                  <a
                    href={reel.creatorProfileUrl || `https://instagram.com/${creatorHandle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-[#0095F6] hover:text-blue-400 transition-colors shrink-0"
                  >
                    Follow
                  </a>
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
                    <div className="absolute right-0 top-full mt-1 w-44 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 z-30 text-xs">
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
                        <span>Open in Instagram</span>
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
                        <span>Delete Reel</span>
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

            {/* 2. MIDDLE SCROLLABLE FEED: Caption, Comments, AI Summary, Notes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-normal leading-relaxed custom-scrollbar bg-black">
              {/* Creator Caption Post */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5">
                  {creatorHandle[0]?.toUpperCase()}
                </div>
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-xs text-white">{creatorHandle}</span>
                    <BadgeCheck className="w-3 h-3 fill-[#0095F6] text-white shrink-0" />
                    <span className="text-zinc-500 text-[11px]">8h</span>
                  </div>

                  <p className="text-xs text-zinc-200 whitespace-pre-line leading-relaxed">
                    {formatCaption(reel.caption)}
                  </p>

                  {/* Audio Tag */}
                  <div className="pt-1.5 flex items-center space-x-1.5 text-[11px] text-zinc-400 hover:text-zinc-200 cursor-pointer">
                    <Music2 className="w-3 h-3" />
                    <span>Original Audio • {creatorHandle}</span>
                  </div>
                </div>
              </div>

              {/* Comments Thread Section */}
              <div className="pt-2 border-t border-zinc-800/60 space-y-3.5">
                {mockComments.map((c, idx) => (
                  <div key={idx} className="flex items-start space-x-3 group">
                    <div className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-300 font-semibold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {c.username[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="text-xs text-zinc-200">
                        <span className="font-semibold mr-1.5 text-white">{c.username}</span>
                        {c.text}
                      </p>
                      <div className="flex items-center space-x-3 text-[10px] text-zinc-500 font-medium">
                        <span>{c.time}</span>
                        <span className="hover:text-zinc-300 cursor-pointer">
                          {c.likes + (likedComments[idx] ? 1 : 0)} likes
                        </span>
                        <span className="hover:text-zinc-300 cursor-pointer">Reply</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleCommentLike(idx)}
                      className={`p-1 transition-colors cursor-pointer shrink-0 ${
                        likedComments[idx] ? "text-red-500" : "text-zinc-600 hover:text-zinc-400"
                      }`}
                    >
                      <Heart
                        className={`w-3 h-3 ${likedComments[idx] ? "fill-red-500" : ""}`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              {/* AI Key Insights Card */}
              <div className="p-3 bg-zinc-900/80 border border-zinc-800/80 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-brand-400 font-semibold text-[11px]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Key Takeaways</span>
                  </div>
                  <button
                    onClick={() => generateAiSummary(reel.id)}
                    className="text-[10px] text-zinc-400 hover:text-brand-400 cursor-pointer"
                  >
                    {reel.aiSummary ? "Regenerate" : "Extract"}
                  </button>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {reel.aiSummary || "Click extract to summarize key insights, workout steps, or recipe notes."}
                </p>
              </div>

              {/* Personal Notes */}
              <div className="p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-lg space-y-2">
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
                    {reel.notes || <span className="italic text-zinc-500">No notes yet. Click edit to add your thoughts.</span>}
                  </p>
                )}
              </div>
            </div>

            {/* 3. BOTTOM ENGAGEMENT & ACTIONS BAR */}
            <div className="p-3.5 px-4 border-t border-zinc-800/80 bg-black shrink-0 space-y-2">
              {/* Row 1: Action Icons (Like, Comment, Share, Bookmark) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Like Button */}
                  <button
                    onClick={() => {
                      setIsLiked(!isLiked);
                      toggleFavorite(reel.id);
                    }}
                    className={`transition-transform hover:scale-110 cursor-pointer ${
                      isLiked || reel.isFavorite ? "text-red-500" : "text-zinc-200 hover:text-white"
                    }`}
                    title="Like Reel"
                  >
                    <Heart
                      className={`w-5 h-5 ${isLiked || reel.isFavorite ? "fill-red-500" : ""}`}
                    />
                  </button>

                  {/* Comment Button */}
                  <button
                    className="text-zinc-200 hover:text-white transition-transform hover:scale-110 cursor-pointer"
                    title="Comment"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>

                  {/* Share / Copy Link Button */}
                  <button
                    onClick={handleCopyLink}
                    className="text-zinc-200 hover:text-white transition-transform hover:scale-110 cursor-pointer"
                    title="Share Reel"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>

                {/* Bookmark / Collection Button */}
                <button
                  onClick={() => setIsCollectionPickerOpen(!isCollectionPickerOpen)}
                  className={`transition-transform hover:scale-110 cursor-pointer ${
                    reel.isFavorite ? "text-brand-500" : "text-zinc-200 hover:text-white"
                  }`}
                  title="Add to Collection"
                >
                  <Bookmark className={`w-5 h-5 ${reel.isFavorite ? "fill-brand-500" : ""}`} />
                </button>
              </div>

              {/* Row 2: Metrics and Date */}
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white">
                  {cleanLikes} likes
                </p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wide">
                  8 hours ago
                </p>
              </div>

              {/* Row 3: Open on Instagram Button */}
              <div className="pt-1.5 flex items-center">
                <a
                  href={reel.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-md text-xs font-medium flex items-center justify-center space-x-1.5 border border-zinc-800 transition-colors"
                >
                  <span>Open on Instagram</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
