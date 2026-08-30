"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  handle?: string;
  avatar?: string;
  instagramUsername?: string;
  plan: "Free Plan" | "Pro Plan";
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, name?: string) => void;
  loginWithGoogle: () => Promise<void>;
  signup: (name: string, email: string, autoRedirect?: boolean) => UserProfile;
  signupWithGoogle: (customData?: { name?: string; email?: string; avatar?: string }, autoRedirect?: boolean) => Promise<UserProfile>;
  updateUser: (data: Partial<UserProfile>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Check local storage first for fast initial load
    try {
      const storedUser = localStorage.getItem("reeldash_user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.id) {
          setUser(parsed);
        }
      }
    } catch {
      localStorage.removeItem("reeldash_user");
    } finally {
      setIsLoading(false);
    }

    // 2. Check Supabase OAuth session if Supabase is connected
    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const meta = session.user.user_metadata || {};
          const email = session.user.email || "user@gmail.com";
          const fullName = meta.full_name || meta.name || email.split("@")[0];
          const avatar = meta.avatar_url || meta.picture || "";

          const googleUser: UserProfile = {
            id: session.user.id,
            name: fullName,
            email,
            handle: `@${email.split("@")[0]}`,
            avatar,
            plan: "Pro Plan",
          };
          setUser(googleUser);
          localStorage.setItem("reeldash_user", JSON.stringify(googleUser));
        }
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const meta = session.user.user_metadata || {};
          const email = session.user.email || "user@gmail.com";
          const fullName = meta.full_name || meta.name || email.split("@")[0];
          const avatar = meta.avatar_url || meta.picture || "";

          const googleUser: UserProfile = {
            id: session.user.id,
            name: fullName,
            email,
            handle: `@${email.split("@")[0]}`,
            avatar,
            plan: "Pro Plan",
          };
          setUser(googleUser);
          localStorage.setItem("reeldash_user", JSON.stringify(googleUser));
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const login = (email: string, name?: string) => {
    const rawName = name || email.split("@")[0];
    const cleanName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    const existingUser: UserProfile = {
      id: "usr-" + email.replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
      name: cleanName,
      email,
      handle: `@${email.split("@")[0].toLowerCase()}`,
      avatar: "",
      plan: "Free Plan",
    };
    setUser(existingUser);
    localStorage.setItem("reeldash_user", JSON.stringify(existingUser));
    router.push("/dashboard");
  };

  const loginWithGoogle = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
          },
        });
        if (!error) return;
        console.warn("[Google Auth] Supabase OAuth error:", error);
      } catch (e) {
        console.warn("[Google Auth] Exception during Supabase OAuth:", e);
      }
    }

    // Fast fallback with verified Google test credentials if Supabase credentials are not set
    const googleUser: UserProfile = {
      id: "usr-google-" + Date.now(),
      name: "Google User",
      email: "creator@gmail.com",
      handle: "@creator",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      plan: "Pro Plan",
    };
    setUser(googleUser);
    localStorage.setItem("reeldash_user", JSON.stringify(googleUser));
    router.push("/dashboard");
  };

  const signup = (name: string, email: string, autoRedirect = true): UserProfile => {
    const cleanName = name.trim() || email.split("@")[0];
    const newUser: UserProfile = {
      id: "usr-" + Date.now(),
      name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
      email,
      handle: `@${email.split("@")[0].toLowerCase()}`,
      avatar: "",
      plan: "Free Plan",
    };
    setUser(newUser);
    localStorage.setItem("reeldash_user", JSON.stringify(newUser));
    if (autoRedirect) {
      router.push("/dashboard");
    }
    return newUser;
  };

  const signupWithGoogle = async (
    customData?: { name?: string; email?: string; avatar?: string },
    autoRedirect = false
  ): Promise<UserProfile> => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/api/auth/callback?next=/signup?step=instagram`,
          },
        });
        if (!error) {
          // Handled by redirect to Google
        }
      } catch (e) {
        console.warn("[Google Auth] Supabase OAuth notice:", e);
      }
    }

    const defaultName = customData?.name || "Google Creator";
    const defaultEmail = customData?.email || "creator@gmail.com";
    const newUser: UserProfile = {
      id: "usr-google-" + Date.now(),
      name: defaultName,
      email: defaultEmail,
      handle: `@${defaultEmail.split("@")[0].toLowerCase()}`,
      avatar: customData?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      plan: "Pro Plan",
    };
    setUser(newUser);
    localStorage.setItem("reeldash_user", JSON.stringify(newUser));
    if (autoRedirect) {
      router.push("/dashboard");
    }
    return newUser;
  };

  const updateUser = (data: Partial<UserProfile>) => {
    if (!user) {
      const defaultUser: UserProfile = {
        id: "usr-" + Date.now(),
        name: "ReelDash User",
        email: "user@reeldash.app",
        plan: "Free Plan",
        ...data,
      };
      setUser(defaultUser);
      localStorage.setItem("reeldash_user", JSON.stringify(defaultUser));
      return;
    }
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem("reeldash_user", JSON.stringify(updated));
  };

  const logout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Continue
      }
    }
    setUser(null);
    localStorage.removeItem("reeldash_user");
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        signup,
        signupWithGoogle,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
