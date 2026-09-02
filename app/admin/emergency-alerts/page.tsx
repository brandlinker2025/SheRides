"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface EmergencyAlert {
  id: string;
  user_id: string;
  rider_name: string | null;
  mobile_number: string | null;
  problem_type: string;
  note: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

export default function AdminEmergencyAlertsPage() {
  const [items, setItems] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const supabase = createClient();
    if (!supabase) {
      setError("SheRides connection is unavailable.");
      setLoading(false);
      return;
    }
    const { data, error: rpcError } = await supabase.rpc("admin_list_emergency_alerts");
    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }
    setItems((data ?? []) as EmergencyAlert[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const supabase = createClient();
    if (!supabase) return;
    const channel = supabase
      .channel("admin-emergency-alerts")
      .on("postgres_changes", { event: "*", schema: "public", table: "emergency_alerts" }, () => void load())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const resolveAlert = async (id: string) => {
    setResolving(id);
    const supabase = createClient();
    if (!supabase) {
      setResolving(null);
      return;
    }
    const { error: rpcError } = await supabase.rpc("admin_resolve_emergency_alert", { p_alert_id: id });
    if (rpcError) setError(rpcError.message);
    await load();
    setResolving(null);
  };

  const activeCount = items.filter((item) => item.status === "active").length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-red-500">Live Safety Desk</p>
          <h1 className="font-headline-xl text-headline-xl">Emergency Alerts</h1>
          <p className="mt-1 text-secondary">SOS alerts from SheRides members appear here immediately.</p>
        </div>
        <div className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white">{activeCount} ACTIVE</div>
      </div>

      {loading ? <p>Loading emergency alerts…</p> : null}
      {error ? <p role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-200">{error}</p> : null}

      {!loading && items.length === 0 ? (
        <div className="rounded-2xl border border-surface-border bg-surface-container-lowest p-8 text-center">
          <h2 className="font-headline-sm text-headline-sm">No emergency alerts</h2>
          <p className="mt-2 text-secondary">New SOS requests will appear here automatically.</p>
        </div>
      ) : null}

      <div className="space-y-4">
        {items.map((item) => {
          const active = item.status === "active";
          const mapHref = item.latitude != null && item.longitude != null
            ? `https://www.google.com/maps?q=${item.latitude},${item.longitude}`
            : null;
          return (
            <article key={item.id} className={`rounded-2xl border p-5 shadow-premium ${active ? "border-red-500/50 bg-red-500/8" : "border-surface-border bg-surface-container-lowest"}`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${active ? "bg-red-600 text-white" : "bg-black/20 text-secondary"}`}>{item.status}</span>
                    <span className="font-bold uppercase text-red-400">{item.problem_type.replaceAll("_", " ")}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-bold">{item.rider_name || "SheRides member"}</h2>
                  {item.mobile_number ? <p className="mt-1 text-secondary">Mobile: {item.mobile_number}</p> : null}
                  {item.note ? <p className="mt-3 rounded-xl bg-black/15 p-3">{item.note}</p> : null}
                  <p className="mt-3 text-sm text-secondary">Sent: {new Date(item.created_at).toLocaleString()}</p>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  {mapHref ? (
                    <a href={mapHref} target="_blank" rel="noreferrer" className="rounded-full border border-accent-magenta px-4 py-2 font-bold text-accent-magenta">Open location</a>
                  ) : (
                    <span className="rounded-full border border-surface-border px-4 py-2 text-sm text-secondary">Location unavailable</span>
                  )}
                  {active ? (
                    <button type="button" disabled={resolving === item.id} onClick={() => void resolveAlert(item.id)} className="rounded-full bg-accent-magenta px-4 py-2 font-bold text-white disabled:opacity-60">
                      {resolving === item.id ? "Resolving…" : "Mark resolved"}
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
