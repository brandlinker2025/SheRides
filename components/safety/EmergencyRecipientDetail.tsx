"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AlertDetail = {
 id: string; problem_type: string; note: string | null;
 latitude: number | null; longitude: number | null;
 status: string; created_at: string; rider_name: string;
};

export function EmergencyRecipientDetail() {
 const [alertId, setAlertId] = useState<string | null>(null);
 const [detail, setDetail] = useState<AlertDetail | null>(null);
 const [message, setMessage] = useState<string | null>(null);
 useEffect(() => {
  const id = new URLSearchParams(window.location.search).get("alert");
  if (!id) return;
  setAlertId(id);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
   setMessage("Invalid emergency alert link.");
   return;
  }
  const supabase = createClient();
  if (!supabase) { setMessage("Connection unavailable."); return; }
  let active = true;
  void supabase.rpc("get_emergency_alert_for_recipient", { p_alert_id: id }).then(({ data, error }) => {
   if (!active) return;
   if (error) setMessage("Unable to load this alert.");
   else if (!data?.length) setMessage("Alert not found or you do not have access.");
   else setDetail(data[0] as AlertDetail);
  });
  return () => { active = false; };
 }, []);
 if (!alertId) return null;
 const mapUrl = detail?.latitude != null && detail?.longitude != null
  ? `https://www.google.com/maps?q=${encodeURIComponent(`${detail.latitude},${detail.longitude}`)}` : null;
 return <section aria-label="Emergency alert details" className="mb-5 rounded-2xl border border-red-500/50 bg-red-500/10 p-5">
  <h2 className="text-xl font-bold text-on-surface">Emergency alert details</h2>
  {message ? <p role="status" className="mt-2 text-secondary">{message}</p> : null}
  {!message && !detail ? <p className="mt-2 text-secondary">Loading alert…</p> : null}
  {detail ? <div className="mt-3 space-y-2 text-on-surface">
   <p><strong>Rider:</strong> {detail.rider_name}</p>
   <p><strong>Emergency:</strong> {detail.problem_type.replaceAll("_", " ")}</p>
   <p><strong>Status:</strong> {detail.status}</p>
   {detail.note ? <p className="whitespace-pre-wrap">{detail.note}</p> : null}
   <p className="text-sm text-secondary">{new Date(detail.created_at).toLocaleString()}</p>
   {mapUrl ? <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full bg-red-600 px-4 py-2 font-bold text-white">Open emergency location</a> : <p>Location not available. Please contact an admin for assistance.</p>}
  </div> : null}
 </section>;
}
