"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Reel } from "@/types/reel";
import { useReels } from "@/context/ReelContext";
import { Heart, Play, MoreVertical, ExternalLink, Trash2, FolderPlus, Copy, FileText, MessageCircle, ThumbsUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ReelCardProps {
  reel: Reel;
  viewMode?: "grid" | "compact";
}

export function ReelCard({ reel, viewMode = "grid" }: ReelCardProps) {
  const { toggleFavorite, deleteReel, collections, addReelToCollection, showToast } = useReels();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollectionPickerOpen, setIsCollectionPickerOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Shortcode extraction
  const shortcodeMatch = reel.instagramUrl.match(/(?:reel|p)\/([A-Za-z0-9_-]+)/);
  const shortcode = shortcodeMatch ? shortcodeMatch[1] : null;

  // Clean thumbnail image source via our proxy endpoint
  const imageSrc =
    !imageError && reel.thumbnailUrl && !reel.thumbnailUrl.includes("unsplash.com")
      ? reel.thumbnailUrl
      : shortcode
      ? `/api/proxy-image?shortcode=${shortcode}`
      : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80";

  const displayCreator = reel.creatorFullName || reel.creatorUsername || (shortcode ? `reels_${shortcode.substring(0, 6)}` : "creator");
  const displayHandle = reel.creatorUsername || "creator";
  const displayCaption = reel.caption || `Instagram Reel (${shortcode || "video"})`;

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

  if (viewMode === "compact") {
    return (
      <div className="group relative flex items-center justify-between p-3.5 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md hover:border-brand-500/30 transition-all duration-200 shadow-rd-subtle">
        <div className="flex items-center space-x-3 min-w-0">
          <Link
            href={`/reel/${reel.id}`}
            className="relative w-12 h-16 rounded-rd-sm overflow-hidden shrink-0 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark flex items-center justify-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt={displayCaption}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
          </Link>
          <div className="min-w-0">
            <Link href={`/reel/${reel.id}`} className="hover:underline">
              <p className="text-xs font-semibold text-primaryText-light dark:text-primaryText-dark truncate">
                {displayCreator} <span className="text-mutedText-light dark:text-mutedText-dark font-normal">(@{displayHandle})</span>
              </p>
              <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark truncate max-w-md mt-0.5">
                {displayCaption}
              </p>
            </Link>
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
            onClick={() => deleteReel(reel.id)}
            className="p-1.5 text-mutedText-light dark:text-mutedText-dark hover:text-rose-500 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-card overflow-hidden shadow-rd-subtle hover:-translate-y-0.5 transition-all duration-200">
      {/* 9:16 REAL Clean Image Thumbnail Container (NO IFRAME) */}
      <div className="relative aspect-reel w-full overflow-hidden bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark">
        <Link href={`/reel/${reel.id}`} className="block w-full h-full relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={displayCaption}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
        </Link>

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

        {/* Play Icon & Metrics Badge */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center space-x-2 z-10">
          <div className="flex items-center space-x-1 px-2 py-0.5 rounded-rd-sm bg-black/60 backdrop-blur-md text-white text-[10px] font-medium">
            <Play className="w-2.5 h-2.5 fill-white" />
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
          className="absolute top-2.5 left-2.5 p-1.5 rounded-full bg-black/50 backdrop-blur-md text-white/90 hover:text-white transition-colors cursor-pointer z-10 opacity-0 group-hover:opacity-100"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {/* Hover Quick Action Bar */}
        <div className="absolute bottom-10 inset-x-2 flex items-center justify-center space-x-2 p-1.5 rounded-rd-md bg-black/75 backdrop-blur-md text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <Link
            href={`/reel/${reel.id}`}
            className="px-3 py-1 rounded bg-white/20 hover:bg-white/30 font-medium transition-colors"
          >
            Open Reel
          </Link>
          <button
            onClick={handleCopyLink}
            className="px-3 py-1 rounded bg-white/20 hover:bg-white/30 font-medium transition-colors cursor-pointer"
          >
            Copy
          </button>
        </div>

        {/* Context Menu Dropdown */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
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
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-rd-sm hover:bg-rose-500/10 text-rose-500 transition-colors text-left font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Reel</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Card Info Section */}
      <div className="p-3 flex flex-col justify-between flex-1 space-y-2">
        <div>
          <Link href={`/reel/${reel.id}`} className="group-hover:text-brand-500 transition-colors">
            <p className="text-xs font-semibold text-primaryText-light dark:text-primaryText-dark truncate">
              {displayCreator}
            </p>
            <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark line-clamp-2 mt-0.5 leading-normal">
              {displayCaption}
            </p>
          </Link>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-borderSubtle-light/50 dark:border-borderSubtle-dark/50 text-[11px]">
          <span className="px-2 py-0.5 rounded-full bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark font-medium text-secondaryText-light dark:text-secondaryText-dark">
            {reel.category}
          </span>
          <span className="text-mutedText-light dark:text-mutedText-dark font-mono text-[10px]">
            {new Date(reel.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        </div>
      </div>
    </div>
  );
}
