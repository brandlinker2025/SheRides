"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Insurance = { provider: string; summary: string; terms_url: string };

export function InsurancePanel() {
  const [details, setDetails] = useState<Insurance | null>();
  const [loading, setLoading] = useState(false);

  async function loadInsurance(open: boolean) {
    if (!open || loading || details !== undefined) return;
    const supabase = createClient();
    if (!supabase) return setDetails(null);
    setLoading(true);
    const { data } = await supabase.from("ride_insurance_settings")
      .select("provider, summary, terms_url").eq("published", true).maybeSingle();
    setDetails(data);
    setLoading(false);
  }

  return (
    <details onToggle={(event) => void loadInsurance(event.currentTarget.open)}>
      <summary>Insurance</summary>
      {details ? (
        <>
          <p><strong>{details.provider}</strong></p>
          <p>{details.summary}</p>
          <a className="mt-2 inline-block underline" href={details.terms_url} target="_blank" rel="noreferrer">Policy terms</a>
        </>
      ) : <p>{details === undefined ? "Loading…" : "Insurance details unavailable."}</p>}
    </details>
  );
}
