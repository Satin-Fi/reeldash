"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ReelDashLogo } from "@/components/ui/ReelDashLogo";
import { Eye, EyeOff, ChevronRight } from "lucide-react";
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
    <div className="min-h-screen bg-[#050608] text-zinc-100 flex flex-col items-center justify-center p-6 sm:p-8 font-sans selection:bg-white/20 selection:text-white">
      {/* Top Header Logo */}
      <div className="mb-8">
        <ReelDashLogo href="/" size={28} />
      </div>

      {/* Main Centered Minimalist Card */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-[380px] bg-[#0c0d10] border border-white/[0.08] rounded-2xl p-7 sm:p-8 shadow-2xl space-y-5"
      >
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Sign in to your account
          </h1>
          <p className="text-xs text-zinc-400">
            Access your Instagram reels, clips, and collections.
          </p>
        </div>

        {/* Google One-Click Auth */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          className="w-full py-2.5 px-4 bg-[#14151a] hover:bg-[#1a1b22] active:bg-[#111216] text-zinc-200 text-xs sm:text-sm font-medium rounded-xl border border-white/[0.08] flex items-center justify-center space-x-2.5 transition-colors duration-150 cursor-pointer disabled:opacity-60"
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

        {/* Minimal Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-white/[0.06]" />
          <span className="absolute px-2.5 bg-[#0c0d10] text-[10px] font-mono tracking-widest text-zinc-600 uppercase">
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
              className="w-full px-3.5 py-2.5 bg-[#14151a] border border-white/[0.08] hover:border-white/[0.14] focus:border-white/30 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors duration-150"
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
            <span>{isSubmitting ? "Signing in..." : "Sign in"}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-zinc-500 pt-2 border-t border-white/[0.05]">
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
  );
}
