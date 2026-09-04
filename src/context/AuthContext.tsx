"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { getClientAuthHeaders } from "@/lib/clientAuth";
import { ConnectedInstagramAccount } from "@/types/reel";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  handle?: string;
  avatar?: string;
  instagramUsername?: string;
  connectedAccounts?: ConnectedInstagramAccount[];
  plan: "Free Plan" | "Pro Plan";
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, name?: string) => void;
  loginWithGoogle: (nextPath?: string) => Promise<void>;
  signup: (name: string, email: string, autoRedirect?: boolean) => UserProfile;
  signupWithGoogle: (customData?: { name?: string; email?: string; avatar?: string }, autoRedirect?: boolean) => Promise<UserProfile | void>;
  updateUser: (data: Partial<UserProfile>) => void;
  addInstagramAccount: (username: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  removeInstagramAccount: (accountId: string) => Promise<boolean>;
  refreshAccounts: () => Promise<void>;
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
          // SANITIZATION: Validate that instagramUsername matches an ACTIVE connected account
          const activeAccounts = (parsed.connectedAccounts || []).filter(
            (a: any) => a.status === "active"
          );
          if (activeAccounts.length === 0) {
            parsed.instagramUsername = undefined;
          } else {
            parsed.instagramUsername = activeAccounts[0].username;
          }
          parsed.connectedAccounts = (parsed.connectedAccounts || []).filter(
            (a: any) => a.status !== "inactive"
          );
          localStorage.setItem("reeldash_user", JSON.stringify(parsed));
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

          setUser((prev) => {
            const activeAccs = (prev?.connectedAccounts || []).filter(
              (a: any) => a.status === "active"
            );
            const current: UserProfile = {
              ...(prev || googleUser),
              instagramUsername: activeAccs.length > 0 ? activeAccs[0].username : undefined,
            };
            localStorage.setItem("reeldash_user", JSON.stringify(current));
            return current;
          });

          // Fetch user's connected Instagram accounts
          setTimeout(() => refreshAccounts(), 100);
        }
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          const meta = session.user.user_metadata || {};
          const email = session.user.email || "user@gmail.com";
          const fullName = meta.full_name || meta.name || email.split("@")[0];
          const avatar = meta.avatar_url || meta.picture || "";

          setUser((prev) => {
            const activeAccs = (prev?.connectedAccounts || []).filter(
              (a: any) => a.status === "active"
            );
            const current: UserProfile = {
              id: session.user.id,
              name: prev?.name || fullName,
              email: session.user.email || email,
              handle: `@${email.split("@")[0]}`,
              avatar: prev?.avatar || avatar,
              instagramUsername: activeAccs.length > 0 ? activeAccs[0].username : undefined,
              connectedAccounts: prev?.connectedAccounts,
              plan: "Pro Plan",
            };
            localStorage.setItem("reeldash_user", JSON.stringify(current));
            return current;
          });

          // Fetch accounts on auth state change
          setTimeout(() => refreshAccounts(), 100);

          const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
          if (
            !currentPath.startsWith("/connect-instagram") &&
            (currentPath === "/login" || currentPath === "/signup" || event === "SIGNED_IN")
          ) {
            router.push("/dashboard");
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const refreshAccounts = async () => {
    try {
      const headers = await getClientAuthHeaders(user?.id);
      const res = await fetch(`/api/instagram/accounts?plan=${encodeURIComponent(user?.plan || "Free Plan")}`, {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        const rawAccounts: ConnectedInstagramAccount[] = data.accounts || [];
        // SINGLE SOURCE OF TRUTH: Only accounts with status === 'active' are active
        const activeAccounts = rawAccounts.filter((a) => a.status === "active");
        const activeUsername = activeAccounts.length > 0 ? activeAccounts[0].username : undefined;

        setUser((prev) => {
          if (!prev) return prev;
          const updated: UserProfile = {
            ...prev,
            connectedAccounts: rawAccounts,
            instagramUsername: activeUsername,
          };
          localStorage.setItem("reeldash_user", JSON.stringify(updated));
          return updated;
        });
      }
    } catch (e) {
      console.warn("[AuthContext] refreshAccounts notice:", e);
    }
  };

  /**
   * @deprecated Username-only linking is disabled. Use the DM challenge code
   * flow via /api/instagram/link-code instead.
   */
  const addInstagramAccount = async (_username: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    return {
      success: false,
      error: "Username-only linking has been disabled for security. Use DM verification in Settings → Instagram Accounts.",
    };
  };

  const removeInstagramAccount = async (accountId: string): Promise<boolean> => {
    // Optimistically update local state immediately so UI updates with zero lag
    setUser((prev) => {
      if (!prev) return prev;
      const remaining = (prev.connectedAccounts || []).filter(
        (a) => a.id !== accountId
      );
      const activeRemaining = remaining.filter((a) => a.status === "active");
      const updated: UserProfile = {
        ...prev,
        connectedAccounts: remaining,
        instagramUsername: activeRemaining.length > 0 ? activeRemaining[0].username : undefined,
      };
      localStorage.setItem("reeldash_user", JSON.stringify(updated));
      return updated;
    });

    try {
      const headers = await getClientAuthHeaders(user?.id);
      const res = await fetch(`/api/instagram/accounts?accountId=${encodeURIComponent(accountId)}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        await refreshAccounts();
        return true;
      }
      await refreshAccounts();
      return false;
    } catch {
      await refreshAccounts();
      return false;
    }
  };

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

  const loginWithGoogle = async (nextPath = "/dashboard") => {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });
      if (error) {
        console.error("[Google Auth] Supabase OAuth error:", error);
        throw error;
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
    }
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
  ): Promise<UserProfile | void> => {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=/signup?step=instagram`,
        },
      });
      if (error) {
        console.error("[Google Auth] Supabase OAuth error:", error);
        throw error;
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
    }
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
        addInstagramAccount,
        removeInstagramAccount,
        refreshAccounts,
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
