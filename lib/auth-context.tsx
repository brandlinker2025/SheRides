"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { riderFromProfile } from "./profile";
import { siteOrigin } from "./site";
import { createClient } from "./supabase/client";
import type { Rider } from "./types";

export type ProfileUpdates = {
  fullName?: string;
  bio?: string;
  location?: string;
  bikeBrand?: string;
  bikeModel?: string;
  avatarUrl?: string;
  coverUrl?: string;
};

type AuthContextValue = {
  user: Rider | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: ProfileUpdates) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (fullName: string, email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Rider | null>(null);
  const [loading, setLoading] = useState(true);

  const mapUser = useCallback(async (id: string, fullName?: string) => {
    const supabase = createClient();
    if (!supabase) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    if (!data) {
      await supabase.from("profiles").upsert({
        id,
        full_name: fullName ?? "",
        username: fullName?.toLowerCase().replace(/\s+/g, "") || id.slice(0, 8),
      });
    }
    const latest = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    const { count } = await supabase.from("posts").select("*", { count: "exact", head: true }).eq("author_id", id);
    const rider = riderFromProfile(id, latest.data, fullName);
    rider.postsCount = count ?? 0;
    setUser(rider);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        await mapUser(data.user.id, data.user.user_metadata?.full_name as string | undefined);
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
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [mapUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async refreshUser() {
        const supabase = createClient();
        if (!supabase) return;
        const { data } = await supabase.auth.getUser();
        if (data.user) await mapUser(data.user.id, data.user.user_metadata?.full_name as string | undefined);
      },
      async updateProfile(updates) {
        const supabase = createClient();
        if (!supabase || !user) return "You need to sign in first.";
        const bike = [updates.bikeBrand, updates.bikeModel].filter(Boolean).join(" ");
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: updates.fullName ?? user.fullName,
            bio: updates.bio ?? user.bio,
            location: updates.location ?? user.location,
            bike_brand: updates.bikeBrand ?? user.bikeBrand ?? "",
            bike_model: updates.bikeModel ?? user.bikeModel ?? "",
            bike: bike || user.bike,
            avatar_url: updates.avatarUrl ?? user.avatar ?? null,
            cover_url: updates.coverUrl ?? user.cover ?? null,
          })
          .eq("id", user.id);
        if (error) return error.message;
        await mapUser(user.id, updates.fullName ?? user.fullName);
        return null;
      },
      async signIn(email, password) {
        const supabase = createClient();
        if (!supabase) return "Supabase is not configured.";
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error?.message ?? null;
      },
      async signUp(fullName, email, password) {
        const supabase = createClient();
        if (!supabase) return "Supabase is not configured.";
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, username: email.split("@")[0] },
            emailRedirectTo: `${siteOrigin()}/verification`,
          },
        });
        if (error) return error.message;
        if (data.user && !data.session) {
          return "Check your email to confirm your account, then sign in and complete rider verification.";
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
        if (typeof window !== "undefined") window.location.assign("/login");
      },
    }),
    [user, loading, mapUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
