"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { currentUser } from "./data";
import { createClient } from "./supabase/client";
import { isSupabaseConfigured } from "./supabase/config";
import type { Rider } from "./types";

const DEMO_KEY = "sherides-demo-session";

type AuthContextValue = {
  user: Rider | null;
  loading: boolean;
  demoMode: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (fullName: string, email: string, password: string) => Promise<string | null>;
  continueAsDemo: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Rider | null>(null);
  const [loading, setLoading] = useState(true);
  const demoMode = !isSupabaseConfigured();

  useEffect(() => {
    if (demoMode) {
      const stored = window.localStorage.getItem(DEMO_KEY);
      setUser(stored === "1" ? currentUser : null);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    const mapUser = async (id: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!data) {
        setUser({ ...currentUser, id });
        return;
      }
      setUser({
        id: data.id,
        username: data.username ?? currentUser.username,
        fullName: data.full_name ?? currentUser.fullName,
        bio: data.bio ?? "",
        location: data.location ?? "",
        bike: data.bike ?? "",
        avatar: data.avatar_url ?? currentUser.avatar,
        cover: data.cover_url ?? currentUser.cover,
        verified: Boolean(data.verified),
        role: data.role === "admin" ? "admin" : "rider",
        followers: data.followers_count ?? 0,
        following: data.following_count ?? 0,
        postsCount: 0,
        ridesCount: data.rides_count ?? 0,
      });
    };

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) void mapUser(data.user.id);
      else setUser(null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) void mapUser(session.user.id);
      else setUser(null);
    });

    return () => sub.subscription.unsubscribe();
  }, [demoMode]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      demoMode,
      async signIn(email, password) {
        if (demoMode) {
          window.localStorage.setItem(DEMO_KEY, "1");
          setUser(currentUser);
          return null;
        }
        const supabase = createClient();
        if (!supabase) return "Supabase is not configured.";
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error?.message ?? null;
      },
      async signUp(fullName, email, password) {
        if (demoMode) {
          window.localStorage.setItem(DEMO_KEY, "1");
          setUser({ ...currentUser, fullName, username: email.split("@")[0] });
          return null;
        }
        const supabase = createClient();
        if (!supabase) return "Supabase is not configured.";
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, username: email.split("@")[0] } },
        });
        return error?.message ?? null;
      },
      continueAsDemo() {
        window.localStorage.setItem(DEMO_KEY, "1");
        setUser(currentUser);
      },
      async signOut() {
        window.localStorage.removeItem(DEMO_KEY);
        setUser(null);
        const supabase = createClient();
        if (supabase) await supabase.auth.signOut();
      },
    }),
    [user, loading, demoMode]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
