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
      {/* Linear-tier Interlocking Kinetic Glyph */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 transition-transform duration-200 hover:scale-105"
      >
        {/* Left Diamond: Electric Ultraviolet */}
        <path
          d="M 23 11 L 37 25 L 23 39 L 9 25 Z"
          stroke="#8B5CF6"
          strokeWidth="5.5"
          strokeLinejoin="miter"
        />
        {/* Right Diamond: Cyber White */}
        <path
          d="M 41 25 L 55 39 L 41 53 L 27 39 Z"
          stroke="#FFFFFF"
          strokeWidth="5.5"
          strokeLinejoin="miter"
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
