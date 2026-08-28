"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, Mail, Lock, Zap } from "lucide-react";
import { motion } from "framer-motion";

const ease = [0.32, 0.72, 0, 1];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    login(email);
  };

  return (
    <div className="min-h-[100dvh] bg-background-dark text-primaryText-dark flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Outer bezel */}
        <div className="p-[5px] rounded-[22px] bg-white/[0.02] border border-white/[0.05] shadow-rd-dark">
          <div className="p-8 rounded-[18px] bg-surface-dark border border-borderSubtle-dark space-y-7">

            {/* Logo */}
            <div className="text-center space-y-3">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[10px] bg-brand-500 flex items-center justify-center shadow-rd-glow">
                  <Zap className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-[17px] font-bold tracking-tight">ReelDash</span>
              </Link>
              <div className="space-y-1">
                <h1 className="text-[18px] font-bold tracking-tight">Welcome back</h1>
                <p className="text-[13px] text-secondaryText-dark">Sign in to your Reel library</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[12px] font-medium text-secondaryText-dark">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mutedText-dark" strokeWidth={1.75} />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-surfaceSecondary-dark border border-borderSubtle-dark hover:border-borderDefault-dark focus:border-brand-500 focus:ring-1 focus:ring-brand-500/25 rounded-rd-lg text-[13px] text-primaryText-dark placeholder:text-mutedText-dark outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[12px] font-medium text-secondaryText-dark">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mutedText-dark" strokeWidth={1.75} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-surfaceSecondary-dark border border-borderSubtle-dark hover:border-borderDefault-dark focus:border-brand-500 focus:ring-1 focus:ring-brand-500/25 rounded-rd-lg text-[13px] text-primaryText-dark placeholder:text-mutedText-dark outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="group w-full flex items-center justify-center gap-2 py-3 bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white text-[14px] font-semibold rounded-rd-lg transition-all duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer shadow-rd-glow"
              >
                Sign in
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
              </button>
            </form>

            <p className="text-center text-[12px] text-mutedText-dark">
              No account?{" "}
              <Link href="/signup" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
