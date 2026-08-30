"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { SplineScene } from "@/components/ui/SplineScene";
import {
  Eye,
  EyeOff,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, loginWithGoogle } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    login(email);
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090b] text-zinc-100 flex items-stretch font-sans selection:bg-white/20 selection:text-white">
      {/* ========================================================================= */}
      {/* LEFT COLUMN: PURE INTERACTIVE 3D SPLINE SCENE                             */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 border-r border-white/[0.06] bg-[#050608] overflow-hidden select-none">
        {/* Clean Logo Only */}
        <div className="relative z-20 flex items-center">
          <Link href="/" className="inline-flex items-center">
            <span className="text-base font-semibold tracking-tight text-white hover:text-zinc-300 transition-colors">
              ReelDash
            </span>
          </Link>
        </div>

        {/* Center: Full Interactive 3D Spline Canvas */}
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>

        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-transparent to-[#050608]/40 pointer-events-none z-15" />

        {/* Clean Bottom Text */}
        <div className="relative z-20 space-y-2 max-w-md">
          <h2 className="text-2xl xl:text-3xl font-semibold tracking-tight text-white leading-snug">
            Welcome back to your workspace.
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed font-normal">
            Access your organized Instagram reels, audio clips, and collections.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: LOGIN INTERFACE                                            */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-[380px] space-y-8"
        >
          {/* Mobile Top Brand */}
          <div className="lg:hidden flex items-center justify-between pb-4 border-b border-white/[0.06]">
            <Link href="/" className="inline-flex items-center">
              <span className="text-base font-semibold tracking-tight text-white">ReelDash</span>
            </Link>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
              Sign in to your account
            </h1>
            <p className="text-xs text-zinc-400">
              Enter your credentials or continue with Google.
            </p>
          </div>

          {/* Google One-Click Auth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full py-2.5 px-4 bg-[#111215] hover:bg-[#16171b] active:bg-[#0e0f12] text-zinc-200 text-xs sm:text-sm font-medium rounded-xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] flex items-center justify-center space-x-2.5 transition-all duration-150 cursor-pointer disabled:opacity-60 group"
          >
            {isGoogleLoading ? (
              <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
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

          {/* Minimalist Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-white/[0.06]" />
            <span className="absolute px-3 bg-[#08090b] text-[10px] font-mono tracking-widest text-zinc-600 uppercase">
              OR
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-zinc-400">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#111215] border border-white/[0.08] hover:border-white/[0.14] focus:border-white/30 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-all duration-150"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-zinc-400">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 bg-[#111215] border border-white/[0.08] hover:border-white/[0.14] focus:border-white/30 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-all duration-150"
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
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black font-semibold text-xs sm:text-sm shadow-sm flex items-center justify-center space-x-2 transition-all duration-150 cursor-pointer disabled:opacity-60"
            >
              <span>{isSubmitting ? "Signing in..." : "Sign in"}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-xs text-zinc-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-zinc-300 hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              Create one free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
