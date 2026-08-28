"use client";

import React from "react";

export function ShimmerButton({
  children,
  onClick,
  className = "",
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-xl p-[1px] font-semibold text-xs transition-all duration-300 active:scale-95 cursor-pointer ${className}`}
    >
      {/* 21st.dev Rotating Shimmer Border Gradient */}
      <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#7C3AED_0%,#EC4899_50%,#7C3AED_100%)] opacity-80 group-hover:opacity-100 transition-opacity" />

      {/* Button Content Surface */}
      <span
        className={`inline-flex h-full w-full items-center justify-center space-x-2 rounded-xl px-4 py-2 backdrop-blur-3xl transition-colors ${
          variant === "primary"
            ? "bg-zinc-950 text-white group-hover:bg-zinc-900"
            : "bg-white text-zinc-950 group-hover:bg-zinc-100"
        }`}
      >
        {children}
      </span>
    </button>
  );
}

export function GlowingBadge({
  children,
  color = "brand",
  pulse = true,
  className = "",
}: {
  children: React.ReactNode;
  color?: "brand" | "emerald" | "amber" | "purple";
  pulse?: boolean;
  className?: string;
}) {
  const colorMap = {
    brand: "bg-brand-500/10 text-brand-500 border-brand-500/20 dot-brand-500",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 dot-emerald-400",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20 dot-amber-400",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20 dot-purple-400",
  };

  return (
    <span
      className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${colorMap[color]} backdrop-blur-md ${className}`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      <span>{children}</span>
    </span>
  );
}
