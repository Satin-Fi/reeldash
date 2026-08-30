"use client";

import React, { useState } from "react";
import { useReels } from "@/context/ReelContext";
import { X, Folder } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function CreateCollectionModal() {
  const { isCreateCollectionModalOpen, setIsCreateCollectionModalOpen, createCollection } = useReels();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  if (!isCreateCollectionModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createCollection(name.trim(), description.trim(), "");
    setName("");
    setDescription("");
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
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="relative w-full max-w-md bg-[#111419] border border-white/[0.08] rounded-xl p-6 shadow-2xl text-white"
        >
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#8E93A2]">
                <Folder className="w-4 h-4 text-[#5B52E8]" />
              </div>
              <div>
                <h3 className="text-base font-semibold tracking-tight text-white">Create Collection</h3>
                <p className="text-xs text-[#8E93A2] mt-0.5">Group related posts and reference reels.</p>
              </div>
            </div>
            <button
              onClick={() => setIsCreateCollectionModalOpen(false)}
              className="p-1.5 text-[#8E93A2] hover:text-white hover:bg-white/[0.06] rounded-md transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#8E93A2] mb-1.5">
                Collection Name
              </label>
              <input
                type="text"
                placeholder="e.g. Visual Inspo, Fitness Routines"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="w-full px-3.5 py-2.5 bg-[#0B0D10] border border-white/[0.08] hover:border-white/[0.12] focus:border-[#5B52E8] rounded-lg text-sm text-white placeholder-[#5A5F6E] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#8E93A2] mb-1.5">
                Description <span className="text-[#5A5F6E] font-normal lowercase">(optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Add notes about what is saved here..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0B0D10] border border-white/[0.08] hover:border-white/[0.12] focus:border-[#5B52E8] rounded-lg text-sm text-white placeholder-[#5A5F6E] focus:outline-none transition-colors resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setIsCreateCollectionModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-[#8E93A2] hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="px-4 py-2 text-xs font-semibold bg-[#5B52E8] hover:bg-[#4E45D6] active:scale-[0.98] text-white rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
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
