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
      className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 pt-1 sm:pt-2 pb-2 ${className}`}
    >
      <div className="max-w-xl min-w-0">
        <h1
          className={`${bricolage.className} text-2xl sm:text-3xl lg:text-[34px] font-bold leading-tight tracking-[-0.035em] text-zinc-950 dark:text-white break-words`}
        >
          {title}
        </h1>

        {subtitle && (
          <p className="mt-1 max-w-md text-xs sm:text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </p>
        )}
      </div>

      {stats && stats.length > 0 && (
        <div className="flex shrink-0 items-center gap-4 sm:gap-6 self-start sm:self-auto">
          {stats.map((stat, idx) => (
            <React.Fragment key={stat.label}>
              {idx > 0 && (
                <div className="h-7 sm:h-8 w-px bg-black/[0.08] dark:bg-white/[0.08]" />
              )}
              <div>
                <p
                  className={`${bricolage.className} text-xl sm:text-2xl font-medium tracking-tight tabular-nums text-zinc-950 dark:text-white`}
                >
                  {typeof stat.value === "number"
                    ? stat.value < 100
                      ? stat.value.toString().padStart(2, "0")
                      : stat.value.toLocaleString()
                    : stat.value}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-400 dark:text-zinc-500">
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
