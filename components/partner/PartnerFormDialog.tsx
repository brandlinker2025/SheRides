"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { bangladeshCities } from "@/lib/cities";
import { validatePartnerApplication, type Commitment, type VehicleType } from "@/lib/partner-application";
import type { PartnerCopy } from "./copy";

const fieldClass =
  "h-[52px] w-full rounded-full border border-white/10 bg-[#1a1a24]/90 px-5 text-base text-[#e4e1e9] placeholder:text-white/35 focus:border-[#f4b8d4] focus:outline-none";

type PartnerFormDialogProps = {
  open: boolean;
  vehicle: VehicleType | null;
  copy: PartnerCopy["form"];
  onClose: () => void;
};

export function PartnerFormDialog({ open, vehicle, copy, onClose }: PartnerFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const errorId = useId();
  const citiesId = useId();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType | "">("");
  const [commitment, setCommitment] = useState<Commitment | "">("");
  const [note, setNote] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setFullName("");
      setPhone("");
      setArea("");
      setVehicleType(vehicle ?? "");
      setCommitment("");
      setNote("");
      setWebsite("");
      setError(null);
      setDone(false);
      dialog.showModal();
      dialog.querySelector<HTMLInputElement>("input[name='fullName']")?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, vehicle]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = validatePartnerApplication({ fullName, phone, area, vehicleType, commitment, note });
    if (!parsed.ok) {
      setError(copy.errors[parsed.field] ?? copy.errors.save);
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.value, website }),
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; field?: string } | null;
      if (!response.ok || !payload?.ok) {
        setError(copy.errors[payload?.field ?? "save"] ?? copy.errors.save);
        return;
      }
      setDone(true);
    } catch {
      setError(copy.errors.save);
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="partner-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="max-h-[92dvh] overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#1a1a24] p-5 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.6)] md:rounded-[2rem] md:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ffb95f]">SheRides</p>
            <h2 id={titleId} className="mt-1 text-[22px] font-bold leading-8 text-white">
              {done ? copy.successTitle : copy.title}
            </h2>
            <p className="mt-1 text-sm leading-5 text-white/70">{done ? copy.successBody : copy.sub}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/80 hover:bg-white/10"
            aria-label={copy.close}
          >
            <Icon name="close" />
          </button>
        </div>

        {done ? (
          <button type="button" onClick={onClose} className="partner-cta h-14 w-full rounded-full text-base font-semibold">
            {copy.close}
          </button>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={(event) => void submit(event)} noValidate>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {copy.name}
              <input
                className={fieldClass}
                name="fullName"
                autoComplete="name"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {copy.phone}
              <input
                className={fieldClass}
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={copy.phoneHint}
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {copy.area}
              <input
                className={fieldClass}
                name="area"
                autoComplete="address-level2"
                placeholder={copy.areaHint}
                list={citiesId}
                required
                value={area}
                onChange={(event) => setArea(event.target.value)}
              />
              <datalist id={citiesId}>
                {bangladeshCities.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            </label>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-semibold">{copy.vehicle}</legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(Object.keys(copy.vehicles) as VehicleType[]).map((option) => {
                  const selected = vehicleType === option;
                  return (
                    <label
                      key={option}
                      onClick={() => setVehicleType(option)}
                      className={`flex min-h-12 cursor-pointer items-center justify-center rounded-full border px-3 text-center text-sm font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#f4b8d4] ${
                        selected
                          ? "border-transparent bg-[#f4b8d4] text-[#3a1830]"
                          : "border-white/10 bg-[#1f1f24] text-white/75"
                      }`}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        name="vehicleType"
                        value={option}
                        checked={selected}
                        onChange={() => setVehicleType(option)}
                      />
                      {copy.vehicles[option]}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-semibold">{copy.commitment}</legend>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(copy.commitments) as Commitment[]).map((option) => {
                  const selected = commitment === option;
                  return (
                    <label
                      key={option}
                      onClick={() => setCommitment(option)}
                      className={`flex min-h-12 cursor-pointer items-center justify-center rounded-full border px-3 text-sm font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#f4b8d4] ${
                        selected ? "border-transparent bg-[#b76dff] text-[#2c0051]" : "border-white/10 bg-[#1f1f24] text-white/75"
                      }`}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        name="commitment"
                        value={option}
                        checked={selected}
                        onChange={() => setCommitment(option)}
                      />
                      {copy.commitments[option]}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              <span>
                {copy.note} <span className="font-normal text-white/45">({copy.noteHint})</span>
              </span>
              <textarea
                className="min-h-24 w-full rounded-[1.25rem] border border-white/10 bg-[#1a1a24]/90 px-5 py-3 text-base text-[#e4e1e9] placeholder:text-white/35 focus:border-[#f4b8d4] focus:outline-none"
                name="note"
                maxLength={500}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>

            <label className="absolute left-[-9999px] h-px w-px overflow-hidden" aria-hidden="true">
              Website
              <input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
            </label>

            {error && (
              <p id={errorId} role="alert" className="text-sm text-[#ffb4ab]">
                {error}
              </p>
            )}

            <button type="submit" disabled={busy} className="partner-cta mt-1 h-14 rounded-full text-base font-semibold">
              {busy ? copy.sending : copy.submit}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}
