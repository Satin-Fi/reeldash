"use client";

import React, { useState, useEffect } from "react";
import { useReels } from "@/context/ReelContext";
import { X, Link2, Sparkles, User, FileText, Tag, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function SaveReelModal() {
  const { isSaveModalOpen, setIsSaveModalOpen, saveReel, smartCategories } = useReels();
  const [url, setUrl] = useState("");
  const [creator, setCreator] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("General");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fetch metadata whenever URL changes
  useEffect(() => {
    if (!url.includes("instagram.com/") && !url.includes("instagr.am/")) return;

    const timer = setTimeout(async () => {
      setIsAnalyzing(true);

      // Parse shortcode / creator handle directly from URL path
      const userMatch = url.match(/instagram\.com\/([A-Za-z0-9_.]+)\/(?:reel|p)\//);
      if (userMatch && userMatch[1] && userMatch[1] !== "reel" && userMatch[1] !== "p") {
        setCreator(userMatch[1]);
      }

      // Try fetching via /api/reel-info
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
      } catch (err) {
        console.warn("Client metadata fetch notice:", err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [url]);

  if (!isSaveModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setIsSubmitting(true);
    await saveReel(url.trim());
    setUrl("");
    setCreator("");
    setCaption("");
    setCategory("General");
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
          className="absolute inset-0 bg-black/40 backdrop-blur-xs"
        />

        {/* Dialog Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg p-6 shadow-rd-modal text-primaryText-light dark:text-primaryText-dark"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">Save a Reel</h3>
              <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark mt-0.5">
                Paste any Instagram Reel URL to automatically organize it.
              </p>
            </div>
            <button
              onClick={() => setIsSaveModalOpen(false)}
              className="p-1.5 text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark rounded-rd-sm transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark mb-1.5">
                Instagram Reel URL
              </label>
              <div className="relative flex items-center">
                <Link2 className="absolute left-3 w-4 h-4 text-mutedText-light dark:text-mutedText-dark" />
                <input
                  type="url"
                  placeholder="https://instagram.com/reel/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  autoFocus
                  className="w-full pl-9 pr-4 py-2.5 bg-background-light dark:bg-background-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md text-sm text-primaryText-light dark:text-primaryText-dark focus:outline-none focus:border-brand-500 transition-colors"
                />
                {isAnalyzing && (
                  <Loader2 className="absolute right-3 w-4 h-4 text-brand-500 animate-spin" />
                )}
              </div>
            </div>

            {/* Auto-extracted editable details */}
            <div className="space-y-3 pt-2 border-t border-borderSubtle-light dark:border-borderSubtle-dark">
              <div>
                <label className="block text-[11px] font-medium text-secondaryText-light mb-1">
                  Creator Handle
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-2.5 w-3.5 h-3.5 text-mutedText-light" />
                  <input
                    type="text"
                    placeholder="e.g. hubermanlab, aliabdaal"
                    value={creator}
                    onChange={(e) => setCreator(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-background-light dark:bg-background-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-sm text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-secondaryText-light mb-1">
                  Caption / Title
                </label>
                <div className="relative flex items-center">
                  <FileText className="absolute left-2.5 w-3.5 h-3.5 text-mutedText-light" />
                  <input
                    type="text"
                    placeholder="Brief description of Reel content..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-background-light dark:bg-background-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-sm text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark rounded-rd-md text-xs text-secondaryText-light dark:text-secondaryText-dark">
              <Sparkles className="w-4 h-4 text-brand-500 shrink-0" />
              <span>AI automatically predicts categories and indexes for smart search.</span>
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
                className="px-4 py-2 text-xs font-medium bg-brand-500 hover:bg-brand-600 active:scale-95 text-white rounded-rd-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Saving Reel..." : "Save Reel"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
