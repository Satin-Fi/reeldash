"use client";

import React from "react";
import { motion } from "framer-motion";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface AnimatedTabsProps<T extends string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
}

/**
 * 21st.dev inspired Animated Tabs with Framer Motion sliding pill indicator
 */
export function AnimatedTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  className = "",
}: AnimatedTabsProps<T>) {
  return (
    <div
      className={`inline-flex items-center p-1 rounded-2xl bg-zinc-100 dark:bg-[#12131a] border border-zinc-200/80 dark:border-white/[0.08] ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors duration-200 cursor-pointer outline-none ${
              isActive
                ? "text-zinc-900 dark:text-white"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="active-tab-pill"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                className="absolute inset-0 rounded-xl bg-white dark:bg-white/[0.12] shadow-sm border border-zinc-200/50 dark:border-white/[0.15]"
              />
            )}
            <span className="relative z-10 flex items-center space-x-1.5">
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive
                      ? "bg-brand-500/10 text-brand-500"
                      : "bg-zinc-200/60 dark:bg-white/[0.06] text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
