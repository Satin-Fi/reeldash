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
      {/* Supahub-tier Fluid Ribbon Spark Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M 50 16 C 50 28.5 42 39 23 43 H 14 V 57 H 50 C 50 69.5 42 80 23 84 H 42 C 59 84 71 72 71 57 H 86 V 43 H 50 C 50 30.5 58 20 77 16 H 50 Z"
          fill="#8B5CF6"
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
