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
          className={`${bricolage.className} text-[clamp(2.15rem,6.5vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.055em] text-zinc-950 dark:text-white break-words`}
        >
          {title}
          <span className="text-[#CBB5FD]">.</span>
        </h1>

        <p className="mt-2.5 sm:mt-4 max-w-md text-xs sm:text-sm leading-5 sm:leading-6 text-zinc-500 sm:text-[15px] dark:text-zinc-400">
          {subtitle}
        </p>
      </div>

      {stats && stats.length > 0 && (
        <div className="flex shrink-0 items-center gap-5 sm:gap-7 pb-1 self-start sm:self-auto">
          {stats.map((stat, idx) => (
            <React.Fragment key={stat.label}>
              {idx > 0 && (
                <div className="h-8 sm:h-10 w-px bg-black/[0.08] dark:bg-white/[0.08]" />
              )}
              <div>
                <p
                  className={`${bricolage.className} text-2xl sm:text-3xl font-medium tracking-tight tabular-nums text-zinc-950 dark:text-white`}
                >
                  {typeof stat.value === "number"
                    ? stat.value < 100
                      ? stat.value.toString().padStart(2, "0")
                      : stat.value.toLocaleString()
                    : stat.value}
                </p>
                <p className="mt-0.5 sm:mt-1 text-[9px] sm:text-[10px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
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
