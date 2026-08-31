import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  hashOtpCode,
  otpAttemptsLeft,
  otpCookieName,
  otpCookieOptions,
  readOtpCookie,
  sealOtpCookie,
  sealVerifiedCookie,
  timingSafeEqual,
  verifiedCookieName,
  type OtpPurpose,
} from "@/lib/otp";
import { normalizeBdPhone, phoneAuthEmail } from "@/lib/phone";
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
  let body: { phone?: unknown; code?: unknown; purpose?: unknown };
  try {
    body = (await request.json()) as { phone?: unknown; code?: unknown; purpose?: unknown };
  } catch {
    return jsonError("Invalid request.", 400);
  }

  const phone = typeof body.phone === "string" ? normalizeBdPhone(body.phone) : null;
  const code = typeof body.code === "string" ? body.code.replace(/\s/g, "") : "";
  if (!phone) {
    return jsonError("Enter a valid Bangladesh mobile number (01XXXXXXXXX or +8801XXXXXXXXX).", 400);
  }
  if (!/^\d{6}$/.test(code)) {
    return jsonError("Enter the 6-digit code sent to your mobile.", 400);
  }
  if (!isPurpose(body.purpose)) {
    return jsonError("Invalid request.", 400);
  }

  const jar = await cookies();
  const pending = await readOtpCookie(jar.get(otpCookieName)?.value);
  if (!pending || pending.p !== phone || pending.u !== body.purpose) {
    return jsonError("That code is invalid or has expired. Request a new one.", 400);
  }
  if (otpAttemptsLeft(pending) <= 0) {
    const response = jsonError("Too many attempts. Request a new code.", 429);
    response.cookies.set(otpCookieName, "", { ...otpCookieOptions, maxAge: 0 });
    return response;
  }

  const expected = await hashOtpCode(phone, body.purpose, code);
  if (!timingSafeEqual(expected, pending.h)) {
    const sealed = await sealOtpCookie({
      phone,
      purpose: body.purpose,
      codeHash: pending.h,
      attempts: pending.a + 1,
      expiresAt: pending.e,
      sentAt: pending.s,
    });
    const response = jsonError("That code is incorrect.", 400);
    response.cookies.set(otpCookieName, sealed.value, { ...otpCookieOptions, maxAge: sealed.maxAge });
    return response;
  }

  const admin = createAdminClient();
  if (admin) {
    await admin
      .from("phone_otps")
      .update({ consumed_at: new Date().toISOString() })
      .eq("phone", phone)
      .eq("purpose", body.purpose)
      .is("consumed_at", null);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(otpCookieName, "", { ...otpCookieOptions, maxAge: 0 });

  if (body.purpose === "signup") {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
    const userId =
      user && (user.email === phoneAuthEmail(phone) || user.user_metadata?.phone === phone) ? user.id : null;

    let verifiedUserId = userId;
    if (admin) {
      const { data: row } = await admin.from("member_phones").select("user_id").eq("phone", phone).maybeSingle();
      if (row?.user_id) {
        verifiedUserId = row.user_id as string;
        await admin
          .from("member_phones")
          .update({ verified_at: new Date().toISOString() })
          .eq("phone", phone)
          .is("verified_at", null);
      }
    }

    if (verifiedUserId) {
      const proof = await sealVerifiedCookie(verifiedUserId, phone);
      response.cookies.set(verifiedCookieName, proof.value, { ...otpCookieOptions, maxAge: proof.maxAge });
    }
  }

  return response;
}
