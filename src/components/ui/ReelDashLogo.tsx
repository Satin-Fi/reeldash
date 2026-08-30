"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

interface ReelDashLogoProps {
  size?: number;
  showText?: boolean;
  href?: string;
  className?: string;
}

export function ReelDashLogo({
  size = 28,
  showText = true,
  href,
  className = "",
}: ReelDashLogoProps) {
  const content = (
    <div className={`inline-flex items-center space-x-2.5 select-none ${className}`}>
      <div className="relative flex items-center justify-center shrink-0">
        <Image
          src="/logo.png"
          alt="ReelDash Logo"
          width={size}
          height={size}
          priority
          className="object-contain transition-transform duration-200 group-hover:scale-105"
        />
      </div>

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
