"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useReels } from "@/context/ReelContext";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  ExternalLink,
  Sparkles,
  Tag,
  FolderPlus,
  Trash2,
  Copy,
  Edit2,
  Check,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";

export default function ReelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reelId = params.id as string;

  const {
    reels,
    toggleFavorite,
    deleteReel,
    updateNote,
    updateCategory,
    generateAiSummary,
    smartCategories,
    collections,
    addReelToCollection,
    showToast,
  } = useReels();

  const reel = reels.find((r) => r.id === reelId);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState(reel?.notes || "");
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isExpandedCaption, setIsExpandedCaption] = useState(false);

  if (!reel) {
    return (
      <div className="p-12 text-center space-y-4">
        <h3 className="text-lg font-bold">Reel not found</h3>
        <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark">
          This Reel may have been deleted or moved.
        </p>
        <button
          onClick={() => router.push("/reels")}
          className="px-4 py-2 bg-brand-500 text-white rounded-rd-md text-xs font-medium cursor-pointer"
        >
          Return to All Reels
        </button>
      </div>
    );
  }

  const handleSaveNote = () => {
    updateNote(reel.id, noteContent);
    setIsEditingNote(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(reel.instagramUrl);
    showToast("Link copied to clipboard");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Back Navigation */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center space-x-2 text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to library</span>
      </button>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left: 7.1 Reel Video Player */}
        <div className="md:col-span-5 flex justify-center">
          <div className="relative aspect-reel w-full max-w-xs md:max-w-none rounded-rd-card overflow-hidden bg-black shadow-rd-card group">
            {reel.mediaUrl ? (
              <video
                src={reel.mediaUrl}
                poster={reel.thumbnailUrl}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <Image
                src={reel.thumbnailUrl}
                alt={reel.caption}
                fill
                className="object-cover"
              />
            )}

            {/* Video Controls Overlay */}
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-center justify-between text-white text-xs z-10">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              </button>
              <span className="font-mono text-[11px]">{reel.duration}</span>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Metadata & Detail Panel */}
        <div className="md:col-span-7 space-y-6">
          {/* 7.2 Creator Section */}
          <div className="flex items-center justify-between p-4 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md shadow-rd-subtle">
            <div className="flex items-center space-x-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-brand-500/10">
                {reel.creatorAvatar ? (
                  <Image src={reel.creatorAvatar} alt={reel.creatorUsername} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-xs">
                    {reel.creatorUsername[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark leading-tight">
                  @{reel.creatorUsername}
                </h3>
                <span className="text-[11px] text-secondaryText-light dark:text-secondaryText-dark">
                  Instagram Creator
                </span>
              </div>
            </div>

            <a
              href={reel.creatorProfileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-sm hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark transition-colors"
            >
              <span>View creator</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* 7.3 Caption Section */}
          <div className="p-4 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md shadow-rd-subtle space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-mutedText-light dark:text-mutedText-dark">
              Caption
            </h4>
            <p
              className={`text-xs text-primaryText-light dark:text-primaryText-dark leading-relaxed ${
                !isExpandedCaption && reel.caption.length > 150 ? "line-clamp-3" : ""
              }`}
            >
              {reel.caption}
            </p>
            {reel.caption.length > 150 && (
              <button
                onClick={() => setIsExpandedCaption(!isExpandedCaption)}
                className="text-[11px] font-medium text-brand-500 hover:underline cursor-pointer"
              >
                {isExpandedCaption ? "Show less" : "Show more"}
              </button>
            )}
          </div>

          {/* 7.4 AI Summary Section */}
          <div className="p-4 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md shadow-rd-subtle space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-primaryText-light dark:text-primaryText-dark">
                <Sparkles className="w-4 h-4 text-brand-500" />
                <span>AI Summary</span>
              </div>
              <button
                onClick={() => generateAiSummary(reel.id)}
                className="px-2.5 py-1 text-xs font-medium bg-brand-500/10 hover:bg-brand-500/20 text-brand-500 rounded-rd-sm transition-colors cursor-pointer"
              >
                {reel.aiSummary ? "Regenerate" : "Generate summary"}
              </button>
            </div>
            {reel.aiSummary ? (
              <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark leading-relaxed bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark p-3 rounded-rd-sm">
                {reel.aiSummary}
              </p>
            ) : (
              <p className="text-xs text-mutedText-light dark:text-mutedText-dark italic">
                No AI summary generated yet. Click above to extract key takeaways.
              </p>
            )}
          </div>

          {/* 7.5 Categories & Collections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Categories */}
            <div className="p-4 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md shadow-rd-subtle space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-mutedText-light dark:text-mutedText-dark uppercase tracking-wider">
                  Category
                </span>
                <button
                  onClick={() => setIsEditingCategory(!isEditingCategory)}
                  className="text-[11px] text-brand-500 hover:underline cursor-pointer"
                >
                  {isEditingCategory ? "Done" : "Edit"}
                </button>
              </div>

              {isEditingCategory ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {smartCategories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => {
                        updateCategory(reel.id, cat.name);
                        setIsEditingCategory(false);
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        reel.category === cat.name
                          ? "bg-brand-500 text-white"
                          : "bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-secondaryText-light"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-500 text-xs font-medium">
                    {reel.category}
                  </span>
                  {reel.subcategories?.map((sub) => (
                    <span
                      key={sub}
                      className="px-2.5 py-1 rounded-full bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-secondaryText-light dark:text-secondaryText-dark text-xs"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Collections */}
            <div className="p-4 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md shadow-rd-subtle space-y-2">
              <span className="text-xs font-semibold text-mutedText-light dark:text-mutedText-dark uppercase tracking-wider">
                Collections
              </span>
              <div className="flex flex-wrap gap-1.5">
                {reel.collections.length > 0 ? (
                  reel.collections.map((colId) => {
                    const col = collections.find((c) => c.id === colId);
                    return (
                      <span
                        key={colId}
                        className="px-2.5 py-1 rounded-full bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-secondaryText-light text-xs font-medium"
                      >
                        {col?.icon || "📁"} {col?.name || "Collection"}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-mutedText-light dark:text-mutedText-dark italic">
                    Not in any collection
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 7.6 Notes Section */}
          <div className="p-4 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md shadow-rd-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-mutedText-light dark:text-mutedText-dark uppercase tracking-wider">
                Personal Notes
              </span>
              {!isEditingNote && (
                <button
                  onClick={() => setIsEditingNote(true)}
                  className="flex items-center space-x-1 text-[11px] text-brand-500 hover:underline cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Note</span>
                </button>
              )}
            </div>

            {isEditingNote ? (
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder='e.g. "Try this workout on Monday."'
                  className="w-full p-2.5 bg-background-light dark:bg-background-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md text-xs text-primaryText-light dark:text-primaryText-dark focus:outline-none focus:border-brand-500 resize-none"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setIsEditingNote(false)}
                    className="px-3 py-1 text-xs text-secondaryText-light"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNote}
                    className="px-3 py-1 bg-brand-500 text-white rounded-rd-sm text-xs font-medium"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark italic">
                {reel.notes ? `"${reel.notes}"` : "No notes attached yet."}
              </p>
            )}
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between p-4 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md shadow-rd-subtle">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => toggleFavorite(reel.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-rd-sm text-xs font-medium transition-colors cursor-pointer ${
                  reel.isFavorite
                    ? "bg-rose-500/10 text-rose-500 font-semibold"
                    : "bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-secondaryText-light"
                }`}
              >
                <Heart className={`w-4 h-4 ${reel.isFavorite ? "fill-rose-500" : ""}`} />
                <span>{reel.isFavorite ? "Favorited" : "Favorite"}</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-rd-sm bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-secondaryText-light text-xs font-medium hover:text-primaryText-light transition-colors cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Link</span>
              </button>
            </div>

            <button
              onClick={() => {
                deleteReel(reel.id);
                router.push("/reels");
              }}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-rd-sm bg-rose-500/10 text-rose-500 text-xs font-medium hover:bg-rose-500/20 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Remove Reel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
