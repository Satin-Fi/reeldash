"use client";

import React, { Suspense } from "react";
import { UnifiedAuthPage } from "@/components/auth/UnifiedAuthPage";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b0c0f] flex items-center justify-center">
          <div className="size-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      }
    >
      <UnifiedAuthPage defaultMode="login" />
    </Suspense>
  );
}
