"use client";

import React from "react";
import { Bricolage_Grotesque } from "next/font/google";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export interface HeaderStat {
  value: number | string;
  label: string;
}

export interface LibraryHeaderProps {
  title: string;
  subtitle: React.ReactNode;
  stats?: HeaderStat[];
  className?: string;
}

export function LibraryHeader({
  title,
  subtitle,
  stats,
  className = "",
}: LibraryHeaderProps) {
  return (
    <header
      className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-8 pt-1 sm:pt-4 ${className}`}
    >
      <div className="max-w-2xl min-w-0">
        <h1
          className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white break-words"
        >
          {title}
        </h1>

        {subtitle && (
          <p className="mt-1.5 max-w-lg text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </p>
        )}
      </div>

      {stats && stats.length > 0 && (
        <div className="flex shrink-0 items-center gap-4 sm:gap-6 pb-1 self-start sm:self-auto">
          {stats.map((stat, idx) => (
            <React.Fragment key={stat.label}>
              {idx > 0 && (
                <div className="h-7 sm:h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
              )}
              <div>
                <p
                  className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums text-zinc-900 dark:text-white"
                >
                  {typeof stat.value === "number"
                    ? stat.value < 100
                      ? stat.value.toString().padStart(2, "0")
                      : stat.value.toLocaleString()
                    : stat.value}
                </p>
                <p className="mt-0.5 text-[9px] sm:text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {stat.label}
                </p>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </header>
  );
}
