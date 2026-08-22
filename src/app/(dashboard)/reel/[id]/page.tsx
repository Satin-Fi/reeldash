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
  Trash2,
  Copy,
  Edit2,
  Download,
  Loader2,
  Clock,
  Instagram,
  MessageCircle,
  ThumbsUp,
  RefreshCw,
  Play,
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
    refreshReelMetadata,
    smartCategories,
    collections,
    showToast,
  } = useReels();

  const reel = reels.find((r) => r.id === reelId);

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState(reel?.notes || "");
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isExpandedCaption, setIsExpandedCaption] = useState(false);
  const [downloadState, setDownloadState] = useState<"idle" | "processing" | "ready">("idle");
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleRequestDownload = () => {
    setDownloadState("processing");
    setTimeout(() => {
      setDownloadState("ready");
      showToast("Download ready — Click button to download MP4");
    }, 1500);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshReelMetadata(reel.id);
    setIsRefreshing(false);
  };

  const match = reel.instagramUrl.match(/(?:reel|p)\/([A-Za-z0-9_-]+)/);
  const shortcode = match ? match[1] : null;

  const imageSrc =
    reel.thumbnailUrl && !reel.thumbnailUrl.includes("unsplash.com")
      ? reel.thumbnailUrl
      : shortcode
      ? `/api/proxy-image?shortcode=${shortcode}`
      : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80";

  const videoSrc =
    reel.mediaUrl && !reel.mediaUrl.includes("googleapis.com")
      ? reel.mediaUrl
      : "https://vjs.zencdn.net/v/oceans.mp4";

  const downloadApiUrl = `/api/download?shortcode=${shortcode || ""}&reelUrl=${encodeURIComponent(reel.instagramUrl)}&url=${encodeURIComponent(reel.mediaUrl || "")}`;

  const creatorTitle = reel.creatorFullName || reel.creatorUsername;
  const creatorHandle = reel.creatorUsername;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Back Navigation & Refresh */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center space-x-2 text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to library</span>
        </button>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs text-secondaryText-light dark:text-secondaryText-dark hover:text-brand-500 border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-sm transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-brand-500" : ""}`} />
          <span>{isRefreshing ? "Syncing..." : "Refresh from Instagram"}</span>
        </button>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left: Clean Native Cover / HTML5 Video Player (NO IFRAME) */}
        <div className="md:col-span-5 flex justify-center">
          <div className="relative aspect-reel w-full max-w-xs md:max-w-none rounded-rd-card overflow-hidden bg-black border border-borderSubtle-light dark:border-borderSubtle-dark shadow-rd-card group">
            {isPlayingVideo ? (
              /* Native HTML5 Video Player - 100% Clean, No Iframe */
              <video
                src={videoSrc}
                poster={imageSrc}
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              /* Clean Real Thumbnail Cover with Click to Play */
              <div className="relative w-full h-full cursor-pointer" onClick={() => setIsPlayingVideo(true)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt={reel.caption}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                {/* Big Center Play Button */}
                <button
                  type="button"
                  aria-label="Play video"
                  className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-rd-modal hover:scale-110 active:scale-95 transition-all cursor-pointer z-10"
                >
                  <Play className="w-7 h-7 fill-white ml-1" />
                </button>

                {/* Duration Badge */}
                <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/60 backdrop-blur-md text-white text-xs font-medium">
                  {reel.duration}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Metadata & Detail Panel */}
        <div className="md:col-span-7 space-y-6">
          {/* Creator & Metrics Section */}
          <div className="p-4 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md shadow-rd-subtle space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-11 h-11 rounded-full bg-brand-500/20 text-brand-500 font-bold text-sm flex items-center justify-center shrink-0">
                  {creatorTitle[0]?.toUpperCase() || "I"}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark truncate">
                    {creatorTitle}
                  </h3>
                  <span className="text-xs text-secondaryText-light dark:text-secondaryText-dark">
                    @{creatorHandle}
                  </span>
                </div>
              </div>

              <a
                href={reel.creatorProfileUrl || `https://instagram.com/${creatorHandle}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-sm hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark transition-colors shrink-0"
              >
                <span>Instagram Profile</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Engagement Metrics (Likes & Comments from Instagram) */}
            {(reel.likes || reel.commentsCount) && (
              <div className="pt-2 border-t border-borderSubtle-light dark:border-borderSubtle-dark flex items-center space-x-4 text-xs text-secondaryText-light dark:text-secondaryText-dark">
                {reel.likes && (
                  <div className="flex items-center space-x-1.5 font-medium">
                    <ThumbsUp className="w-3.5 h-3.5 text-brand-500" />
                    <span>{reel.likes}</span>
                  </div>
                )}
                {reel.commentsCount && (
                  <div className="flex items-center space-x-1.5 font-medium">
                    <MessageCircle className="w-3.5 h-3.5 text-brand-500" />
                    <span>{reel.commentsCount}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Caption & Hashtags Section */}
          <div className="p-4 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md shadow-rd-subtle space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-mutedText-light dark:text-mutedText-dark">
              Caption
            </h4>
            <p
              className={`text-xs text-primaryText-light dark:text-primaryText-dark leading-relaxed whitespace-pre-line ${
                !isExpandedCaption && reel.caption.length > 200 ? "line-clamp-4" : ""
              }`}
            >
              {reel.caption}
            </p>
            {reel.caption.length > 200 && (
              <button
                onClick={() => setIsExpandedCaption(!isExpandedCaption)}
                className="text-[11px] font-medium text-brand-500 hover:underline cursor-pointer"
              >
                {isExpandedCaption ? "Show less" : "Show more"}
              </button>
            )}

            {/* Hashtags */}
            {reel.hashtags && reel.hashtags.length > 0 && (
              <div className="pt-2 border-t border-borderSubtle-light dark:border-borderSubtle-dark flex flex-wrap gap-1.5">
                {reel.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center space-x-0.5 text-[11px] font-mono text-brand-500 font-medium"
                  >
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* AI Summary Section */}
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

          {/* Categories & Collections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>
              )}
            </div>

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

          {/* TEMPORARY DOWNLOAD PROCESSING */}
          <div className="p-4 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md shadow-rd-subtle space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-primaryText-light dark:text-primaryText-dark">
                <Download className="w-4 h-4 text-brand-500" />
                <span>Temporary Download</span>
              </div>
            </div>

            {downloadState === "idle" && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondaryText-light dark:text-secondaryText-dark text-[11px]">
                  Request a temporary signed MP4 download link (expires in 15 mins).
                </span>
                <button
                  onClick={handleRequestDownload}
                  className="px-3 py-1.5 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark hover:border-brand-500 text-xs font-medium rounded-rd-sm transition-colors cursor-pointer shrink-0"
                >
                  Prepare Download
                </button>
              </div>
            )}

            {downloadState === "processing" && (
              <div className="flex items-center space-x-2 p-3 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark rounded-rd-sm text-xs text-secondaryText-light">
                <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
                <span>Preparing MP4 video stream...</span>
              </div>
            )}

            {downloadState === "ready" && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-rd-sm space-y-2 text-xs">
                <div className="flex items-center justify-between font-semibold text-emerald-600 dark:text-emerald-400">
                  <span>✓ Signed MP4 ready</span>
                  <span className="flex items-center space-x-1 text-[10px] font-mono">
                    <Clock className="w-3 h-3" />
                    <span>Expires in 15m</span>
                  </span>
                </div>
                <a
                  href={downloadApiUrl}
                  download={`reel_${shortcode || "video"}.mp4`}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-rd-sm text-xs font-semibold shadow-rd-subtle transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download MP4 Video</span>
                </a>
              </div>
            )}
          </div>

          {/* Personal Notes */}
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
