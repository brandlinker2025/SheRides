import { NextResponse } from "next/server";
import { validatePartnerApplication } from "@/lib/partner-application";
import { storePartnerApplication } from "@/lib/partner-store";

export const dynamic = "force-dynamic";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, number[]>();

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "local";
}

function rateLimited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((stamp) => now - stamp < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

export async function POST(request: Request) {
  if (rateLimited(clientKey(request))) {
    return NextResponse.json({ ok: false, field: "rate" }, { status: 429 });
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 8_000) {
    return NextResponse.json({ ok: false, field: "note" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, field: "name" }, { status: 400 });
  }

  if (body && typeof body === "object" && "website" in body && String((body as { website?: unknown }).website ?? "").trim()) {
    return NextResponse.json({ ok: true });
  }

  const parsed = validatePartnerApplication(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, field: parsed.field }, { status: 400 });
  }

  try {
    await storePartnerApplication(parsed.value);
  } catch {
    return NextResponse.json({ ok: false, field: "save" }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
