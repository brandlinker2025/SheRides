"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * The app scrolls inside <main> (not the window), so Next.js can't reset the
 * scroll position on navigation. Attach the returned ref to the scroll container.
 */
export function useScrollTopOnNavigate<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const pathname = usePathname();
  useEffect(() => {
    ref.current?.scrollTo({ top: 0 });
  }, [pathname]);
  return ref;
}
