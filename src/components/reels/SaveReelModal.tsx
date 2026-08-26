"use client";

import React, { useState, useEffect } from "react";
import { useReels } from "@/context/ReelContext";
import { MediaType } from "@/types/reel";
import {
  X,
  Link2,
  Sparkles,
  User,
  FileText,
  Music2,
  Film,
  Image as ImageIcon,
  Clock,
  Loader2,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function SaveReelModal() {
  const { isSaveModalOpen, setIsSaveModalOpen, saveReel } = useReels();
  const [selectedType, setSelectedType] = useState<MediaType | "auto">("auto");
  const [url, setUrl] = useState("");
  const [creator, setCreator] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("General");
  const [audioTitle, setAudioTitle] = useState("");
  const [audioArtist, setAudioArtist] = useState("");
  const [detectedType, setDetectedType] = useState<MediaType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-detect media type and extract info on URL change
  useEffect(() => {
    if (!url.trim()) {
      setDetectedType(null);
      return;
    }

    const clean = url.toLowerCase();
    let detected: MediaType = "reel";
    if (clean.includes("/audio/") || clean.includes("/reels/audio/")) {
      detected = "audio";
    } else if (clean.includes("/stories/")) {
      detected = "story";
    } else if (clean.includes("/p/")) {
      detected = "post";
    } else if (clean.includes("/reel/") || clean.includes("/reels/")) {
      detected = "reel";
    }
    setDetectedType(detected);

    if (!url.includes("instagram.com/") && !url.includes("instagr.am/")) return;

    const timer = setTimeout(async () => {
      setIsAnalyzing(true);

      const userMatch = url.match(/instagram\.com\/([A-Za-z0-9_.]+)\/(?:reel|reels|p|stories)\//);
      if (userMatch && userMatch[1] && !["reel", "p", "stories", "audio"].includes(userMatch[1])) {
        setCreator(userMatch[1]);
      }

      try {
        const res = await fetch("/api/reel-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (data.creatorUsername && data.creatorUsername !== "instagram_creator") {
          setCreator(data.creatorUsername);
        }
        if (data.caption && !data.caption.includes("Instagram Reel (")) {
          setCaption(data.caption);
        }
        if (data.category) {
          setCategory(data.category);
        }
        if (data.audioTitle) {
          setAudioTitle(data.audioTitle);
        }
        if (data.audioArtist) {
          setAudioArtist(data.audioArtist);
        }
        if (data.mediaType) {
          setDetectedType(data.mediaType);
        }
      } catch (err) {
        console.warn("Client metadata fetch notice:", err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [url]);

  if (!isSaveModalOpen) return null;

  const currentEffectiveType: MediaType =
    selectedType === "auto" ? (detectedType || "reel") : selectedType;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setIsSubmitting(true);
    await saveReel(url.trim(), {
      creator: creator.trim() || undefined,
      caption: caption.trim() || undefined,
      category: category.trim() || undefined,
      mediaType: currentEffectiveType,
      audioTitle: audioTitle.trim() || undefined,
      audioArtist: audioArtist.trim() || undefined,
    });
    setUrl("");
    setCreator("");
    setCaption("");
    setAudioTitle("");
    setAudioArtist("");
    setCategory("General");
    setSelectedType("auto");
    setDetectedType(null);
    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsSaveModalOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Dialog Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg p-6 shadow-rd-modal text-primaryText-light dark:text-primaryText-dark max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold tracking-tight">Save Instagram Content</h3>
              <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark mt-0.5">
                Save and organize Reels, Posts, Songs/Audio tracks, and Stories with real metadata.
              </p>
            </div>
            <button
              onClick={() => setIsSaveModalOpen(false)}
              className="p-1.5 text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark rounded-rd-sm transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Real Live Link Quick Fill Presets */}
          <div className="mb-4 p-3 bg-brand-500/5 border border-brand-500/20 rounded-rd-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Example Live Links (Click to test extraction)</span>
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedType("reel");
                  setUrl("https://www.instagram.com/reel/C89210382/");
                }}
                className="px-2 py-1.5 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark hover:border-purple-500 text-[11px] font-medium rounded-rd-sm flex items-center justify-center space-x-1 transition-all cursor-pointer"
              >
                <Film className="w-3 h-3 text-purple-500" />
                <span>Reel URL</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedType("post");
                  setUrl("https://www.instagram.com/p/C998877665/");
                }}
                className="px-2 py-1.5 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark hover:border-blue-500 text-[11px] font-medium rounded-rd-sm flex items-center justify-center space-x-1 transition-all cursor-pointer"
              >
                <ImageIcon className="w-3 h-3 text-blue-500" />
                <span>Post URL</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedType("audio");
                  setUrl("https://www.instagram.com/reels/audio/7819203912/");
                }}
                className="px-2 py-1.5 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark hover:border-emerald-500 text-[11px] font-medium rounded-rd-sm flex items-center justify-center space-x-1 transition-all cursor-pointer"
              >
                <Music2 className="w-3 h-3 text-emerald-500" />
                <span>Song URL</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedType("story");
                  setUrl("https://www.instagram.com/stories/sam_altman/32891029384/");
                }}
                className="px-2 py-1.5 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark hover:border-amber-500 text-[11px] font-medium rounded-rd-sm flex items-center justify-center space-x-1 transition-all cursor-pointer"
              >
                <Clock className="w-3 h-3 text-amber-500" />
                <span>Story URL</span>
              </button>
            </div>
          </div>

          {/* Media Type Selector Tabs */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-secondaryText-light dark:text-secondaryText-dark mb-1.5 uppercase tracking-wider">
              Content Type
            </label>
            <div className="grid grid-cols-5 gap-1 p-1 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark rounded-rd-md border border-borderSubtle-light dark:border-borderSubtle-dark text-xs">
              <button
                type="button"
                onClick={() => setSelectedType("auto")}
                className={`py-1.5 px-2 rounded-rd-sm font-medium transition-all text-center cursor-pointer ${
                  selectedType === "auto"
                    ? "bg-surface-light dark:bg-surface-dark text-brand-500 shadow-sm font-bold"
                    : "text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light"
                }`}
              >
                ⚡ Auto
              </button>
              <button
                type="button"
                onClick={() => setSelectedType("reel")}
                className={`py-1.5 px-2 rounded-rd-sm font-medium transition-all text-center cursor-pointer ${
                  selectedType === "reel"
                    ? "bg-surface-light dark:bg-surface-dark text-purple-500 shadow-sm font-bold"
                    : "text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light"
                }`}
              >
                🎬 Reel
              </button>
              <button
                type="button"
                onClick={() => setSelectedType("post")}
                className={`py-1.5 px-2 rounded-rd-sm font-medium transition-all text-center cursor-pointer ${
                  selectedType === "post"
                    ? "bg-surface-light dark:bg-surface-dark text-blue-500 shadow-sm font-bold"
                    : "text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light"
                }`}
              >
                📸 Post
              </button>
              <button
                type="button"
                onClick={() => setSelectedType("audio")}
                className={`py-1.5 px-2 rounded-rd-sm font-medium transition-all text-center cursor-pointer ${
                  selectedType === "audio"
                    ? "bg-surface-light dark:bg-surface-dark text-emerald-500 shadow-sm font-bold"
                    : "text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light"
                }`}
              >
                🎵 Song
              </button>
              <button
                type="button"
                onClick={() => setSelectedType("story")}
                className={`py-1.5 px-2 rounded-rd-sm font-medium transition-all text-center cursor-pointer ${
                  selectedType === "story"
                    ? "bg-surface-light dark:bg-surface-dark text-amber-500 shadow-sm font-bold"
                    : "text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light"
                }`}
              >
                ⏱️ Story
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark">
                  Instagram Link
                </label>
                {detectedType && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/10 text-brand-500 border border-brand-500/20">
                    Detected: {detectedType === "audio" ? "🎵 Song / Audio" : detectedType === "post" ? "📸 Post" : detectedType === "story" ? "⏱️ Story" : "🎬 Reel"}
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <Link2 className="absolute left-3 w-4 h-4 text-mutedText-light dark:text-mutedText-dark" />
                <input
                  type="url"
                  placeholder="Paste https://instagram.com/reel/..., /p/..., /audio/..., or /stories/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  autoFocus
                  className="w-full pl-9 pr-4 py-2.5 bg-background-light dark:bg-background-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md text-xs sm:text-sm text-primaryText-light dark:text-primaryText-dark focus:outline-none focus:border-brand-500 transition-colors"
                />
                {isAnalyzing && (
                  <Loader2 className="absolute right-3 w-4 h-4 text-brand-500 animate-spin" />
                )}
              </div>
            </div>

            {/* Song Specific Fields */}
            {currentEffectiveType === "audio" && (
              <div className="p-3 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md space-y-2.5">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-500">
                  <Music2 className="w-3.5 h-3.5" />
                  <span>Audio & Song Track Information</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-secondaryText-light dark:text-secondaryText-dark mb-1">
                      Track / Song Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Midnight City Vibes"
                      value={audioTitle}
                      onChange={(e) => setAudioTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-background-light dark:bg-background-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-sm text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-secondaryText-light dark:text-secondaryText-dark mb-1">
                      Artist / Creator
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Synthwave Records"
                      value={audioArtist}
                      onChange={(e) => setAudioArtist(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-background-light dark:bg-background-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-sm text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Auto-extracted editable details */}
            <div className="space-y-3 pt-2 border-t border-borderSubtle-light dark:border-borderSubtle-dark">
              <div>
                <label className="block text-[11px] font-medium text-secondaryText-light dark:text-secondaryText-dark mb-1">
                  Creator Username
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-2.5 w-3.5 h-3.5 text-mutedText-light" />
                  <input
                    type="text"
                    placeholder="e.g. hubermanlab, aliabdaal, sama"
                    value={creator}
                    onChange={(e) => setCreator(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-background-light dark:bg-background-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-sm text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-secondaryText-light dark:text-secondaryText-dark mb-1">
                  Caption / Title
                </label>
                <div className="relative flex items-center">
                  <FileText className="absolute left-2.5 w-3.5 h-3.5 text-mutedText-light" />
                  <input
                    type="text"
                    placeholder="Brief description or takeaways..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-background-light dark:bg-background-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-sm text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark rounded-rd-md text-xs text-secondaryText-light dark:text-secondaryText-dark">
              <Sparkles className="w-4 h-4 text-brand-500 shrink-0" />
              <span>Smart auto-categorization and AI keyword indexing enabled for all media types.</span>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark rounded-rd-md transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold bg-brand-500 hover:bg-brand-600 active:scale-95 text-white rounded-rd-md transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>
                    Save {currentEffectiveType === "audio" ? "Song" : currentEffectiveType === "post" ? "Post" : currentEffectiveType === "story" ? "Story" : "Reel"}
                  </span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
