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
import { validateDateOfBirth } from "./birthday";
import { riderFromProfile } from "./profile";
import { authEmailForIdentifier, isPhoneAuthEmail, parseMemberIdentifier } from "./phone";
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
  dateOfBirth?: string;
};

type AuthContextValue = {
  user: Rider | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: ProfileUpdates) => Promise<string | null>;
  signIn: (identifier: string, password: string) => Promise<string | null>;
  signUp: (fullName: string, identifier: string, password: string, dateOfBirth: string) => Promise<{ error?: string; confirmationRequired?: boolean }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function alreadyRegistered(message: string) {
  const lower = message.toLowerCase();
  return lower.includes("already registered") || lower.includes("already been registered") || lower.includes("user already exists") || lower.includes("phone taken") || lower.includes("duplicate key") || lower.includes("unique constraint");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Rider | null>(null);
  const [loading, setLoading] = useState(true);

  const mapUser = useCallback(async (id: string, fullName?: string) => {
    const supabase = createClient();
    if (!supabase) return;
    try {
      const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      if (!data) await supabase.from("profiles").upsert({ id, full_name: fullName ?? "", username: fullName?.toLowerCase().replace(/\s+/g, "") || id.slice(0, 8) });
      const latest = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      const birthday = await supabase.from("member_birthdays").select("user_id").eq("user_id", id).maybeSingle();
      const rider = riderFromProfile(id, { ...(latest.data ?? {}), hasBirthday: !birthday.error && Boolean(birthday.data) }, fullName);
      setUser(rider);
    } catch { setUser((prev) => prev ?? riderFromProfile(id, null, fullName)); }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }
    let cancelled = false;
    const stopLoading = () => { if (!cancelled) setLoading(false); };
    void (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (cancelled) return;
        const sessionUser = sessionData.session?.user;
        if (sessionUser) { await mapUser(sessionUser.id, sessionUser.user_metadata?.full_name as string | undefined); stopLoading(); }
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        if (data.user) await mapUser(data.user.id, data.user.user_metadata?.full_name as string | undefined);
        else if (!sessionUser) setUser(null);
      } catch { if (!cancelled) setUser(null); } finally { stopLoading(); }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) void mapUser(session.user.id, session.user.user_metadata?.full_name as string | undefined);
      else { setUser(null); setLoading(false); }
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, [mapUser]);

  const value = useMemo<AuthContextValue>(() => ({
    user, loading,
    async refreshUser() {
      const supabase = createClient(); if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      if (data.user) await mapUser(data.user.id, data.user.user_metadata?.full_name as string | undefined);
    },
    async updateProfile(updates) {
      const supabase = createClient(); if (!supabase || !user) return "You need to sign in first.";
      const bike = [updates.bikeBrand, updates.bikeModel].filter(Boolean).join(" ");
      const { error } = await supabase.from("profiles").update({
        full_name: updates.fullName ?? user.fullName, bio: updates.bio ?? user.bio, location: updates.location ?? user.location,
        bike_brand: updates.bikeBrand ?? user.bikeBrand ?? "", bike_model: updates.bikeModel ?? user.bikeModel ?? "", bike: bike || user.bike,
        avatar_url: updates.avatarUrl ?? user.avatar ?? null, cover_url: updates.coverUrl ?? user.cover ?? null,
      }).eq("id", user.id);
      if (error) return error.message;
      if (updates.dateOfBirth !== undefined) {
        const dobError = validateDateOfBirth(updates.dateOfBirth); if (dobError) return dobError;
        const saved = await supabase.rpc("save_own_date_of_birth", { p_dob: updates.dateOfBirth });
        if (saved.error) return "Could not save your date of birth.";
      }
      await mapUser(user.id, updates.fullName ?? user.fullName); return null;
    },
    async signIn(identifier, password) {
      const supabase = createClient(); if (!supabase) return "Supabase is not configured.";
      const parsed = parseMemberIdentifier(identifier); if (!parsed) return "Enter a Bangladesh mobile number or your email.";
      const { error } = await supabase.auth.signInWithPassword({ email: authEmailForIdentifier(parsed), password });
      if (!error || parsed.kind !== "phone" || !/invalid login credentials/i.test(error.message)) return error?.message ?? null;
      // Members who linked a real email (for free password reset) log in with that address now.
      const { data: linkedEmail, error: lookupError } = await supabase.rpc("member_login_email", { p_phone: parsed.value, p_password: password });
      if (lookupError) return /too many/i.test(lookupError.message) ? lookupError.message : error.message;
      if (typeof linkedEmail !== "string" || !linkedEmail) return error.message;
      const retry = await supabase.auth.signInWithPassword({ email: linkedEmail, password });
      return retry.error?.message ?? null;
    },
    async signUp(fullName, identifier, password, dateOfBirth) {
      const supabase = createClient();
      if (!supabase) return { error: "Supabase is not configured." };
      const dobError = validateDateOfBirth(dateOfBirth);
      if (dobError) return { error: dobError };
      const parsed = parseMemberIdentifier(identifier);
      if (!parsed || (parsed.kind === "email" && isPhoneAuthEmail(parsed.value))) {
        return { error: "Enter a valid email address or Bangladesh mobile number." };
      }

      const phone = parsed.kind === "phone" ? parsed.value : null;
      const duplicate = phone ? "This mobile number is already registered. Sign in instead." : "This email is already registered. Sign in instead.";
      if (phone) {
        const { data: taken } = await supabase.rpc("is_member_phone_taken", { p_phone: phone });
        if (taken === true) return { error: duplicate };
      }

      const username = phone ?? `member_${crypto.randomUUID()}`;
      const { data, error } = await supabase.auth.signUp({
        email: authEmailForIdentifier(parsed),
        password,
        options: {
          data: { full_name: fullName, username, ...(phone ? { phone } : {}) },
          emailRedirectTo: `${siteOrigin()}/auth/callback`,
        },
      });
      if (error) return { error: alreadyRegistered(error.message) ? duplicate : error.message };
      if (!data.session) return { confirmationRequired: true };

      if (phone) {
        const profileSave = await supabase.from("profiles").update({ mobile_number: phone }).eq("id", data.session.user.id);
        if (profileSave.error) return { error: "Account created, but the mobile number could not be saved to your profile." };
      }
      const saved = await supabase.rpc("save_own_date_of_birth", { p_dob: dateOfBirth });
      if (saved.error) return { error: "Account created. Add your birthday from your profile to receive wishes." };
      return {};
    },
    async signOut() {
      setUser(null); const supabase = createClient(); if (supabase) await supabase.auth.signOut();
      if (typeof window !== "undefined") window.location.assign("/login");
    },
  }), [user, loading, mapUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const ctx = useContext(AuthContext); if (!ctx) throw new Error("useAuth must be used within AuthProvider"); return ctx; }
