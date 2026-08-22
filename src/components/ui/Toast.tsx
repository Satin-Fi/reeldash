"use client";

import React from "react";
import { useReels } from "@/context/ReelContext";
import { AnimatePresence, motion } from "framer-motion";

export function ToastContainer() {
  const { toasts, removeToast } = useReels();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto flex items-center justify-between gap-3 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md p-3.5 shadow-rd-card text-primaryText-light dark:text-primaryText-dark text-xs sm:text-sm font-medium"
          >
            <div className="flex flex-col">
              <span className="leading-tight">{toast.title}</span>
              {toast.subtitle && (
                <span className="text-secondaryText-light dark:text-secondaryText-dark text-xs mt-0.5 font-normal">
                  {toast.subtitle}
                </span>
              )}
            </div>
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="px-2.5 py-1 text-xs bg-brand-500 hover:bg-brand-600 text-white rounded-rd-sm font-medium transition-colors cursor-pointer shrink-0"
              >
                {toast.action.label}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
