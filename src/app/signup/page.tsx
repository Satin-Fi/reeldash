"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { ReelDashLogo } from "@/components/ui/ReelDashLogo";
import {
  Eye,
  EyeOff,
  Check,
  ChevronRight,
  Copy,
  CheckCircle2,
  Loader2,
  Instagram,
  RefreshCw,
} from "lucide-react";
import { getClientAuthHeaders } from "@/lib/clientAuth";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStep = searchParams?.get("step") === "instagram" ? 2 : 1;

  const [step, setStep] = useState<1 | 2>(initialStep as 1 | 2);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Step 2: Challenge code state
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null);
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [isCodeExpired, setIsCodeExpired] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [linkedUsername, setLinkedUsername] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // DM Verification Code redemption state
  const [dmCode, setDmCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dmCode.trim()) return;
    setIsRedeeming(true);
    setRedeemError(null);

    try {
      const headers = await getClientAuthHeaders(user?.id);
      headers["Content-Type"] = "application/json";
      const res = await fetch("/api/instagram/link-code", {
        method: "POST",
        headers,
        body: JSON.stringify({ code: dmCode.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsLinked(true);
        setLinkedUsername(data.username ? `@${data.username}` : null);
        if (pollRef.current) clearInterval(pollRef.current);
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        setRedeemError(data.error || "Failed to verify code.");
      }
    } catch (err: any) {
      setRedeemError(err?.message || "Connection error. Please try again.");
    } finally {
      setIsRedeeming(false);
    }
  };

  const { signup, signupWithGoogle, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (searchParams?.get("step") === "instagram") {
      setStep(2);
    }
  }, [searchParams]);

  // Generate challenge code on Step 2 mount
  useEffect(() => {
    if (step === 2 && isAuthenticated && !linkCode && !isLinked) {
      generateCode();
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [step, isAuthenticated]);

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
        setCodeExpiresAt(data.expiresAt);
        startPolling();
      } else {
        console.warn("[Signup] Failed to generate link code");
      }
    } catch (err) {
      console.warn("[Signup] Code generation error:", err);
    } finally {
      setIsCodeLoading(false);
    }
  }, [user?.id]);

  const startPolling = useCallback(() => {
    // Clear any existing poll
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const headers = await getClientAuthHeaders(user?.id);
        const res = await fetch("/api/instagram/link-code", { headers });
        if (!res.ok) return;

        const data = await res.json();

        if (data.linked) {
          // Success!
          setIsLinked(true);
          setLinkedUsername(data.username);
          if (pollRef.current) clearInterval(pollRef.current);

          // Redirect after celebration
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
      // Fallback
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

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setIsSubmitting(true);

    try {
      signup(name, email, false);
      setIsSubmitting(false);
      setStep(2);
    } catch {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    try {
      await signupWithGoogle(
        {
          name: "Creator",
          email: "creator@reeldash.app",
          avatar: "",
        },
        false
      );
      setIsGoogleLoading(false);
      setStep(2);
    } catch {
      setIsGoogleLoading(false);
    }
  };

  const handleSkipInstagram = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100 flex flex-col items-center justify-center p-6 sm:p-8 font-sans selection:bg-white/20 selection:text-white">
      {/* Top Header Logo */}
      <div className="mb-8">
        <ReelDashLogo href="/" size={32} textSize="text-[24px]" />
      </div>

      {/* Main Centered Card */}
      <div className="w-full max-w-[380px] bg-[#0c0d10] border border-white/[0.08] rounded-2xl p-7 sm:p-8 shadow-2xl space-y-6">
        {/* Step Progress */}
        <div className="flex items-center justify-between pb-1 border-b border-white/[0.05]">
          <div className="flex items-center space-x-2">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                step === 1
                  ? "bg-white text-black"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              }`}
            >
              {step === 2 ? <Check className="w-3 h-3" /> : "1"}
            </div>
            <div className="w-4 h-[1px] bg-zinc-800" />
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                step === 2
                  ? "bg-white text-black"
                  : "bg-zinc-900 text-zinc-600 border border-zinc-800"
              }`}
            >
              2
            </div>
          </div>
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
            {step === 1 ? "Step 1 of 2" : "Step 2 of 2"}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            /* ── STEP 1: CREATE ACCOUNT ── */
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="space-y-1">
                <h1 className="text-xl font-semibold tracking-tight text-white">
                  Create your workspace
                </h1>
                <p className="text-xs text-zinc-400">
                  Save and organize Instagram references automatically.
                </p>
              </div>

              {/* Google OAuth */}
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={isGoogleLoading}
                className="w-full py-2.5 px-4 bg-[#14151a] hover:bg-[#1a1b22] active:bg-[#111216] text-zinc-200 text-xs sm:text-sm font-medium rounded-xl border border-white/[0.08] flex items-center justify-center space-x-2.5 transition-colors duration-150 cursor-pointer disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-white/[0.06]" />
                <span className="absolute px-2.5 bg-[#0c0d10] text-[10px] font-mono tracking-widest text-zinc-600 uppercase">
                  OR
                </span>
              </div>

              {/* Email form */}
              <form onSubmit={handleEmailSignup} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-zinc-400">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Alex Rivera"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#14151a] border border-white/[0.08] hover:border-white/[0.14] focus:border-white/30 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors duration-150"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-zinc-400">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="alex@reeldash.app"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#14151a] border border-white/[0.08] hover:border-white/[0.14] focus:border-white/30 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors duration-150"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-zinc-400">Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 bg-[#14151a] border border-white/[0.08] hover:border-white/[0.14] focus:border-white/30 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors duration-150"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black font-semibold text-xs sm:text-sm shadow-sm flex items-center justify-center space-x-1.5 transition-colors duration-150 cursor-pointer disabled:opacity-60"
                >
                  <span>{isSubmitting ? "Creating..." : "Continue"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          ) : (
            /* ── STEP 2: CONNECT INSTAGRAM VIA DM CODE ── */
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight text-white">
                  Connect Instagram
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Send this code to <span className="text-zinc-200 font-medium">@ReelDash</span> on Instagram DM to verify your account.
                </p>
              </div>

              {/* Success State */}
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
                      <p className="text-xs text-zinc-400 font-mono">{linkedUsername}</p>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500">Redirecting to dashboard...</p>
                </motion.div>
              ) : isCodeLoading ? (
                /* Loading State */
                <div className="py-10 flex flex-col items-center space-y-3">
                  <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
                  <p className="text-xs text-zinc-500">Generating your code...</p>
                </div>
              ) : isCodeExpired ? (
                /* Expired State */
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
                /* Active Code State */
                <div className="space-y-4">
                  {/* Code Display */}
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
                            <span className="text-[11px] text-emerald-400">Copied</span>
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

                  {/* How-to steps */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-start space-x-2.5">
                      <div className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] font-mono text-zinc-400 mt-0.5 shrink-0">1</div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">Open Instagram and go to <span className="text-zinc-200">@ReelDash</span></p>
                    </div>
                    <div className="flex items-start space-x-2.5">
                      <div className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] font-mono text-zinc-400 mt-0.5 shrink-0">2</div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">Send the code above as a DM</p>
                    </div>
                    <div className="flex items-start space-x-2.5">
                      <div className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] font-mono text-zinc-400 mt-0.5 shrink-0">3</div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">Come back here — it connects automatically</p>
                    </div>
                  </div>

                  {/* Polling indicator */}
                  <div className="flex items-center justify-center space-x-2 pt-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-pulse" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-pulse" style={{ animationDelay: "300ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-pulse" style={{ animationDelay: "600ms" }} />
                    </div>
                    <span className="text-[11px] text-zinc-500">Waiting for verification</span>
                  </div>

                  {/* Alternative: Enter code received in DM */}
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
                    {redeemError && (
                      <p className="text-[11px] text-red-400 font-medium">{redeemError}</p>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Skip */}
              {!isLinked && (
                <button
                  type="button"
                  onClick={handleSkipInstagram}
                  className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors text-center cursor-pointer"
                >
                  Skip for now
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-zinc-500 pt-2 border-t border-white/[0.05]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-zinc-300 hover:text-white transition-colors underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050608] flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
