"use client";

import { AuthProvider } from "@/lib/auth-context";
import { FeedProvider } from "@/lib/feed-context";
import { UIProvider } from "@/lib/ui-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UIProvider>
        <FeedProvider>{children}</FeedProvider>
      </UIProvider>
    </AuthProvider>
  );
}
