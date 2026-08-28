"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  signup: (name: string, email: string) => void;
  updateUser: (data: Partial<UserProfile>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("reeldash_user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.id) {
          setUser(parsed);
        }
      }
    } catch (e) {
      localStorage.removeItem("reeldash_user");
    } finally {
      setIsLoading(false);
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

  const signup = (name: string, email: string) => {
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
    router.push("/dashboard");
  };

  const updateUser = (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem("reeldash_user", JSON.stringify(updated));
  };

  const logout = () => {
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
        signup,
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
