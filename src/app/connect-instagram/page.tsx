"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ReelDashLogo } from "@/components/ui/ReelDashLogo";
import {
  Copy,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Instagram,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";

export default function ConnectInstagramPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [isCodeExpired, setIsCodeExpired] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [linkedUsername, setLinkedUsername] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Redirect unauthenticated users to signup
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/signup?source=instagram&next=/connect-instagram");
    }
  }, [isLoading, isAuthenticated, router]);

  // Generate code on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && !linkCode && !isLinked) {
      generateCode();
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isAuthenticated]);

  const generateCode = useCallback(async () => {
    setIsCodeLoading(true);
    setIsCodeExpired(false);
    setLinkCode(null);

    try {
      const res = await fetch("/api/instagram/link-code", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setLinkCode(data.code);
        startPolling();
      } else if (res.status === 401) {
        router.replace("/signup?source=instagram&next=/connect-instagram");
      }
    } catch (err) {
      console.warn("[ConnectInstagram] Code generation error:", err);
    } finally {
      setIsCodeLoading(false);
    }
  }, [router]);

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/instagram/link-code");
        if (!res.ok) return;

        const data = await res.json();

        if (data.linked) {
          setIsLinked(true);
          setLinkedUsername(data.username);
          if (pollRef.current) clearInterval(pollRef.current);
          setTimeout(() => router.push("/dashboard"), 2000);
          return;
        }

        if (data.expired) {
          setIsCodeExpired(true);
          setLinkCode(null);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // Network error — keep polling
      }
    }, 3000);
  }, [router]);

  const handleCopyCode = async () => {
    if (!linkCode) return;
    try {
      await navigator.clipboard.writeText(linkCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = linkCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050608] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100 flex flex-col items-center justify-center p-6 sm:p-8 font-sans selection:bg-white/20 selection:text-white">
      <div className="mb-8">
        <ReelDashLogo href="/" size={32} textSize="text-[24px]" />
      </div>

      <div className="w-full max-w-[380px] bg-[#0c0d10] border border-white/[0.08] rounded-2xl p-7 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2 mb-2">
            <Instagram className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Verification
            </span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Connect Instagram
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Send this code to{" "}
            <span className="text-zinc-200 font-medium">@ReelDash</span> on
            Instagram DM to connect your account.
          </p>
        </div>

        {/* Success */}
        {isLinked ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="py-8 flex flex-col items-center space-y-3"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-white">Connected!</p>
              {linkedUsername && (
                <p className="text-xs text-zinc-400 font-mono">
                  {linkedUsername}
                </p>
              )}
            </div>
            <p className="text-[11px] text-zinc-500">
              Redirecting to dashboard...
            </p>
          </motion.div>
        ) : isCodeLoading ? (
          <div className="py-10 flex flex-col items-center space-y-3">
            <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
            <p className="text-xs text-zinc-500">Generating your code...</p>
          </div>
        ) : isCodeExpired ? (
          <div className="py-6 flex flex-col items-center space-y-4">
            <p className="text-xs text-zinc-400 text-center">
              Your code has expired.
            </p>
            <button
              onClick={generateCode}
              className="px-4 py-2 rounded-xl bg-[#14151a] hover:bg-[#1a1b22] border border-white/[0.08] text-xs text-zinc-200 font-medium flex items-center space-x-2 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Generate new code</span>
            </button>
          </div>
        ) : linkCode ? (
          <div className="space-y-4">
            {/* Code */}
            <button
              onClick={handleCopyCode}
              className="w-full group relative py-4 px-5 bg-[#14151a] hover:bg-[#1a1b22] border border-white/[0.08] hover:border-white/[0.14] rounded-xl transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-bold tracking-[0.15em] text-white">
                  {linkCode}
                </span>
                <div className="flex items-center space-x-1.5 text-zinc-500 group-hover:text-zinc-300 transition-colors">
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-[11px] text-emerald-400">
                        Copied
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" strokeWidth={1.5} />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </div>
              </div>
            </button>

            {/* Steps */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-start space-x-2.5">
                <div className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] font-mono text-zinc-400 mt-0.5 shrink-0">
                  1
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Open Instagram and go to{" "}
                  <span className="text-zinc-200">@ReelDash</span>
                </p>
              </div>
              <div className="flex items-start space-x-2.5">
                <div className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] font-mono text-zinc-400 mt-0.5 shrink-0">
                  2
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Send the code above as a DM
                </p>
              </div>
              <div className="flex items-start space-x-2.5">
                <div className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] font-mono text-zinc-400 mt-0.5 shrink-0">
                  3
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Come back here — it connects automatically
                </p>
              </div>
            </div>

            {/* Polling */}
            <div className="flex items-center justify-center space-x-2 pt-2">
              <div className="flex space-x-1">
                <div
                  className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-pulse"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-pulse"
                  style={{ animationDelay: "300ms" }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-pulse"
                  style={{ animationDelay: "600ms" }}
                />
              </div>
              <span className="text-[11px] text-zinc-500">
                Waiting for verification
              </span>
            </div>
          </div>
        ) : null}

        {/* Back link */}
        {!isLinked && (
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full flex items-center justify-center space-x-1.5 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to dashboard</span>
          </button>
        )}
      </div>
    </div>
  );
}
