import { NextResponse } from "next/server";
import { runBirthdayWishes } from "@/lib/birthday-job";
import { authorizeCronRequest, cronUnauthorizedResponse } from "@/lib/cron-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function handle(request: Request) {
  if (!authorizeCronRequest(request)) {
    return cronUnauthorizedResponse();
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  try {
    const result = await runBirthdayWishes(supabase);
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
