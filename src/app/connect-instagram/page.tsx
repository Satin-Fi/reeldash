"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getClientAuthHeaders } from "@/lib/clientAuth";
import { ReelDashLogo } from "@/components/ui/ReelDashLogo";
import {
  Copy,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Instagram,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";

function ConnectInstagramContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeParam = searchParams?.get("code");
  const { user, isAuthenticated, isLoading, loginWithGoogle } = useAuth();

  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [isCodeExpired, setIsCodeExpired] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [linkedUsername, setLinkedUsername] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // DM Verification Code entry state
  const [dmCode, setDmCode] = useState(codeParam || "");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const hasAutoRedeemedRef = useRef(false);

  const executeRedeem = useCallback(
    async (codeToRedeem: string) => {
      if (!codeToRedeem.trim()) return;
      setIsRedeeming(true);
      setRedeemError(null);

      try {
        const headers = await getClientAuthHeaders(user?.id);
        headers["Content-Type"] = "application/json";
        const res = await fetch("/api/instagram/link-code", {
          method: "POST",
          headers,
          body: JSON.stringify({ code: codeToRedeem.trim() }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setIsLinked(true);
          setLinkedUsername(data.username ? `@${data.username}` : null);
          if (pollRef.current) clearInterval(pollRef.current);
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("reeldash_pending_code");
          }
          setTimeout(() => router.push("/dashboard"), 1800);
        } else {
          setRedeemError(data.error || "Failed to verify code.");
        }
      } catch (err: any) {
        setRedeemError(err?.message || "Connection error. Please try again.");
      } finally {
        setIsRedeeming(false);
      }
    },
    [user?.id, router]
  );

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeRedeem(dmCode);
  };

  // Persist code across Google OAuth redirects
  useEffect(() => {
    if (codeParam && typeof window !== "undefined") {
      sessionStorage.setItem("reeldash_pending_code", codeParam.trim());
      setDmCode(codeParam.trim());
    }
  }, [codeParam]);

  const activePendingCode =
    (codeParam ||
      (typeof window !== "undefined"
        ? sessionStorage.getItem("reeldash_pending_code")
        : null))?.trim() || "";

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      if (activePendingCode && typeof window !== "undefined") {
        sessionStorage.setItem("reeldash_pending_code", activePendingCode);
      }
      const nextPath = activePendingCode
        ? `/connect-instagram?code=${encodeURIComponent(activePendingCode)}`
        : "/connect-instagram";
      await loginWithGoogle(nextPath);
    } catch (err) {
      console.error("[ConnectInstagram] Google sign-in failed:", err);
      setIsGoogleLoading(false);
    }
  };

  // Handle 1-click auto redeem or challenge code generation when authenticated
  useEffect(() => {
    if (!isAuthenticated || isLinked) return;

    if (activePendingCode && !hasAutoRedeemedRef.current) {
      hasAutoRedeemedRef.current = true;
      setDmCode(activePendingCode);
      executeRedeem(activePendingCode);
    } else if (!activePendingCode && !linkCode) {
      generateCode();
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isAuthenticated, isLinked, activePendingCode, linkCode, executeRedeem]);

  const generateCode = useCallback(async () => {
    setIsCodeLoading(true);
    setIsCodeExpired(false);
    setLinkCode(null);

    try {
      const headers = await getClientAuthHeaders(user?.id);
      const res = await fetch("/api/instagram/link-code", {
        method: "POST",
        headers,
      });
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
  }, [user?.id, router]);

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const headers = await getClientAuthHeaders(user?.id);
        const res = await fetch("/api/instagram/link-code", { headers });
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

  // ─── Step 1: Unauthenticated -> Enforce Google Login First ───────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050608] text-zinc-100 flex flex-col items-center justify-center p-6 sm:p-8 font-sans selection:bg-white/20 selection:text-white">
        <div className="mb-8">
          <ReelDashLogo href="/" size={32} textSize="text-[24px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-[390px] bg-[#0c0d10] border border-white/[0.08] rounded-2xl p-7 sm:p-8 shadow-2xl space-y-6"
        >
          {/* Header */}
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                <Instagram className="w-3.5 h-3.5 text-pink-400" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                Instagram Connection
              </span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-white">
              Connect your Instagram
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Sign in with your Google account first to link your Instagram and start saving your Reels.
            </p>
          </div>

          {/* Active Code Badge */}
          {activePendingCode && (
            <div className="py-2.5 px-3.5 rounded-xl bg-[#14151a] border border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-zinc-300">Code ready to link</span>
              </div>
              <span className="font-mono text-xs font-bold text-white tracking-widest px-2 py-0.5 rounded bg-white/10">
                {activePendingCode}
              </span>
            </div>
          )}

          {/* Google Sign-In Button */}
          <div className="space-y-3 pt-1">
            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full py-3 px-4 bg-white hover:bg-zinc-100 text-black font-semibold text-sm rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-zinc-800" />
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
              Use your Gmail account to sign in. Once authenticated, your Instagram identity will be connected automatically.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100 flex flex-col items-center justify-center p-6 sm:p-8 font-sans selection:bg-white/20 selection:text-white">
      <div className="mb-8">
        <ReelDashLogo href="/" size={32} textSize="text-[24px]" />
      </div>

      <div className="w-full max-w-[390px] bg-[#0c0d10] border border-white/[0.08] rounded-2xl p-7 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2 mb-2">
            <Instagram className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Instagram Connection
            </span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Connect Instagram
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {isRedeeming
              ? "Connecting your account and claiming your Reels..."
              : isLinked
              ? "Instagram connection complete."
              : "Verify your Instagram connection to save Reels directly."}
          </p>
        </div>

        {/* State A: Redeeming Code */}
        {isRedeeming ? (
          <div className="py-10 flex flex-col items-center space-y-3">
            <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-white">
                Connecting your account...
              </p>
              <p className="text-xs text-zinc-400">
                Verifying code & saving your Reels to your library
              </p>
            </div>
          </div>
        ) : isLinked ? (
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
        ) : (
          <div className="space-y-4">
            {redeemError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold">Verification failed</p>
                  <p className="text-[11px] text-red-300">{redeemError}</p>
                </div>
              </div>
            )}

            {isCodeLoading ? (
              <div className="py-8 flex flex-col items-center space-y-3">
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

            {/* Manual code redemption form - ALWAYS available */}
            <div className="pt-3 border-t border-white/[0.08] space-y-2">
              <p className="text-[11px] text-zinc-400 font-medium">
                Got a code from @ReelDash on Instagram?
              </p>
              <form onSubmit={handleRedeemCode} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 7K4P92"
                  maxLength={10}
                  value={dmCode}
                  onChange={(e) => {
                    setDmCode(e.target.value.toUpperCase());
                    setRedeemError(null);
                  }}
                  className="flex-1 px-3 py-2 bg-[#14151a] border border-white/[0.1] rounded-xl font-mono text-xs uppercase tracking-wider text-white placeholder:text-zinc-600 focus:border-white/30 outline-none"
                />
                <button
                  type="submit"
                  disabled={isRedeeming || !dmCode.trim()}
                  className="px-3.5 py-2 bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-xl disabled:opacity-50 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {isRedeeming ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Connect</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Back link */}
        {!isLinked && !isRedeeming && (
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

export default function ConnectInstagramPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050608] flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      }
    >
      <ConnectInstagramContent />
    </Suspense>
  );
}
