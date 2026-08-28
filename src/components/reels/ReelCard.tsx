"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Reel } from "@/types/reel";
import { useReels } from "@/context/ReelContext";
import {
  Heart,
  Play,
  MoreVertical,
  ExternalLink,
  Trash2,
  FolderPlus,
  Copy,
  FileText,
  MessageCircle,
  ThumbsUp,
  Music2,
  Layers,
  Image as ImageIcon,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ReelPlayerModal } from "./ReelPlayerModal";

interface ReelCardProps {
  reel: Reel;
  viewMode?: "grid" | "compact";
}

export function ReelCard({ reel, viewMode = "grid" }: ReelCardProps) {
  const { toggleFavorite, deleteReel, collections, addReelToCollection, showToast } = useReels();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollectionPickerOpen, setIsCollectionPickerOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);

  const mediaType =
    reel.mediaType ||
    (reel.instagramUrl?.includes("/audio/")
      ? "audio"
      : reel.instagramUrl?.includes("/stories/")
      ? "story"
      : (reel.instagramUrl?.includes("/p/") || reel.isCarousel || (reel.carouselImages && reel.carouselImages.length > 0))
      ? "post"
      : "reel");

  // Shortcode extraction
  const shortcodeMatch = reel.instagramUrl.match(/(?:reel|reels|p|audio|stories)\/([A-Za-z0-9_-]+)/);
  const shortcode = shortcodeMatch ? shortcodeMatch[1] : null;

  // Clean thumbnail image source via our proxy endpoint
  const imageSrc =
    !imageError && reel.thumbnailUrl
      ? reel.thumbnailUrl
      : shortcode
      ? `/api/proxy-image?shortcode=${shortcode}`
      : "";

  const displayCreator =
    reel.creatorFullName || reel.creatorUsername || (shortcode ? `ig_${shortcode.substring(0, 6)}` : "creator");
  const displayHandle = reel.creatorUsername || "creator";
  const displayCaption = reel.caption || `Instagram ${mediaType.toUpperCase()} (${shortcode || "media"})`;

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(reel.instagramUrl);
    showToast("Link copied to clipboard");
    setIsMenuOpen(false);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(reel.id);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPlayerModalOpen(true);
  };

  return (
    <>
      {/* Player Modal with reference Instagram split layout */}
      <ReelPlayerModal
        reel={reel}
        isOpen={isPlayerModalOpen}
        onClose={() => setIsPlayerModalOpen(false)}
      />

      {viewMode === "compact" ? (
        <div
          onClick={handleCardClick}
          className="group relative flex items-center justify-between p-3.5 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md hover:border-brand-500/40 transition-all duration-200 shadow-rd-subtle cursor-pointer"
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="relative w-12 h-16 rounded-rd-sm overflow-hidden shrink-0 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt={displayCaption}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {mediaType === "audio" ? (
                  <Music2 className="w-5 h-5 text-emerald-400" />
                ) : mediaType === "post" ? (
                  <ImageIcon className="w-5 h-5 text-blue-400" />
                ) : mediaType === "story" ? (
                  <Clock className="w-5 h-5 text-amber-400" />
                ) : (
                  <Play className="w-5 h-5 text-white fill-white" />
                )}
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded-full uppercase tracking-wider ${
                  mediaType === "audio"
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    : mediaType === "post"
                    ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                    : mediaType === "story"
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    : "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                }`}>
                  {mediaType === "audio" ? "🎵 Song" : mediaType === "post" ? "📸 Post" : mediaType === "story" ? "⏱️ Story" : "🎬 Reel"}
                </span>
                <p className="text-xs font-semibold text-primaryText-light dark:text-primaryText-dark truncate">
                  {displayCreator} <span className="text-mutedText-light dark:text-mutedText-dark font-normal">(@{displayHandle})</span>
                </p>
              </div>
              <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark truncate max-w-md mt-0.5">
                {reel.audioTitle || displayCaption}
              </p>
              <div className="flex items-center space-x-2 mt-1.5 text-[11px]">
                <span className="px-2 py-0.5 rounded-full bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark font-medium text-secondaryText-light dark:text-secondaryText-dark">
                  {reel.category}
                </span>
                {reel.likes && (
                  <span className="text-mutedText-light dark:text-mutedText-dark flex items-center space-x-1">
                    <ThumbsUp className="w-3 h-3" />
                    <span>{reel.likes}</span>
                  </span>
                )}
                {reel.commentsCount && (
                  <span className="text-mutedText-light dark:text-mutedText-dark flex items-center space-x-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>{reel.commentsCount}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 ml-3">
            <button
              onClick={handleFavoriteClick}
              className="p-1.5 text-secondaryText-light dark:text-secondaryText-dark hover:text-rose-500 transition-colors cursor-pointer"
            >
              <Heart
                className={`w-4 h-4 transition-transform duration-200 ${
                  reel.isFavorite ? "fill-rose-500 text-rose-500 scale-110" : ""
                }`}
              />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteReel(reel.id);
              }}
              className="p-1.5 text-mutedText-light dark:text-mutedText-dark hover:text-rose-500 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={handleCardClick}
          className="group relative flex flex-col bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-card overflow-hidden shadow-rd-subtle hover:-translate-y-0.5 hover:border-brand-500/40 transition-all duration-200 cursor-pointer"
        >
          {/* 9:16 Clean Image Thumbnail Container */}
          <div className="relative aspect-reel w-full overflow-hidden bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt={displayCaption}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 opacity-70 group-hover:opacity-90 transition-opacity" />

            {/* Media Type Badge (Top Left) */}
            <div className="absolute top-2.5 left-2.5 z-10">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md shadow-sm uppercase tracking-wider flex items-center space-x-1 ${
                mediaType === "audio"
                  ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30"
                  : mediaType === "post"
                  ? "bg-blue-950/80 text-blue-300 border border-blue-500/30"
                  : mediaType === "story"
                  ? "bg-amber-950/80 text-amber-300 border border-amber-500/30"
                  : "bg-purple-950/80 text-purple-300 border border-purple-500/30"
              }`}>
                {mediaType === "audio" && <Music2 className="w-2.5 h-2.5" />}
                {mediaType === "post" && (reel.isCarousel ? <Layers className="w-2.5 h-2.5" /> : <ImageIcon className="w-2.5 h-2.5" />)}
                {mediaType === "story" && <Clock className="w-2.5 h-2.5" />}
                {mediaType === "reel" && <Play className="w-2.5 h-2.5 fill-current" />}
                <span>{mediaType === "audio" ? "Song" : mediaType === "post" ? (reel.isCarousel ? "Carousel" : "Post") : mediaType === "story" ? "Story" : "Reel"}</span>
              </span>
            </div>

            {/* Favorite Toggle Button */}
            <motion.button
              whileTap={{ scale: 1.25 }}
              onClick={handleFavoriteClick}
              className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/50 backdrop-blur-md text-white/90 hover:text-rose-400 transition-colors cursor-pointer z-10"
            >
              <Heart
                className={`w-4 h-4 transition-transform duration-200 ${
                  reel.isFavorite ? "fill-rose-500 text-rose-500 scale-110" : ""
                }`}
              />
            </motion.button>

            {/* Center Action Hover Icon (Appears on Hover) */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200">
              <div className={`w-12 h-12 rounded-full text-white flex items-center justify-center shadow-rd-modal transform scale-90 group-hover:scale-100 transition-transform ${
                mediaType === "audio"
                  ? "bg-emerald-500/90"
                  : mediaType === "post"
                  ? "bg-blue-500/90"
                  : mediaType === "story"
                  ? "bg-amber-500/90"
                  : "bg-brand-500/90"
              }`}>
                {mediaType === "audio" ? (
                  <Music2 className="w-5 h-5" />
                ) : mediaType === "post" ? (
                  reel.isCarousel ? <Layers className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />
                ) : mediaType === "story" ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                )}
              </div>
            </div>

            {/* Media Type & Metrics Badge */}
            <div className="absolute bottom-2.5 left-2.5 flex items-center space-x-2 z-10">
              <div className="flex items-center space-x-1 px-2 py-0.5 rounded-rd-sm bg-black/60 backdrop-blur-md text-white text-[10px] font-medium">
                {mediaType === "audio" ? (
                  <Music2 className="w-2.5 h-2.5 text-emerald-400" />
                ) : mediaType === "post" ? (
                  reel.isCarousel ? <Layers className="w-2.5 h-2.5 text-blue-400" /> : <ImageIcon className="w-2.5 h-2.5 text-blue-400" />
                ) : mediaType === "story" ? (
                  <Clock className="w-2.5 h-2.5 text-amber-400" />
                ) : (
                  <Play className="w-2.5 h-2.5 fill-white" />
                )}
                <span>{reel.duration}</span>
              </div>
              {reel.likes && (
                <div className="flex items-center space-x-1 px-2 py-0.5 rounded-rd-sm bg-black/60 backdrop-blur-md text-white text-[10px] font-medium">
                  <ThumbsUp className="w-2.5 h-2.5" />
                  <span>{reel.likes.replace(/likes/i, "").trim()}</span>
                </div>
              )}
            </div>

            {/* More Options Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="absolute top-10 right-2.5 p-1.5 rounded-full bg-black/50 backdrop-blur-md text-white/90 hover:text-white transition-colors cursor-pointer z-10 opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Context Menu Dropdown */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-10 left-2.5 z-30 w-48 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md shadow-rd-modal p-1 text-xs text-primaryText-light dark:text-primaryText-dark"
                >
                  <Link
                    href={`/reel/${reel.id}`}
                    className="flex items-center space-x-2 px-2.5 py-2 rounded-rd-sm hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-secondaryText-light dark:text-secondaryText-dark" />
                    <span>Open Detail Page</span>
                  </Link>
                  <a
                    href={reel.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-2 px-2.5 py-2 rounded-rd-sm hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-secondaryText-light dark:text-secondaryText-dark" />
                    <span>Open on Instagram</span>
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCollectionPickerOpen(!isCollectionPickerOpen);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-rd-sm hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark transition-colors text-left"
                  >
                    <span className="flex items-center space-x-2">
                      <FolderPlus className="w-3.5 h-3.5 text-secondaryText-light dark:text-secondaryText-dark" />
                      <span>Add to Collection</span>
                    </span>
                  </button>

                  {isCollectionPickerOpen && (
                    <div className="my-1 pl-4 border-l border-borderSubtle-light dark:border-borderSubtle-dark space-y-1">
                      {collections.map((col) => (
                        <button
                          key={col.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            addReelToCollection(reel.id, col.id);
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-2 py-1 text-[11px] hover:text-brand-500 transition-colors truncate"
                        >
                          {col.icon} {col.name}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-rd-sm hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark transition-colors text-left"
                  >
                    <Copy className="w-3.5 h-3.5 text-secondaryText-light dark:text-secondaryText-dark" />
                    <span>Copy Link</span>
                  </button>

                  <div className="my-1 border-t border-borderSubtle-light dark:border-borderSubtle-dark" />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteReel(reel.id);
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-rd-sm hover:bg-rose-500/10 text-rose-500 transition-colors text-left cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Reel</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Card Content Footer */}
          <div className="p-3 flex flex-col flex-1 justify-between space-y-2">
            <div>
              <div className="flex items-center space-x-2 min-w-0">
                <div className="w-5 h-5 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700/60 shrink-0 flex items-center justify-center">
                  <img
                    src={`/api/proxy-image?username=${encodeURIComponent(displayHandle)}`}
                    alt={displayHandle}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
                <span className="text-xs font-semibold text-primaryText-light dark:text-primaryText-dark truncate">
                  @{displayHandle}
                </span>
              </div>
              <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark line-clamp-2 mt-1.5 leading-relaxed">
                {displayCaption}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] border-t border-borderSubtle-light dark:border-borderSubtle-dark">
              <span className="px-2 py-0.5 rounded-full bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-secondaryText-light dark:text-secondaryText-dark font-medium text-[10px]">
                {reel.category}
              </span>
              <span className="text-mutedText-light dark:text-mutedText-dark font-mono text-[10px]">
                {reel.createdAt ? new Date(reel.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Today"}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
