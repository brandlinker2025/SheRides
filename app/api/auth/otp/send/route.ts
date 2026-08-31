import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  generateOtpCode,
  hashOtpCode,
  otpCookieName,
  otpCookieOptions,
  otpResendWaitMs,
  readOtpCookie,
  sealOtpCookie,
  type OtpPurpose,
} from "@/lib/otp";
import { normalizeBdPhone } from "@/lib/phone";
import { memberOtpMessage, sendSmsNetBd, smsNetBdConfigured } from "@/lib/sms-net-bd";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isPurpose(value: unknown): value is OtpPurpose {
  return value === "signup" || value === "reset";
}

export async function POST(request: Request) {
  let body: { phone?: unknown; purpose?: unknown };
  try {
    body = (await request.json()) as { phone?: unknown; purpose?: unknown };
  } catch {
    return jsonError("Invalid request.", 400);
  }

  const phone = typeof body.phone === "string" ? normalizeBdPhone(body.phone) : null;
  if (!phone) {
    return jsonError("Enter a valid Bangladesh mobile number (01XXXXXXXXX or +8801XXXXXXXXX).", 400);
  }
  if (!isPurpose(body.purpose)) {
    return jsonError("Invalid request.", 400);
  }

  if (!smsNetBdConfigured()) {
    return jsonError("SMS is not configured on this server. Add SMS_NET_BD_API_KEY to send verification codes.", 503);
  }

  const admin = createAdminClient();
  const supabase = await createServerSupabase();

  let claimed: boolean | null = null;
  if (admin) {
    const { data, error } = await admin.from("member_phones").select("user_id").eq("phone", phone).maybeSingle();
    if (!error) claimed = Boolean(data?.user_id);
  } else if (supabase) {
    const { data, error } = await supabase.rpc("is_member_phone_taken", { p_phone: phone });
    if (!error) claimed = data === true;
  }

  if (body.purpose === "reset" && claimed === false) {
    return jsonError("No SheRides account uses this mobile number.", 404);
  }
  if (body.purpose === "signup" && claimed === false) {
    return jsonError("Create your account first, then we can text a verification code.", 400);
  }

  const jar = await cookies();
  const pending = await readOtpCookie(jar.get(otpCookieName)?.value);
  const wait = otpResendWaitMs(pending && pending.p === phone && pending.u === body.purpose ? pending : null);
  if (wait > 0) {
    return jsonError(`Please wait ${Math.ceil(wait / 1000)} seconds before requesting another code.`, 429);
  }

  const code = generateOtpCode();
  const codeHash = await hashOtpCode(phone, body.purpose, code);
  const sealed = await sealOtpCookie({ phone, purpose: body.purpose, codeHash });

  if (admin) {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await admin.from("phone_otps").delete().eq("phone", phone).eq("purpose", body.purpose).is("consumed_at", null);
    await admin.from("phone_otps").insert({
      phone,
      purpose: body.purpose,
      code_hash: codeHash,
      expires_at: expiresAt,
    });
  }

  const sendError = await sendSmsNetBd(phone, memberOtpMessage(code));
  if (sendError) {
    return jsonError(sendError, 502);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(otpCookieName, sealed.value, { ...otpCookieOptions, maxAge: sealed.maxAge });
  return response;
}
