export function cronUnauthorizedResponse() {
  return Response.json({ ok: false }, { status: 401 });
}

/** Vercel Cron sends Authorization: Bearer $CRON_SECRET. Require it always. */
export function authorizeCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
