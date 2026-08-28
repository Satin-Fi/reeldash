"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useReels } from "@/context/ReelContext";
import { ReelPlayer } from "@/components/reels/ReelPlayer";
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
  Instagram,
  MessageCircle,
  ThumbsUp,
  RefreshCw,
  BadgeCheck,
  Music2,
  Bookmark,
  Send,
  MoreHorizontal,
  FolderPlus,
} from "lucide-react";
import Link from "next/link";

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
    addReelToCollection,
    showToast,
  } = useReels();

  const reel = reels.find((r) => r.id === reelId);

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState(reel?.notes || "");
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isCollectionPickerOpen, setIsCollectionPickerOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [downloadState, setDownloadState] = useState<"idle" | "processing">("idle");
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
    showToast("Personal note saved");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(reel.instagramUrl);
    showToast("Reel link copied to clipboard");
  };

  const mediaType = reel.mediaType || (reel.instagramUrl.includes("/audio/") ? "audio" : reel.instagramUrl.includes("/stories/") ? "story" : reel.instagramUrl.includes("/p/") ? "post" : "reel");

  const handleDownload = () => {
    setDownloadState("processing");
    const match = reel.instagramUrl.match(/(?:reel|reels|p|audio|stories)\/([A-Za-z0-9_-]+)/);
    const shortcode = match ? match[1] : reel.id.replace(/^(reel|audio|post|story)-/, "");
    const ext = mediaType === "audio" ? "mp3" : mediaType === "post" ? "jpg" : "mp4";
    const downloadUrl = `/api/download?shortcode=${shortcode}&type=${mediaType === "audio" ? "audio" : mediaType === "post" ? "image" : "video"}&reelUrl=${encodeURIComponent(reel.instagramUrl)}`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `instagram_${mediaType}_${shortcode}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => {
      setDownloadState("idle");
      showToast(`Downloading ${mediaType.toUpperCase()} file...`);
    }, 1200);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshReelMetadata(reel.id);
    setIsRefreshing(false);
    showToast("Metadata refreshed from Instagram");
  };

  const shortcodeMatch = reel.instagramUrl.match(/(?:reel|reels|p|audio|stories)\/([A-Za-z0-9_-]+)/);
  const shortcode = shortcodeMatch ? shortcodeMatch[1] : reel.id.replace(/^(reel|audio|post|story)-/, "");
  const creatorHandle = reel.creatorUsername || "creator";

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
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Top Back Navigation & Refresh Bar */}
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
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs text-secondaryText-light dark:text-secondaryText-dark hover:text-brand-500 border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-sm transition-colors cursor-pointer bg-surface-light dark:bg-surface-dark shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-brand-500" : ""}`} />
          <span>{isRefreshing ? "Syncing..." : "Refresh from Instagram"}</span>
        </button>
      </div>

      {/* Main Split Layout matching Instagram Post/Reel Dialog UI */}
      <div className="w-full bg-black text-white rounded-xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col lg:flex-row h-auto lg:h-[750px]">
        {/* LEFT COLUMN: 9:16 Vertical Video Player (Embed Iframe or HTML5) */}
        <div className="w-full lg:w-[50%] h-[500px] lg:h-full bg-black flex items-center justify-center relative overflow-hidden border-b lg:border-b-0 lg:border-r border-zinc-800 shrink-0">
          <ReelPlayer
            reel={reel}
            autoPlay={true}
            className="w-full h-full rounded-none border-0 shadow-none"
          />
        </div>

        {/* RIGHT COLUMN: Instagram Post Social & Management Sidebar */}
        <div className="w-full lg:w-[50%] h-full flex flex-col bg-zinc-950 text-zinc-100 min-w-0">
          {/* 1. TOP CREATOR HEADER */}
          <div className="p-4 flex items-center justify-between border-b border-zinc-800/80 shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              {/* Creator Avatar with clean border */}
              <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-900 border border-zinc-700/80 shrink-0 flex items-center justify-center">
                <img
                  src={
                    reel.creatorAvatar?.startsWith("http")
                      ? `/api/proxy-image?url=${encodeURIComponent(reel.creatorAvatar)}`
                      : reel.creatorAvatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          creatorHandle
                        )}&background=27272a&color=fff`
                  }
                  alt={creatorHandle}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center space-x-1.5 min-w-0">
                  <Link
                    href={`/creator/${creatorHandle}`}
                    className="text-xs font-bold hover:text-brand-400 truncate text-white transition-colors"
                  >
                    @{creatorHandle}
                  </Link>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {mediaType.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Actions Menu */}
            <div className="flex items-center space-x-1">
              <button
                onClick={handleCopyLink}
                className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Copy Link"
              >
                <Copy className="w-4 h-4" />
              </button>
              <a
                href={reel.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
                title="Open on Instagram"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={() => {
                  deleteReel(reel.id);
                  router.push("/reels");
                }}
                className="p-2 text-zinc-400 hover:text-red-400 rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Delete Reel"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. MIDDLE SCROLLABLE FEED: Caption, Audio, Tags, Notes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-normal leading-relaxed custom-scrollbar">
            {/* Caption Content */}
            <div className="space-y-2">
              <p className="text-xs text-zinc-200 whitespace-pre-line leading-relaxed">
                {formatCaption(reel.caption || "No caption provided.")}
              </p>

              {/* Audio Tag (if present) */}
              {reel.audioTitle && (
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[11px] text-emerald-400">
                  <Music2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="font-semibold truncate">
                    {reel.audioTitle} {reel.audioArtist ? `• ${reel.audioArtist}` : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Engagement & Metadata Breakdown */}
            <div className="pt-3 border-t border-zinc-800/60 space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <div className="flex items-center space-x-3">
                  {reel.likes && (
                    <span className="flex items-center space-x-1 text-zinc-300 font-semibold">
                      <ThumbsUp className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{reel.likes}</span>
                    </span>
                  )}
                  {reel.commentsCount && (
                    <span className="flex items-center space-x-1 text-zinc-300">
                      <MessageCircle className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{reel.commentsCount} comments</span>
                    </span>
                  )}
                </div>
              </div>

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

            {/* AI Key Insights Card */}
            <div className="p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-lg space-y-2">
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

            {/* Category & Collection Tagging */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Category
                  </span>
                  <button
                    onClick={() => setIsEditingCategory(!isEditingCategory)}
                    className="text-[10px] text-brand-400 hover:underline cursor-pointer"
                  >
                    {isEditingCategory ? "Done" : "Change"}
                  </button>
                </div>
                {isEditingCategory ? (
                  <select
                    value={reel.category}
                    onChange={(e) => {
                      updateCategory(reel.id, e.target.value);
                      setIsEditingCategory(false);
                    }}
                    className="w-full p-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white"
                  >
                    {smartCategories.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="inline-block px-2 py-0.5 rounded bg-brand-500/20 text-brand-400 text-xs font-medium">
                    {reel.category}
                  </span>
                )}
              </div>

              <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-1.5 relative">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Collection
                </span>
                <button
                  onClick={() => setIsCollectionPickerOpen(!isCollectionPickerOpen)}
                  className="w-full text-left px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-200 hover:text-white truncate cursor-pointer flex items-center justify-between"
                >
                  <span>
                    {reel.collections && reel.collections.length > 0
                      ? collections.find((c) => c.id === reel.collections[0])?.name || "Assigned"
                      : "Add to..."}
                  </span>
                  <FolderPlus className="w-3 h-3 text-zinc-400" />
                </button>

                {isCollectionPickerOpen && (
                  <div className="absolute left-0 bottom-full mb-1 w-full bg-zinc-900 border border-zinc-800 rounded shadow-xl py-1 z-30 text-xs max-h-36 overflow-y-auto">
                    {collections.map((col) => (
                      <button
                        key={col.id}
                        onClick={() => {
                          addReelToCollection(reel.id, col.id);
                          setIsCollectionPickerOpen(false);
                          showToast(`Added to ${col.name}`);
                        }}
                        className="w-full text-left px-2.5 py-1 text-zinc-300 hover:text-white hover:bg-zinc-800 truncate"
                      >
                        {col.icon} {col.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Personal Notes */}
            <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-2">
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
                    placeholder="Add personal notes or key takeaways..."
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

          {/* 3. BOTTOM CLEAN LIBRARY ACTION BAR (Zero fake social buttons) */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950 shrink-0 space-y-2.5">
            <div className="flex items-center gap-2">
              {/* Favorite Toggle Button */}
              <button
                onClick={() => {
                  toggleFavorite(reel.id);
                  showToast(reel.isFavorite ? "Removed from Favorites" : "Added to Favorites");
                }}
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
                className="flex-1 py-2.5 px-4 bg-brand-500 hover:bg-brand-600 active:scale-98 text-white rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-sm cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Add to Collection</span>
              </button>

              {/* Copy Link Button */}
              <button
                onClick={handleCopyLink}
                className="p-2.5 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition-all cursor-pointer"
                title="Copy Link"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            {/* Collection Picker Dropdown */}
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
      </div>
    </div>
  );
}
