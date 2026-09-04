"use client";

import React, { useState, useMemo } from "react";
import { useReels } from "@/context/ReelContext";
import {
  Folder,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Reel } from "@/types/reel";

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
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-24 px-2 sm:px-4">
      {/* ─── Hero / Header ───────────────────────────────────────── */}
      <div className="hidden sm:flex items-center justify-between gap-3 pb-5 sm:pb-6 border-b border-borderSubtle-light dark:border-white/[0.06]">
        <h1 className="font-bricolage text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-primaryText-light dark:text-white">
          Categories
        </h1>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setIsCreating(true)}
            className="group relative inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-brand-600 hover:bg-brand-500 active:scale-[0.98] text-white text-xs font-semibold shadow-lg shadow-brand-600/20 transition-all duration-300 cursor-pointer"
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
              className="p-4 sm:p-5 rounded-[calc(1rem-2px)] bg-surface-light dark:bg-[#0E1015] border border-white/[0.06] space-y-4"
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
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-base sm:text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand-500 transition-colors"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-base sm:text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand-500 transition-colors"
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

      {/* ─── Search Bar ───────────────────────────────────────── */}
      <div className="flex items-center gap-2 sm:hidden">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-surface-light dark:bg-[#0E1015] border border-borderSubtle-light dark:border-white/[0.08] text-xs text-primaryText-light dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white rounded"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="shrink-0 flex items-center space-x-1 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 active:scale-95 text-white text-xs font-semibold shadow-md shadow-brand-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>
      </div>

      <div className="hidden sm:flex items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-surface-light dark:bg-[#0E1015] border border-borderSubtle-light dark:border-white/[0.08] text-xs text-primaryText-light dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ─── High-End Visual Categories Grid ──────────────────── */}
      {filteredCategories.length === 0 ? (
        <div className="py-20 sm:py-24 text-center border border-dashed border-borderSubtle-light dark:border-white/[0.08] rounded-2xl bg-surface-light/40 dark:bg-white/[0.01] px-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCategories.map((cat) => {
            const catReels = reelsByCategory.get(cat.name) || [];
            const previewReels = catReels.slice(0, 3);
            const isEditing = editingCatId === cat.id;
            const isDeleting = deletingCatId === cat.id;

            return (
              <div
                key={cat.id || cat.name}
                className="group relative flex flex-col rounded-2xl bg-[#0c0e14] border border-white/[0.08] hover:border-white/20 shadow-md hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)] transition-all duration-300 overflow-hidden"
              >
                {/* Top Subtle Hairline Highlight */}
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none z-10" />

                {/* ── Visual Media Header (Dynamic Responsive Collage) ── */}
                <Link
                  href={`/reels?category=${encodeURIComponent(cat.name)}`}
                  onClick={() => setActiveCategory(cat.name)}
                  className="block relative h-44 sm:h-48 w-full bg-zinc-950 overflow-hidden border-b border-white/[0.06] cursor-pointer"
                >
                  {previewReels.length > 0 ? (
                    <div
                      className={`grid h-full gap-0.5 p-0.5 bg-black/40 ${
                        previewReels.length === 1
                          ? "grid-cols-1"
                          : previewReels.length === 2
                          ? "grid-cols-2"
                          : "grid-cols-3"
                      }`}
                    >
                      {previewReels.map((r, idx) => (
                        <div
                          key={r.id || idx}
                          className="relative h-full w-full overflow-hidden bg-zinc-900"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={r.thumbnailUrl || `/api/proxy-image?shortcode=${r.shortcode}`}
                            alt=""
                            className="h-full w-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center gap-1.5 bg-gradient-to-b from-white/[0.02] to-transparent text-zinc-600">
                      <span className="text-xs font-medium text-zinc-500 tracking-wide">
                        No reels saved yet
                      </span>
                    </div>
                  )}

                  {/* Subtle Gradient bottom fog */}
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#0c0e14] to-transparent pointer-events-none" />
                </Link>

                {/* Top-Right Actions (Always accessible on touch devices, revealed on hover on desktop) */}
                {cat.id && (
                  <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 bg-black/75 backdrop-blur-md rounded-lg p-1 border border-white/10 shadow-lg">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleStartEdit(cat);
                      }}
                      className="p-1.5 text-zinc-300 hover:text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                      title="Edit Category"
                      aria-label="Edit Category"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeletingCatId(cat.id || null);
                      }}
                      className="p-1.5 text-zinc-300 hover:text-rose-400 rounded-md hover:bg-rose-500/20 transition-colors cursor-pointer"
                      title="Delete Category"
                      aria-label="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* ── Metadata & Details Body ── */}
                <div className="p-3.5 sm:p-4 bg-[#0c0e14]">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-base sm:text-xs rounded-lg bg-black/50 border border-white/20 text-white focus:outline-none focus:border-brand-500"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Description"
                        className="w-full px-2.5 py-1.5 text-base sm:text-[11px] rounded-lg bg-black/50 border border-white/20 text-zinc-300 focus:outline-none focus:border-brand-500"
                      />
                      <div className="flex items-center space-x-1.5 pt-1">
                        <button
                          onClick={() => handleSaveEdit(cat.id!)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-[11px] font-semibold cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingCatId(null)}
                          className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white text-xs sm:text-[11px] cursor-pointer"
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
                      <div className="min-w-0">
                        <h3 className="font-bricolage text-[15px] font-bold text-white tracking-tight truncate group-hover:text-brand-300 group-hover/link:text-brand-300 transition-colors">
                          {cat.name}
                        </h3>
                        {cat.description && (
                          <p className="text-xs text-zinc-400 line-clamp-1 leading-relaxed mt-0.5">
                            {cat.description}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] group-hover:border-white/20 text-xs font-medium text-zinc-300 group-hover:text-white transition-all duration-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] active:scale-95">
                        Explore
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
