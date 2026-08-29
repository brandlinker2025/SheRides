"use client";

import { AuthProvider } from "@/lib/auth-context";
import { FeedProvider } from "@/lib/feed-context";
import { ThemeProvider } from "@/lib/theme-context";
import { UIProvider } from "@/lib/ui-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UIProvider>
          <FeedProvider>{children}</FeedProvider>
        </UIProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
