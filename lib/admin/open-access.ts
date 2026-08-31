/**
 * TEMPORARY product flag requested by the site owner (RS Lina).
 *
 * When true:
 * - `/admin` renders the admin dashboard without an authenticated admin session
 * - `/admin-login` immediately redirects to `/admin`
 *
 * When false, restore previous behavior:
 * - unauthenticated `/admin` → `/admin-login`
 * - successful admin credentials → `/admin`
 *
 * This does not open community `/home` or other member routes.
 *
 * Turn off by setting `ADMIN_OPEN_ACCESS` to false below, or
 * `NEXT_PUBLIC_ADMIN_OPEN_ACCESS=false` (rebuild required for the public env).
 */
export const ADMIN_OPEN_ACCESS =
  process.env.NEXT_PUBLIC_ADMIN_OPEN_ACCESS !== "false";
