"use client";

import React, { useState } from "react";
import { useReels } from "@/context/ReelContext";
import {
  Folder,
  Plus,
  Search,
  ArrowRight,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { Category } from "@/types/reel";

export default function CategoriesPage() {
  const {
    userCategories,
    smartCategories,
    createUserCategory,
    updateUserCategory,
    deleteUserCategory,
    activeCategory,
    setActiveCategory,
  } = useReels();

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("📁");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  // Combine userCategories and smartCategories
  const allCategories = smartCategories.filter((cat) => !cat.name.startsWith("#"));

  const filteredCategories = allCategories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsSubmitting(true);
    await createUserCategory(newCatName.trim(), newCatIcon, newCatDesc.trim());
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
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ─── Header & Action Bar ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-borderSubtle-light dark:border-borderSubtle-dark pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Folder className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-primaryText-light dark:text-primaryText-dark">
              Library Categories
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-secondaryText-light dark:text-secondaryText-dark border border-borderSubtle-light dark:border-borderSubtle-dark tabular-nums">
              {allCategories.length} {allCategories.length === 1 ? "category" : "categories"}
            </span>
          </div>
          <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark mt-1.5 max-w-xl leading-relaxed">
            Categories organize your personal library. You can assign reels to multiple categories using DM shortcuts like <span className="font-mono text-brand-600 dark:text-brand-400">/yoga</span>, <span className="font-mono text-brand-600 dark:text-brand-400">/tech</span>, or manually below.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-semibold transition-all cursor-pointer shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* ─── Create Category Modal / Inline Box ───────────────── */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="p-5 rounded-xl bg-surface-light dark:bg-[#12141A] border border-brand-500/30 shadow-lg space-y-3.5 animate-slide-down"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-primaryText-light dark:text-white">
              Create New Category
            </h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-zinc-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-secondaryText-light dark:text-zinc-400 mb-1">
                Category Name (e.g. Fitness, Yoga, SaaS, AI)
              </label>
              <input
                type="text"
                required
                placeholder="Category name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-surfaceSecondary-light dark:bg-black/40 border border-borderSubtle-light dark:border-white/[0.08] text-xs text-primaryText-light dark:text-white focus:outline-none focus:border-brand-500"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-secondaryText-light dark:text-zinc-400 mb-1">
                Icon (optional)
              </label>
              <input
                type="text"
                placeholder="📁"
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-surfaceSecondary-light dark:bg-black/40 border border-borderSubtle-light dark:border-white/[0.08] text-xs text-primaryText-light dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-secondaryText-light dark:text-zinc-400 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              placeholder="What kind of reels belong here..."
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-surfaceSecondary-light dark:bg-black/40 border border-borderSubtle-light dark:border-white/[0.08] text-xs text-primaryText-light dark:text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 rounded-lg bg-surfaceSecondary-light dark:bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-secondaryText-light dark:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newCatName.trim()}
              className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Save Category"}
            </button>
          </div>
        </form>
      )}

      {/* ─── Search & Filter Bar ──────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-light dark:bg-[#12141A] border border-borderSubtle-light dark:border-white/[0.08] text-xs text-primaryText-light dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* ─── Categories Grid ──────────────────────────────────── */}
      {filteredCategories.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-borderSubtle-light dark:border-borderSubtle-dark rounded-xl">
          <Folder className="w-10 h-10 text-zinc-500 mx-auto opacity-50 mb-2.5" />
          <p className="text-sm font-semibold text-primaryText-light dark:text-white">
            {searchQuery ? "No matching categories" : "No categories created yet"}
          </p>
          <p className="text-xs text-secondaryText-light dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? "Try searching for a different keyword or create this new category above."
              : "Send /category_name via DM or click 'New Category' to organize your library."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredCategories.map((cat) => {
            const isEditing = editingCatId === cat.id;
            const isDeleting = deletingCatId === cat.id;

            return (
              <div
                key={cat.id || cat.name}
                className="group relative flex flex-col justify-between p-4 rounded-xl bg-surface-light dark:bg-[#12141A] border border-borderSubtle-light dark:border-white/[0.07] hover:border-brand-500/30 shadow-xs hover:shadow-md transition-all"
              >
                <div>
                  {/* Top Bar: Icon + Actions */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl">{cat.icon || "📁"}</span>

                    <div className="flex items-center space-x-1">
                      {cat.source && (
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 mr-1">
                          {cat.source}
                        </span>
                      )}

                      {cat.id && (
                        <>
                          <button
                            onClick={() => handleStartEdit(cat)}
                            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingCatId(cat.id || null)}
                            className="p-1 text-zinc-400 hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Title & Edit Form */}
                  {isEditing ? (
                    <div className="space-y-2 mb-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded bg-black/50 border border-white/20 text-white focus:outline-none focus:border-brand-500"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Description"
                        className="w-full px-2 py-1 text-[11px] rounded bg-black/50 border border-white/20 text-zinc-300 focus:outline-none focus:border-brand-500"
                      />
                      <div className="flex items-center space-x-1.5 pt-1">
                        <button
                          onClick={() => handleSaveEdit(cat.id!)}
                          className="px-2 py-1 rounded bg-emerald-600 text-white text-[11px] font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingCatId(null)}
                          className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-[11px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-sm font-semibold text-primaryText-light dark:text-white leading-tight">
                        {cat.name}
                      </h3>
                      {cat.description && (
                        <p className="text-xs text-secondaryText-light dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                          {cat.description}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Delete Confirmation Alert */}
                  {isDeleting && (
                    <div className="my-2.5 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 space-y-2">
                      <p className="text-[11px] leading-tight">
                        Delete this category? Associated reels will remain in your library.
                      </p>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDelete(cat.id!)}
                          className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-semibold cursor-pointer"
                        >
                          Confirm Delete
                        </button>
                        <button
                          onClick={() => setDeletingCatId(null)}
                          className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-[10px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Stats & Link */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-borderSubtle-light dark:border-white/[0.06]">
                  <span className="text-xs font-mono text-secondaryText-light dark:text-zinc-400">
                    {cat.count} {cat.count === 1 ? "Reel" : "Reels"}
                  </span>

                  <Link
                    href={`/reels?category=${encodeURIComponent(cat.name)}`}
                    onClick={() => {
                      setActiveCategory(cat.name);
                    }}
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    <span>View Reels</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
