"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  handle?: string;
  avatar?: string;
  plan: "Free Plan" | "Pro Plan";
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, name?: string) => void;
  signup: (name: string, email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultDemoUser: UserProfile = {
  id: "usr-demo",
  name: "Alex Rivera",
  email: "alex@reeldash.app",
  handle: "@alex_rivera",
  avatar: "",
  plan: "Pro Plan",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(defaultDemoUser);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check local storage session
    const storedUser = localStorage.getItem("reeldash_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("reeldash_user");
      }
    } else {
      localStorage.setItem("reeldash_user", JSON.stringify(defaultDemoUser));
    }
  }, []);

  const login = (email: string, name?: string) => {
    const existingUser: UserProfile = {
      id: "usr-" + email.replace(/[^a-zA-Z0-9]/g, ""),
      name: name || email.split("@")[0],
      email,
      handle: `@${email.split("@")[0]}`,
      avatar: "",
      plan: "Free Plan",
    };
    setUser(existingUser);
    localStorage.setItem("reeldash_user", JSON.stringify(existingUser));
    router.push("/dashboard");
  };

  const signup = (name: string, email: string) => {
    const newUser: UserProfile = {
      id: "usr-" + Date.now(),
      name,
      email,
      handle: `@${email.split("@")[0]}`,
      avatar: "",
      plan: "Free Plan",
    };
    setUser(newUser);
    localStorage.setItem("reeldash_user", JSON.stringify(newUser));
    router.push("/dashboard");
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
