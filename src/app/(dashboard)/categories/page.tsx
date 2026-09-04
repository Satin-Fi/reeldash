"use client";

import React, { useState, useMemo } from "react";
import { useReels } from "@/context/ReelContext";
import {
  Folder,
  Plus,
  Search,
  ArrowRight,
  Edit3,
  Trash2,
  X,
  Code2,
  Music2,
  Compass,
  Palette,
  Camera,
  Layers,
  Sparkles,
  ShoppingBag,
  Activity,
  Film,
  Utensils,
  Cpu,
  Check,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Category, Reel } from "@/types/reel";

// Curated category themes for high-end agency aesthetic
interface CategoryTheme {
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
  glow: string;
}

const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  "tech & dev": {
    icon: Code2,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20 hover:border-blue-500/40",
    glow: "rgba(59, 130, 246, 0.15)",
  },
  "music & audio": {
    icon: Music2,
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20 hover:border-pink-500/40",
    glow: "rgba(236, 72, 153, 0.15)",
  },
  "travel & places": {
    icon: Compass,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20 hover:border-emerald-500/40",
    glow: "rgba(16, 185, 129, 0.15)",
  },
  "design & art": {
    icon: Palette,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20 hover:border-purple-500/40",
    glow: "rgba(168, 85, 247, 0.15)",
  },
  "camera": {
    icon: Camera,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20 hover:border-amber-500/40",
    glow: "rgba(245, 158, 11, 0.15)",
  },
  "saree": {
    icon: ShoppingBag,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20 hover:border-rose-500/40",
    glow: "rgba(244, 63, 94, 0.15)",
  },
  "fashion": {
    icon: ShoppingBag,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20 hover:border-rose-500/40",
    glow: "rgba(244, 63, 94, 0.15)",
  },
  "fitness": {
    icon: Activity,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20 hover:border-cyan-500/40",
    glow: "rgba(6, 182, 212, 0.15)",
  },
  "yoga": {
    icon: Activity,
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20 hover:border-teal-500/40",
    glow: "rgba(20, 184, 166, 0.15)",
  },
  "ai": {
    icon: Cpu,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20 hover:border-indigo-500/40",
    glow: "rgba(99, 102, 241, 0.15)",
  },
  "recipes": {
    icon: Utensils,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20 hover:border-orange-500/40",
    glow: "rgba(249, 115, 22, 0.15)",
  },
};

function getCategoryTheme(name: string): CategoryTheme {
  const norm = name.toLowerCase().trim();
  if (CATEGORY_THEMES[norm]) return CATEGORY_THEMES[norm];
  
  // Partial matches
  for (const [key, theme] of Object.entries(CATEGORY_THEMES)) {
    if (norm.includes(key) || key.includes(norm)) return theme;
  }

  // Default elegant neutral theme
  return {
    icon: Folder,
    color: "text-brand-400",
    bg: "bg-brand-500/10",
    border: "border-brand-500/20 hover:border-brand-500/40",
    glow: "rgba(79, 106, 232, 0.15)",
  };
}

