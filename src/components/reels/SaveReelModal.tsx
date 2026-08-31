"use client";

import React, { useState, useEffect } from "react";
import { useReels } from "@/context/ReelContext";
import { MediaType } from "@/types/reel";
import { X, Link2, Loader2, Music2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function SaveReelModal() {
  const { isSaveModalOpen, setIsSaveModalOpen, saveReel } = useReels();
  const [url, setUrl] = useState("");
  const [creator, setCreator] = useState("");
  const [caption, setCaption] = useState("");
  const [audioTitle, setAudioTitle] = useState("");
  const [audioArtist, setAudioArtist] = useState("");
  const [category, setCategory] = useState("");
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
        if (data.category && !category) {
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

  const currentEffectiveType: MediaType = detectedType || "reel";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await saveReel(url.trim(), {
        creator: creator.trim() || undefined,
        caption: caption.trim() || undefined,
        category: category.trim() || undefined,
        mediaType: currentEffectiveType,
        audioTitle: audioTitle.trim() || (currentEffectiveType === "audio" ? "Original audio" : undefined),
        audioArtist: audioArtist.trim() || (currentEffectiveType === "audio" ? (creator.trim() || undefined) : undefined),
      });
      setUrl("");
      setCreator("");
      setCaption("");
      setCategory("");
      setAudioTitle("");
      setAudioArtist("");
      setDetectedType(null);
      setIsSaveModalOpen(false);
    } catch {
      // Handled in context toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMediaLabel = (type: MediaType) => {
    switch (type) {
      case "audio":
        return "Audio Track";
      case "post":
        return "Post";
      case "story":
        return "Story";
      default:
        return "Reel";
    }
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
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Dialog Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="relative w-full max-w-lg bg-[#111419] border border-white/[0.08] rounded-xl p-6 shadow-2xl text-white overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">Save to Library</h3>
              <p className="text-xs text-[#8E93A2] mt-0.5">
                Save Instagram Reels, Posts, Carousels, Audio, and Stories.
              </p>
            </div>
            <button
              onClick={() => setIsSaveModalOpen(false)}
              className="p-1.5 text-[#8E93A2] hover:text-white hover:bg-white/[0.06] rounded-md transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Main Link Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-medium uppercase tracking-wider text-[#8E93A2]">
                  Instagram Link
                </label>
                {detectedType && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/[0.06] text-[#A0A5B5] border border-white/[0.08] tracking-wide">
                    {getMediaLabel(detectedType)}
                  </span>
                )}
              </div>

              <div className="relative flex items-center">
                <Link2 className="absolute left-3.5 w-4 h-4 text-[#777C89]" />
                <input
                  type="text"
                  placeholder="https://www.instagram.com/reel/... or /yoga, /fitness"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  autoFocus
                  className="w-full pl-10 pr-10 py-2.5 bg-[#0B0D10] border border-white/[0.08] hover:border-white/[0.12] focus:border-[#5B52E8] rounded-lg text-sm text-white placeholder-[#5A5F6E] focus:outline-none transition-colors"
                />
                {isAnalyzing ? (
                  <Loader2 className="absolute right-3.5 w-4 h-4 text-[#5B52E8] animate-spin" />
                ) : url ? (
                  <button
                    type="button"
                    onClick={() => {
                      setUrl("");
                      setDetectedType(null);
                      setCreator("");
                      setCaption("");
                      setCategory("");
                      setAudioTitle("");
                      setAudioArtist("");
                    }}
                    className="absolute right-3.5 text-[#777C89] hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>
            </div>

            {/* Optional Category Field */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#8E93A2] mb-1.5">
                Category <span className="text-[10px] lowercase font-normal text-[#5A5F6E]">(e.g. Yoga, Fitness, SaaS)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Yoga, Fitness, AI, SaaS"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#0B0D10] border border-white/[0.08] hover:border-white/[0.12] focus:border-[#5B52E8] rounded-lg text-sm text-white placeholder-[#5A5F6E] focus:outline-none transition-colors"
              />
            </div>

            {/* Audio Details (Only for Audio links) */}
            {currentEffectiveType === "audio" && (
              <div className="p-3.5 bg-[#0B0D10] border border-white/[0.06] rounded-lg space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#8E93A2]">
                  <Music2 className="w-3.5 h-3.5 text-[#5B52E8]" />
                  <span>Audio Track Details</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#777C89] mb-1">
                      Track Title
                    </label>
                    <input
                      type="text"
                      placeholder="Original Audio"
                      value={audioTitle}
                      onChange={(e) => setAudioTitle(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#111419] border border-white/[0.08] rounded-md text-xs text-white placeholder-[#5A5F6E] focus:outline-none focus:border-[#5B52E8]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#777C89] mb-1">
                      Artist
                    </label>
                    <input
                      type="text"
                      placeholder="Artist name"
                      value={audioArtist}
                      onChange={(e) => setAudioArtist(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#111419] border border-white/[0.08] rounded-md text-xs text-white placeholder-[#5A5F6E] focus:outline-none focus:border-[#5B52E8]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-[#8E93A2] hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!url.trim() || isSubmitting}
                className="px-4 py-2 text-xs font-semibold bg-[#5B52E8] hover:bg-[#4E45D6] active:scale-[0.98] text-white rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <span>Save Link</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
