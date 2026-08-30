"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowRight,
  Lock,
  Mail,
  User,
  Instagram,
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  Layers,
  Flame,
  AtSign,
  Check,
} from "lucide-react";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStep = searchParams?.get("step") === "instagram" ? 2 : 1;

  const [step, setStep] = useState<1 | 2>(initialStep as 1 | 2);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [instagramHandle, setInstagramHandle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [instaConnected, setInstaConnected] = useState(false);

  const { signup, signupWithGoogle, updateUser } = useAuth();

  // Handle Step 1: Account Creation
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setIsSubmitting(true);

    try {
      // Create user without immediate redirect
      signup(name, email, false);
      // Smoothly transition to Step 2: Instagram Handle
      setTimeout(() => {
        setIsSubmitting(false);
        setStep(2);
      }, 400);
    } catch {
      setIsSubmitting(false);
    }
  };

  // Handle Google Auth
  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    try {
      await signupWithGoogle(
        {
          name: "Creator",
          email: "creator@reeldash.app",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        },
        false
      );
      setTimeout(() => {
        setIsGoogleLoading(false);
        setStep(2);
      }, 600);
    } catch {
      setIsGoogleLoading(false);
    }
  };

  // Handle Step 2: Instagram Username Setup
  const handleSaveInstagram = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    const cleanHandle = instagramHandle.trim().replace(/^@/, "");
    if (cleanHandle) {
      updateUser({
        instagramUsername: cleanHandle,
        handle: `@${cleanHandle}`,
      });
    }

    setInstaConnected(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 900);
  };

  const handleSkipInstagram = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden font-sans selection:bg-brand-500/30 selection:text-brand-200">
      {/* Ambient Radial Mesh Lighting */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-brand-500/5 to-transparent rounded-full blur-[160px] pointer-events-none" />

      {/* Subtle Noise Texture */}
      <div
        className="absolute inset-0 opacity-[0.018] pointer-events-none bg-repeat"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        {/* Left Side: Brand Narrative & Live Reel Sync Card */}
        <div className="lg:col-span-5 space-y-8 hidden lg:block">
          {/* Logo & Eyebrow Badge */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/25 ring-1 ring-white/20 transition-transform group-hover:scale-105 duration-300">
                <Zap className="w-5 h-5 fill-white text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  ReelDash
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-brand-500/20 text-brand-300 border border-brand-500/30 font-medium">
                    PRO
                  </span>
                </span>
                <span className="text-[11px] text-zinc-400 font-medium tracking-wide">
                  The Visual Instagram Vault
                </span>
              </div>
            </Link>

            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Organize every Instagram Reel effortlessly.
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              DM any Reel, Post, or Audio to your personal automation bot. ReelDash auto-provisions your 4K library in real-time.
            </p>
          </div>

          {/* Double-Bezel Live Sync Showcase Card */}
          <div className="p-1.5 rounded-3xl bg-zinc-900/60 ring-1 ring-zinc-800/80 shadow-2xl backdrop-blur-xl">
            <div className="bg-zinc-950/80 rounded-[calc(1.5rem-0.375rem)] p-5 border border-zinc-800/60 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-200">@sweatingcurves</p>
                    <p className="text-[10px] text-zinc-400">Synced 2m ago via Instagram DM</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Auto-Saved
                </span>
              </div>

              {/* Video Thumbnail Mockup */}
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/80 group">
                <img
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80"
                  alt="Reel Preview"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-medium border border-white/10">
                      Reel
                    </span>
                    <span className="font-medium text-xs truncate max-w-[140px]">
                      Curated Motion Flow
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-300">0:24</span>
                </div>
              </div>

              {/* Feature Chips */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-[10px] text-zinc-400">
                <div className="flex items-center space-x-1.5 bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/50">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span>Instant Sync</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/50">
                  <Layers className="w-3.5 h-3.5 text-brand-400" />
                  <span>Tags & Collections</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/50">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Private 4K</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: The Double-Bezel Onboarding Container */}
        <div className="lg:col-span-7 w-full max-w-lg mx-auto">
          {/* Double-Bezel Nested Hardware Card */}
          <div className="p-1.5 sm:p-2 rounded-[2rem] bg-gradient-to-b from-zinc-800/60 via-zinc-900/40 to-zinc-900/80 ring-1 ring-white/10 shadow-2xl backdrop-blur-2xl">
            <div className="bg-zinc-950/90 rounded-[calc(2rem-0.5rem)] p-6 sm:p-9 border border-zinc-800/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] relative overflow-hidden">
              {/* Progress Indicator */}
              <div className="flex items-center justify-between mb-6 pb-5 border-b border-zinc-800/60">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      step === 1
                        ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {step === 2 ? <Check className="w-4 h-4" /> : "1"}
                  </div>
                  <div className="w-8 h-[2px] bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-brand-500 transition-all duration-500 ${
                        step === 2 ? "w-full" : "w-0"
                      }`}
                    />
                  </div>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      step === 2
                        ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                        : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                    }`}
                  >
                    2
                  </div>
                </div>

                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">
                  {step === 1 ? "Step 1: Account" : "Step 2: Instagram"}
                </span>
              </div>

              <AnimatePresence mode="wait">
                {step === 1 ? (
                  /* ========================================================= */
                  /* STEP 1: CREATE ACCOUNT (GOOGLE AUTH + EMAIL)              */
                  /* ========================================================= */
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1.5">
                      <h2 className="text-2xl font-bold tracking-tight text-white">
                        Create your ReelDash account
                      </h2>
                      <p className="text-xs text-zinc-400">
                        Join thousands of curators saving Instagram Reels automatically.
                      </p>
                    </div>

                    {/* Google One-Tap Authentication Button */}
                    <button
                      type="button"
                      onClick={handleGoogleSignup}
                      disabled={isGoogleLoading}
                      className="w-full py-3 px-4 bg-zinc-900/90 hover:bg-zinc-800/90 active:bg-zinc-800 text-zinc-100 font-semibold text-xs sm:text-sm rounded-2xl border border-zinc-700/60 shadow-md flex items-center justify-center space-x-3 transition-all duration-200 hover:border-zinc-500/80 hover:shadow-zinc-900/50 cursor-pointer disabled:opacity-60 group"
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

                    {/* Form Fields */}
                    <form onSubmit={handleEmailSignup} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                          Full Name
                        </label>
                        <div className="relative flex items-center">
                          <User className="w-4 h-4 text-zinc-500 absolute left-3.5" />
                          <input
                            type="text"
                            required
                            placeholder="Alex Rivera"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-zinc-900/70 border border-zinc-800 rounded-2xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                          Email Address
                        </label>
                        <div className="relative flex items-center">
                          <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5" />
                          <input
                            type="email"
                            required
                            placeholder="alex@reeldash.app"
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

                      {/* Primary Nested CTA Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full group mt-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 active:scale-[0.99] text-white font-semibold text-sm shadow-xl shadow-brand-500/25 flex items-center justify-between transition-all duration-300 cursor-pointer disabled:opacity-60"
                      >
                        <span className="font-semibold tracking-wide">
                          {isSubmitting ? "Creating Account..." : "Continue to Instagram Setup"}
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center transition-transform group-hover:translate-x-1 duration-200">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </button>
                    </form>

                    <p className="text-center text-xs text-zinc-400">
                      Already have an account?{" "}
                      <Link
                        href="/login"
                        className="text-brand-400 font-semibold hover:text-brand-300 transition-colors underline-offset-4 hover:underline"
                      >
                        Log in
                      </Link>
                    </p>
                  </motion.div>
                ) : (
                  /* ========================================================= */
                  /* STEP 2: CONNECT INSTAGRAM USERNAME                        */
                  /* ========================================================= */
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/20 mb-2">
                        <Instagram className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold tracking-tight text-white">
                        Connect your Instagram Handle
                      </h2>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Enter the handle you will DM Reels from. Our bot matches your sender ID to this account and saves your Reels to your private gallery automatically.
                      </p>
                    </div>

                    <form onSubmit={handleSaveInstagram} className="space-y-5">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                          Instagram Username
                        </label>
                        <div className="relative flex items-center">
                          <AtSign className="w-4 h-4 text-zinc-500 absolute left-3.5" />
                          <input
                            type="text"
                            required
                            placeholder="your_instagram_handle"
                            value={instagramHandle}
                            onChange={(e) => setInstagramHandle(e.target.value)}
                            className="w-full pl-10 pr-4 py-3.5 bg-zinc-900/80 border border-zinc-700/80 rounded-2xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono transition-all"
                          />
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-2">
                          No password required. We only use your handle to route your DMs.
                        </p>
                      </div>

                      {/* Quick Handle Suggestions */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                          Suggested Handles:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {["@sweatingcurves", "@design_curator", "@reel_collector"].map((h) => (
                            <button
                              key={h}
                              type="button"
                              onClick={() => setInstagramHandle(h)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 font-mono transition-colors"
                            >
                              {h}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-2">
                        <button
                          type="submit"
                          disabled={isSubmitting || instaConnected}
                          className="w-full group py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 active:scale-[0.99] text-white font-semibold text-sm shadow-xl shadow-brand-500/25 flex items-center justify-between transition-all duration-300 cursor-pointer disabled:opacity-60"
                        >
                          <span className="font-semibold tracking-wide">
                            {instaConnected
                              ? "✨ Profile Connected! Entering Dashboard..."
                              : isSubmitting
                              ? "Saving Profile..."
                              : "Save Handle & Go to Dashboard"}
                          </span>
                          <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center transition-transform group-hover:translate-x-1 duration-200">
                            {instaConnected ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                            ) : (
                              <ArrowRight className="w-4 h-4" />
                            )}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={handleSkipInstagram}
                          className="w-full py-2.5 text-xs text-zinc-400 hover:text-zinc-200 font-medium transition-colors text-center cursor-pointer"
                        >
                          Skip for now and enter dashboard
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070709] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
