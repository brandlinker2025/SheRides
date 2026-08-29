"use client";

import { useTheme } from "@/lib/theme-context";
import { Icon } from "./Icon";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className={`w-10 h-10 rounded-full flex items-center justify-center text-on-primary hover:bg-white/10 transition-colors relative overflow-hidden ${className}`}
    >
      <Icon name={isDark ? "light_mode" : "dark_mode"} className="animate-scale-in" key={theme} />
    </button>
  );
}
