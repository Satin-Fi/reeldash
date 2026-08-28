"use client";

import React from "react";

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className = "" }: BentoGridProps) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr ${className}`}
    >
      {children}
    </div>
  );
}

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  span?: "col-span-1" | "col-span-2" | "col-span-3" | "row-span-2";
  onClick?: () => void;
}

export function BentoCard({
  children,
  className = "",
  span = "col-span-1",
  onClick,
}: BentoCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-rd-xl border border-borderSubtle-light dark:border-borderSubtle-dark bg-surface-light dark:bg-surface-dark p-5 shadow-rd-subtle transition-all duration-200 hover:border-brand-500/30 ${span} ${className}`}
    >
      {children}
    </div>
  );
}
