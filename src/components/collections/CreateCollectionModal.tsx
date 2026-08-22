"use client";

import React, { useState } from "react";
import { useReels } from "@/context/ReelContext";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function CreateCollectionModal() {
  const { isCreateCollectionModalOpen, setIsCreateCollectionModalOpen, createCollection } = useReels();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📁");

  if (!isCreateCollectionModalOpen) return null;

  const emojiOptions = ["📁", "💡", "🏋️", "🤖", "🍲", "🎨", "✈️", "❤️", "📚", "🚀"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createCollection(name.trim(), description.trim(), icon);
    setName("");
    setDescription("");
    setIcon("📁");
    setIsCreateCollectionModalOpen(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsCreateCollectionModalOpen(false)}
          className="absolute inset-0 bg-black/40 backdrop-blur-xs"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-md bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg p-6 shadow-rd-modal text-primaryText-light dark:text-primaryText-dark"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold tracking-tight">Create Collection</h3>
            <button
              onClick={() => setIsCreateCollectionModalOpen(false)}
              className="p-1.5 text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark rounded-rd-sm transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark mb-1.5">
                Collection Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {emojiOptions.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setIcon(e)}
                    className={`w-9 h-9 flex items-center justify-center rounded-rd-md text-lg transition-all cursor-pointer ${
                      icon === e
                        ? "bg-brand-500/10 border-2 border-brand-500 scale-105"
                        : "bg-background-light dark:bg-background-dark border border-borderSubtle-light dark:border-borderSubtle-dark hover:border-brand-500/50"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark mb-1.5">
                Name
              </label>
              <input
                type="text"
                placeholder="e.g. Workout Ideas, Recipe Book"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="w-full px-3.5 py-2.5 bg-background-light dark:bg-background-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md text-sm text-primaryText-light dark:text-primaryText-dark focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark mb-1.5">
                Description <span className="font-normal text-mutedText-light dark:text-mutedText-dark">(Optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="What kind of Reels are stored here?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-background-light dark:bg-background-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md text-sm text-primaryText-light dark:text-primaryText-dark focus:outline-none focus:border-brand-500 transition-colors resize-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateCollectionModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark rounded-rd-md transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium bg-brand-500 hover:bg-brand-600 active:scale-95 text-white rounded-rd-md transition-all cursor-pointer"
              >
                Create Collection
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
