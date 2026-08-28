"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";

export function BentoGrid({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 max-w-7xl mx-auto ${className}`}
    >
      {children}
    </div>
  );
}

export function BentoCard({
  title,
  subtitle,
  icon,
  badge,
  actionText,
  onAction,
  className = "",
  children,
  colSpan = "md:col-span-1",
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
  children?: React.ReactNode;
  colSpan?: string;
}) {
  return (
    <div
      onClick={onAction}
      className={`group relative overflow-hidden rounded-2xl p-6 bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/[0.18] transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between ${colSpan} ${className}`}
    >
      {/* Background subtle radial glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-brand-500/5 group-hover:bg-brand-500/10 transition-colors blur-2xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {icon && (
              <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200/60 dark:border-white/[0.08] flex items-center justify-center text-brand-500 group-hover:scale-105 transition-transform">
                {icon}
              </div>
            )}
            {badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/10 border border-brand-500/20 text-brand-500">
                {badge}
              </span>
            )}
          </div>

          {actionText && (
            <div className="flex items-center space-x-1 text-xs font-semibold text-zinc-400 group-hover:text-brand-500 transition-colors">
              <span>{actionText}</span>
              <ArrowUpRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          )}
        </div>

        <h4 className="text-base font-bold tracking-tight text-zinc-900 dark:text-white mb-1">
          {title}
        </h4>
        {subtitle && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {children && <div className="mt-4 relative z-10">{children}</div>}
    </div>
  );
}