export default function CategoriesPage() {
  const {
    reels,
    smartCategories,
    createUserCategory,
    updateUserCategory,
    deleteUserCategory,
    setActiveCategory,
  } = useReels();

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  // Filter out any hashtag artifacts
  const cleanCategories = useMemo(() => {
    return smartCategories.filter((cat) => !cat.name.startsWith("#"));
  }, [smartCategories]);

  const filteredCategories = useMemo(() => {
    return cleanCategories.filter((cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [cleanCategories, searchQuery]);

  // Map category to its constituent reels
  const reelsByCategory = useMemo(() => {
    const map = new Map<string, Reel[]>();
    cleanCategories.forEach((cat) => {
      const catLower = cat.name.toLowerCase();
      const matched = reels.filter((r) => {
        const assigned = r.categories && r.categories.length > 0 ? r.categories : [r.category || ""];
        return assigned.some((c) => c.toLowerCase() === catLower);
      });
      map.set(cat.name, matched);
    });
    return map;
  }, [cleanCategories, reels]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsSubmitting(true);
    await createUserCategory(newCatName.trim(), undefined, newCatDesc.trim());
    setNewCatName("");
    setNewCatDesc("");
    setIsCreating(false);
    setIsSubmitting(false);
  };

  const handleStartEdit = (cat: { id?: string; name: string; description?: string }) => {
    if (!cat.id) return;
    setEditingCatId(cat.id);
    setEditName(cat.name);
    setEditDesc(cat.description || "");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    await updateUserCategory(id, {
      name: editName.trim(),
      description: editDesc.trim(),
    });
    setEditingCatId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteUserCategory(id);
    setDeletingCatId(null);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24 px-1 sm:px-2">
      {/* ─── Hero / Header ───────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-borderSubtle-light dark:border-white/[0.06]">
        <div className="space-y-1.5">
          <h1 className="font-bricolage text-2xl sm:text-3xl font-bold tracking-tight text-primaryText-light dark:text-white">
            Categories
          </h1>
          <p className="text-xs sm:text-[13px] text-secondaryText-light dark:text-zinc-400 max-w-xl leading-relaxed">
            Curated collections of your saved reels. Organize via DM commands like <span className="px-1.5 py-0.5 rounded bg-zinc-800 font-mono text-zinc-300 text-[11px]">/yoga</span> or <span className="px-1.5 py-0.5 rounded bg-zinc-800 font-mono text-zinc-300 text-[11px]">/tech</span>, or manage visually below.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsCreating(true)}
            className="group relative inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand-600 hover:bg-brand-500 active:scale-[0.98] text-white text-xs font-semibold shadow-lg shadow-brand-600/20 transition-all duration-300 cursor-pointer"
          >
            <span>New Category</span>
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <Plus className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </div>

      {/* ─── Create Category Panel (Double-Bezel Modal) ─────────── */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="p-1.5 rounded-2xl bg-white/5 border border-white/10 shadow-2xl"
          >
            <form
              onSubmit={handleCreate}
              className="p-5 rounded-[calc(1rem-2px)] bg-surface-light dark:bg-[#0E1015] border border-white/[0.06] space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
                    <Folder className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-primaryText-light dark:text-white">
                    Create New Category
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fitness, AI Tools, Architecture, Travel"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand-500 transition-colors"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="What belongs in this category..."
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newCatName.trim()}
                  className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 shadow-md"
                >
                  {isSubmitting ? "Creating..." : "Save Category"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Search & Stats Bar ───────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-surface-light dark:bg-[#0E1015] border border-borderSubtle-light dark:border-white/[0.08] text-xs text-primaryText-light dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        <span className="text-xs font-mono text-zinc-500">
          {cleanCategories.length} {cleanCategories.length === 1 ? "Category" : "Categories"} • {reels.length} Reels
        </span>
      </div>

      {/* ─── High-End Visual Categories Grid ──────────────────── */}
      {filteredCategories.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-borderSubtle-light dark:border-white/[0.08] rounded-2xl bg-surface-light/40 dark:bg-white/[0.01]">
          <Folder className="w-10 h-10 text-zinc-500 mx-auto opacity-40 mb-3" />
          <p className="text-sm font-semibold text-primaryText-light dark:text-white">
            {searchQuery ? "No matching categories" : "No categories created yet"}
          </p>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? "Try searching for a different keyword or create this category above."
              : "Send /category_name via DM or click 'New Category' to organize your library."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCategories.map((cat) => {
            const theme = getCategoryTheme(cat.name);
            const ThemeIcon = theme.icon;
            const catReels = reelsByCategory.get(cat.name) || [];
            const previewReels = catReels.slice(0, 3);
            const isEditing = editingCatId === cat.id;
            const isDeleting = deletingCatId === cat.id;

            return (
              <div
                key={cat.id || cat.name}
                className="group relative flex flex-col rounded-2xl bg-surface-light dark:bg-[#0E1015] border border-borderSubtle-light dark:border-white/[0.06] hover:border-white/[0.18] shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                {/* ── Visual Media Header (3-Reel Mosaic / Preview Strip) ── */}
                <Link
                  href={`/reels?category=${encodeURIComponent(cat.name)}`}
                  onClick={() => setActiveCategory(cat.name)}
                  className="block relative h-44 w-full bg-zinc-950/80 overflow-hidden border-b border-borderSubtle-light dark:border-white/[0.06] cursor-pointer"
                >
                  {previewReels.length > 0 ? (
                    <div className="grid grid-cols-3 h-full gap-0.5 p-0.5 bg-black/40">
                      {previewReels.map((r, idx) => (
                        <div key={r.id || idx} className="relative h-full w-full overflow-hidden bg-zinc-900 group-hover:brightness-105 transition-all">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={r.thumbnailUrl || `/api/proxy-image?shortcode=${r.shortcode}`}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                        </div>
                      ))}
                      {/* Filler slots if less than 3 reels */}
                      {Array.from({ length: Math.max(0, 3 - previewReels.length) }).map((_, i) => (
                        <div key={i} className="h-full w-full bg-white/[0.02] flex items-center justify-center text-zinc-800">
                          <Film className="w-5 h-5 opacity-20" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-white/[0.02] to-transparent text-zinc-600">
                      <ThemeIcon className="w-8 h-8 opacity-30" strokeWidth={1.5} />
                      <span className="text-[11px] font-mono text-zinc-600">Empty Category</span>
                    </div>
                  )}

                  {/* Gradient bottom fog */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0E1015] to-transparent pointer-events-none" />
                </Link>

                {/* Top-Right Actions (Overlay) */}
                {cat.id && (
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md rounded-lg p-0.5 border border-white/10">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleStartEdit(cat);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeletingCatId(cat.id || null);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-md hover:bg-rose-500/20 transition-colors cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* ── Metadata & Details Body ── */}
                <div className="p-4">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-black/50 border border-white/20 text-white focus:outline-none focus:border-brand-500"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Description"
                        className="w-full px-2.5 py-1.5 text-[11px] rounded-lg bg-black/50 border border-white/20 text-zinc-300 focus:outline-none focus:border-brand-500"
                      />
                      <div className="flex items-center space-x-1.5 pt-1">
                        <button
                          onClick={() => handleSaveEdit(cat.id!)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingCatId(null)}
                          className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white text-[11px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={`/reels?category=${encodeURIComponent(cat.name)}`}
                      onClick={() => setActiveCategory(cat.name)}
                      className="flex items-center justify-between gap-3 group/link"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg ${theme.bg} flex items-center justify-center shrink-0 border border-white/[0.04]`}>
                          <ThemeIcon className={`w-4 h-4 ${theme.color}`} strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bricolage text-base font-bold text-primaryText-light dark:text-white tracking-tight truncate group-hover/link:text-brand-400 group-hover:text-brand-400 transition-colors">
                            {cat.name}
                          </h3>
                          {cat.description && (
                            <p className="text-xs text-secondaryText-light dark:text-zinc-400 line-clamp-1 leading-relaxed mt-0.5">
                              {cat.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-zinc-300 group-hover/link:bg-brand-500/10 group-hover/link:border-brand-500/30 group-hover/link:text-brand-400 group-hover:bg-brand-500/10 group-hover:border-brand-500/30 group-hover:text-brand-400 transition-all">
                        <span>Explore</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  )}

                  {/* Delete Confirmation Alert */}
                  {isDeleting && (
                    <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 space-y-2 animate-slide-down">
                      <p className="text-[11px] leading-tight font-medium">
                        Delete &quot;{cat.name}&quot;? Reels will remain safely in your library.
                      </p>
                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          onClick={() => handleDelete(cat.id!)}
                          className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-semibold cursor-pointer"
                        >
                          Confirm Delete
                        </button>
                        <button
                          onClick={() => setDeletingCatId(null)}
                          className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 text-[10px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
