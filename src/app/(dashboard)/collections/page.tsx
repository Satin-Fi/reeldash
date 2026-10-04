"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CollectionsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/categories");
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
    </div>
  );
}
