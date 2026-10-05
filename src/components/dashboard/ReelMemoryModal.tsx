"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Search,
  X,
  Play,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Loader2,
  Tag,
  Compass,
  ArrowRight,
} from "lucide-react";
import { Reel } from "@/types/reel";

interface ReelMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  reels: Reel[];
  onSelectReel: (reel: Reel) => void;
  onSaveUrl?: (url: string) => Promise<void>;
}

function getMediaUrl(reel: Reel): string {
  const r = reel as any;
  return (
    r.thumbnailUrl ||
    r.coverUrl ||
    r.imageUrl ||
    r.displayUrl ||
    ""
  );
}

function getCreator(reel: Reel): string {
  const r = reel as any;
  return (
    r.creatorUsername ||
    r.creatorFullName ||
    (typeof r.creator === "string" ? r.creator : r.creator?.username) ||
    "instagram"
  );
}

const DISCOVERY_PROMPTS = [
  { label: "🐹 Animals & Pets", query: "animal" },
  { label: "💃 Dance & Choreography", query: "dance" },
  { label: "👗 Saree & Fashion", query: "saree" },
  { label: "💻 Tech & Dev", query: "tech" },
  { label: "🎭 Latent & Comedy", query: "comedy" },
  { label: "📍 Delhi & Travel", query: "delhi" },
  { label: "🥗 Food & Recipes", query: "food" },
  { label: "🏋️ Fitness & Gym", query: "fitness" },
];

