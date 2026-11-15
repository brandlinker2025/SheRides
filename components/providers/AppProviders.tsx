"use client";

import { AuthProvider } from "@/lib/auth-context";
import { LocaleProvider } from "@/lib/locale";
import { ThemeProvider } from "@/lib/theme-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <AuthProvider>{children}</AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
