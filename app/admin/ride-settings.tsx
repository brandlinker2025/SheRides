import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/require-admin";

async function saveInsurance(form: FormData) {
  "use server";
  const { supabase } = await requireAdmin();
  const provider = String(form.get("provider") ?? "").trim();
  const summary = String(form.get("summary") ?? "").trim();
  const terms = new URL(String(form.get("terms_url") ?? ""));
  if (terms.protocol !== "https:" || terms.username || terms.password || !provider || !summary) {
    throw new Error("Enter the insurer, summary and an HTTPS policy URL.");
  }
  const { error } = await supabase.from("ride_insurance_settings").upsert({
    id: true, provider, summary, terms_url: terms.href, published: form.get("published") === "on",
  });
  if (error) throw new Error("Could not save insurance details.");
  revalidatePath("/admin");
}

async function setPromoStatus(form: FormData) {
  "use server";
  const { supabase } = await requireAdmin();
  const code = String(form.get("code") ?? "");
  if (!/^[A-Z0-9]{4,16}$/.test(code)) throw new Error("Invalid promotion.");
  const { error } = await supabase.from("go_promo_codes").update({ active: form.get("active") === "true" }).eq("code", code);
  if (error) throw new Error("Could not update promotion.");
  revalidatePath("/admin");
}

export async function RideSettings() {
  const { supabase } = await requireAdmin();
  const [insurance, promotions] = await Promise.all([
    supabase.from("ride_insurance_settings").select("provider, summary, terms_url, published").eq("id", true).maybeSingle(),
    supabase.from("go_promo_codes").select("code, kind, amount, active, uses, max_uses, expires_at").order("code"),
  ]);
  const data = insurance.data;
  const input = "mt-1 w-full rounded-lg border border-surface-border bg-surface p-2";
  return (
    <div className="my-6 grid gap-4 lg:grid-cols-2">
      <section className="card-surface p-5">
        <h2 className="mb-3 text-lg font-bold">Insurance</h2>
        {insurance.error ? <p>Insurance settings could not be loaded.</p> : (
          <form action={saveInsurance} className="grid gap-3">
            <label>Provider<input className={input} name="provider" required maxLength={120} defaultValue={data?.provider} /></label>
            <label>Coverage summary<textarea className={input} name="summary" required maxLength={1200} defaultValue={data?.summary} /></label>
            <label>Policy terms URL<input className={input} name="terms_url" type="url" required maxLength={1024} defaultValue={data?.terms_url} /></label>
            <label><input type="checkbox" name="published" defaultChecked={data?.published} /> Show approved details to passengers</label>
            <button className="btn btn-primary" type="submit">Save insurance</button>
          </form>
        )}
      </section>
      <section className="card-surface p-5">
        <h2 className="mb-3 text-lg font-bold">Promotions</h2>
        {promotions.error && <p>Promotion data could not be loaded.</p>}
        {!promotions.error && !promotions.data?.length && <p>No promotion codes.</p>}
        {promotions.data?.map((promo) => (
          <form action={setPromoStatus} className="my-3 flex flex-wrap items-center justify-between gap-2" key={promo.code}>
            <input type="hidden" name="code" value={promo.code} />
            <input type="hidden" name="active" value={String(!promo.active)} />
            <p><strong>{promo.code}</strong><br />{promo.amount}{promo.kind === "percent" ? "%" : " BDT"} · {promo.uses}/{promo.max_uses} used{promo.expires_at ? ` · Expires ${promo.expires_at.slice(0, 10)}` : ""}</p>
            <button className="btn btn-secondary" type="submit">{promo.active ? "Pause" : "Activate"}</button>
          </form>
        ))}
      </section>
    </div>
  );
}
