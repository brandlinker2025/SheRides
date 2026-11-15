"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useLocale } from "@/lib/locale";
import { rpcMissing } from "@/lib/ride-extras";
import { createClient } from "@/lib/supabase/client";

const KEY = "sherides.favourite-riders.v1";

function readLocal(): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeLocal(ids: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* private mode */
  }
}

export function FavouriteCaptain({ riderId, name }: { riderId: string; name: string }) {
  const { t } = useLocale();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    setSaved(readLocal().includes(riderId));
    const supabase = createClient();
    if (!supabase) return;
    void supabase
      .from("go_favourite_riders")
      .select("rider_id")
      .eq("rider_id", riderId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) return;
        const on = Boolean(data);
        setSaved(on);
        const ids = new Set(readLocal());
        if (on) ids.add(riderId);
        else ids.delete(riderId);
        writeLocal([...ids]);
      });
  }, [riderId]);

  async function toggle() {
    setBusy(true);
    setNote(null);
    const supabase = createClient();
    if (!supabase) {
      const ids = new Set(readLocal());
      if (ids.has(riderId)) ids.delete(riderId);
      else ids.add(riderId);
      writeLocal([...ids]);
      setSaved(ids.has(riderId));
      setBusy(false);
      return;
    }
    const { data, error } = await supabase.rpc("go_toggle_favourite", { p_rider_id: riderId });
    setBusy(false);
    if (error) {
      if (!rpcMissing(error.message)) {
        setNote(error.message);
        return;
      }
      const ids = new Set(readLocal());
      if (ids.has(riderId)) ids.delete(riderId);
      else ids.add(riderId);
      writeLocal([...ids]);
      setSaved(ids.has(riderId));
      setNote("Saved on this phone until the database update is applied.");
      return;
    }
    const on = Boolean(data);
    setSaved(on);
    const ids = new Set(readLocal());
    if (on) ids.add(riderId);
    else ids.delete(riderId);
    writeLocal([...ids]);
    try {
      const named = JSON.parse(window.localStorage.getItem("sherides.favourite-names.v1") ?? "{}") as Record<string, string>;
      if (on) named[riderId] = name;
      else delete named[riderId];
      window.localStorage.setItem("sherides.favourite-names.v1", JSON.stringify(named));
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" onClick={() => void toggle()} disabled={busy} aria-pressed={saved} className="btn btn-ghost h-10 min-h-10 px-3 text-xs">
        <Icon name="favorite" filled={saved} size={18} className={saved ? "text-[#f4b8d4]" : ""} />
        {saved ? t("fav.saved") : t("fav.save")}
      </button>
      {note && <p className="max-w-[14rem] text-right text-xs text-white/55">{note}</p>}
    </div>
  );
}
