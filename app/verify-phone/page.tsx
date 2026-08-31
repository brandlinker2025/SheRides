"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthScene } from "@/components/auth/AuthScene";
import { DustumiSubmitButton } from "@/components/auth/DustumiSubmitButton";
import { PhoneOtpFields, postAuthJson } from "@/components/auth/PhoneOtpFields";
import { usePandaForm } from "@/components/auth/usePandaForm";
import { formatBdPhoneDisplay } from "@/lib/phone";

export default function VerifyPhonePage() {
  const router = useRouter();
  const panda = usePandaForm();
  const [phone, setPhone] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dodgeToken, setDodgeToken] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      router.replace("/login");
      return;
    }
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/login");
        return;
      }
      const { data: row, error: rowError } = await supabase
        .from("member_phones")
        .select("phone, verified_at")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (rowError || !row) {
        router.replace("/home");
        return;
      }
      if (row.verified_at) {
        router.replace("/home");
        return;
      }
      setPhone(row.phone as string);
    })();
  }, [router]);

  async function sendCode() {
    if (!phone) return;
    setError(null);
    setBusy(true);
    const message = await postAuthJson("/api/auth/otp/send", { phone, purpose: "signup" });
    setBusy(false);
    if (message) {
      setError(message);
      panda.onError();
      return;
    }
    setInfo("We sent a verification code to your mobile.");
    panda.onSuccess();
  }

  return (
    <AuthScene mood={panda.mood} track={panda.track} speech="One more step — verify your mobile to join the ride.">
      <div className="w-full rounded-[28px] border border-[#FF2D78]/50 bg-[rgba(12,10,14,0.82)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,45,120,0.12)] backdrop-blur-xl sm:p-8">
        <h1
          className="mb-1 text-[34px] leading-none text-[#FF2D78] sm:text-[42px]"
          style={{ fontFamily: "var(--font-butterpop), Georgia, serif" }}
        >
          Verify mobile
        </h1>
        <p className="mb-6 text-sm text-white/70">
          Unverified accounts cannot use SheRides.{" "}
          {phone ? `We’ll text ${formatBdPhoneDisplay(phone)}.` : "Checking your number…"}
        </p>
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={async (event) => {
            event.preventDefault();
            if (!phone || !code.trim()) {
              setDodgeToken((value) => value + 1);
              panda.onError();
              return;
            }
            setBusy(true);
            setError(null);
            const message = await postAuthJson("/api/auth/otp/verify", { phone, code, purpose: "signup" });
            setBusy(false);
            if (message) {
              setError(message);
              panda.onError();
              return;
            }
            panda.onSuccess();
            window.setTimeout(() => {
              router.replace("/home");
              router.refresh();
            }, 900);
          }}
        >
          <PhoneOtpFields code={code} onCodeChange={setCode} onFocus={panda.onTextFocus} onBlur={panda.onBlur} />
          {error && (
            <p className="text-sm text-[#ff8a80]" role="alert">
              {error}
            </p>
          )}
          {info && <p className="text-sm text-[#FF2D78]">{info}</p>}
          <DustumiSubmitButton dodgeToken={dodgeToken} busy={busy || !phone}>
            {busy ? "Verifying..." : "Verify"}
          </DustumiSubmitButton>
          <button type="button" onClick={() => void sendCode()} className="text-sm text-[#FF2D78] hover:underline">
            Send code
          </button>
        </form>
      </div>
    </AuthScene>
  );
}
