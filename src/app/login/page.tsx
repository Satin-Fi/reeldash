"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, Mail, Lock, Zap, Eye, EyeOff } from "lucide-react";
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
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-brand-500/30 selection:text-brand-200">
      {/* Ambient Radial Mesh Lighting */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-brand-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Subtle Noise Texture */}
      <div
        className="absolute inset-0 opacity-[0.018] pointer-events-none bg-repeat"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Double-Bezel Hardware Card */}
        <div className="p-1.5 sm:p-2 rounded-[2rem] bg-gradient-to-b from-zinc-800/60 via-zinc-900/40 to-zinc-900/80 ring-1 ring-white/10 shadow-2xl backdrop-blur-2xl">
          <div className="bg-zinc-950/90 rounded-[calc(2rem-0.5rem)] p-6 sm:p-8 border border-zinc-800/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] space-y-6">
            {/* Logo & Heading */}
            <div className="text-center space-y-3">
              <Link href="/" className="inline-flex items-center space-x-2.5 group">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/25 ring-1 ring-white/20 transition-transform group-hover:scale-105 duration-300">
                  <Zap className="w-5 h-5 fill-white text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  ReelDash
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-brand-500/20 text-brand-300 border border-brand-500/30 font-medium">
                    PRO
                  </span>
                </span>
              </Link>
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Welcome back
                </h1>
                <p className="text-xs text-zinc-400">
                  Sign in to access your curated Instagram library
                </p>
              </div>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full py-3 px-4 bg-zinc-900/90 hover:bg-zinc-800/90 active:bg-zinc-800 text-zinc-100 font-semibold text-xs sm:text-sm rounded-2xl border border-zinc-700/60 shadow-md flex items-center justify-center space-x-3 transition-all duration-200 hover:border-zinc-500/80 hover:shadow-zinc-900/50 cursor-pointer disabled:opacity-60"
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

            {/* Or Divider */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-zinc-800/80" />
              <span className="absolute px-3 bg-zinc-950 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                or with email
              </span>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-900/70 border border-zinc-800 rounded-2xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-zinc-900/70 border border-zinc-800 rounded-2xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Primary Nested CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full group mt-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 active:scale-[0.99] text-white font-semibold text-sm shadow-xl shadow-brand-500/25 flex items-center justify-between transition-all duration-300 cursor-pointer disabled:opacity-60"
              >
                <span className="font-semibold tracking-wide">
                  {isSubmitting ? "Signing in..." : "Sign in to ReelDash"}
                </span>
                <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center transition-transform group-hover:translate-x-1 duration-200">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </form>

            <p className="text-center text-xs text-zinc-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-brand-400 font-semibold hover:text-brand-300 transition-colors underline-offset-4 hover:underline"
              >
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
