"use client";

import { useLocale } from "@/lib/locale";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { t, toggleLocale } = useLocale();
  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={`btn btn-ghost h-10 min-h-10 px-3 text-sm ${className}`}
      aria-label={t("lang.label")}
    >
      {t("lang.switch")}
    </button>
  );
}
