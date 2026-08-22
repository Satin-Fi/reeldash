"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    login(email);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-primaryText-light dark:text-primaryText-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg p-8 shadow-rd-modal space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="w-8 h-8 rounded-rd-md bg-brand-500 flex items-center justify-center text-white font-bold">
              ⚡
            </div>
            <span className="text-xl font-bold tracking-tight">ReelDash</span>
          </Link>
          <h2 className="text-lg font-bold">Welcome Back</h2>
          <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark">
            Log in to access your saved Reel memory library.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-secondaryText-light mb-1.5">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-mutedText-light absolute left-3" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-background-light dark:bg-background-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md text-xs text-primaryText-light dark:text-primaryText-dark focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-secondaryText-light mb-1.5">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-mutedText-light absolute left-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-background-light dark:bg-background-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md text-xs text-primaryText-light dark:text-primaryText-dark focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-rd-md shadow-rd-subtle flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <span>Log In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-secondaryText-light pt-2">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-brand-500 font-semibold hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
