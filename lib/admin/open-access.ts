/**
 * Temporary product flag. Keep false so the dashboard is admin-only.
 *
 * When true:
 * - `/admin` renders the admin dashboard without an authenticated admin session
 * - `/admin-login` immediately redirects to `/admin`
 *
 * When false:
 * - unauthenticated `/admin*` → `/admin-login`
 * - signed-in non-admin hitting `/admin*` → `/home`
 * - successful admin credentials on `/admin-login` → `/admin`
 *
 * This does not open community `/home` or other member routes.
 * Do not default this from env — a missing/true env value used to leave /admin open.
 */
export const ADMIN_OPEN_ACCESS = false;