export function ReelMemoryModal({
  isOpen,
  onClose,
  reels,
  onSelectReel,
  onSaveUrl,
}: ReelMemoryModalProps) {
  const [query, setQuery] = useState("");
  const [saveUrl, setSaveUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setSaveUrl("");
      setSaveMessage(null);
    }
  }, [isOpen]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Deep Semantic Search across AI Summaries, AI Topics, Captions, Creators, Categories
  const searchResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      // Return top reels with AI summaries first
      return [...reels]
        .sort((a, b) => {
          const aHasSummary = a.aiSummary && a.aiSummary.length > 15 ? 1 : 0;
          const bHasSummary = b.aiSummary && b.aiSummary.length > 15 ? 1 : 0;
          if (bHasSummary !== aHasSummary) return bHasSummary - aHasSummary;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
        .slice(0, 16);
    }

    const tokens = q.split(/\s+/).filter(Boolean);

    // Score and rank matches
    const scored = reels
      .map((reel) => {
        let score = 0;
        const creator = getCreator(reel).toLowerCase();
        const caption = (reel.caption || "").toLowerCase();
        const summary = (reel.aiSummary || "").toLowerCase();
        const category = (reel.category || "").toLowerCase();
        const topics = Array.isArray(reel.aiTopics) ? reel.aiTopics.map((t) => t.toLowerCase()) : [];
        const tags = Array.isArray(reel.tags) ? reel.tags.map((t) => t.toLowerCase()) : [];

        for (const token of tokens) {
          // Highest weight: AI Topic direct match (what is physically/conceptually in the reel)
          if (topics.some((t) => t.includes(token))) score += 40;
          // High weight: AI Summary match (video briefing)
          if (summary.includes(token)) score += 30;
          // Category match
          if (category.includes(token)) score += 20;
          // Creator match
          if (creator.includes(token)) score += 15;
          // Tag match
          if (tags.some((t) => t.includes(token))) score += 15;
          // Caption match
          if (caption.includes(token)) score += 10;
        }

        return { reel, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.reel);

    return scored;
  }, [reels, query]);

  const handleCopyLink = (reel: Reel, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = reel.instagramUrl || `https://www.instagram.com/reel/${reel.shortcode}/`;
    navigator.clipboard.writeText(url);
    setCopiedId(reel.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveUrl.trim() || !onSaveUrl) return;

    setIsSaving(true);
    setSaveMessage(null);
    try {
      await onSaveUrl(saveUrl.trim());
      setSaveUrl("");
      setSaveMessage({ kind: "success", text: "Saved to your vault and enriched!" });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage({ kind: "error", text: "Could not save Instagram link." });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 pt-12 sm:pt-16">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/65 backdrop-blur-md transition-all"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -16 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative flex flex-col w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-[28px] border border-purple-200/80 bg-white/95 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(147,51,234,0.3)] dark:border-purple-800/40 dark:bg-[#111319]/95 dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)]"
        >
          {/* Header & Search Bar */}
          <div className="relative border-b border-purple-100 bg-gradient-to-r from-purple-50/50 via-white to-pink-50/40 p-4 sm:p-5 dark:border-zinc-800/80 dark:from-[#17132B]/80 dark:via-[#111319] dark:to-[#1E1129]/80">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-sm">
                  <Sparkles className="size-3.5" />
                </span>
                <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">
                  Reel Memory
                </span>
                <span className="rounded-full bg-purple-100/80 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-950/70 dark:text-purple-300">
                  Visual AI Engine
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex size-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Input field */}
            <div className="relative flex items-center rounded-2xl border border-purple-200/90 bg-white px-3.5 py-2.5 shadow-sm transition-all focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-400/20 dark:border-purple-800/50 dark:bg-[#181922]">
              <Search className="size-4 text-purple-600 dark:text-purple-400 mr-2.5 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search what is in the reel (e.g. 'hamster', 'girl dancing', 'saree', 'python code', 'delhi food')…"
                className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Quick Prompt Pills */}
            <div className="mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 shrink-0 mr-1">
                Explore:
              </span>
              {DISCOVERY_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() => setQuery(prompt.query)}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                    query.toLowerCase() === prompt.query
                      ? "bg-purple-600 text-white shadow-sm"
                      : "bg-purple-50/70 text-purple-700 hover:bg-purple-100/80 border border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40 dark:hover:bg-purple-900/60"
                  }`}
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Save Link Form */}
          {onSaveUrl && (
            <form
              onSubmit={handleSaveSubmit}
              className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50/80 px-4 py-2 dark:border-zinc-800/60 dark:bg-[#14151C]"
            >
              <Plus className="size-3.5 text-zinc-400 shrink-0" />
              <input
                type="text"
                value={saveUrl}
                onChange={(e) => setSaveUrl(e.target.value)}
                placeholder="Paste any Instagram reel URL to auto-enrich and save…"
                className="flex-1 bg-transparent text-xs text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-200 dark:placeholder:text-zinc-500"
              />
              <button
                type="submit"
                disabled={isSaving || !saveUrl.trim()}
                className="inline-flex items-center gap-1 rounded-full bg-purple-600 px-3 py-1 text-[11px] font-medium text-white shadow-sm transition-all hover:bg-purple-700 disabled:opacity-40"
              >
                {isSaving ? <Loader2 className="size-3 animate-spin" /> : "Save"}
              </button>
            </form>
          )}

          {saveMessage && (
            <div
              className={`px-4 py-1.5 text-xs font-medium ${
                saveMessage.kind === "success"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
              }`}
            >
              {saveMessage.text}
            </div>
          )}

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between px-5 py-2 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800/50">
            <span>
              {query ? `Found ${searchResults.length} reels matching "${query}"` : `Showing ${searchResults.length} recent reels with AI briefings`}
            </span>
            <span className="font-mono text-[10px]">Esc to close</span>
          </div>

          {/* Reel List with Visual Briefings */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-300 mb-3">
                  <Compass className="size-6" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  No reels matched "{query}"
                </h3>
                <p className="mt-1 text-xs text-zinc-400 max-w-sm">
                  Try searching for visual concepts like "hamster", "dance", "saree", "coding", "delhi", or "standup".
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                  {DISCOVERY_PROMPTS.slice(0, 4).map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setQuery(p.query)}
                      className="rounded-full border border-purple-200/80 bg-purple-50/50 px-3 py-1 text-xs text-purple-700 hover:bg-purple-100 dark:border-purple-800/40 dark:bg-purple-950/40 dark:text-purple-300"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              searchResults.map((reel) => {
                const thumb = getMediaUrl(reel);
                const creator = getCreator(reel);
                const topics = Array.isArray(reel.aiTopics) ? reel.aiTopics.slice(0, 6) : [];

                return (
                  <div
                    key={reel.id}
                    onClick={() => {
                      onSelectReel(reel);
                      onClose();
                    }}
                    className="group relative flex flex-col sm:flex-row gap-3.5 p-3.5 rounded-2xl border border-zinc-200/70 bg-white/70 hover:bg-white hover:border-purple-300/80 hover:shadow-md transition-all duration-200 cursor-pointer dark:border-zinc-800/80 dark:bg-[#161822]/80 dark:hover:bg-[#1B1D2B] dark:hover:border-purple-700/50"
                  >
                    {/* Media Thumbnail */}
                    <div className="relative aspect-[9/16] w-24 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-zinc-900 shadow-inner">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={reel.caption || `@${creator}`}
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-zinc-800 text-zinc-500">
                          <Play className="size-6 opacity-30" />
                        </div>
                      )}

                      {/* Hover Play Button */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <span className="flex size-9 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-md transform scale-90 group-hover:scale-100 transition-transform duration-200">
                          <Play className="ml-0.5 size-4 fill-white text-white" />
                        </span>
                      </div>

                      {/* Duration / Media Type Badge */}
                      {reel.duration && (
                        <div className="absolute bottom-1.5 left-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-mono font-medium text-white backdrop-blur-sm">
                          {reel.duration}
                        </div>
                      )}
                    </div>

                    {/* Content & AI Briefing */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        {/* Creator & Category row */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                              @{creator}
                            </span>
                            {reel.category && (
                              <span className="shrink-0 rounded-full border border-purple-200/60 bg-purple-50/70 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:border-purple-800/40 dark:bg-purple-950/40 dark:text-purple-300">
                                {reel.category}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => handleCopyLink(reel, e)}
                              className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
                              title="Copy URL"
                            >
                              {copiedId === reel.id ? (
                                <Check className="size-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                            </button>
                            {reel.instagramUrl && (
                              <a
                                href={reel.instagramUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
                                title="Open on Instagram"
                              >
                                <ExternalLink className="size-3.5" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Real AI Video Briefing */}
                        {reel.aiSummary ? (
                          <div className="rounded-xl border border-purple-100 bg-[#FDF8FF] p-2.5 dark:border-purple-900/30 dark:bg-[#1D172A]/70 mb-2">
                            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300 mb-0.5">
                              <Sparkles className="size-3" />
                              <span>Video Briefing</span>
                            </div>
                            <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                              {reel.aiSummary}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-2">
                            {reel.caption || "Saved Instagram Reel"}
                          </p>
                        )}
                      </div>

                      {/* Visual Topics & Keywords */}
                      {topics.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-zinc-100 dark:border-zinc-800/40">
                          <Tag className="size-2.5 text-zinc-400 shrink-0" />
                          {topics.map((topic) => (
                            <button
                              key={topic}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuery(topic);
                              }}
                              className="rounded-md bg-zinc-100/90 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 hover:bg-purple-100 hover:text-purple-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-purple-950 dark:hover:text-purple-300 transition-colors"
                            >
                              {topic}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
