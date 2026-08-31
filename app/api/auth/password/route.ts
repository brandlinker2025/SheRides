import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  hashOtpCode,
  otpAttemptsLeft,
  otpCookieName,
  otpCookieOptions,
  readOtpCookie,
  sealOtpCookie,
  timingSafeEqual,
} from "@/lib/otp";
import { normalizeBdPhone } from "@/lib/phone";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: { phone?: unknown; code?: unknown; password?: unknown };
  try {
    body = (await request.json()) as { phone?: unknown; code?: unknown; password?: unknown };
  } catch {
    return jsonError("Invalid request.", 400);
  }

  const phone = typeof body.phone === "string" ? normalizeBdPhone(body.phone) : null;
  const code = typeof body.code === "string" ? body.code.replace(/\s/g, "") : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!phone) {
    return jsonError("Enter a valid Bangladesh mobile number (01XXXXXXXXX or +8801XXXXXXXXX).", 400);
  }
  if (!/^\d{6}$/.test(code)) {
    return jsonError("Enter the 6-digit code sent to your mobile.", 400);
  }
  if (password.length < 6) {
    return jsonError("Use at least 6 characters for your password.", 400);
  }

  const jar = await cookies();
  const pending = await readOtpCookie(jar.get(otpCookieName)?.value);
  if (!pending || pending.p !== phone || pending.u !== "reset") {
    return jsonError("That code is invalid or has expired. Request a new one.", 400);
  }
  if (otpAttemptsLeft(pending) <= 0) {
    const response = jsonError("Too many attempts. Request a new code.", 429);
    response.cookies.set(otpCookieName, "", { ...otpCookieOptions, maxAge: 0 });
    return response;
  }

  const expected = await hashOtpCode(phone, "reset", code);
  if (!timingSafeEqual(expected, pending.h)) {
    const sealed = await sealOtpCookie({
      phone,
      purpose: "reset",
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
  if (!admin) {
    return jsonError("This server cannot update passwords yet. Your code was checked, but password reset is not fully configured.", 503);
  }

  const { data: row } = await admin.from("member_phones").select("user_id").eq("phone", phone).maybeSingle();
  if (!row?.user_id) {
    return jsonError("No SheRides account uses this mobile number.", 404);
  }

  const { error } = await admin.auth.admin.updateUserById(row.user_id as string, { password });
  if (error) {
    return jsonError(error.message, 400);
  }

  await admin
    .from("phone_otps")
    .update({ consumed_at: new Date().toISOString() })
    .eq("phone", phone)
    .eq("purpose", "reset")
    .is("consumed_at", null);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(otpCookieName, "", { ...otpCookieOptions, maxAge: 0 });
  return response;
}
