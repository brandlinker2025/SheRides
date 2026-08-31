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
import { authEmailForIdentifier, normalizeBdPhone, parseMemberIdentifier, phoneAuthEmail } from "./phone";
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
  signIn: (identifier: string, password: string) => Promise<string | null>;
  signUp: (fullName: string, phone: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function alreadyRegistered(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("already registered") ||
    lower.includes("already been registered") ||
    lower.includes("user already exists") ||
    lower.includes("phone taken") ||
    lower.includes("duplicate key") ||
    lower.includes("unique constraint")
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Rider | null>(null);
  const [loading, setLoading] = useState(true);

  const mapUser = useCallback(async (id: string, fullName?: string) => {
    const supabase = createClient();
    if (!supabase) return;
    try {
      const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      if (!data) {
        await supabase.from("profiles").upsert({
          id,
          full_name: fullName ?? "",
          username: fullName?.toLowerCase().replace(/\s+/g, "") || id.slice(0, 8),
        });
      }
      const latest = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      const [{ count }, followers, following] = await Promise.all([
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("author_id", id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", id),
      ]);
      const rider = riderFromProfile(id, latest.data, fullName);
      rider.postsCount = count ?? 0;
      if (!followers.error) rider.followers = followers.count ?? rider.followers;
      if (!following.error) rider.following = following.count ?? rider.following;
      setUser(rider);
    } catch {
      setUser((prev) => prev ?? riderFromProfile(id, null, fullName));
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const stopLoading = () => {
      if (!cancelled) setLoading(false);
    };

    void (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (cancelled) return;
        const sessionUser = sessionData.session?.user;
        if (sessionUser) {
          await mapUser(sessionUser.id, sessionUser.user_metadata?.full_name as string | undefined);
          stopLoading();
        }
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        if (data.user) {
          await mapUser(data.user.id, data.user.user_metadata?.full_name as string | undefined);
        } else if (!sessionUser) {
          setUser(null);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        stopLoading();
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void mapUser(session.user.id, session.user.user_metadata?.full_name as string | undefined);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
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
      async signIn(identifier, password) {
        const supabase = createClient();
        if (!supabase) return "Supabase is not configured.";
        const parsed = parseMemberIdentifier(identifier);
        if (!parsed) return "Enter a Bangladesh mobile number or your email.";
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmailForIdentifier(parsed),
          password,
        });
        return error?.message ?? null;
      },
      async signUp(fullName, phoneInput, password) {
        const supabase = createClient();
        if (!supabase) return "Supabase is not configured.";
        const phone = normalizeBdPhone(phoneInput);
        if (!phone) return "Enter a valid Bangladesh mobile number (01XXXXXXXXX or +8801XXXXXXXXX).";

        const { data: taken, error: takenError } = await supabase.rpc("is_member_phone_taken", { p_phone: phone });
        if (!takenError && taken === true) {
          return "This mobile number is already registered. Sign in instead.";
        }

        const email = phoneAuthEmail(phone);
        const username = phone;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, username, phone },
          },
        });
        if (error) {
          if (alreadyRegistered(error.message)) {
            return "This mobile number is already registered. Sign in instead.";
          }
          return error.message;
        }
        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            full_name: fullName || "Rider",
            username,
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
