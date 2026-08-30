"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

interface ReelDashLogoProps {
  size?: number;
  showText?: boolean;
  href?: string;
  className?: string;
  textSize?: string;
}

export function ReelDashLogo({
  size = 30,
  showText = true,
  href,
  className = "",
  textSize = "text-[22px]",
}: ReelDashLogoProps) {
  const content = (
    <div className={`inline-flex items-center space-x-2.5 select-none ${className}`}>
      {/* Precision Icon Mark */}
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo.png"
          alt="ReelDash"
          width={size}
          height={size}
          priority
          className="object-contain w-full h-full transition-transform duration-200 group-hover:scale-105"
        />
      </div>

      {/* Supahub-Calibrated Bricolage Grotesque Wordmark (Theme-Aware) */}
      {showText && (
        <span
          className={`font-bricolage font-extrabold ${textSize} tracking-[-0.035em] text-zinc-900 dark:text-white leading-none flex items-center transition-colors duration-150`}
        >
          ReelDash
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center group transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
