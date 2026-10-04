"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getSupabaseClient } from "@/lib/supabase";
import { Bookmark, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type AuthMode = "login" | "signup" | "forgot";

interface UnifiedAuthPageProps {
  defaultMode?: AuthMode;
}

const MODE_CONFIG = {
  login: {
    title: "Welcome to Reeldash",
    subtitle: "Log in or create an account with your email",
    button: "Log in",
  },
  signup: {
    title: "Create your account",
    subtitle: "Start saving and organizing your Instagram Reels",
    button: "Create account",
  },
  forgot: {
    title: "Reset your password",
    subtitle: "Enter your email and we'll send you a reset link.",
    button: "Send reset link",
  },
};

export function UnifiedAuthPage({ defaultMode = "login" }: UnifiedAuthPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams?.get("next") || "/dashboard";
  const paramMode = searchParams?.get("mode") as AuthMode | null;

  const initialMode: AuthMode =
    paramMode === "signup" || paramMode === "forgot" ? paramMode : defaultMode;

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { login, signup, loginWithGoogle, isAuthenticated } = useAuth();

  useEffect(() => {
    if (paramMode && (paramMode === "login" || paramMode === "signup" || paramMode === "forgot")) {
      setMode(paramMode);
    }
  }, [paramMode]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push(nextPath);
    }
  }, [isAuthenticated, nextPath, router]);

  const switchMode = (newMode: AuthMode) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setMode(newMode);
    const params = new URLSearchParams(window.location.search);
    if (newMode === "login") {
      params.delete("mode");
    } else {
      params.set("mode", newMode);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    window.history.replaceState(null, "", `${window.location.pathname}${query}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage("Enter your email address.");
      return;
    }

    if (mode === "forgot") {
      setIsLoading(true);
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
            redirectTo: `${window.location.origin}/login?mode=recovery`,
          });
          if (error) {
            setErrorMessage(error.message);
            return;
          }
        }
        setSuccessMessage("If that email has an account, we've sent a reset link.");
      } catch (err: any) {
        setErrorMessage(err?.message || "Failed to send reset link.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorMessage("Enter your password.");
      return;
    }

    if (mode === "signup" && password.length < 6) {
      setErrorMessage("Use a password with at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "login") {
        const res = await login(cleanEmail, password);
        if (!res.success) {
          setErrorMessage(res.error || "Invalid email or password.");
        } else {
          router.push(nextPath);
        }
      } else {
        const cleanName = name.trim() || cleanEmail.split("@")[0];
        const res = await signup(cleanName, cleanEmail, password, false);
        if (!res.success) {
          setErrorMessage(res.error || "Failed to create account.");
        } else {
          router.push(nextPath);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle(nextPath);
    } catch (err: any) {
      setErrorMessage(err?.message || "Google sign in failed. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  const currentConfig = MODE_CONFIG[mode];

  return (
    <main className="relative min-h-screen min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 bg-[#0b0c0f] text-zinc-100 overflow-hidden font-sans selection:bg-[#CBB5FD]/30 selection:text-white">
      {/* Precision Geometric Trace Lines (from reeldash.vercel.app auth background) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-8%] opacity-40 sm:opacity-60"
        style={{
          backgroundImage: `
            linear-gradient(135deg, transparent 0 31%, rgba(255, 255, 255, 0.035) 31% calc(31% + 1px), transparent calc(31% + 1px) 100%),
            linear-gradient(90deg, transparent 0 18%, rgba(255, 255, 255, 0.035) 18% calc(18% + 1px), transparent calc(18% + 1px) 100%),
            linear-gradient(135deg, transparent 0 74%, rgba(255, 255, 255, 0.035) 74% calc(74% + 1px), transparent calc(74% + 1px) 100%),
            linear-gradient(90deg, transparent 0 82%, rgba(255, 255, 255, 0.035) 82% calc(82% + 1px), transparent calc(82% + 1px) 100%)
          `,
          backgroundPosition: "-220px 20px, 70% 72px, 94% 42%, 22% 96%",
          backgroundSize: "780px 420px, 920px 360px, 760px 520px, 880px 460px",
        }}
      />

      {/* Subtle Node Circles */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30 sm:opacity-50"
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(255, 255, 255, 0.07) 0 4px, rgba(255, 255, 255, 0.015) 5px 6px, transparent 7px),
            radial-gradient(circle, rgba(255, 255, 255, 0.07) 0 4px, rgba(255, 255, 255, 0.015) 5px 6px, transparent 7px),
            radial-gradient(circle, rgba(255, 255, 255, 0.07) 0 4px, rgba(255, 255, 255, 0.015) 5px 6px, transparent 7px)
          `,
          backgroundPosition: "8% 33%, 19% 8%, 92% 70%",
          backgroundSize: "420px 260px, 520px 340px, 460px 320px",
        }}
      />

      {/* Main Centered Panel (Matching exact 440px max-width, 24px radius, and elevation) */}
      <div className="relative z-10 w-full max-w-[440px] rounded-[24px] bg-[#121316] border border-white/[0.08] p-7 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col">
        {/* Brand Logo Mark */}
        <div className="flex justify-center mb-6">
          <Link
            href="/"
            aria-label="Reeldash home"
            className="group flex flex-col items-center gap-2"
          >
            <div className="size-14 rounded-2xl bg-[#CBB5FD] text-[#24163D] flex items-center justify-center shadow-lg shadow-[#CBB5FD]/15 transition-transform duration-200 group-hover:scale-105">
              <Bookmark size={26} strokeWidth={2.6} aria-hidden="true" />
            </div>
          </Link>
        </div>

        {/* Head Title & Subtitle */}
        <div className="text-center mb-7 space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {currentConfig.title}
          </h1>
          <p className="text-sm text-zinc-400">
            {currentConfig.subtitle}
          </p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <label htmlFor="auth-name" className="block text-xs font-medium text-zinc-300">
                Your Name
              </label>
              <input
                id="auth-name"
                type="text"
                autoComplete="name"
                placeholder="Alex Carter"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 px-3.5 bg-[#0b0c0f] border border-white/10 hover:border-white/20 focus:border-white/50 focus:ring-2 focus:ring-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none transition-all duration-150"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="auth-email" className="block text-xs font-medium text-zinc-300">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              required
              autoFocus={mode !== "signup"}
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-3.5 bg-[#0b0c0f] border border-white/10 hover:border-white/20 focus:border-white/50 focus:ring-2 focus:ring-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none transition-all duration-150"
            />
          </div>

          {(mode === "login" || mode === "signup") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="auth-password" className="block text-xs font-medium text-zinc-300">
                  Password
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={mode === "signup" ? 6 : undefined}
                  className="w-full h-11 px-3.5 pr-10 bg-[#0b0c0f] border border-white/10 hover:border-white/20 focus:border-white/50 focus:ring-2 focus:ring-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none transition-all duration-150"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-zinc-500 hover:text-zinc-300 p-1 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mode === "signup" && (
                <p className="text-[11px] text-zinc-500">Use at least 6 characters.</p>
              )}
            </div>
          )}

          {/* Feedback Alerts */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs leading-relaxed"
            >
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs leading-relaxed"
            >
              {successMessage}
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 mt-1 rounded-xl bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black font-semibold text-sm transition-all duration-150 flex items-center justify-center cursor-pointer disabled:opacity-60 shadow-sm"
          >
            {isLoading ? (
              <div className="size-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              currentConfig.button
            )}
          </button>
        </form>

        {/* Divider and Google One-Click Auth */}
        {(mode === "login" || mode === "signup") && (
          <>
            <div className="relative flex items-center justify-center my-5">
              <div className="w-full border-t border-white/[0.08]" />
              <span className="absolute px-3 bg-[#121316] text-xs text-zinc-500 font-medium">
                or
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full h-11 px-4 bg-[#18191f] hover:bg-[#202128] active:bg-[#14151a] text-zinc-200 text-sm font-medium rounded-xl border border-white/[0.08] hover:border-white/[0.15] flex items-center justify-center gap-2.5 transition-all duration-150 cursor-pointer disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <div className="size-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="size-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
              )}
              <span>Continue with Google</span>
            </button>
          </>
        )}

        {/* Mode Switch Footer */}
        <div className="mt-6 pt-2 text-center text-xs text-zinc-400 flex items-center justify-center gap-1.5">
          {mode === "login" && (
            <>
              <span>New to Reeldash?</span>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="text-white hover:underline font-medium transition-colors cursor-pointer"
              >
                Create account
              </button>
            </>
          )}

          {mode === "signup" && (
            <>
              <span>Already have an account?</span>
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="text-white hover:underline font-medium transition-colors cursor-pointer"
              >
                Log in
              </button>
            </>
          )}

          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="text-zinc-300 hover:text-white transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={13} /> Back to log in
            </button>
          )}
        </div>

        {/* Back to Home Link */}
        <div className="mt-5 text-center">
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center gap-1 group"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">←</span> Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
