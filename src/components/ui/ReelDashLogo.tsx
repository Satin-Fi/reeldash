"use client";

import React from "react";
import Link from "next/link";

interface ReelDashLogoProps {
  size?: number;
  showText?: boolean;
  href?: string;
  className?: string;
}

export function ReelDashLogo({
  size = 24,
  showText = true,
  href,
  className = "",
}: ReelDashLogoProps) {
  const content = (
    <div className={`inline-flex items-center space-x-2.5 select-none ${className}`}>
      {/* Runway / Raycast tier Monoline 'R' Glyph */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
      >
        <path
          d="M 22 12 H 34 C 41.732 12 48 18.268 48 26 C 48 31.8 44.5 36.7 39.5 38.8 L 47.5 48.8 C 48.8 50.4 47.6 52 45.5 52 H 39 C 37.8 52 36.7 51.3 36 50.4 L 28.5 40 H 22 V 48 C 22 50.2 20.2 52 18 52 C 15.8 52 14 50.2 14 48 V 16 C 14 13.8 15.8 12 18 12 H 22 Z M 22 20 V 32 H 34 C 37.314 32 40 29.314 40 26 C 40 22.686 37.314 20 34 20 H 22 Z"
          fill="#FFFFFF"
        />
      </svg>

      {showText && (
        <span className="text-base font-semibold tracking-tight text-white font-sans">
          ReelDash
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center group">
        {content}
      </Link>
    );
  }

  return content;
}
