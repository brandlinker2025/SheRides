"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "en" | "bn";

const STORAGE_KEY = "sherides-locale";

const COPY = {
  en: {
    "nav.book": "Book",
    "nav.rides": "Rides",
    "nav.rider": "Rider",
    "nav.alerts": "Alerts",
    "nav.places": "Places",
    "nav.profile": "Profile",
    "nav.bookLong": "Book a Ride",
    "nav.ridesLong": "My Rides",
    "nav.riderLong": "Rider Mode",
    "nav.alertsLong": "Notifications",
    "nav.placesLong": "Saved places",
    "nav.profileLong": "Profile",
    "nav.partner": "Become a Partner",
    "lang.switch": "বাংলা",
    "lang.label": "Switch to Bangla",
    "places.title": "Saved places",
    "places.lead": "Home and work show up when you book. They stay on your account after the database update is applied.",
    "places.home": "Save as home",
    "places.work": "Save as work",
    "places.other": "Save this place",
    "places.empty": "No saved places yet.",
    "places.delete": "Remove",
    "places.book": "Book a ride",
    "places.favourites": "Favourite captains",
    "places.favouritesEmpty": "Save a captain from a completed or active ride. SheRides still matches the nearest approved rider.",
    "wait.title": "Waiting for approval",
    "wait.body": "You cannot go online or receive rides until an admin approves you.",
    "earnings.title": "Earnings",
    "earnings.today": "Today",
    "earnings.week": "7 days",
    "earnings.total": "All completed",
    "receipt.title": "Receipt",
    "receipt.print": "Print receipt",
    "fav.save": "Save captain",
    "fav.saved": "Saved captain",
    "stop.label": "Add a stop (optional)",
    "promo.label": "Promo code",
    "promo.apply": "Check code",
  },
  bn: {
    "nav.book": "বুক",
    "nav.rides": "রাইড",
    "nav.rider": "রাইডার",
    "nav.alerts": "অ্যালার্ট",
    "nav.places": "জায়গা",
    "nav.profile": "প্রোফাইল",
    "nav.bookLong": "রাইড বুক করুন",
    "nav.ridesLong": "আমার রাইড",
    "nav.riderLong": "রাইডার মোড",
    "nav.alertsLong": "নোটিফিকেশন",
    "nav.placesLong": "সেভ করা জায়গা",
    "nav.profileLong": "প্রোফাইল",
    "nav.partner": "পার্টনার হন",
    "lang.switch": "English",
    "lang.label": "ইংরেজিতে যান",
    "places.title": "সেভ করা জায়গা",
    "places.lead": "হোম আর অফিস বুকিংয়ের সময় দেখা যাবে। ডাটাবেস আপডেটের পর এগুলো অ্যাকাউন্টে থাকবে।",
    "places.home": "হোম হিসেবে সেভ",
    "places.work": "অফিস হিসেবে সেভ",
    "places.other": "এই জায়গা সেভ করুন",
    "places.empty": "এখনো কোনো জায়গা সেভ হয়নি।",
    "places.delete": "মুছুন",
    "places.book": "রাইড বুক করুন",
    "places.favourites": "প্রিয় ক্যাপ্টেন",
    "places.favouritesEmpty": "চলমান বা শেষ হওয়া রাইড থেকে ক্যাপ্টেন সেভ করুন। ম্যাচ এখনো নিকটবর্তী অনুমোদিত রাইডারের সাথে হয়।",
    "wait.title": "অনুমোদনের অপেক্ষায়",
    "wait.body": "অ্যাডমিন অনুমোদন না করা পর্যন্ত আপনি অনলাইন হতে বা রাইড নিতে পারবেন না।",
    "earnings.title": "আয়",
    "earnings.today": "আজ",
    "earnings.week": "৭ দিন",
    "earnings.total": "সব সম্পন্ন",
    "receipt.title": "রসিদ",
    "receipt.print": "রসিদ প্রিন্ট",
    "fav.save": "ক্যাপ্টেন সেভ",
    "fav.saved": "সেভ হয়েছে",
    "stop.label": "একটি স্টপ যোগ করুন (ঐচ্ছিক)",
    "promo.label": "প্রোমো কোড",
    "promo.apply": "কোড দেখুন",
  },
} as const;

export type CopyKey = keyof (typeof COPY)["en"];

type LocaleValue = {
  locale: Locale;
  t: (key: CopyKey) => string;
  toggleLocale: () => void;
};

const LocaleContext = createContext<LocaleValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "bn" || stored === "en") setLocale(stored);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale((current) => {
      const next = current === "en" ? "bn" : "en";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* storage unavailable */
      }
      document.documentElement.lang = next === "bn" ? "bn" : "en";
      return next;
    });
  }, []);

  const t = useCallback((key: CopyKey) => COPY[locale][key], [locale]);

  return <LocaleContext.Provider value={{ locale, t, toggleLocale }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used within LocaleProvider");
  return value;
}
