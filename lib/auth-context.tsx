"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { promoteFirstAdmin } from "./admin/promote-first-admin";
import { currentUser } from "./data";
import { createClient } from "./supabase/client";
import type { Rider } from "./types";

type AuthContextValue = {
  user: Rider | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (fullName: string, email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function riderFromProfile(
  id: string,
  data: Record<string, unknown> | null,
  fallbackName?: string
): Rider {
  return {
    id,
    username: (data?.username as string) || currentUser.username,
    fullName: (data?.full_name as string) || fallbackName || currentUser.fullName,
    bio: (data?.bio as string) || "",
    location: (data?.location as string) || "",
    bike: (data?.bike as string) || "",
    avatar: (data?.avatar_url as string) || currentUser.avatar,
    cover: (data?.cover_url as string) || currentUser.cover,
    verified: Boolean(data?.verified),
    role: data?.role === "admin" ? "admin" : "rider",
    followers: (data?.followers_count as number) ?? 0,
    following: (data?.following_count as number) ?? 0,
    postsCount: 0,
    ridesCount: (data?.rides_count as number) ?? 0,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Rider | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    const mapUser = async (id: string, fullName?: string) => {
      const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      if (!data) {
        await supabase.from("profiles").upsert({
          id,
          full_name: fullName ?? "",
          username: fullName?.toLowerCase().replace(/\s+/g, "") || id.slice(0, 8),
        });
      }
      await promoteFirstAdmin(supabase, id);
      const latest = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      setUser(riderFromProfile(id, latest.data, fullName));
    };

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        void mapUser(data.user.id, data.user.user_metadata?.full_name as string | undefined);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void mapUser(session.user.id, session.user.user_metadata?.full_name as string | undefined);
      } else {
        setUser(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async signIn(email, password) {
        const supabase = createClient();
        if (!supabase) return "Supabase is not configured.";
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error?.message ?? null;
      },
      async signUp(fullName, email, password) {
        const supabase = createClient();
        if (!supabase) return "Supabase is not configured.";
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, username: email.split("@")[0] },
            emailRedirectTo: origin ? `${origin}/home` : undefined,
          },
        });
        if (error) return error.message;
        if (data.user && !data.session) {
          return "Check your email to confirm your account, then sign in.";
        }
        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            full_name: fullName,
            username: email.split("@")[0],
          });
        }
        return null;
      },
      async signOut() {
        setUser(null);
        const supabase = createClient();
        if (supabase) await supabase.auth.signOut();
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
