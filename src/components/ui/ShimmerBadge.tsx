"use client";

import React from "react";

interface ShimmerBadgeProps {
  children: React.ReactNode;
  className?: string;
  shimmerColor?: string;
  onClick?: () => void;
}

/**
 * 21st.dev / Magic UI Shimmer Badge
 * Elegant badge with an animated shimmering light reflection.
 */
export function ShimmerBadge({
  children,
  className = "",
  shimmerColor = "rgba(255, 255, 255, 0.2)",
  onClick,
}: ShimmerBadgeProps) {
  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center p-[1px] overflow-hidden rounded-full font-medium transition-all ${
        onClick ? "cursor-pointer active:scale-95" : ""
      } ${className}`}
    >
      <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#6366F1_0%,#EC4899_50%,#6366F1_100%)]" />
      <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark px-3 py-1 text-xs font-semibold text-primaryText-light dark:text-primaryText-dark backdrop-blur-3xl space-x-1.5">
        {children}
      </span>
    </div>
  );
}
