"use client";

import { AuthProvider } from "@/context/AuthContext";
import { ReelProvider } from "@/context/ReelContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ReelProvider>
        {children}
      </ReelProvider>
    </AuthProvider>
  );
}
