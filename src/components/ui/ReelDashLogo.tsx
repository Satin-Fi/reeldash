"use client";

import React from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";

interface ReelDashLogoProps {
  size?: number;
  showText?: boolean;
  href?: string;
  className?: string;
  textSize?: string;
  inverted?: boolean;
}

export function ReelDashLogo({
  size = 30,
  showText = true,
  href,
  className = "",
  textSize = "text-[20px]",
  inverted = false,
}: ReelDashLogoProps) {
  const badgeSize = Math.max(26, size);
  const iconSize = Math.max(13, Math.round(badgeSize * 0.52));

  const content = (
    <div
      className={`inline-flex items-center gap-2.5 font-bold tracking-[-0.06em] select-none ${textSize} ${
        inverted ? "text-white" : "text-[#17181C] dark:text-white"
      } ${className}`}
    >
      {/* Precision Lavender Squircle Badge */}
      <span
        style={{ width: badgeSize, height: badgeSize }}
        className={`flex shrink-0 items-center justify-center rounded-[10px] transition-transform duration-200 group-hover:scale-105 ${
          inverted ? "bg-white text-[#17181C]" : "bg-[#CBB5FD] text-[#24163D]"
        }`}
      >
        <Bookmark size={iconSize} strokeWidth={2.6} aria-hidden="true" />
      </span>

      {/* reeldash. Wordmark */}
      {showText && (
        <span className="leading-none flex items-center">
          reeldash<span className="-ml-1 text-[#9C7ADA] font-extrabold">.</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label="Reeldash home"
        className="inline-flex items-center group transition-opacity hover:opacity-90"
      >
        {content}
      </Link>
    );
  }

  return content;
}

